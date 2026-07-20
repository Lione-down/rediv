from __future__ import annotations

from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from controllers.store import DEFAULT_REGISTRATION_SETTINGS, normalize_login_value, store
from models.base import StoreConfig, get_session
from models.identity import Identity
from models.invitation import InvitationCode
from models.quota import Quota, QuotaLedger
from models.user import User


class RegistrationForbiddenError(ValueError):
    pass


class RegistrationConflictError(ValueError):
    pass


def register_password_user(
    *,
    username: str,
    email: str | None,
    password_hash: str,
    invitation_code: str | None,
) -> dict:
    normalized_username = normalize_login_value(username)
    normalized_email = normalize_login_value(email)
    if normalized_username is None:
        raise ValueError("Username is required")

    def add_registration(session, settings: dict, timestamp: datetime) -> tuple[User, Identity | None, Quota]:
        if session.scalar(select(User.id).where(User.username == normalized_username)) is not None:
            raise RegistrationConflictError("Username already exists")
        if normalized_email is not None and session.scalar(
            select(User.id).where(User.email == normalized_email)
        ) is not None:
            raise RegistrationConflictError("Email already exists")

        user = _new_user(
            nickname=normalized_username,
            avatar_url="",
            username=normalized_username,
            email=normalized_email,
            password_hash=password_hash,
            timestamp=timestamp,
        )
        session.add(user)
        session.flush()
        quota = _add_quota(session, user.id, settings, timestamp)
        return user, None, quota

    return _register(invitation_code, add_registration)


def register_wechat_user(profile: dict, invitation_code: str | None) -> dict:
    provider_user_id = str(profile["openid"])

    def add_registration(session, settings: dict, timestamp: datetime) -> tuple[User, Identity, Quota]:
        if not settings.get("wechat_login_enabled", True):
            raise RegistrationForbiddenError("Wechat login is disabled")
        existing_identity = session.scalar(
            select(Identity.id).where(
                Identity.provider == "wechat_open",
                Identity.provider_user_id == provider_user_id,
            )
        )
        if existing_identity is not None:
            raise RegistrationConflictError("Wechat identity already exists")

        user = _new_user(
            nickname=profile.get("nickname", "Wechat User"),
            avatar_url=profile.get("avatar_url", ""),
            username=None,
            email=None,
            password_hash=None,
            timestamp=timestamp,
        )
        session.add(user)
        session.flush()
        identity = _add_wechat_identity(session, user.id, profile, timestamp)
        quota = _add_quota(session, user.id, settings, timestamp)
        return user, identity, quota

    return _register(invitation_code, add_registration)


def _register(invitation_code, add_registration) -> dict:
    invitation = None
    user = None
    identity = None
    quota = None
    try:
        with get_session() as session:
            with session.begin():
                settings = _load_registration_settings(session)
                invitation = _lock_valid_invitation(
                    session,
                    settings.get("registration_mode", "invite_only"),
                    invitation_code,
                )
                timestamp = datetime.now(UTC)
                user, identity, quota = add_registration(session, settings, timestamp)
                if invitation is not None:
                    invitation.used_count += 1
                session.flush()
    except IntegrityError as exc:
        raise RegistrationConflictError(_integrity_conflict_detail(exc)) from exc

    if user is None or quota is None:
        raise RuntimeError("Registration transaction produced no user")
    return store.sync_registration_result(user, identity, quota, invitation)


def _load_registration_settings(session) -> dict:
    config = session.get(StoreConfig, "registration_settings")
    if config is None:
        config = StoreConfig(
            key="registration_settings",
            value={
                "wechat_login_enabled": DEFAULT_REGISTRATION_SETTINGS["wechat_login_enabled"],
                "registration_mode": DEFAULT_REGISTRATION_SETTINGS["registration_mode"],
                "default_quotas": dict(DEFAULT_REGISTRATION_SETTINGS["default_quotas"]),
            },
        )
        session.add(config)
        session.flush()
    return {
        "wechat_login_enabled": config.value.get("wechat_login_enabled", True),
        "registration_mode": config.value.get("registration_mode", "invite_only"),
        "default_quotas": dict(
            config.value.get(
                "default_quotas",
                DEFAULT_REGISTRATION_SETTINGS["default_quotas"],
            )
        ),
    }


