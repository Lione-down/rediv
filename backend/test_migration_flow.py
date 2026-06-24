#!/usr/bin/env python3
"""Test the actual migration flow."""

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
    create_engine,
    text,
    setup_schema_via_alembic,
)

def main():
    print("=" * 60)
    print("Testing Migration Flow")
    print("=" * 60)
    
    # Get admin URL
    admin_url = get_admin_url()
    print(f"\n✓ Admin URL obtained")
    
    # Build test DB URL
    test_db_url = build_test_db_url(admin_url)
    print(f"✓ Test DB URL built: {TEST_DB_NAME}")
    
    # Test connection
    engine = create_engine(test_db_url, future=True, pool_pre_ping=True)
    with engine.connect() as conn:
        result = conn.execute(text("SELECT DATABASE()"))
        db_name = result.scalar()
        print(f"✓ Connected to: {db_name}")
    
    engine.dispose()
    
    # Try schema setup
    print("\nAttempting schema setup...")
    try:
        setup_schema_via_alembic(test_db_url)
        print("✓ Schema setup successful")
    except Exception as e:
        print(f"✗ Schema setup failed: {e}")
        # Print more details
        import traceback
        traceback.print_exc()
        return 1
    
    print("\n" + "=" * 60)
    print("Flow test: PASSED")
    print("=" * 60)
    return 0

if __name__ == "__main__":
    sys.exit(main())
