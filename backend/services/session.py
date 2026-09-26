import json
import os
from pathlib import Path

from fastapi import HTTPException

from backend.logger import get_logger

logger = get_logger(__name__)

SESSIONS_DIR = Path("./sessions")

# In-memory store: session_id -> list of {role, content} dicts
_sessions: dict[str, list[dict]] = {}

SYSTEM_MESSAGE = (
    "You are a knowledgeable and helpful AI assistant. "
    "Answer questions clearly and concisely. "
    "Be honest when you are uncertain about something."
)


def _session_file(session_id: str) -> Path:
    return SESSIONS_DIR / f"{session_id}.json"


def _load_sessions_from_disk() -> None:
    """Scan ./sessions/ and reload existing session JSON files into memory."""
    if not SESSIONS_DIR.exists():
        return
    count = 0
    for filepath in SESSIONS_DIR.glob("*.json"):
        session_id = filepath.stem
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                messages = json.load(f)
            if isinstance(messages, list):
                _sessions[session_id] = messages
                count += 1
        except (json.JSONDecodeError, OSError) as e:
            logger.warning("Skipping corrupt session file %s: %s", filepath, e)
    logger.info("Reloaded %d session(s) from disk.", count)


def create_session(session_id: str) -> None:
    """Initialise a new session with the system message."""
    _sessions[session_id] = [{"role": "system", "content": SYSTEM_MESSAGE}]
    _persist(session_id)


def get_session(session_id: str) -> list[dict]:
    """Return the message history for a session, or raise 404 if not found."""
    if session_id not in _sessions:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")
    return _sessions[session_id]


def append_message(session_id: str, role: str, content: str) -> None:
    """Append a message to the session and persist to disk."""
    if session_id not in _sessions:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")
    _sessions[session_id].append({"role": role, "content": content})
    logger.debug("Appended [%s] message to session %s (total: %d)", role, session_id, len(_sessions[session_id]))
    _persist(session_id)


def delete_session(session_id: str) -> None:
    """Remove session from memory and delete its JSON file if it exists."""
    _sessions.pop(session_id, None)
    filepath = _session_file(session_id)
    if filepath.exists():
        filepath.unlink()
    logger.info("Session deleted: %s", session_id)


def _persist(session_id: str) -> None:
    """Write session messages to ./sessions/<session_id>.json."""
    SESSIONS_DIR.mkdir(parents=True, exist_ok=True)
    filepath = _session_file(session_id)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(_sessions[session_id], f, indent=2)


# Reload sessions from disk when the module is first imported
_load_sessions_from_disk()
