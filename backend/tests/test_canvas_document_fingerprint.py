from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from core.canvas_document_fingerprint import canonical_json, mutation_fingerprint


class CanvasDocumentFingerprintTestCase(unittest.TestCase):
    def test_canonical_json_matches_rfc_8785_number_and_key_rules(self) -> None:
        value = {
            "numbers": [333333333.33333329, 1e30, 4.50, 2e-3, 1e-27, -0.0],
            "string": "€$\u000f\nA'B\"\\\"/",
        }

        self.assertEqual(
            '{"numbers":[333333333.3333333,1e+30,4.5,0.002,1e-27,0],'
            '"string":"€$\\u000f\\nA\'B\\\"\\\\\\\"/"}',
            canonical_json(value),
        )
        self.assertEqual(
            canonical_json({"\ufffd": 1, "😀": 2}),
            '{"😀":2,"�":1}',
        )
        with self.assertRaisesRegex(ValueError, "safe integers"):
            canonical_json(9_007_199_254_740_992)

    def test_mutation_fingerprint_is_order_stable_and_excludes_mutation_id(self) -> None:
        first = {
            "client_mutation_id": "first",
            "base_revision": 0,
            "node_upserts": [{"id": "node-a", "content": {"b": 2, "a": 1}}],
            "node_deletes": [],
            "connection_upserts": [],
            "connection_deletes": [],
        }
        second = {
            "connection_deletes": [],
            "connection_upserts": [],
            "node_deletes": [],
            "node_upserts": [{"content": {"a": 1, "b": 2}, "id": "node-a"}],
            "base_revision": 0,
            "client_mutation_id": "second",
        }

        self.assertEqual(mutation_fingerprint(first), mutation_fingerprint(second))
        second["base_revision"] = 1
        self.assertNotEqual(mutation_fingerprint(first), mutation_fingerprint(second))


if __name__ == "__main__":
    unittest.main()
