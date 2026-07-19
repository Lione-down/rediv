from __future__ import annotations

import unittest

from core.script_authoring_contract import (
    ScriptAuthoringOutputError,
    build_script_authoring_capabilities,
    build_script_authoring_messages,
    validate_script_authoring_output,
)


class ScriptAuthoringContractTests(unittest.TestCase):
    def test_capability_exposes_fixed_model_and_bounded_intents(self) -> None:
        capability = build_script_authoring_capabilities(model="text-current")

        self.assertEqual(1, capability["contract_version"])
        self.assertEqual("text-current", capability["model"])
        self.assertEqual("Agnes 2.0 Flash", capability["model_label"])
        self.assertEqual(["script_draft", "script_refine"], capability["intents"])
        self.assertEqual(4_000, capability["brief_max_length"])
        self.assertEqual(12_000, capability["source_max_length"])
        self.assertEqual(12_000, capability["output_max_length"])

    def test_draft_and_refine_messages_are_backend_owned(self) -> None:
        draft = build_script_authoring_messages(
            intent="script_draft",
            locale="zh-CN",
            brief="一名摄影师在雨夜寻找失踪的胶卷。",
            image_urls=["https://media.revid.test/reference.png"],
        )
        refine = build_script_authoring_messages(
            intent="script_refine",
            locale="en-US",
            source_text="A photographer enters the station.",
            instruction="Improve pacing without changing the ending.",
        )

        self.assertEqual(["system", "user"], [item["role"] for item in draft])
        self.assertIn("editable script", draft[0]["content"])
        self.assertIn("zh-CN", draft[0]["content"])
        self.assertIn("摄影师", draft[1]["content"][0]["text"])
        self.assertEqual("text", draft[1]["content"][0]["type"])
        self.assertEqual("image_url", draft[1]["content"][1]["type"])
        self.assertEqual(
            "https://media.revid.test/reference.png",
            draft[1]["content"][1]["image_url"]["url"],
        )
        self.assertIn("preserve", refine[0]["content"].lower())
        self.assertIn("Improve pacing", refine[1]["content"])
        self.assertIn("photographer", refine[1]["content"])

    def test_output_is_plain_bounded_editable_text(self) -> None:
        self.assertEqual("第一场：雨夜。", validate_script_authoring_output("  第一场：雨夜。  "))
        for value in ("", "```markdown\nscript\n```", "x" * 12_001):
            with self.subTest(value_length=len(value)):
                with self.assertRaises(ScriptAuthoringOutputError):
                    validate_script_authoring_output(value)


if __name__ == "__main__":
    unittest.main()
