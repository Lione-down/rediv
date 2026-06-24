"""Quick MySQL connectivity check."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from scripts.migrate_sqlite_to_mysql import get_admin_url, build_test_db_url, TEST_DB_NAME

url = get_admin_url()
test_url = build_test_db_url(url)
print(f"Test URL (redacted): {test_url[:40]}...")

from sqlalchemy import create_engine, text
eng = create_engine(test_url, future=True)
try:
    with eng.connect() as c:
        r = c.execute(text("SELECT DATABASE(), VERSION()")).fetchone()
        print(f"DB={r[0]}, Version={r[1]}")
        # Check if test DB exists
        r2 = c.execute(text(f"SHOW DATABASES LIKE '{TEST_DB_NAME}'")).fetchone()
        print(f"Test DB exists: {r2 is not None}")
except Exception as e:
    print(f"Connection error: {e}")
finally:
    eng.dispose()
