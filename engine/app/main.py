from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import audit, health


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Validate config on startup
    from app.config import settings  # noqa: F401
    yield


app = FastAPI(title="AgentProof Engine", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten to Vercel domain in production
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

app.include_router(audit.router)
app.include_router(health.router)
