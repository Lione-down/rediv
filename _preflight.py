"""Pre-flight: check MySQL connectivity and clean test DB."""
import os
import sys
from urllib.parse import urlparse
from sqlalchemy import create_engine, text

admin_url = os.environ.get("REVID_TEST_MYSQL_ADMIN_URL", "")
if not admin_url:
    print("ERROR: REVID_TEST_MYSQL_ADMIN_URL not set")
    sys.exit(1)

parsed = urlparse(admin_url)
admin_conn = create_engine(
    f"{parsed.scheme}://{parsed.username}:{parsed.password}@{parsed.hostname}:{parsed.port or 3306}/",
    future=True,
)
with admin_conn.connect() as conn:
    version = conn.execute(text("SELECT VERSION()")).scalar()
    print(f"MySQL version: {version}")
    
    # Check/test DB existence
    result = conn.execute(
        text("SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME='revid_test_t4_002'")
    )
    exists = result.scalar()
    if exists:
        print("Test DB exists — dropping...")
        conn.execute(text("DROP DATABASE `revid_test_t4_002`"))
        conn.commit()
        print("Test DB dropped.")
    else:
        print("Test DB does not exist yet — OK.")

admin_conn.dispose()
print("Pre-flight OK.")
