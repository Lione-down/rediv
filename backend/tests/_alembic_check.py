"""Check Alembic schema creation on test DB."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from scripts.migrate_sqlite_to_mysql import (
    get_admin_url, build_test_db_url, TEST_DB_NAME, cleanup_test_database,
    setup_schema_via_alembic
)

# Cleanup first
admin_url = get_admin_url()
try:
    cleanup_test_database(admin_url)
except Exception as e:
    print(f"Cleanup error (may not exist): {e}")

# Recreate
from urllib.parse import urlparse
from sqlalchemy import create_engine, text, URL
parsed = urlparse(admin_url)
admin_eng = create_engine(URL.create(
    drivername=parsed.scheme,
    username=parsed.username or "root",
    password=parsed.password or "",
    host=parsed.hostname,
    port=parsed.port or 3306,
).render_as_string(hide_password=False), future=True)
with admin_eng.connect() as conn:
    conn.execute(text(f"CREATE DATABASE IF NOT EXISTS `{TEST_DB_NAME}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"))
    conn.commit()
admin_eng.dispose()

# Setup via Alembic
test_db_url = build_test_db_url(admin_url)
print(f"Setting up schema via Alembic on {test_db_url[:40]}...")
setup_schema_via_alembic(test_db_url)
print("Alembic upgrade head succeeded.")

# Verify all 12 tables
from scripts.migrate_sqlite_to_mysql import TABLE_ORDER
eng = create_engine(test_db_url, future=True)
with eng.connect() as conn:
    tables = conn.execute(text(
        "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE()"
    )).fetchall()
existing = {t[0] for t in tables}
print(f"Tables found: {sorted(existing)}")
for t in TABLE_ORDER:
    status = "OK" if t in existing else "MISSING"
    print(f"  {t}: {status}")
eng.dispose()

# Cleanup
cleanup_test_database(admin_url)
print("Done.")
