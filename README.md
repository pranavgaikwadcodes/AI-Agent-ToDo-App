# AI Todo Agent

A full-stack AI-powered todo manager that lets you manage tasks through natural language conversation. Built with a local LLM (Ollama), Node.js, PostgreSQL, and React.

![Tech Stack](https://img.shields.io/badge/Node.js-Express-green) ![React](https://img.shields.io/badge/Frontend-React-blue) ![Ollama](https://img.shields.io/badge/AI-Ollama%20%7C%20qwen2.5-orange) ![PostgreSQL](https://img.shields.io/badge/DB-PostgreSQL-blue) ![Docker](https://img.shields.io/badge/Infra-Docker-2496ED)

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
| Backend | Node.js + Express (containerised via Docker) |
| Database | PostgreSQL (Docker) + Drizzle ORM |
| Frontend | React + Vite + Tailwind CSS |

Everything runs **100% locally** — no OpenAI API key, no cloud, no data leaves your machine.

---

## Project Structure

```
AI-ToDo-App/
├── index.js            # Original CLI interface (still works)
├── agent.js            # AI agent logic (shared between CLI and API)
├── server.js           # Express API server (auto-runs migrations on start)
├── Dockerfile          # Backend container definition
├── docker-compose.yaml # Postgres + backend services
├── db/
│   ├── index.js        # Database connection
│   └── schema.js       # Drizzle schema (todos + messages tables)
├── drizzle/            # Auto-generated migration SQL files
├── client/             # React frontend (Vite + Tailwind)
│   └── src/
│       ├── App.jsx
│       └── components/
│           ├── Header.jsx
│           ├── ChatWindow.jsx
│           └── TodoSidebar.jsx
└── .env
```

---

## Local Setup

### Prerequisites

- [Node.js](https://nodejs.org) v18+
- [pnpm](https://pnpm.io) — `npm install -g pnpm`
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (runs Postgres + backend API)
- [Ollama](https://ollama.com/download) (runs the local LLM on your machine)

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

The default `.env` is used for local/CLI development. Docker uses its own env vars defined in `docker-compose.yaml`.

```env
DATABASE_URL=postgresql://admin:admin@localhost:5432/postgres
```

### 4. Install frontend dependencies

```bash
cd client && npm install && cd ..
```

---

## Running the App

You need **two things running**: Docker (Postgres + backend) and the React dev server.

**Step 1 — Start Ollama** (skip if already running):
```bash
ollama serve
```

**Step 2 — Start Postgres + backend via Docker:**
```bash
docker compose up --build
# Postgres running at localhost:5432
# Backend API running at http://localhost:3001
# Migrations are applied automatically on startup
```

**Step 3 — Start the frontend** (separate terminal):
```bash
cd client
npm run dev
# Running at http://localhost:5173
```

Open **http://localhost:5173** in your browser.

> **Note:** On the first run, `--build` compiles the Docker image. After that you can use `docker compose up` (without `--build`) for faster startup.

---

## Production Build

Build the React app and serve everything from a single Express server:

```bash
cd client && npm run build && cd ..
docker compose up --build
# App + API served at http://localhost:3001
```

---

## CLI Mode

The original terminal interface still works if you prefer it:

```bash
# Make sure Postgres is running first
docker compose up -d postgres

pnpm install
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
| `docker compose up --build` | Build and start Postgres + backend API |
| `docker compose up -d postgres` | Start only Postgres (for CLI mode) |
| `cd client && npm run dev` | Start the React dev server |
| `cd client && npm run build` | Build React for production |
| `pnpm cli` | Run the original CLI interface |
| `pnpm generate` | Generate a new Drizzle migration file |
| `pnpm migrate` | Apply migrations manually (optional — runs automatically via Docker) |
| `pnpm studio` | Open Drizzle Studio (DB browser GUI) |
