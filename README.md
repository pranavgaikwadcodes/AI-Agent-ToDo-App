# AI Todo Agent

A full-stack AI-powered todo manager that lets you manage tasks through natural language conversation. Built with a local LLM (Ollama), Node.js, PostgreSQL, and React.

![Tech Stack](https://img.shields.io/badge/Node.js-Express-green) ![React](https://img.shields.io/badge/Frontend-React-blue) ![Ollama](https://img.shields.io/badge/AI-Ollama%20%7C%20qwen2.5-orange) ![PostgreSQL](https://img.shields.io/badge/DB-PostgreSQL-blue)

---

## What it does

Instead of clicking buttons, you just talk to the AI:

- **"Add buy milk"** → creates a todo
- **"Show all my todos"** → lists everything
- **"Mark todo 3 as completed"** → updates status
- **"Delete todo 2"** → removes it
- **"Search for groceries"** → filters todos
- **"Mark all done"** or **"Delete everything"** → bulk actions

The AI figures out what you mean, calls the right database function, and responds in plain English. Chat history is saved per browser session so conversations persist across page refreshes.

---

## Tech Stack

| Layer | Tech |
|---|---|
| AI / LLM | [Ollama](https://ollama.com) running `qwen2.5:3b` locally |
| Backend | Node.js + Express |
| Database | PostgreSQL (via Docker) + Drizzle ORM |
| Frontend | React + Vite + Tailwind CSS |

Everything runs **100% locally** — no OpenAI API key, no cloud, no data leaves your machine.

---

## Project Structure

```
AI-ToDo-App/
├── index.js          # Original CLI interface (still works)
├── agent.js          # AI agent logic (shared between CLI and API)
├── server.js         # Express API server
├── db/
│   ├── index.js      # Database connection
│   └── schema.js     # Drizzle schema (todos + messages tables)
├── drizzle/          # Auto-generated migrations
├── client/           # React frontend (Vite + Tailwind)
│   └── src/
│       ├── App.jsx
│       └── components/
│           ├── Header.jsx
│           ├── ChatWindow.jsx
│           └── TodoSidebar.jsx
├── docker-compose.yaml
└── .env
```

---

## Local Setup

### Prerequisites

- [Node.js](https://nodejs.org) v18+
- [pnpm](https://pnpm.io) — `npm install -g pnpm`
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for PostgreSQL)
- [Ollama](https://ollama.com/download) (for the local LLM)

---

### 1. Clone the repo

```bash
git clone https://github.com/your-username/AI-ToDo-App.git
cd AI-ToDo-App
```

### 2. Install Ollama and pull the model

Download Ollama from [ollama.com/download](https://ollama.com/download), then pull the model:

```bash
ollama pull qwen2.5:3b
```

Start Ollama (it usually starts automatically after install):

```bash
ollama serve
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

The default `.env` works out of the box with the provided Docker config:

```env
DATABASE_URL=postgresql://admin:admin@localhost:5432/postgres
```

### 4. Start the database

Make sure Docker Desktop is running, then:

```bash
docker compose up -d
```

### 5. Install dependencies

```bash
# Root (backend)
pnpm install

# Frontend
cd client && npm install && cd ..
```

### 6. Run database migrations

```bash
pnpm migrate
```

This creates the `todos` and `messages` tables.

---

## Running the App

You need **three things running**: Ollama, the Express server, and the React dev server.

**Terminal 1 — Ollama** (skip if already running):
```bash
ollama serve
```

**Terminal 2 — Backend API:**
```bash
pnpm server
# Running at http://localhost:3001
```

**Terminal 3 — Frontend:**
```bash
cd client
npm run dev
# Running at http://localhost:5173
```

Open **http://localhost:5173** in your browser.

---

## Production Build

Build the React app and serve everything from a single port:

```bash
cd client && npm run build && cd ..
pnpm server
# App + API at http://localhost:3001
```

---

## CLI Mode

The original terminal interface still works if you prefer it:

```bash
pnpm cli
```

```
>> add buy milk
>> show my todos
>> mark todo 1 as completed
>> exit
```

---

## How the AI Agent Works

The agent uses a **JSON-based tool-calling loop**:

1. User sends a message
2. LLM responds with either `{"action": "functionName", "input": "..."}` or `{"response": "..."}`
3. If it's an action, the server calls the matching database function and feeds the result back to the LLM
4. The loop continues until the LLM produces a `response`
5. Final response is returned to the frontend and saved to the database

This pattern lets a small local model (3B parameters) reliably perform structured database operations from natural language.

---

## Database Schema

**todos**
| Column | Type | Description |
|---|---|---|
| id | integer | Auto-increment primary key |
| todo | text | Task description |
| status | text | `pending` or `completed` |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last modified time |

**messages**
| Column | Type | Description |
|---|---|---|
| id | integer | Auto-increment primary key |
| session_id | text | Browser session identifier |
| role | text | `user` or `assistant` |
| content | text | Message text |
| created_at | timestamp | Creation time |

---

## Available Scripts

| Command | Description |
|---|---|
| `pnpm server` | Start the Express API server |
| `pnpm cli` | Run the original CLI interface |
| `pnpm generate` | Generate a new Drizzle migration |
| `pnpm migrate` | Apply pending migrations |
| `pnpm studio` | Open Drizzle Studio (DB GUI) |
| `cd client && npm run dev` | Start the React dev server |
| `cd client && npm run build` | Build React for production |
