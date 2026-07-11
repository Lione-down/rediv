from __future__ import annotations

import os
import sys
from pathlib import Path

from sqlalchemy.engine import make_url


project_root = Path(__file__).resolve().parents[3]
backend_root = project_root / "backend"
qa_root = Path(__file__).resolve().parent

admin_url = make_url(os.environ["REVID_TEST_MYSQL_ADMIN_URL"])
if admin_url.get_backend_name() != "mysql":
    raise SystemExit("BLOCKED: injected runtime URL is not MySQL")
if admin_url.host not in {"127.0.0.1", "localhost"}:
    raise SystemExit("BLOCKED: injected runtime URL is not local")
if not admin_url.username or admin_url.password is None:
    raise SystemExit("BLOCKED: injected runtime URL lacks credentials")

os.environ.update(
    REVID_USE_SQLITE="false",
    REVID_DB_HOST=admin_url.host,
    REVID_DB_PORT=str(admin_url.port or 3306),
    REVID_DB_NAME="revid_db",
    REVID_DB_USER=admin_url.username,
    REVID_DB_PASSWORD=admin_url.password,
)

os.chdir(qa_root)
sys.path.insert(0, str(backend_root))

import uvicorn


uvicorn.run("main:app", host="127.0.0.1", port=8000, log_level="info")
