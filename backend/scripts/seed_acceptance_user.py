from __future__ import annotations

import json
import os
import sys
from collections.abc import Callable, Mapping
from pathlib import Path
from typing import Protocol

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))


class SeedUserError(RuntimeError):
    pass


class AcceptanceUserStore(Protocol):
    def find_user_by_username(self, username: str) -> dict | None: ...

    def create_user(
        self,
        nickname: str,
        avatar_url: str,
        role: str = "user",
        **fields,
    ) -> dict: ...

    def grant_default_quotas(self, user_id: str) -> None: ...


def load_seed_credentials(environment: Mapping[str, str]) -> tuple[str, str]:
    username = environment.get("REVID_ACCEPTANCE_USERNAME", "").strip()
    password = environment.get("REVID_ACCEPTANCE_PASSWORD", "")
    if not username or not password:
        raise SeedUserError("Dedicated acceptance username and password are required")
    return username, password


def seed_acceptance_user(
    store: AcceptanceUserStore,
    *,
    username: str,
    password: str,
    password_hasher: Callable[[str], str],
) -> dict:
    if store.find_user_by_username(username) is not None:
        raise SeedUserError("Acceptance username already exists; refusing to adopt it")
    user = store.create_user(
        "Canvas Acceptance User",
        "",
        role="user",
        username=username,
        password_hash=password_hasher(password),
    )
    if user.get("role") != "user":
        raise SeedUserError("Acceptance seed did not create a normal user")
    store.grant_default_quotas(user["id"])
    return user


def safe_seed_result(user: Mapping[str, object]) -> dict[str, str]:
    if user.get("role") != "user":
        raise SeedUserError("Acceptance seed result is not a normal user")
    return {"status": "ready", "role": "user"}


def main() -> int:
    from controllers.store import DatabaseStore
    from core.security import hash_password
    from database import check_alembic_revision, close_db, init_mysql_engine

    try:
        username, password = load_seed_credentials(os.environ)
        init_mysql_engine()
        check_alembic_revision()
        user = seed_acceptance_user(
            DatabaseStore(),
            username=username,
            password=password,
            password_hasher=hash_password,
        )
        print(json.dumps(safe_seed_result(user), separators=(",", ":")))
        return 0
    except Exception:
        print("Acceptance user seed failed", file=sys.stderr)
        return 1
    finally:
        close_db()


if __name__ == "__main__":
    raise SystemExit(main())
