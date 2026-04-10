from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class TracerouteResult(Base):
    __tablename__ = "traceroute_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    test_session_id: Mapped[int] = mapped_column(Integer, ForeignKey("test_sessions.id"), nullable=False, index=True)
    target_host: Mapped[str] = mapped_column(String(255), nullable=False)
    total_hops: Mapped[int] = mapped_column(Integer, nullable=False)
    completed: Mapped[bool] = mapped_column(Boolean, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now(), index=True)

    test_session = relationship("TestSession", back_populates="traceroute_results")
    hops = relationship("TracerouteHop", back_populates="traceroute", cascade="all, delete-orphan", order_by="TracerouteHop.hop_number")


class TracerouteHop(Base):
    __tablename__ = "traceroute_hops"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    traceroute_id: Mapped[int] = mapped_column(Integer, ForeignKey("traceroute_results.id"), nullable=False, index=True)
    hop_number: Mapped[int] = mapped_column(Integer, nullable=False)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    hostname: Mapped[str | None] = mapped_column(String(255), nullable=True)
    rtt1_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    rtt2_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    rtt3_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    timed_out: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    traceroute = relationship("TracerouteResult", back_populates="hops")
