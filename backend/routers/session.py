import uuid

from fastapi import APIRouter, Response

from backend.logger import get_logger
from backend.models import CreateSessionResponse
from backend.services import session as session_service

router = APIRouter()
logger = get_logger(__name__)


@router.post("/session", response_model=CreateSessionResponse, status_code=201)
async def create_session() -> CreateSessionResponse:
    """Create a new session and return its ID."""
    session_id = str(uuid.uuid4())
    session_service.create_session(session_id)
    logger.info("Session created: %s", session_id)
    return CreateSessionResponse(session_id=session_id)


@router.delete("/session/{session_id}", status_code=204)
async def delete_session(session_id: str) -> Response:
    """Delete a session and its persisted history."""
    session_service.delete_session(session_id)
    logger.info("Session deleted: %s", session_id)
    return Response(status_code=204)
