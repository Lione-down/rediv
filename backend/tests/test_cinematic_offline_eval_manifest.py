from __future__ import annotations

import json
from pathlib import Path
import unittest


MANIFEST = Path(__file__).parents[2] / "ai" / "evidence" / "t6-001" / "offline-eval-manifest.json"
REQUIRED_CASES = {
    "standalone-fast-lane", "vague-brief", "product-continuity", "character-continuity",
    "accepted-unexpected-outcome", "rejected-take", "completed-reserved-beats",
    "single-variable-retake", "unsupported-media", "stale-canon", "provider-ownership",
    "malformed-schema", "duplication", "review-only-375",
}
ALLOWED_MUTATIONS = {
    "none", "canvas-command-only", "one-canon-command", "explicit-send-only",
    "duplicate-canvas-only",
}


class CinematicOfflineEvalManifestTests(unittest.TestCase):
    def test_manifest_covers_required_cases_without_real_provider_claims(self) -> None:
        manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))

        self.assertEqual(1, manifest["contract_version"])
        self.assertEqual("offline-contract-mock-browser", manifest["evidence_class"])
        self.assertIs(False, manifest["real_provider_fidelity_claimed"])
        cases = manifest["cases"]
        self.assertEqual(REQUIRED_CASES, {case["id"] for case in cases})
        self.assertEqual(len(REQUIRED_CASES), len(cases))
        for case in cases:
            with self.subTest(case=case["id"]):
                self.assertEqual(
                    {"id", "layer", "expected", "mutation", "evidence"}, set(case),
                )
                self.assertIn(case["mutation"], ALLOWED_MUTATIONS)
                self.assertTrue(case["expected"])
                self.assertTrue(case["evidence"])
                self.assertTrue(all(isinstance(item, str) and item for item in case["evidence"]))


if __name__ == "__main__":
    unittest.main()
