import ast, sys

files = [
    'backend/scripts/migrate_sqlite_to_mysql.py',
    'backend/tests/test_migration_tool.py',
]
ok = True
for f in files:
    try:
        with open(f) as fh:
            ast.parse(fh.read())
        print(f"OK: {f}")
    except SyntaxError as e:
        print(f"SYNTAX ERROR: {f}: {e}")
        ok = False
sys.exit(0 if ok else 1)
