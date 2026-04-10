from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class WiFiSnapshot(Base):
    __tablename__ = "wifi_snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    test_session_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("test_sessions.id"), nullable=True, index=True)
    ssid: Mapped[str | None] = mapped_column(String(255), nullable=True)
    bssid: Mapped[str | None] = mapped_column(String(17), nullable=True)
    rssi_dbm: Mapped[int | None] = mapped_column(Integer, nullable=True)
    signal_pct: Mapped[int | None] = mapped_column(Integer, nullable=True)
    channel: Mapped[int | None] = mapped_column(Integer, nullable=True)
    band: Mapped[str | None] = mapped_column(String(20), nullable=True)
    radio_type: Mapped[str | None] = mapped_column(String(20), nullable=True)
    auth_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    rx_rate_mbps: Mapped[float | None] = mapped_column(Float, nullable=True)
    tx_rate_mbps: Mapped[float | None] = mapped_column(Float, nullable=True)
    channel_utilization_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now(), index=True)

    test_session = relationship("TestSession", back_populates="wifi_snapshots")
