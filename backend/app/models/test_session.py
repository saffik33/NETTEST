from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class TestSession(Base):
    __tablename__ = "test_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    started_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now(), index=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    trigger_type: Mapped[str] = mapped_column(String(20), nullable=False, default="manual")
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="running")
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    speed_results = relationship("SpeedTestResult", back_populates="test_session", cascade="all, delete-orphan")
    ping_results = relationship("PingResult", back_populates="test_session", cascade="all, delete-orphan")
    dns_results = relationship("DNSResult", back_populates="test_session", cascade="all, delete-orphan")
    wifi_snapshots = relationship("WiFiSnapshot", back_populates="test_session", cascade="all, delete-orphan")
    traceroute_results = relationship("TracerouteResult", back_populates="test_session", cascade="all, delete-orphan")
    device_scans = relationship("DeviceScan", back_populates="test_session", cascade="all, delete-orphan")
