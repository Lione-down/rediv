from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base, utc_now


class User(Base):
    __tablename__ = "users"
    __table_args__ = {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4", "comment": "User accounts"}

    id: Mapped[str] = mapped_column(String(36), primary_key=True, comment="Unique user identifier")
    username: Mapped[str | None] = mapped_column(String(64), nullable=True, unique=True, index=True, comment="Login username")
    email: Mapped[str | None] = mapped_column(String(255), nullable=True, unique=True, index=True, comment="Login email")
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True, comment="Bcrypt password hash")
    nickname: Mapped[str] = mapped_column(String(255), nullable=False, comment="Display nickname")
    avatar_url: Mapped[str] = mapped_column(String(1024), nullable=False, default="", comment="Avatar URL")
    role: Mapped[str] = mapped_column(String(32), nullable=False, index=True, comment="User role: user/admin")
    status: Mapped[str] = mapped_column(String(32), nullable=False, index=True, comment="User status: active/banned")
    generation_status: Mapped[str] = mapped_column(String(32), nullable=False, comment="Generation status: enabled/frozen")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False, comment="Created at")
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False, comment="Updated at")
    last_login_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False, comment="Last login at")
