from __future__ import annotations

import unittest

from sqlalchemy import inspect

from controllers.store import DatabaseStore
from models import Base, dispose_engine, init_engine
from tests.mysql_test_database import MySQLTestDatabase, assert_selected_database


class MySQLClosureTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.mysql_database = MySQLTestDatabase("revid_test_t5_002_closure")
        cls.mysql_database.start()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.mysql_database.stop()

    def test_all_application_tables_have_comments_and_foreign_keys_match(self) -> None:
        engine = init_engine()
        assert_selected_database(engine, self.mysql_database.schema_name)
        inspector = inspect(engine)

        expected_tables = set(Base.metadata.tables)
        self.assertTrue(expected_tables)
        self.assertTrue(expected_tables.issubset(set(inspector.get_table_names())))

        expected_foreign_keys: set[tuple[str, tuple[str, ...], str, tuple[str, ...]]] = set()
        actual_foreign_keys: set[tuple[str, tuple[str, ...], str, tuple[str, ...]]] = set()

        for table_name in sorted(expected_tables):
            table_comment = inspector.get_table_comment(table_name).get("text")
            self.assertTrue(table_comment and table_comment.strip(), f"missing table comment: {table_name}")

            for column in inspector.get_columns(table_name):
                comment = column.get("comment")
                self.assertTrue(
                    comment and comment.strip(),
                    f"missing column comment: {table_name}.{column['name']}",
                )

            table = Base.metadata.tables[table_name]
            for constraint in table.foreign_key_constraints:
                elements = list(constraint.elements)
                expected_foreign_keys.add(
                    (
                        table_name,
                        tuple(element.parent.name for element in elements),
                        elements[0].column.table.name,
                        tuple(element.column.name for element in elements),
                    )
                )

            for foreign_key in inspector.get_foreign_keys(table_name):
                actual_foreign_keys.add(
                    (
                        table_name,
                        tuple(foreign_key["constrained_columns"]),
                        foreign_key["referred_table"],
                        tuple(foreign_key["referred_columns"]),
                    )
                )

        self.assertTrue(expected_foreign_keys)
        self.assertEqual(expected_foreign_keys, actual_foreign_keys)

    def test_committed_data_survives_engine_reconstruction(self) -> None:
        first_engine = init_engine()
        assert_selected_database(first_engine, self.mysql_database.schema_name)
        first_store = DatabaseStore()
        user = first_store.create_user("Restart Persistence User", "")
        project = first_store.create_project(user["id"], "Restart Persistence Project")

        dispose_engine()
        second_engine = init_engine()
        self.assertIsNot(first_engine, second_engine)
        assert_selected_database(second_engine, self.mysql_database.schema_name)
        reloaded_store = DatabaseStore()

        self.assertEqual("Restart Persistence User", reloaded_store.get_user(user["id"])["nickname"])
        self.assertEqual(
            "Restart Persistence Project",
            reloaded_store.get_project(project["id"])["name"],
        )


if __name__ == "__main__":
    unittest.main()
