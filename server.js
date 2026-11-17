const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'todos.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

// MIME types mapping
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

// Ensure todos.json exists
async function initStorage() {
  try {
    await fs.promises.access(DATA_FILE);
  } catch {
    await fs.promises.writeFile(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

// Read todos from file
async function readTodos() {
  try {
    const data = await fs.promises.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error('Error reading todos:', err);
    return [];
  }
}

// Write todos to file
async function writeTodos(todos) {
  await fs.promises.writeFile(DATA_FILE, JSON.stringify(todos, null, 2), 'utf-8');
}

// Parse request body JSON
function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      // Guard against huge payload
      if (body.length > 1e6) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON format'));
      }
    });
    req.on('error', reject);
  });
}

// Send JSON response helper
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data));
}

// Serve static files from public/
async function serveStaticFile(req, res, pathname) {
  let relativePath = pathname === '/' ? 'index.html' : pathname;
  // Prevent directory traversal
  const safePath = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(PUBLIC_DIR, safePath);

  // Security check: ensure filePath is inside PUBLIC_DIR
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  try {
    const stat = await fs.promises.stat(filePath);
    if (stat.isDirectory()) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('403 Forbidden');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    const content = await fs.promises.readFile(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (err) {
    if (err.code === 'ENOENT') {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    } else {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('500 Internal Server Error');
    }
  }
}

// Main HTTP request handler
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const { pathname } = parsedUrl;
  const method = req.method;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  // API Endpoints
  if (pathname.startsWith('/api/todos')) {
    try {
      const todos = await readTodos();

      // GET /api/todos
      if (method === 'GET' && pathname === '/api/todos') {
        return sendJson(res, 200, todos);
      }

      // POST /api/todos -> Create a new task
      if (method === 'POST' && pathname === '/api/todos') {
        const body = await getRequestBody(req);
        const title = (body.title || '').trim();

        if (!title) {
          return sendJson(res, 400, { error: 'Task title is required' });
        }

        const newTodo = {
          id: Date.now().toString(36) + Math.random().toString(36).substring(2, 7),
          title: title,
          completed: false,
          createdAt: new Date().toISOString(),
        };

        todos.unshift(newTodo);
        await writeTodos(todos);
        return sendJson(res, 201, newTodo);
      }

      // PATCH /api/todos/:id -> Toggle completed or update title
      const patchMatch = pathname.match(/^\/api\/todos\/([a-zA-Z0-9_-]+)$/);
      if (method === 'PATCH' && patchMatch) {
        const id = patchMatch[1];
        const body = await getRequestBody(req);
        const todoIndex = todos.findIndex(t => t.id === id);

        if (todoIndex === -1) {
          return sendJson(res, 404, { error: 'Task not found' });
        }

        if (typeof body.completed === 'boolean') {
          todos[todoIndex].completed = body.completed;
        }

        if (typeof body.title === 'string' && body.title.trim()) {
          todos[todoIndex].title = body.title.trim();
        }

        await writeTodos(todos);
        return sendJson(res, 200, todos[todoIndex]);
      }

      // DELETE /api/todos/:id -> Delete specific task
      const deleteMatch = pathname.match(/^\/api\/todos\/([a-zA-Z0-9_-]+)$/);
      if (method === 'DELETE' && deleteMatch) {
        const id = deleteMatch[1];
        const initialLength = todos.length;
        const updatedTodos = todos.filter(t => t.id !== id);

        if (updatedTodos.length === initialLength) {
          return sendJson(res, 404, { error: 'Task not found' });
        }

        await writeTodos(updatedTodos);
        return sendJson(res, 200, { success: true, id });
      }

      // DELETE /api/todos?completed=true -> Clear all completed tasks
      if (method === 'DELETE' && pathname === '/api/todos' && parsedUrl.query.completed === 'true') {
        const activeTodos = todos.filter(t => !t.completed);
        const removedCount = todos.length - activeTodos.length;
        await writeTodos(activeTodos);
        return sendJson(res, 200, { success: true, removedCount });
      }

      return sendJson(res, 405, { error: 'Method Not Allowed' });
    } catch (err) {
      console.error('API Error:', err);
      return sendJson(res, 500, { error: err.message || 'Internal Server Error' });
    }
  }

  // Static Assets
  return serveStaticFile(req, res, pathname);
});

// Initialize & listen
initStorage().then(() => {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize storage:', err);
  process.exit(1);
});
