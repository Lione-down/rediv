import unittest

from core.agent_skill_contract import (
    AgentSkillManifest,
    AgentSkillContractError,
    build_agent_skill_capabilities,
    build_agent_skill_preflight,
    resolve_active_agent_skill_manifest,
    resolve_agent_skill_manifest,
    validate_agent_skill_manifests,
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

    def test_v3_discovers_only_active_cinematic_v2_and_preserves_v2_exactly(self):
        legacy = build_agent_skill_capabilities(contract_version=2)
        current = build_agent_skill_capabilities(contract_version=3)

        self.assertEqual(2, legacy["contract_version"])
        self.assertEqual([1, 1, 1, 1], [item["version"] for item in legacy["skills"]])
        self.assertTrue(all("lifecycle" not in item for item in legacy["skills"]))
        self.assertEqual(3, current["contract_version"])
        self.assertEqual(
            [
                ("revid.canvas-context", 1, "active", None),
                ("revid.cinema-script", 2, "active", 1),
                ("revid.cinema-image", 2, "active", 1),
                ("revid.cinema-video", 2, "active", 1),
            ],
            [
                (item["id"], item["version"], item["lifecycle"], item["replaces_version"])
                for item in current["skills"]
            ],
        )
        self.assertEqual(1, resolve_agent_skill_manifest("revid.cinema-video", 1).version)
        self.assertEqual(2, resolve_agent_skill_manifest("revid.cinema-video", 2).version)
        self.assertEqual(2, resolve_active_agent_skill_manifest("revid.cinema-video").version)

    def test_registry_validation_rejects_duplicate_active_and_unknown_lifecycle(self):
        valid = AgentSkillManifest(
            id="revid.cinema-image", version=2, execution_mode="native-handoff",
            intent="cinema-image", requires_acknowledgement=False,
            lifecycle="active", replaces_version=None,
        )
        second_active = AgentSkillManifest(
            id="revid.cinema-image", version=3, execution_mode="native-handoff",
            intent="cinema-image", requires_acknowledgement=False,
            lifecycle="active", replaces_version=None,
        )
        with self.assertRaisesRegex(AgentSkillContractError, "duplicate active"):
            validate_agent_skill_manifests((valid, second_active))
        invalid = AgentSkillManifest(
            id="revid.cinema-image", version=3, execution_mode="native-handoff",
            intent="cinema-image", requires_acknowledgement=False,
            lifecycle="retired", replaces_version=2,  # type: ignore[arg-type]
        )
        with self.assertRaisesRegex(AgentSkillContractError, "lifecycle"):
            validate_agent_skill_manifests((invalid,))

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
