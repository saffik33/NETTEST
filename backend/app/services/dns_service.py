import asyncio
import logging
import time
from collections.abc import Awaitable, Callable
from dataclasses import dataclass

import dns.resolver

logger = logging.getLogger(__name__)


@dataclass
class DNSData:
    target_domain: str
    resolution_time_ms: float
    resolved_ip: str | None
    dns_server: str | None
    success: bool


async def run_dns_test(
    domains: list[str] | None = None,
    progress_callback: Callable[[str], Awaitable[None]] | None = None,
) -> list[DNSData]:
    if domains is None:
        domains = ["google.com", "cloudflare.com", "github.com"]

    results: list[DNSData] = []
    resolver = dns.resolver.Resolver()

    for domain in domains:
        if progress_callback:
            await progress_callback(domain)
        try:
            start = time.perf_counter()
            answers = await asyncio.to_thread(resolver.resolve, domain, "A")
            elapsed_ms = (time.perf_counter() - start) * 1000

            results.append(DNSData(
                target_domain=domain,
                resolution_time_ms=round(elapsed_ms, 2),
                resolved_ip=str(answers[0]) if answers else None,
                dns_server=resolver.nameservers[0] if resolver.nameservers else None,
                success=True,
            ))
        except Exception as e:
            logger.warning("DNS resolution failed for %s: %s", domain, e)
            results.append(DNSData(
                target_domain=domain,
                resolution_time_ms=0,
                resolved_ip=None,
                dns_server=None,
                success=False,
            ))

    return results
