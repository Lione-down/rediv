from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
if str(REPOSITORY_ROOT) not in sys.path:
    sys.path.insert(0, str(REPOSITORY_ROOT))

from scripts.canvas_acceptance_evidence import (
    finalize_retained_evidence,
    retain_live_evidence,
)
from scripts.canvas_acceptance_support import HarnessError


def valid_manifest(run_id: str) -> dict:
    return {
        "run": run_id,
        "project": "project-id",
        "canvas": "canvas-id",
        "checksum": "a" * 64,
        "revision": 7,
        "count": {"canvases": 1, "nodes": 200, "connections": 300},
    }


class RetainedEvidenceTestCase(unittest.TestCase):
    def test_live_playwright_artifacts_are_scoped_by_manifest_run(self) -> None:
        repository_root = Path(__file__).resolve().parents[2]
        config_source = (repository_root / "frontend/playwright.live.config.ts").read_text(
            encoding="utf-8"
        )

        self.assertIn("const manifestPath = requiredManifestPath()", config_source)
        self.assertIn("const runId = path.basename(path.dirname(manifestPath))", config_source)
        self.assertIn("t5-008-live/${runId}/${phase}/test-results", config_source)

    def test_valid_manifest_is_retained_without_identity_or_credentials(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            repo_root = Path(temporary_directory)
            run_id = "t5008-123-deadbeef"
            runtime_path = repo_root / "output/runtime" / run_id
            runtime_path.mkdir(parents=True)
            manifest_path = runtime_path / "manifest.json"
            manifest_path.write_text(
                json.dumps(valid_manifest(run_id)),
                encoding="utf-8",
            )
            (repo_root / "output/playwright/t5-008-live" / run_id / "pre-restart").mkdir(
                parents=True
            )

            reference = retain_live_evidence(
                repo_root=repo_root,
                run_id=run_id,
                manifest_path=manifest_path,
                schema_name="revid_test_t5008_123_deadbeef",
                api_port=8765,
                preview_port=9765,
                environment_metadata={
                    "os": "Windows",
                    "os_release": "test-release",
                    "machine": "AMD64",
                    "python": "3.13.2",
                },
            )

            pending = json.loads(reference.path.read_text(encoding="utf-8"))
            self.assertEqual(pending["status"], "verification_passed_cleanup_pending")
            finalize_retained_evidence(reference)
            retained = json.loads(reference.path.read_text(encoding="utf-8"))

        self.assertEqual(
            reference.path,
            repo_root / "output/playwright/t5-008-live" / run_id / "summary.json",
        )
        self.assertEqual(reference.checksum, "a" * 64)
        self.assertEqual(reference.revision, 7)
        self.assertEqual(reference.count["nodes"], 200)
        self.assertEqual(retained["checksum"], "a" * 64)
        self.assertEqual(retained["status"], "passed")
        self.assertEqual(retained["count"]["connections"], 300)
        self.assertEqual(retained["environment"]["python"], "3.13.2")
        rendered = json.dumps(retained, sort_keys=True)
        self.assertNotIn("project-id", rendered)
        self.assertNotIn("canvas-id", rendered)
        self.assertNotIn("password", rendered.lower())
        self.assertNotIn("token", rendered.lower())

    def test_manifest_with_extra_secret_field_is_rejected_without_evidence(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            repo_root = Path(temporary_directory)
            run_id = "t5008-123-deadbeef"
            runtime_path = repo_root / "output/runtime" / run_id
            runtime_path.mkdir(parents=True)
            manifest = valid_manifest(run_id)
            manifest["password"] = "credential-secret"
            manifest_path = runtime_path / "manifest.json"
            manifest_path.write_text(json.dumps(manifest), encoding="utf-8")

            with self.assertRaisesRegex(HarnessError, "unsupported"):
                retain_live_evidence(
                    repo_root=repo_root,
                    run_id=run_id,
                    manifest_path=manifest_path,
                    schema_name="revid_test_t5008_123_deadbeef",
                    api_port=8765,
                    preview_port=9765,
                    environment_metadata={"os": "Windows"},
                )

            self.assertFalse(
                (repo_root / "output/playwright/t5-008-live" / run_id / "summary.json").exists()
            )

    def test_manifest_run_and_environment_metadata_are_strictly_validated(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            repo_root = Path(temporary_directory)
            run_id = "t5008-123-deadbeef"
            runtime_path = repo_root / "output/runtime" / run_id
            runtime_path.mkdir(parents=True)
            manifest_path = runtime_path / "manifest.json"
            manifest_path.write_text(
                json.dumps(valid_manifest("another-run")),
                encoding="utf-8",
            )

            with self.assertRaisesRegex(HarnessError, "run"):
                retain_live_evidence(
                    repo_root=repo_root,
                    run_id=run_id,
                    manifest_path=manifest_path,
                    schema_name="revid_test_t5008_123_deadbeef",
                    api_port=8765,
                    preview_port=9765,
                    environment_metadata={"os": "Windows"},
                )

            manifest_path.write_text(
                json.dumps(valid_manifest(run_id)),
                encoding="utf-8",
            )
            with self.assertRaisesRegex(HarnessError, "environment"):
                retain_live_evidence(
                    repo_root=repo_root,
                    run_id=run_id,
                    manifest_path=manifest_path,
                    schema_name="revid_test_t5008_123_deadbeef",
                    api_port=8765,
                    preview_port=9765,
                    environment_metadata={"password": "credential-secret"},
                )


if __name__ == "__main__":
    unittest.main()
