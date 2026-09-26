# Local AI Chat App

A local AI-powered chat application using llama.cpp for inference, FastAPI for the backend, and React for the frontend.

## Overview

Type a message and chat with a local LLM. The app maintains conversation context across the session so you can ask follow-up questions naturally. Sessions survive backend restarts via JSON persistence.

## Tech Stack

| Layer | Technology |
|---|---|
| LLM Server | llama.cpp (`llama-server`) |
| Model | `llama-2-13b-chat.Q4_K_M.gguf` |
| Backend | Python 3.14, FastAPI, Uvicorn |
| LLM Client | `openai` SDK (OpenAI-compatible API) |
| Frontend | React 18, Vite, Material UI (MUI) |
| Markdown Rendering | `react-markdown` |
| Code Display | `react-syntax-highlighter` |

## Project Structure

```
chat/
├── backend/
│   ├── main.py                # FastAPI app, CORS, startup
│   ├── models.py              # Pydantic request/response models
│   ├── logger.py              # Centralised logger factory
│   ├── routers/
│   │   ├── session.py         # POST /session, DELETE /session/{id}
│   │   └── generate.py        # POST /chat
│   ├── services/
│   │   ├── llm.py             # llama.cpp API client
│   │   └── session.py         # In-memory session store + file persistence
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Entire UI — AppBar, message list, input area
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── sessions/                  # Persisted session history (JSON)
└── README.md
```

## Prerequisites

- Python 3.14+
- Node.js 26+
- llama.cpp with `llama-server` built
- Model file: `llama-2-13b-chat.Q4_K_M.gguf`

---

## Installation

### 1. Clone the repository

```bash
git clone <repo-url>
cd chat
```

### 2. Backend — install Python dependencies

```bash
python3.14 -m venv .venv
source .venv/bin/activate        # macOS / Linux
# .venv\Scripts\activate         # Windows

pip install -r backend/requirements.txt
```

### 3. Frontend — install Node dependencies

```bash
cd frontend
npm install
cd ..
```

---

## Running the App

All three services must be running at the same time. Open a separate terminal for each.

### Terminal 1 — LLM Server

```bash
llama-server -m /path/to/llama-2-13b-chat.Q4_K_M.gguf --port 8080
```

Replace `/path/to/` with the actual path to your model file.

### Terminal 2 — Backend

```bash
source .venv/bin/activate        # macOS / Linux
# .venv\Scripts\activate         # Windows

uvicorn backend.main:app --reload --port 8000
```

Backend runs at: `http://localhost:8000`  
API docs available at: `http://localhost:8000/docs`

### Terminal 3 — Frontend

```bash
cd frontend
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## Stopping the App

| Service | How to stop |
|---|---|
| LLM Server | `Ctrl+C` in Terminal 1 |
| Backend | `Ctrl+C` in Terminal 2 |
| Frontend | `Ctrl+C` in Terminal 3 |

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/session` | Create a new session, returns `session_id` |
| `DELETE` | `/session/{id}` | Delete session and its history |
| `POST` | `/chat` | Send a message and receive an assistant reply |

### POST /chat

Request:
```json
{
  "session_id": "abc123",
  "prompt": "What is the difference between a process and a thread?"
}
```

Response:
```json
{
  "reply": "..."
}
```

---

## Usage

1. Open `http://localhost:5173` in your browser
2. Type your message in the input field at the bottom
3. Press **Enter** to send (Shift+Enter for a newline)
4. The assistant's reply appears as a message bubble, with Markdown and syntax-highlighted code blocks rendered automatically
5. Each code block has a copy button; assistant messages also have a copy-all button
6. Click **New Chat** in the top-right to clear context and start a fresh conversation

---

## Session Management

Each browser session gets a unique `session_id` stored in `localStorage`. The backend maintains the full conversation history in memory and persists it to `./sessions/<session_id>.json` on each update, so context survives backend restarts.

The session is initialised with a system prompt that instructs the model to be a helpful, honest assistant.

---

## Notes

- Local-only tool — no authentication
- CORS is enabled for local development
- Backend logs to stdout with timestamps and log levels
- No file-save, language selector, or code-generation features — this is a general-purpose chat UI
