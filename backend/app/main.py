import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.api.router import api_router, ws_router
from app.config import settings
from app.database import init_database
from app.services.scheduler_service import load_schedules, start_scheduler, stop_scheduler
from app.services.bandwidth_service import start_bandwidth_monitor, stop_bandwidth_monitor
from app.services.uptime_service import start_uptime_monitor, stop_uptime_monitor

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s %(name)s %(levelname)s %(message)s",
)
logger = logging.getLogger(__name__)

STATIC_DIR = Path(__file__).resolve().parent.parent / "static"


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Startup
    try:
        await init_database()
    except Exception as e:
        logger.error("Database initialization failed: %s", e, exc_info=True)
        raise

    try:
        await load_schedules()
    except Exception as e:
        logger.error("Failed to load schedules: %s", e, exc_info=True)

    try:
        start_scheduler()
    except Exception as e:
        logger.error("Failed to start scheduler: %s", e, exc_info=True)

    try:
        start_uptime_monitor()
    except Exception as e:
        logger.error("Failed to start uptime monitor: %s", e, exc_info=True)

    try:
        start_bandwidth_monitor()
    except Exception as e:
        logger.error("Failed to start bandwidth monitor: %s", e, exc_info=True)

    yield

    # Shutdown
    try:
        stop_bandwidth_monitor()
    except Exception as e:
        logger.error("Error stopping bandwidth monitor: %s", e, exc_info=True)

    try:
        stop_uptime_monitor()
    except Exception as e:
        logger.error("Error stopping uptime monitor: %s", e, exc_info=True)

    try:
        stop_scheduler()
    except Exception as e:
        logger.error("Error stopping scheduler: %s", e, exc_info=True)


app = FastAPI(title="NetTest", version="1.0.0", lifespan=lifespan)

# Rate limiting setup
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {"status": "ok"}


app.include_router(api_router)
app.include_router(ws_router)

# Serve frontend static files in production (built by Dockerfile into ./static)
if STATIC_DIR.is_dir():
    app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(request: Request, full_path: str):
        """Catch-all: serve index.html for SPA client-side routing."""
        file_path = STATIC_DIR / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(STATIC_DIR / "index.html")
