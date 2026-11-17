# The Daily Ledger • Vintage Task Manager 📜

A portfolio-grade, vintage-inspired to-do application and memorandum docket built with **Node.js** and **vanilla HTML/CSS/JavaScript**.

Designed with meticulous attention to detail: aged parchment textures, authentic typewriter typography, synthesized acoustic sound effects, and physical skeuomorphic animations.

---

## ✨ Highlights & Portfolio Features

### 🖋️ Authentic Vintage Skeuomorphism
- **Aged Parchment Ledger**: Multi-layered paper with desk surface shadows, deckled edges, and subtle grain textures.
- **Antique Typography**: Powered by *Cinzel*, *Playfair Display*, and authentic 1900s *Special Elite* typewriter typeface.
- **Physical Desk Accents**: Realistic 3D brass paperclip, machined brass SFX toggle knob, and catalog card index tabs.

### 🔊 Procedural Web Audio API Sound Effects
Zero external `.mp3` files or large assets! All acoustic sounds are procedurally generated in real time using the browser's native **Web Audio API**:
- **Typewriter Keystrokes**: Realistic mechanical key impact on every keystroke.
- **Rubber Stamp "Thud"**: Heavy mechanical impact when inscribing or executing tasks.
- **Paper Tear / Crumple**: High-frequency rustle when tearing a task from the ledger.
- **Carriage Return Bell (*Ding!*)**: Authentic high C7 typewriter chime when all tasks are discharged!
- **Sound Toggle**: Antique brass switch with user preference persisted in `localStorage`.

### ⚡ Physical Micro-Animations
- **Crimson Rubber Stamp**: Marking a task as complete slams down a distressed `[ EXECUTED ]` stamp with ink bounce and authentic angle.
- **Ink Strikethrough**: Rough organic ink line crosses out completed entries.
- **Torn Page Removal**: Deleting an item executes a realistic paper rip & burn animation.

### 🛠️ Robust Architecture
- **Lightweight Node.js Backend**: Built using Node's standard modules (`http`, `fs`, `path`, `url`) with **zero external dependencies**.
- **RESTful API**: Full CRUD capabilities (`GET`, `POST`, `PATCH`, `DELETE`).
- **Persistent Storage**: Changes are automatically written to a local `todos.json` file.
- **Clean Responsive Design**: Fully responsive across mobile, tablet, and desktop viewports.

---

## 🚀 Getting Started

### 1. Launch the Server
```bash
node server.js
```
or
```bash
npm start
```

### 2. View in Browser
Open **[http://localhost:3000](http://localhost:3000)** in any modern web browser.

---

## 📁 Project Structure

```
├── server.js          # Zero-dependency Node.js HTTP server & REST API
├── package.json       # Project configuration
├── todos.json         # Local data store (auto-generated)
├── README.md          # Project documentation
└── public/
    ├── index.html     # Semantic, accessible layout
    ├── style.css      # Vintage styles, layered parchment & stamp animations
    └── app.js         # Client-side state, procedural Web Audio SFX & DOM handling
```

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/todos` | Fetch all docket entries |
| `POST` | `/api/todos` | Inscribe a new entry (`{ "title": "..." }`) |
| `PATCH` | `/api/todos/:id` | Update state or title (`{ "completed": true }`) |
| `DELETE` | `/api/todos/:id` | Expunge an entry by ID |
| `DELETE` | `/api/todos?completed=true` | Archive all executed entries |
