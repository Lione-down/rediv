from __future__ import annotations

import json
import unittest

from scripts.seed_acceptance_user import (
    SeedUserError,
    load_seed_credentials,
    safe_seed_result,
    seed_acceptance_user,
)


class TrackingEnvironment(dict[str, str]):
    def __init__(self, values: dict[str, str]) -> None:
        super().__init__(values)
        self.read_keys: list[str] = []

    def get(self, key: str, default=None):
        self.read_keys.append(key)
        return super().get(key, default)


class FakeStore:
    def __init__(self, existing_user: dict | None = None) -> None:
        self.existing_user = existing_user
        self.created: list[dict] = []
        self.granted: list[str] = []

    def find_user_by_username(self, username: str) -> dict | None:
        return self.existing_user

    def create_user(self, nickname, avatar_url, role="user", **fields):
        user = {
            "id": "user-123",
            "username": fields["username"],
            "role": role,
            "password_hash": fields["password_hash"],
        }
        self.created.append(user)
        return user

    def grant_default_quotas(self, user_id: str) -> None:
        self.granted.append(user_id)


class SeedAcceptanceUserTestCase(unittest.TestCase):
    def test_credentials_read_only_dedicated_environment_names(self) -> None:
        environment = TrackingEnvironment(
            {
                "REVID_ACCEPTANCE_USERNAME": "acceptance-user",
                "REVID_ACCEPTANCE_PASSWORD": "browser-secret",
                "REVID_ADMIN_PASSWORD": "must-not-read",
            }
        )

        credentials = load_seed_credentials(environment)

        self.assertEqual(credentials, ("acceptance-user", "browser-secret"))
        self.assertEqual(
            environment.read_keys,
            ["REVID_ACCEPTANCE_USERNAME", "REVID_ACCEPTANCE_PASSWORD"],
        )

    def test_seed_creates_only_normal_user_and_grants_default_quotas(self) -> None:
        store = FakeStore()

        user = seed_acceptance_user(
            store,
            username="acceptance-user",
            password="browser-secret",
            password_hasher=lambda value: f"hashed:{value}",
        )

        self.assertEqual(user["role"], "user")
        self.assertEqual(store.created[0]["role"], "user")
        self.assertEqual(store.granted, ["user-123"])

    def test_existing_username_fails_closed_without_mutation(self) -> None:
        store = FakeStore(existing_user={"id": "pre-existing", "role": "user"})

        with self.assertRaisesRegex(SeedUserError, "already exists"):
            seed_acceptance_user(
                store,
                username="acceptance-user",
                password="browser-secret",
                password_hasher=lambda value: f"hashed:{value}",
            )

        self.assertEqual(store.created, [])
        self.assertEqual(store.granted, [])

    def test_safe_result_contains_no_identity_or_credentials(self) -> None:
        rendered = json.dumps(
            safe_seed_result(
                {
                    "id": "user-123",
                    "username": "acceptance-user",
                    "password_hash": "hashed:browser-secret",
                    "role": "user",
                }
            )
        )

        self.assertEqual(json.loads(rendered), {"status": "ready", "role": "user"})
        self.assertNotIn("acceptance-user", rendered)
        self.assertNotIn("browser-secret", rendered)


if __name__ == "__main__":
    unittest.main()
