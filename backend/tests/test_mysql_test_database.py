from __future__ import annotations

import os
import unittest
from unittest.mock import patch

from tests.mysql_test_database import MySQLTestDatabase, assert_test_schema_name


class MySQLTestDatabaseGuardTestCase(unittest.TestCase):
    def test_schema_name_accepts_exact_guarded_prefix(self) -> None:
        assert_test_schema_name("revid_test_database_store")

    def test_schema_name_rejects_unsafe_names(self) -> None:
        for schema_name in (
            "revid_db",
            "revid_test_",
            "other_test_schema",
            "revid_test_bad-name",
            "revid_test_数据",
        ):
            with self.subTest(schema_name=schema_name):
                with self.assertRaisesRegex(RuntimeError, "revid_test"):
                    assert_test_schema_name(schema_name)

    def test_missing_admin_url_fails_closed(self) -> None:
        fixture = MySQLTestDatabase("revid_test_database_store")
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaisesRegex(RuntimeError, "BLOCKED"):
                fixture._load_urls()

    def test_non_mysql_admin_url_fails_closed(self) -> None:
        fixture = MySQLTestDatabase("revid_test_database_store")
        with patch.dict(
            os.environ,
            {"REVID_TEST_MYSQL_ADMIN_URL": "postgresql://localhost"},
            clear=True,
        ):
            with self.assertRaisesRegex(RuntimeError, "MySQL dialect"):
                fixture._load_urls()


if __name__ == "__main__":
    unittest.main()
