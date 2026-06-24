# T4-001 PROGRESS (Updated by Coordinator)

## [2026-06-22 14:00] MySQL Live Verification — UNBLOCKED

The "password unknown" blocker has been resolved. The Coordinator manually verified MySQL connection using the `.env` file at project root.

### Verification Results
- MySQL 8.0.43 connection: ✅ mysql+pymysql://root@localhost:3306/revid_db
- 13 tables confirmed with InnoDB engine and utf8mb4_unicode_ci collation
- 90/91 columns have comments (alembic_version.version_num excluded — Alembic-managed)
- 13/13 tables have comments
- Alembic current: a1b2c3d4e5f6 (head) — ✅
- SQLite tests: 97/97 pass — ✅
- `alembic.ini` Windows locale UnicodeDecodeError fixed (em-dash → ASCII `--`)

### Remaining Issues for Worker
1. **Baseline migration missing explicit InnoDB/utf8mb4** — model `__table_args__` has them but `op.create_table()` in the migration file does not. Need to add `mysql_engine='InnoDB'` and `mysql_charset='utf8mb4'` to each `op.create_table()` call.
2. **Create REPORT-T4-001.md** — Coordinator has prepared an updated version at `ai/reports/REPORT-T4-001.md` with MySQL verification results.

### Next Steps
- Worker should: (a) fix baseline migration to include explicit InnoDB/utf8mb4, (b) confirm REPORT is accurate, (c) signal ready for reviewer.
- After worker completion, revid-reviewer creates independent card.
- After reviewer PASS, revid-pm generates PMC handoff.
