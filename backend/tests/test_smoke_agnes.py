from __future__ import annotations

import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


class AgnesSmokeScriptTestCase(unittest.TestCase):
    def test_smoke_script_defaults_to_dry_run(self) -> None:
        script_path = Path(__file__).resolve().parents[2] / "scripts" / "smoke_agnes.py"
        result = subprocess.run(
            [sys.executable, str(script_path), "--media", "text"],
            capture_output=True,
            text=True,
            check=False,
        )

        self.assertEqual(0, result.returncode)
        payload = json.loads(result.stdout)
        self.assertEqual("dry_run", payload["status"])
        self.assertIn("No Agnes call was made", payload["message"])

    def test_smoke_script_execute_without_key_exits_before_call(self) -> None:
        script_path = Path(__file__).resolve().parents[2] / "scripts" / "smoke_agnes.py"
        env = {**os.environ, "REVID_AGNES_API_KEY": ""}
        result = subprocess.run(
            [sys.executable, str(script_path), "--media", "text", "--execute"],
            capture_output=True,
            text=True,
            check=False,
            env=env,
        )

        self.assertEqual(2, result.returncode)
        self.assertIn("REVID_AGNES_API_KEY is not set", result.stdout)

    def test_smoke_script_ignores_key_from_local_env_file(self) -> None:
        script_path = Path(__file__).resolve().parents[2] / "scripts" / "smoke_agnes.py"
        env = {
            key: value
            for key, value in os.environ.items()
            if key not in {"REVID_AGNES_API_KEY", "REVID_AGNES_BASE_URL"}
        }

        with tempfile.TemporaryDirectory() as temp_dir:
            Path(temp_dir, ".env").write_text(
                "REVID_AGNES_API_KEY=fake-local-key\n"
                "REVID_AGNES_BASE_URL=http://127.0.0.1:9\n",
                encoding="utf-8",
            )
            result = subprocess.run(
                [sys.executable, str(script_path), "--media", "text", "--execute"],
                capture_output=True,
                text=True,
                check=False,
                cwd=temp_dir,
                env=env,
            )

        self.assertEqual(2, result.returncode)
        self.assertIn("REVID_AGNES_API_KEY is not set", result.stdout)


if __name__ == "__main__":
    unittest.main()
