from __future__ import annotations

import json
import os
import subprocess
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "scripts" / "smoke_visual_recipes.py"


class VisualRecipeSmokeTestCase(unittest.TestCase):
    def test_dry_run_is_bounded_and_makes_no_call(self) -> None:
        result = subprocess.run(
            [sys.executable, str(SCRIPT)], cwd=ROOT, capture_output=True, text=True, check=False,
        )
        self.assertEqual(0, result.returncode)
        payload = json.loads(result.stdout)
        self.assertEqual("dry_run", payload["status"])
        self.assertEqual(3, payload["calls"])
        self.assertEqual([2, 2, 2], [case["version"] for case in payload["cases"]])
        self.assertIn("No Agnes call was made", payload["message"])

    def test_execute_without_process_key_blocks_before_network(self) -> None:
        env = {key: value for key, value in os.environ.items() if key != "REVID_AGNES_API_KEY"}
        result = subprocess.run(
            [sys.executable, str(SCRIPT), "--execute"], cwd=ROOT, env=env,
            capture_output=True, text=True, check=False,
        )
        self.assertEqual(2, result.returncode)
        self.assertIn("REVID_AGNES_API_KEY is not set", result.stdout)

    def test_dry_run_can_select_one_case_without_broadening_call_count(self) -> None:
        result = subprocess.run(
            [sys.executable, str(SCRIPT), "--case", "photo-scene"], cwd=ROOT,
            capture_output=True, text=True, check=False,
        )
        self.assertEqual(0, result.returncode)
        payload = json.loads(result.stdout)
        self.assertEqual(1, payload["calls"])
        self.assertEqual(["photo-scene"], [case["id"] for case in payload["cases"]])


if __name__ == "__main__":
    unittest.main()
