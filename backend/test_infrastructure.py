#!/usr/bin/env python3
"""Quick infrastructure validation for T4-002 recovery dispatch."""

import os
import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from scripts.migrate_sqlite_to_mysql import (
    TEST_DB_NAME,
    get_admin_url,
    build_test_db_url,
    assert_database_name,
    create_engine,
    text,
)

def main():
    print("=" * 60)
    print("T4-002 Recovery Dispatch - Infrastructure Validation")
    print("=" * 60)
    
    # Step 1: Validate secret
    print("\n[1/4] Validating REVID_TEST_MYSQL_ADMIN_URL...")
    try:
        admin_url = get_admin_url()
        print(f"  ✓ Secret present (masked)")
    except SystemExit:
        print("  ✗ BLOCKED: Secret missing")
        return 1
    
    # Step 2: Build test DB URL
    print("\n[2/4] Building test database URL...")
    try:
        test_db_url = build_test_db_url(admin_url)
        print(f"  ✓ URL built for database: {TEST_DB_NAME}")
    except Exception as e:
        print(f"  ✗ FAILED: {e}")
        return 1
    
    # Step 3: Test connection and identity
    print("\n[3/4] Testing MySQL connection and database identity...")
    try:
        engine = create_engine(test_db_url, future=True, pool_pre_ping=True)
        assert_database_name(engine, TEST_DB_NAME)
        print(f"  ✓ Connected and identity asserted: {TEST_DB_NAME}")
        engine.dispose()
    except Exception as e:
        print(f"  ✗ Connection failed: {e}")
        return 1
    
    # Step 4: Verify source database
    print("\n[4/4] Verifying source SQLite database...")
    source_path = backend_dir / "revid.db"
    if source_path.exists():
        size = source_path.stat().st_size
        print(f"  ✓ Source database found: {source_path} ({size} bytes)")
    else:
        print(f"  ✗ Source database not found: {source_path}")
        return 1
    
    print("\n" + "=" * 60)
    print("Infrastructure validation: PASSED")
    print("=" * 60)
    return 0

if __name__ == "__main__":
    sys.exit(main())
