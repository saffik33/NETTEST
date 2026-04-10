import asyncio
import re
from collections.abc import Awaitable, Callable
from dataclasses import dataclass

from app.core.platform_utils import get_ping_command

_RTT_PATTERN = re.compile(r"time[=<]([\d.]+)\s*ms", re.IGNORECASE)


@dataclass
class PingData:
    target_host: str
    avg_latency_ms: float
    min_latency_ms: float
    max_latency_ms: float
    jitter_ms: float
    packet_loss_pct: float
    packets_sent: int
    packets_received: int


def _parse_ping_output(output: str) -> list[float]:
    """Extract RTT values from ping command output."""
    return [float(m.group(1)) for m in _RTT_PATTERN.finditer(output)]


def _compute_jitter(rtts: list[float]) -> float:
    """Calculate jitter as mean absolute consecutive difference (RFC 3550)."""
    if len(rtts) < 2:
        return 0.0
    diffs = [abs(rtts[i + 1] - rtts[i]) for i in range(len(rtts) - 1)]
    return round(sum(diffs) / len(diffs), 2)


async def run_ping_test(
    target: str = "8.8.8.8",
    count: int = 20,
    progress_callback: Callable[[int, int, float], Awaitable[None]] | None = None,
) -> PingData:
    cmd = get_ping_command(target, count)
    process = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )

    rtts: list[float] = []

    while True:
        line = await process.stdout.readline()
        if not line:
            break
        decoded = line.decode("utf-8", errors="replace")
        match = _RTT_PATTERN.search(decoded)
        if match:
            rtt = float(match.group(1))
            rtts.append(rtt)
            if progress_callback:
                await progress_callback(len(rtts), count, rtt)

    await process.wait()

    packets_sent = count
    packets_received = len(rtts)
    packet_loss_pct = ((packets_sent - packets_received) / packets_sent) * 100 if packets_sent > 0 else 100.0

    if not rtts:
        return PingData(
            target_host=target,
            avg_latency_ms=0,
            min_latency_ms=0,
            max_latency_ms=0,
            jitter_ms=0,
            packet_loss_pct=100.0,
            packets_sent=packets_sent,
            packets_received=0,
        )

    avg_latency = sum(rtts) / len(rtts)
    jitter = _compute_jitter(rtts)

    return PingData(
        target_host=target,
        avg_latency_ms=round(avg_latency, 2),
        min_latency_ms=round(min(rtts), 2),
        max_latency_ms=round(max(rtts), 2),
        jitter_ms=jitter,
        packet_loss_pct=round(packet_loss_pct, 2),
        packets_sent=packets_sent,
        packets_received=packets_received,
    )
