import os, sys

# Check MySQL admin URL
admin_url = os.environ.get("REVID_TEST_MYSQL_ADMIN_URL", "")
print(f"REVID_TEST_MYSQL_ADMIN_URL set: {bool(admin_url)}")

if admin_url:
    from urllib.parse import urlparse
    from sqlalchemy import create_engine, text
    
    parsed = urlparse(admin_url)
    conn_url = f"{parsed.scheme}://{parsed.username}:{parsed.password}@{parsed.hostname}:{parsed.port or 3306}/"
    
    try:
        engine = create_engine(conn_url, future=True, pool_pre_ping=True)
        with engine.connect() as conn:
            result = conn.execute(text("SELECT VERSION()"))
            version = result.scalar()
            print(f"MySQL version: {version}")
            
            # Check if test DB exists
            result = conn.execute(
                text("SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = 'revid_test_t4_002'")
            )
            exists = result.scalar() is not None
            print(f"revid_test_t4_002 exists: {exists}")
        engine.dispose()
    except Exception as e:
        print(f"Connection error: {e}")
else:
    print("REVID_TEST_MYSQL_ADMIN_URL not set — will use fixture-only tests")

# Check if mysql client is available
import subprocess
try:
    result = subprocess.run(["mysql", "--version"], capture_output=True, text=True, timeout=5)
    print(f"MySQL client: {result.stdout.strip()}")
except (FileNotFoundError, subprocess.TimeoutExpired):
    print("MySQL client: not available")
