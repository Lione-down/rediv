import unittest

from core.agent_skill_contract import (
    AgentSkillContractError,
    build_agent_skill_capabilities,
    build_agent_skill_preflight,
    resolve_agent_skill_manifest,
)


class AgentSkillContractTests(unittest.TestCase):
    def test_only_revid_canvas_context_v1_is_discoverable_and_mock_only(self):
        capabilities = build_agent_skill_capabilities()

        self.assertEqual(capabilities["contract_version"], 1)
        self.assertEqual(capabilities["execution_modes"], ["mock-only", "unavailable"])
        self.assertEqual(capabilities["skills"], [{
            "id": "revid.canvas-context",
            "version": 1,
            "execution_mode": "mock-only",
            "intent": "canvas-context",
            "requires_acknowledgement": False,
        }])
        self.assertFalse(capabilities["provider"]["available"])
        self.assertFalse(capabilities["quota"]["available"])
        self.assertFalse(capabilities["task"]["available"])

    def test_manifest_resolution_rejects_unknown_and_future_versions(self):
        manifest = resolve_agent_skill_manifest("revid.canvas-context", 1)

        self.assertEqual(manifest.id, "revid.canvas-context")
        self.assertEqual(manifest.version, 1)
        self.assertEqual(manifest.execution_mode, "mock-only")
        with self.assertRaises(AgentSkillContractError):
            resolve_agent_skill_manifest("revid.external-tool", 1)
        with self.assertRaises(AgentSkillContractError):
            resolve_agent_skill_manifest("revid.canvas-context", 2)

    def test_canvas_context_preflight_is_bounded_deterministic_and_non_durable(self):
        preflight = build_agent_skill_preflight(
            skill_id="revid.canvas-context",
            skill_version=1,
            project_id="project-1",
            canvas_id="canvas-1",
            selected_node_ids=["node-b", "node-a"],
            canvas_nodes=[
                {"id": "node-a", "node_type": "script", "content": {"serialization_version": 1, "subtype": "script"}},
                {"id": "node-b", "node_type": "generation", "content": {"serialization_version": 1, "subtype": "image"}},
            ],
        )

        self.assertEqual(preflight["execution_mode"], "mock-only")
        self.assertEqual(preflight["skill"], {
            "id": "revid.canvas-context",
            "version": 1,
            "execution_mode": "mock-only",
            "intent": "canvas-context",
            "requires_acknowledgement": False,
        })
        self.assertEqual(preflight["sources"], [
            {"node_id": "node-b", "role": "canvas-node", "node_type": "generation", "subtype": "image"},
            {"node_id": "node-a", "role": "canvas-node", "node_type": "script", "subtype": "script"},
        ])
        self.assertFalse(preflight["provider"]["available"])
        self.assertFalse(preflight["quota"]["available"])
        self.assertFalse(preflight["task"]["available"])
        with self.assertRaises(AgentSkillContractError):
            build_agent_skill_preflight(
                skill_id="revid.canvas-context", skill_version=1,
                project_id="project-1", canvas_id="canvas-1",
                selected_node_ids=["node-a", "node-a"],
                canvas_nodes=[{"id": "node-a", "node_type": "script", "content": {"serialization_version": 1, "subtype": "script"}}],
            )

    def test_canvas_context_preflight_rejects_noncanonical_or_missing_canvas_sources(self):
        for canvas_nodes in [
            [{"id": "node-a", "node_type": "external", "content": {"serialization_version": 1, "subtype": "script"}}],
            [{"id": "node-a", "node_type": [], "content": {"serialization_version": 1, "subtype": "script"}}],
            [{"id": "node-a", "node_type": "script", "content": {"serialization_version": 2, "subtype": "script"}}],
            [{"id": "node-a", "node_type": "script", "content": {"serialization_version": 1, "subtype": "foreign"}}],
        ]:
            with self.assertRaises(AgentSkillContractError):
                build_agent_skill_preflight(
                    skill_id="revid.canvas-context", skill_version=1,
                    project_id="project-1", canvas_id="canvas-1",
                    selected_node_ids=["node-a"], canvas_nodes=canvas_nodes,
                )
