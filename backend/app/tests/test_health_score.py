import pytest
from app.services.health_score_service import (
    _score_download,
    _score_upload,
    _score_latency,
    _score_jitter,
    _score_packet_loss,
    _score_wifi_signal,
)


def test_score_download_boundaries():
    assert _score_download(0) == 0
    assert _score_download(-5) == 0
    assert _score_download(100) == 100
    assert _score_download(200) == 100
    assert _score_download(50) == 50


def test_score_upload_boundaries():
    assert _score_upload(0) == 0
    assert _score_upload(50) == 100
    assert _score_upload(100) == 100
    assert _score_upload(25) == 50


def test_score_latency():
    assert _score_latency(5) == 100
    assert _score_latency(2) == 100
    assert _score_latency(200) == 0
    assert _score_latency(500) == 0
    # Mid-range
    score = _score_latency(100)
    assert 40 <= score <= 60


def test_score_jitter():
    assert _score_jitter(0.5) == 100
    assert _score_jitter(50) == 0
    assert _score_jitter(100) == 0


def test_score_packet_loss():
    assert _score_packet_loss(0) == 100
    assert _score_packet_loss(5) == 0
    assert _score_packet_loss(10) == 0
    assert _score_packet_loss(2.5) == 50


def test_score_wifi_signal():
    assert _score_wifi_signal(100) == 100
    assert _score_wifi_signal(0) == 0
    assert _score_wifi_signal(75) == 75
