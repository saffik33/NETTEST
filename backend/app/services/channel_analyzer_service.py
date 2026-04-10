"""WiFi channel congestion analyzer with recommendations."""

from dataclasses import dataclass, field

from app.services.wifi_service import WiFiNetwork, get_wifi_info, get_wifi_networks


# 2.4 GHz channels: 1-13, each 20 MHz wide, centered 5 MHz apart
# Non-overlapping: 1, 6, 11
CHANNELS_2_4GHZ = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
NON_OVERLAPPING_2_4 = [1, 6, 11]

# 5 GHz common channels (20 MHz)
CHANNELS_5GHZ = [36, 40, 44, 48, 52, 56, 60, 64, 100, 104, 108, 112, 116, 120, 124, 128, 132, 136, 140, 144, 149, 153, 157, 161, 165]


@dataclass
class ChannelInfo:
    channel: int
    band: str
    network_count: int
    networks: list[dict]
    avg_signal: float
    congestion_score: int  # 0 = empty, 100 = very congested


@dataclass
class ChannelRecommendation:
    channel: int
    band: str
    reason: str
    congestion_score: int


@dataclass
class ChannelAnalysis:
    current_channel: int | None
    current_band: str | None
    channels: list[ChannelInfo]
    recommendations: list[ChannelRecommendation]
    total_networks: int


def _get_affected_channels(channel: int) -> list[int]:
    """For 2.4 GHz, a network on channel N affects channels N-2 to N+2 due to overlap."""
    if channel <= 13:
        return [c for c in range(max(1, channel - 2), min(14, channel + 3))]
    return [channel]  # 5 GHz channels don't overlap (at 20 MHz width)


def _compute_congestion(channel: int, networks: list[WiFiNetwork], is_5ghz: bool) -> tuple[int, list[dict], float]:
    """Compute congestion score for a channel based on nearby networks."""
    affecting = []
    for net in networks:
        if net.channel is None:
            continue
        if is_5ghz:
            if net.channel == channel:
                affecting.append(net)
        else:
            affected = _get_affected_channels(net.channel)
            if channel in affected:
                affecting.append(net)

    if not affecting:
        return 0, [], 0.0

    avg_signal = sum(n.signal_pct for n in affecting) / len(affecting)
    # Score: weighted by number of networks and their signal strength
    # More networks + stronger signals = more congestion
    score = min(100, int(len(affecting) * 15 + avg_signal * 0.5))

    net_list = [
        {"ssid": n.ssid or "(hidden)", "signal_pct": n.signal_pct, "channel": n.channel}
        for n in affecting
    ]
    return score, net_list, round(avg_signal, 1)


async def analyze_channels() -> ChannelAnalysis:
    """Perform full channel analysis with recommendations."""
    networks = await get_wifi_networks()
    current_wifi = await get_wifi_info()

    current_channel = current_wifi.channel if current_wifi else None
    current_band = current_wifi.band if current_wifi else None

    # Separate networks by band
    networks_2_4 = [n for n in networks if n.channel and n.channel <= 13]
    networks_5 = [n for n in networks if n.channel and n.channel > 13]

    channels: list[ChannelInfo] = []

    # Analyze 2.4 GHz channels (only non-overlapping for recommendations)
    for ch in CHANNELS_2_4GHZ:
        score, nets, avg_sig = _compute_congestion(ch, networks_2_4, False)
        channels.append(ChannelInfo(
            channel=ch, band="2.4 GHz", network_count=len(nets),
            networks=nets, avg_signal=avg_sig, congestion_score=score,
        ))

    # Analyze 5 GHz channels (only those with detected networks + common ones)
    active_5g_channels = {n.channel for n in networks_5 if n.channel}
    analyze_5g = sorted(active_5g_channels | {36, 40, 44, 48, 149, 153, 157, 161})
    for ch in analyze_5g:
        score, nets, avg_sig = _compute_congestion(ch, networks_5, True)
        channels.append(ChannelInfo(
            channel=ch, band="5 GHz", network_count=len(nets),
            networks=nets, avg_signal=avg_sig, congestion_score=score,
        ))

    # Generate recommendations
    recommendations: list[ChannelRecommendation] = []

    # Best 2.4 GHz channel (only non-overlapping: 1, 6, 11)
    best_2_4 = min(
        [c for c in channels if c.channel in NON_OVERLAPPING_2_4],
        key=lambda c: c.congestion_score,
        default=None,
    )
    if best_2_4:
        if current_channel and current_channel <= 13 and current_channel != best_2_4.channel:
            current_ch_info = next((c for c in channels if c.channel == current_channel), None)
            if current_ch_info and current_ch_info.congestion_score > best_2_4.congestion_score + 10:
                recommendations.append(ChannelRecommendation(
                    channel=best_2_4.channel,
                    band="2.4 GHz",
                    reason=f"Channel {best_2_4.channel} has {best_2_4.network_count} networks vs {current_ch_info.network_count} on your current channel {current_channel}",
                    congestion_score=best_2_4.congestion_score,
                ))
        elif not current_channel or current_channel > 13:
            recommendations.append(ChannelRecommendation(
                channel=best_2_4.channel,
                band="2.4 GHz",
                reason=f"Least congested 2.4 GHz channel with {best_2_4.network_count} nearby networks",
                congestion_score=best_2_4.congestion_score,
            ))

    # Best 5 GHz channel
    channels_5g = [c for c in channels if c.band == "5 GHz"]
    best_5 = min(channels_5g, key=lambda c: c.congestion_score, default=None)
    if best_5:
        recommendations.append(ChannelRecommendation(
            channel=best_5.channel,
            band="5 GHz",
            reason=f"Least congested 5 GHz channel with {best_5.network_count} nearby networks",
            congestion_score=best_5.congestion_score,
        ))

    return ChannelAnalysis(
        current_channel=current_channel,
        current_band=current_band,
        channels=channels,
        recommendations=recommendations,
        total_networks=len(networks),
    )
