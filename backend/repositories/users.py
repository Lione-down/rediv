from __future__ import annotations

from sqlalchemy import func, or_, select

from models.admin_log import AdminLog
from models.asset import Asset
from models.base import StoreConfig, get_session
from models.generation_task import GenerationTask
from models.identity import Identity
from models.invitation import InvitationCode
from models.user import User
from repositories.records import admin_log_record, identity_record, invitation_record, normalize_login_value, user_record
from models.base import utc_now


DEFAULT_REGISTRATION_SETTINGS = {
    "wechat_login_enabled": True,
    "registration_mode": "invite_only",
    "default_quotas": {"text": 100, "image": 20, "video": 3},
}


class UserRepository:
    """Fresh user/auth/admin reads; every method owns a short-lived session."""

    def get(self, user_id: str) -> dict | None:
        with get_session() as session:
            row = session.get(User, user_id)
            return user_record(row) if row is not None else None

    def get_password_hash(self, user_id: str) -> str | None:
        with get_session() as session:
            return session.scalar(select(User.password_hash).where(User.id == user_id))

    def find_by_username(self, username: str | None) -> dict | None:
        normalized = normalize_login_value(username)
        if normalized is None:
            return None
        with get_session() as session:
            row = session.scalar(select(User).where(User.username == normalized))
            return user_record(row) if row is not None else None

    def find_by_email(self, email: str | None) -> dict | None:
        normalized = normalize_login_value(email)
        if normalized is None:
            return None
        with get_session() as session:
            row = session.scalar(select(User).where(User.email == normalized))
            return user_record(row) if row is not None else None

    def find_by_identifier(self, identifier: str) -> dict | None:
        normalized = normalize_login_value(identifier)
        if normalized is None:
            return None
        with get_session() as session:
            row = session.scalar(
                select(User).where(or_(User.username == normalized, User.email == normalized))
            )
            return user_record(row) if row is not None else None

    def find_identity(self, provider: str, provider_user_id: str) -> dict | None:
        with get_session() as session:
            row = session.scalar(
                select(Identity).where(
                    Identity.provider == provider,
                    Identity.provider_user_id == provider_user_id,
                )
            )
            return identity_record(row) if row is not None else None

    def list_users(self) -> list[dict]:
        with get_session() as session:
            return [user_record(row) for row in session.scalars(select(User)).all()]

    def find_configured_admin(self) -> dict | None:
        with get_session() as session:
            row = session.scalar(
                select(User).where(
                    User.role == "admin",
                    User.username.is_not(None),
                    User.password_hash.is_not(None),
                ).limit(1)
            )
            return user_record(row) if row is not None else None

    def dashboard_counts(self) -> dict[str, int]:
        with get_session() as session:
            return {
                "users": int(session.scalar(select(func.count()).select_from(User)) or 0),
                "assets": int(session.scalar(select(func.count()).select_from(Asset)) or 0),
                "queued_tasks": int(
                    session.scalar(
                        select(func.count()).select_from(GenerationTask).where(
                            GenerationTask.status.in_(("queued", "pending"))
                        )
                    )
                    or 0
                ),
            }

    def update_state(
        self,
        user_id: str,
        *,
        status: str | None = None,
        generation_status: str | None = None,
    ) -> dict | None:
        with get_session() as session:
            row = session.scalar(select(User).where(User.id == user_id).with_for_update())
            if row is None:
                return None
            if status is not None:
                row.status = status
            if generation_status is not None:
                row.generation_status = generation_status
            row.updated_at = utc_now()
            session.commit()
            return user_record(row)

    def get_registration_settings(self) -> dict:
        with get_session() as session:
            config = session.get(StoreConfig, "registration_settings")
            value = config.value if config is not None else DEFAULT_REGISTRATION_SETTINGS
            return {
                "wechat_login_enabled": value.get("wechat_login_enabled", True),
                "registration_mode": value.get("registration_mode", "invite_only"),
                "default_quotas": dict(value.get("default_quotas", DEFAULT_REGISTRATION_SETTINGS["default_quotas"])),
            }

    def update_registration_settings(self, changes: dict) -> dict:
        with get_session() as session:
            config = session.get(StoreConfig, "registration_settings")
            current = self.get_registration_settings() if config is None else dict(config.value)
            current.update(changes)
            if config is None:
                config = StoreConfig(key="registration_settings", value=current)
                session.add(config)
            else:
                config.value = current
            session.commit()
        return self.get_registration_settings()

    def list_invitations(self) -> list[dict]:
        with get_session() as session:
            rows = session.scalars(select(InvitationCode).order_by(InvitationCode.created_at.desc())).all()
            return [invitation_record(row) for row in rows]

    def get_invitation(self, code: str) -> dict | None:
        with get_session() as session:
            row = session.scalar(select(InvitationCode).where(InvitationCode.code == code))
            return invitation_record(row) if row is not None else None

    def disable_invitation(self, code: str) -> dict | None:
        with get_session() as session:
            row = session.scalar(select(InvitationCode).where(InvitationCode.code == code).with_for_update())
            if row is None:
                return None
            row.status = "disabled"
            session.commit()
            return invitation_record(row)

    def list_admin_logs(self, limit: int = 100) -> list[dict]:
        with get_session() as session:
            rows = session.scalars(
                select(AdminLog).order_by(AdminLog.created_at.desc()).limit(limit)
            ).all()
            return [admin_log_record(row) for row in rows]
