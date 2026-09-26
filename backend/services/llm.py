from openai import AsyncOpenAI

from backend.logger import get_logger

logger = get_logger(__name__)

client = AsyncOpenAI(
    base_url="http://localhost:8080/v1",
    api_key="no-key",
)


async def chat(messages: list[dict]) -> str:
    """
    Send the conversation history to the LLM and return the assistant's reply.
    """
    response = await client.chat.completions.create(
        model="llama-2-13b-chat",
        messages=messages,  # type: ignore[arg-type]
    )
    reply = response.choices[0].message.content or ""
    logger.debug("LLM reply (%d chars): %.200s", len(reply), reply)
    return reply.strip()
