from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class DeviceScan(Base):
    __tablename__ = "device_scans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    test_session_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("test_sessions.id"), nullable=True, index=True)
    device_count: Mapped[int] = mapped_column(Integer, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now(), index=True)

    test_session = relationship("TestSession", back_populates="device_scans")
    devices = relationship("DiscoveredDevice", back_populates="scan", cascade="all, delete-orphan")


class DiscoveredDevice(Base):
    __tablename__ = "discovered_devices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    scan_id: Mapped[int] = mapped_column(Integer, ForeignKey("device_scans.id"), nullable=False, index=True)
    ip_address: Mapped[str] = mapped_column(String(45), nullable=False)
    mac_address: Mapped[str] = mapped_column(String(17), nullable=False)
    hostname: Mapped[str | None] = mapped_column(String(255), nullable=True)
    vendor: Mapped[str | None] = mapped_column(String(255), nullable=True)
    entry_type: Mapped[str] = mapped_column(String(20), nullable=False)

    scan = relationship("DeviceScan", back_populates="devices")
