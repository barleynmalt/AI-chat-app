# Local AI Chat App

You are a Senior Full-stack Developer and AI expert.

## Tech Stack

- **LLM Server**: llama.cpp (`llama-server`) on `localhost:8080`
- **Model**: `llama-2-13b-chat.Q4_K_M.gguf`
- **Backend**: Python 3.14, FastAPI, Uvicorn
- **LLM Client**: `openai` SDK (OpenAI-compatible chat completions API)
- **Frontend**: React 18, Vite, Material UI (MUI), Node.js 26
- **Markdown Rendering**: `react-markdown`
- **Code Display**: `react-syntax-highlighter`

## Architecture

### Data Flow

1. On app load, the frontend checks `localStorage` for an existing `session_id`. If none exists, it calls `POST /session` to create one and stores the returned `session_id`.
2. The user types a message in the text input and presses **Enter** (or clicks the send button).
3. The frontend sends `POST /chat` with the `session_id` and `prompt`.
4. The backend appends the user message to the session's conversation history, calls the llama.cpp server with the full message history, and returns the assistant's reply.
5. The reply is rendered in a message bubble using `react-markdown`, with fenced code blocks syntax-highlighted by `react-syntax-highlighter`.
6. Clicking **New Chat** deletes the current session via `DELETE /session/{id}`, creates a fresh one, and clears the message list.

## Backend

### System Prompt

Prepended to every session:

> "You are a knowledgeable and helpful AI assistant. Answer questions clearly and concisely. Be honest when you are uncertain about something."

### Session Management

- Session history is stored in memory (keyed by `session_id`).
- On every update, the session is persisted to `./sessions/<session_id>.json` so context survives backend restarts.
- The frontend stores `session_id` in `localStorage`.

### Logging

- Centralised logger in `backend/logger.py` using Python's `logging` module.
- Logs to stdout with format: `YYYY-MM-DD HH:MM:SS [LEVEL] module: message`.
- Covers: startup, session lifecycle, chat requests, LLM responses.

### API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/session` | Create a new session, returns `session_id` |
| `DELETE` | `/session/{id}` | Delete session and its history |
| `POST` | `/chat` | Send a message and receive an assistant reply |

### POST /chat — Request

```json
{
  "session_id": "abc123",
  "prompt": "What is the difference between a process and a thread?"
}
```

### POST /chat — Response

```json
{
  "reply": "..."
}
```

### File Storage

- Session history persisted as JSON under `./sessions/`

## Frontend

### Layout

Single-page application with no routing and no separate component files — all UI is in `App.jsx`.

- **AppBar** — Shows the app title ("Chat") and a **New Chat** button.
- **Message list** — Scrollable area displaying chat history as bubbles. Auto-scrolls to the latest message. Shows a "Thinking…" placeholder while waiting for a reply.
- **Input area** — Multi-line `TextField` (Enter to send, Shift+Enter for newline) with a send `IconButton`.

### Message Bubbles

- User messages: right-aligned, primary colour background, plain text with `pre-wrap`.
- Assistant messages: left-aligned, grey background, rendered as Markdown via `react-markdown`.
  - Fenced code blocks use `react-syntax-highlighter` (VS Code Dark+ theme) with language labels, line numbers, and a per-block copy button.
  - Inline code uses a styled `<code>` element.
  - A copy-all button appears at the bottom-right of each assistant bubble.

### Behaviour

- `session_id` persisted in `localStorage` — survives page refresh.
- Send on Enter; Shift+Enter inserts a newline.
- Input and send button are disabled while a request is in flight.
- Error banner displayed on network or server errors, dismissible by the user.
- Empty state shows "How can I help you?" centred in the message area.

## Notes

- Local-only tool, no authentication required
- CORS enabled on the backend for local development
- No file save, language selector, or code-generation features — this is a general-purpose chat UI
