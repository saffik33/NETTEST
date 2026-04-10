from fastapi import APIRouter, Depends

from app.api import alerts, dashboard, devices, dns, ping, profiles, schedule, speed, tests, traceroute, wifi, ws
from app.core.auth import verify_api_key

api_router = APIRouter(prefix="/api", dependencies=[Depends(verify_api_key)])
api_router.include_router(tests.router)
api_router.include_router(speed.router)
api_router.include_router(ping.router)
api_router.include_router(dns.router)
api_router.include_router(wifi.router)
api_router.include_router(traceroute.router)
api_router.include_router(devices.router)
api_router.include_router(dashboard.router)
api_router.include_router(alerts.router)
api_router.include_router(schedule.router)
api_router.include_router(profiles.router)

# WebSocket router without auth (uses different auth mechanism)
ws_router = APIRouter(prefix="/api")
ws_router.include_router(ws.router)
