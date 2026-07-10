from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from controllers.store import DatabaseStore
from database import init_db, init_mysql_engine
from settings.config import settings


def main() -> int:
    username = settings.admin_username.strip()
    password = settings.admin_password

    if not username:
        print("REVID_ADMIN_USERNAME is required", file=sys.stderr)
        return 1
    if not password:
        print("REVID_ADMIN_PASSWORD is required", file=sys.stderr)
        return 1

    if settings.use_sqlite:
        init_db(settings.db_path)
    else:
        init_mysql_engine()

    store = DatabaseStore()
    user = store.find_user_by_username(username)
    if user is None or user["role"] != "admin" or not store.get_password_hash(user["id"]):
        from core.security import hash_password

        user = store.ensure_admin_user(username, hash_password(password))
    print(f'Admin bootstrap complete for user "{user["username"]}"')
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
