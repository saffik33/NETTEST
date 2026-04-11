"""Client-side speed test endpoints: serve test data for download/upload measurement."""

import os
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.speed_test import SpeedTestResult

router = APIRouter(prefix="/speedtest", tags=["speedtest"])

CHUNK_SIZE = 65536  # 64 KB chunks


def _generate_random_bytes(total_bytes: int):
    """Generate random bytes in chunks for streaming download test."""
    sent = 0
    # Pre-generate a reusable 64KB chunk of random data
    chunk = os.urandom(CHUNK_SIZE)
    while sent < total_bytes:
        remaining = total_bytes - sent
        if remaining >= CHUNK_SIZE:
            yield chunk
            sent += CHUNK_SIZE
        else:
            yield chunk[:remaining]
            sent += remaining


@router.get("/download")
async def download_test(size_mb: int = 10):
    """Serve random data for client-side download speed measurement."""
    size_mb = min(size_mb, 100)  # Cap at 100 MB
    total_bytes = size_mb * 1024 * 1024
    return StreamingResponse(
        _generate_random_bytes(total_bytes),
        media_type="application/octet-stream",
        headers={
            "Content-Length": str(total_bytes),
            "Cache-Control": "no-store",
            "X-Test-Size": str(total_bytes),
        },
    )


@router.post("/upload")
async def upload_test(request: Request):
    """Accept uploaded data for client-side upload speed measurement. Returns bytes received."""
    total = 0
    async for chunk in request.stream():
        total += len(chunk)
    return {"bytes_received": total}


@router.post("/result")
async def save_client_result(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Save client-side speed test result to database."""
    data = await request.json()
    result = SpeedTestResult(
        test_session_id=data.get("session_id"),
        download_mbps=data["download_mbps"],
        upload_mbps=data["upload_mbps"],
        server_name="Client-side (browser)",
        server_host=None,
        server_id=None,
        timestamp=datetime.now(timezone.utc),
    )
    db.add(result)
    await db.commit()
    await db.refresh(result)
    return {"id": result.id, "download_mbps": result.download_mbps, "upload_mbps": result.upload_mbps}
