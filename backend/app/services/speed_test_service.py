import asyncio
import logging
from collections.abc import Awaitable, Callable
from dataclasses import dataclass

import speedtest

from app.config import settings

logger = logging.getLogger(__name__)


@dataclass
class SpeedTestData:
    download_mbps: float
    upload_mbps: float
    server_name: str | None
    server_host: str | None
    server_id: int | None


async def run_speed_test(
    progress_callback: Callable[[str, float], Awaitable[None]] | None = None,
) -> SpeedTestData:
    try:
        timeout = settings.SPEED_TEST_TIMEOUT

        def _get_best_server():
            s = speedtest.Speedtest()
            s.get_best_server()
            return s

        def _run_download(s: speedtest.Speedtest):
            s.download()
            return s

        def _run_upload(s: speedtest.Speedtest):
            s.upload()
            return s

        if progress_callback:
            await progress_callback("finding_server", 0.0)

        s = await asyncio.wait_for(asyncio.to_thread(_get_best_server), timeout=timeout)

        if progress_callback:
            await progress_callback("testing_download", 0.1)

        s = await asyncio.wait_for(asyncio.to_thread(_run_download, s), timeout=timeout)
        download_mbps = s.results.download / 1_000_000

        if progress_callback:
            await progress_callback("testing_upload", 0.5)

        s = await asyncio.wait_for(asyncio.to_thread(_run_upload, s), timeout=timeout)
        upload_mbps = s.results.upload / 1_000_000

        if progress_callback:
            await progress_callback("complete", 1.0)

        results = s.results.dict()
        server = results.get("server", {})

        return SpeedTestData(
            download_mbps=round(download_mbps, 2),
            upload_mbps=round(upload_mbps, 2),
            server_name=server.get("name"),
            server_host=server.get("host"),
            server_id=int(server["id"]) if server.get("id") else None,
        )
    except asyncio.TimeoutError:
        logger.error("Speed test timed out after %ds", settings.SPEED_TEST_TIMEOUT)
        raise RuntimeError(f"Speed test timed out after {settings.SPEED_TEST_TIMEOUT} seconds")
    except speedtest.SpeedtestException as e:
        logger.error("Speed test library error: %s", e, exc_info=True)
        raise RuntimeError(f"Speed test failed: {e}")
    except Exception as e:
        logger.error("Unexpected speed test error: %s", e, exc_info=True)
        raise RuntimeError(f"Speed test failed unexpectedly: {e}")