def _lock_valid_invitation(
    session,
    registration_mode: str,
    invitation_code: str | None,
) -> InvitationCode | None:
    if registration_mode == "closed":
        raise RegistrationForbiddenError("Registration is closed")
    if registration_mode == "open":
        return None
    if registration_mode != "invite_only" or not invitation_code:
        raise RegistrationForbiddenError("Invalid invitation code")

    invitation = session.scalar(
        select(InvitationCode)
        .where(InvitationCode.code == invitation_code)
        .with_for_update()
    )
    if invitation is None or invitation.status != "active":
        raise RegistrationForbiddenError("Invalid invitation code")
    if invitation.used_count >= invitation.max_uses:
        raise RegistrationForbiddenError("Invalid invitation code")
    expiration = invitation.expires_at
    if expiration is not None:
        if expiration.tzinfo is None:
            expiration = expiration.replace(tzinfo=UTC)
        if expiration <= datetime.now(UTC):
            raise RegistrationForbiddenError("Invalid invitation code")
    return invitation


def _new_user(
    *,
    nickname: str,
    avatar_url: str,
    username: str | None,
    email: str | None,
    password_hash: str | None,
    timestamp: datetime,
) -> User:
    return User(
        id=str(uuid4()),
        username=username,
        email=email,
        password_hash=password_hash,
        nickname=nickname,
        avatar_url=avatar_url,
        role="user",
        status="active",
        generation_status="enabled",
        created_at=timestamp,
        updated_at=timestamp,
        last_login_at=timestamp,
    )


def _add_wechat_identity(
    session,
    user_id: str,
    profile: dict,
    timestamp: datetime,
) -> Identity:
    identity = Identity(
        id=str(uuid4()),
        user_id=user_id,
        provider="wechat_open",
        provider_user_id=str(profile["openid"]),
        unionid=profile.get("unionid"),
        raw_profile=dict(profile),
        created_at=timestamp,
        updated_at=timestamp,
    )
    session.add(identity)
    return identity


def _add_quota(session, user_id: str, settings: dict, timestamp: datetime) -> Quota:
    quota = Quota(
        id=str(uuid4()),
        user_id=user_id,
        text_quota=0,
        image_quota=0,
        video_quota=0,
        revision=0,
    )
    session.add(quota)
    _apply_default_quotas(
        session,
        quota,
        user_id,
        settings.get("default_quotas", DEFAULT_REGISTRATION_SETTINGS["default_quotas"]),
        timestamp,
    )
    return quota


def _apply_default_quotas(
    session,
    quota: Quota,
    user_id: str,
    default_quotas: dict,
    timestamp: datetime,
) -> None:
    allowed_types = ("text", "image", "video")
    for quota_type in allowed_types:
        amount = default_quotas.get(quota_type, 0)
        if not isinstance(amount, int) or isinstance(amount, bool) or amount < 0:
            raise RuntimeError(f"Invalid default {quota_type} quota")
        setattr(quota, f"{quota_type}_quota", amount)
        quota.revision += 1
        session.add(
            QuotaLedger(
                id=str(uuid4()),
                user_id=user_id,
                quota_type=quota_type,
                change_amount=amount,
                reason="default_grant",
                related_task_id=None,
                admin_id=None,
                created_at=timestamp,
            )
        )


def _integrity_conflict_detail(exc: IntegrityError) -> str:
    message = str(exc.orig).lower()
    if "username" in message:
        return "Username already exists"
    if "email" in message:
        return "Email already exists"
    if "provider_user_id" in message or "identities_provider" in message:
        return "Wechat identity already exists"
    return "Registration conflicts with an existing account"
