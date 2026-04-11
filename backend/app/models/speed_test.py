from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class SpeedTestResult(Base):
    __tablename__ = "speed_test_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    test_session_id: Mapped[int] = mapped_column(Integer, ForeignKey("test_sessions.id"), nullable=False, index=True)
    download_mbps: Mapped[float] = mapped_column(Float, nullable=False)
    upload_mbps: Mapped[float] = mapped_column(Float, nullable=False)
    server_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    server_host: Mapped[str | None] = mapped_column(String(255), nullable=True)
    server_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)

    test_session = relationship("TestSession", back_populates="speed_results")
