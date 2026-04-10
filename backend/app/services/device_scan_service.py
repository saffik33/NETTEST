import asyncio
import logging
import re
import socket
from dataclasses import dataclass, field

from mac_vendor_lookup import MacLookup

logger = logging.getLogger(__name__)


@dataclass
class DeviceData:
    ip_address: str
    mac_address: str
    hostname: str | None = None
    vendor: str | None = None
    entry_type: str = "dynamic"


@dataclass
class ScanData:
    device_count: int = 0
    devices: list[DeviceData] = field(default_factory=list)


_mac_lookup = MacLookup()


async def scan_devices() -> ScanData:
    process = await asyncio.create_subprocess_exec(
        "arp", "-a",
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, _ = await process.communicate()
    output = stdout.decode("utf-8", errors="replace")

    devices: list[DeviceData] = []
    # Windows format: "  192.168.1.1           44-15-24-51-12-6f     dynamic"
    arp_pattern = re.compile(r"([\d.]+)\s+([\da-fA-F-]+)\s+(\w+)")

    for line in output.splitlines():
        match = arp_pattern.search(line)
        if match:
            ip = match.group(1)
            mac_raw = match.group(2)
            entry_type = match.group(3).lower()

            if entry_type != "dynamic":
                continue

            # Normalize MAC from 44-15-24-51-12-6f to 44:15:24:51:12:6f
            mac = mac_raw.replace("-", ":").lower()

            # Vendor lookup
            vendor = None
            try:
                vendor = _mac_lookup.lookup(mac)
            except KeyError:
                pass  # MAC not in vendor database
            except Exception as e:
                logger.debug("Vendor lookup failed for %s: %s", mac, e)

            # Hostname lookup
            hostname = None
            try:
                hostname_result = await asyncio.to_thread(socket.gethostbyaddr, ip)
                hostname = hostname_result[0] if hostname_result else None
            except socket.herror:
                pass  # Host not found — expected for many devices
            except Exception as e:
                logger.debug("Hostname lookup failed for %s: %s", ip, e)

            devices.append(DeviceData(
                ip_address=ip,
                mac_address=mac,
                hostname=hostname,
                vendor=vendor,
                entry_type=entry_type,
            ))

    return ScanData(device_count=len(devices), devices=devices)
