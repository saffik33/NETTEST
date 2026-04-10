import asyncio
import re
from dataclasses import dataclass

from app.core.platform_utils import is_windows


@dataclass
class WiFiData:
    ssid: str | None = None
    bssid: str | None = None
    rssi_dbm: int | None = None
    signal_pct: int | None = None
    channel: int | None = None
    band: str | None = None
    radio_type: str | None = None
    auth_type: str | None = None
    rx_rate_mbps: float | None = None
    tx_rate_mbps: float | None = None
    channel_utilization_pct: float | None = None


@dataclass
class WiFiNetwork:
    ssid: str
    bssid: str
    signal_pct: int
    channel: int | None
    band: str | None


async def get_wifi_info() -> WiFiData | None:
    if not is_windows():
        return None

    process = await asyncio.create_subprocess_exec(
        "netsh", "wlan", "show", "interfaces",
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, _ = await process.communicate()
    output = stdout.decode("utf-8", errors="replace")

    if "disconnected" in output.lower() or "There is no wireless" in output:
        return None

    data = WiFiData()

    patterns = {
        "ssid": (r"^\s*SSID\s*:\s*(.+)$", str),
        "bssid": (r"BSSID\s*:\s*(.+)", str),
        "signal_pct": (r"Signal\s*:\s*(\d+)%", int),
        "rssi_dbm": (r"Rssi\s*:\s*(-?\d+)", int),
        "channel": (r"Channel\s*:\s*(\d+)", int),
        "band": (r"Band\s*:\s*(.+)", str),
        "radio_type": (r"Radio type\s*:\s*(.+)", str),
        "auth_type": (r"Authentication\s*:\s*(.+)", str),
        "rx_rate_mbps": (r"Receive rate \(Mbps\)\s*:\s*([\d.]+)", float),
        "tx_rate_mbps": (r"Transmit rate \(Mbps\)\s*:\s*([\d.]+)", float),
    }

    for field, (pattern, converter) in patterns.items():
        match = re.search(pattern, output, re.MULTILINE | re.IGNORECASE)
        if match:
            setattr(data, field, converter(match.group(1).strip()))

    return data


async def get_wifi_networks() -> list[WiFiNetwork]:
    if not is_windows():
        return []

    process = await asyncio.create_subprocess_exec(
        "netsh", "wlan", "show", "networks", "mode=bssid",
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, _ = await process.communicate()
    output = stdout.decode("utf-8", errors="replace")

    networks: list[WiFiNetwork] = []
    current_ssid = ""

    for line in output.splitlines():
        ssid_match = re.match(r"^SSID\s+\d+\s*:\s*(.*)$", line)
        if ssid_match:
            current_ssid = ssid_match.group(1).strip()

        bssid_match = re.search(r"BSSID\s+\d+\s*:\s*(.+)", line)
        if bssid_match:
            bssid = bssid_match.group(1).strip()
            networks.append(WiFiNetwork(ssid=current_ssid, bssid=bssid, signal_pct=0, channel=None, band=None))

        if networks:
            sig_match = re.search(r"Signal\s*:\s*(\d+)%", line)
            if sig_match:
                networks[-1].signal_pct = int(sig_match.group(1))

            ch_match = re.search(r"Channel\s*:\s*(\d+)", line)
            if ch_match:
                networks[-1].channel = int(ch_match.group(1))

            band_match = re.search(r"Band\s*:\s*(.+)", line)
            if band_match:
                networks[-1].band = band_match.group(1).strip()

    return networks
