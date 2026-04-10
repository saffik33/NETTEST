import platform


def is_windows() -> bool:
    return platform.system() == "Windows"


def get_ping_command(target: str, count: int) -> list[str]:
    if is_windows():
        return ["ping", "-n", str(count), "-w", "2000", target]
    return ["ping", "-c", str(count), "-W", "2", target]


def get_traceroute_command(target: str, max_hops: int) -> list[str]:
    if is_windows():
        return ["tracert", "-d", "-h", str(max_hops), "-w", "2000", target]
    return ["traceroute", "-n", "-m", str(max_hops), "-w", "2", target]
