from fastapi import APIRouter

from backend.logger import get_logger
from backend.models import ChatRequest, ChatResponse
from backend.services import llm as llm_service
from backend.services import session as session_service

router = APIRouter()
logger = get_logger(__name__)


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    """Send a message and get a reply within a session context."""
    logger.info("Chat request | session=%s", request.session_id)

    # Retrieve existing history (raises 404 if session not found)
    session_service.get_session(request.session_id)

    # Persist the user's prompt into the session
    session_service.append_message(request.session_id, "user", request.prompt)

    # Re-fetch updated messages for the LLM call
    messages = session_service.get_session(request.session_id)

    # Get reply from the LLM
    reply = await llm_service.chat(messages)
    logger.info("Reply: %d chars", len(reply))

    # Persist the assistant's response into the session
    session_service.append_message(request.session_id, "assistant", reply)

    return ChatResponse(reply=reply)
