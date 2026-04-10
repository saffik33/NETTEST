import pytest
from app.services.ping_service import _parse_ping_output, _compute_jitter


def test_parse_windows_ping_output():
    output = """
Pinging 8.8.8.8 with 32 bytes of data:
Reply from 8.8.8.8: bytes=32 time=12ms TTL=118
Reply from 8.8.8.8: bytes=32 time=14ms TTL=118
Reply from 8.8.8.8: bytes=32 time=11ms TTL=118
Reply from 8.8.8.8: bytes=32 time=13ms TTL=118

Ping statistics for 8.8.8.8:
    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),
Approximate round trip times in milli-seconds:
    Minimum = 11ms, Maximum = 14ms, Average = 12ms
"""
    rtts = _parse_ping_output(output)
    assert rtts == [12.0, 14.0, 11.0, 13.0]


def test_parse_ping_with_less_than_1ms():
    output = """
Reply from 192.168.1.1: bytes=32 time<1ms TTL=64
Reply from 192.168.1.1: bytes=32 time<1ms TTL=64
"""
    rtts = _parse_ping_output(output)
    assert rtts == [1.0, 1.0]


def test_compute_jitter():
    rtts = [10.0, 15.0, 12.0, 18.0]
    jitter = _compute_jitter(rtts)
    # |15-10| + |12-15| + |18-12| = 5 + 3 + 6 = 14, / 3 = 4.67
    assert abs(jitter - 4.67) < 0.01


def test_compute_jitter_single_value():
    assert _compute_jitter([10.0]) == 0.0


def test_compute_jitter_empty():
    assert _compute_jitter([]) == 0.0


def test_compute_jitter_identical_values():
    assert _compute_jitter([20.0, 20.0, 20.0]) == 0.0


def test_parse_ping_fractional_rtt():
    output = """
Reply from 8.8.8.8: bytes=32 time=12.5ms TTL=118
Reply from 8.8.8.8: bytes=32 time=9.3ms TTL=118
Reply from 8.8.8.8: bytes=32 time=14.7ms TTL=118
"""
    rtts = _parse_ping_output(output)
    assert rtts == [12.5, 9.3, 14.7]
