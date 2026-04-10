import asyncio
import re
from collections.abc import Awaitable, Callable
from dataclasses import dataclass, field

from app.core.platform_utils import get_traceroute_command, is_windows


@dataclass
class HopData:
    hop_number: int
    ip_address: str | None = None
    hostname: str | None = None
    rtt1_ms: float | None = None
    rtt2_ms: float | None = None
    rtt3_ms: float | None = None
    timed_out: bool = False


@dataclass
class TracerouteData:
    target_host: str
    total_hops: int = 0
    completed: bool = False
    hops: list[HopData] = field(default_factory=list)


async def run_traceroute(
    target: str = "8.8.8.8",
    max_hops: int = 30,
    progress_callback: Callable[[HopData], Awaitable[None]] | None = None,
) -> TracerouteData:
    cmd = get_traceroute_command(target, max_hops)
    process = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )

    result = TracerouteData(target_host=target)

    def _parse_rtt(val: str) -> float | None:
        val = val.strip()
        if val == "*":
            return None
        match = re.search(r"(\d+)", val)
        return float(match.group(1)) if match else None

    if is_windows():
        hop_pattern = re.compile(
            r"^\s*(\d+)\s+([\d<]+\s*ms|\*)\s+([\d<]+\s*ms|\*)\s+([\d<]+\s*ms|\*)\s+(.+)$"
        )
    else:
        hop_pattern = re.compile(
            r"^\s*(\d+)\s+(.+)$"
        )

    while True:
        line = await process.stdout.readline()
        if not line:
            break
        decoded = line.decode("utf-8", errors="replace").rstrip()

        if is_windows():
            match = hop_pattern.match(decoded)
            if match:
                hop_num = int(match.group(1))
                ip_or_msg = match.group(5).strip()
                timed_out = "Request timed out" in ip_or_msg or ip_or_msg == "*"
                ip_addr = None if timed_out else ip_or_msg

                hop = HopData(
                    hop_number=hop_num,
                    ip_address=ip_addr,
                    rtt1_ms=_parse_rtt(match.group(2)),
                    rtt2_ms=_parse_rtt(match.group(3)),
                    rtt3_ms=_parse_rtt(match.group(4)),
                    timed_out=timed_out,
                )
                result.hops.append(hop)
                if progress_callback:
                    await progress_callback(hop)

    await process.wait()
    result.total_hops = len(result.hops)
    result.completed = process.returncode == 0

    return result
