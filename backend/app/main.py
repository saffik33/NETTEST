import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.config import settings
from app.database import init_database
from app.services.scheduler_service import load_schedules, start_scheduler, stop_scheduler
from app.services.bandwidth_service import start_bandwidth_monitor, stop_bandwidth_monitor
from app.services.uptime_service import start_uptime_monitor, stop_uptime_monitor

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_database()
    await load_schedules()
    start_scheduler()
    start_uptime_monitor()
    start_bandwidth_monitor()
    yield
    stop_bandwidth_monitor()
    stop_uptime_monitor()
    stop_scheduler()


app = FastAPI(title="NetTest", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)
