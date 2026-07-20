from __future__ import annotations

import sys
import unittest
from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime
from pathlib import Path
from threading import Barrier

from sqlalchemy import select

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from tests.mysql_test_database import MySQLTestDatabase


class AuthThrottleTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.mysql_database = MySQLTestDatabase("revid_test_auth_throttle")
        cls.mysql_database.start()
        from settings.config import settings

        cls.original_jwt_secret = settings.jwt_secret
        settings.jwt_secret = "unit-test-auth-throttle-secret-minimum-32"

    @classmethod
    def tearDownClass(cls) -> None:
        from settings.config import settings

        settings.jwt_secret = cls.original_jwt_secret
        cls.mysql_database.stop()

    def setUp(self) -> None:
        from models.auth_attempt import AuthAttemptWindow
        from models.base import get_session

        with get_session() as session, session.begin():
            session.query(AuthAttemptWindow).delete()

    def test_attempt_window_is_shared_and_subject_is_only_stored_as_digest(self) -> None:
        from core.auth_throttle import record_auth_attempt
        from models.auth_attempt import AuthAttemptWindow
        from models.base import get_session

        now = datetime(2026, 7, 20, 12, 0, tzinfo=UTC)
        raw_subject = "127.0.0.1|user@example.com"

        self.assertEqual(1, record_auth_attempt("login", raw_subject, limit=5, window_seconds=300, now=now))
        self.assertEqual(2, record_auth_attempt("login", raw_subject, limit=5, window_seconds=300, now=now))

        with get_session() as session:
            row = session.scalars(select(AuthAttemptWindow)).one()

        self.assertEqual("login", row.bucket)
        self.assertEqual(2, row.attempt_count)
        self.assertEqual(64, len(row.subject_digest))
        self.assertNotIn("user@example.com", row.subject_digest)

    def test_concurrent_workers_enforce_one_shared_limit(self) -> None:
        from core.auth_throttle import AuthThrottleExceeded, record_auth_attempt

        now = datetime(2026, 7, 20, 12, 0, tzinfo=UTC)
        barrier = Barrier(6)

        def attempt() -> str:
            barrier.wait(timeout=10)
            try:
                record_auth_attempt("login", "shared-subject", limit=5, window_seconds=300, now=now)
                return "allowed"
            except AuthThrottleExceeded as exc:
                self.assertGreaterEqual(exc.retry_after_seconds, 1)
                return "limited"

        with ThreadPoolExecutor(max_workers=6) as executor:
            outcomes = list(executor.map(lambda _index: attempt(), range(6)))

        self.assertEqual(5, outcomes.count("allowed"))
        self.assertEqual(1, outcomes.count("limited"))

    def test_success_clear_and_window_expiry_reset_the_counter(self) -> None:
        from core.auth_throttle import clear_auth_attempts, record_auth_attempt

        first_window = datetime(2026, 7, 20, 12, 0, tzinfo=UTC)
        next_window = datetime(2026, 7, 20, 12, 6, tzinfo=UTC)

        self.assertEqual(1, record_auth_attempt("login", "subject-a", limit=5, window_seconds=300, now=first_window))
        clear_auth_attempts("login", "subject-a")
        self.assertEqual(1, record_auth_attempt("login", "subject-a", limit=5, window_seconds=300, now=first_window))
        self.assertEqual(1, record_auth_attempt("login", "subject-a", limit=5, window_seconds=300, now=next_window))


if __name__ == "__main__":
    unittest.main()
