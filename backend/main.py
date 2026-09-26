from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.logger import get_logger
from backend.routers import generate, session

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure sessions directory exists
    Path("./sessions").mkdir(parents=True, exist_ok=True)
    logger.info("Startup complete. Sessions directory ready.")
    yield
    logger.info("Shutting down.")


app = FastAPI(
    title="Chat API",
    description="Local AI-powered chat using llama.cpp",
    version="1.0.0",
    lifespan=lifespan,
)

# Allow all origins for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(session.router)
app.include_router(generate.router)
