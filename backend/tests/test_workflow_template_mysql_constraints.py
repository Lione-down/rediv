from __future__ import annotations

import unittest
from datetime import UTC, datetime
from hashlib import sha256

from sqlalchemy import func, select
from sqlalchemy.exc import DBAPIError, IntegrityError

from models.base import dispose_engine, get_session, init_engine
from models.canvas import Canvas
from models.canvas_node import CanvasNode
from models.project import Project
from models.user import User
from models.workflow_template import (
    WorkflowRun,
    WorkflowRunStep,
    WorkflowTemplateBinding,
    WorkflowTemplateDefinition,
    WorkflowTemplateInstance,
    WorkflowTemplateInstanceStep,
    WorkflowTemplateSlot,
    WorkflowTemplateVersion,
)
from tests.mysql_test_database import (
    MySQLTestDatabase,
    assert_selected_database,
)


class WorkflowTemplateMySQLConstraintTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.database = MySQLTestDatabase(
            "revid_test_workflow_template_constraints"
        )
        cls.database.start()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.database.stop()

    def setUp(self) -> None:
        self.now = datetime.now(UTC)
        self._seed_scope()

    def test_full_foundation_survives_engine_restart(self) -> None:
        with get_session() as session:
            definition, version, slot, instance, instance_step = (
                self._add_template_foundation(session)
            )
            binding = WorkflowTemplateBinding(
                id="binding-product-name",
                instance_id=instance.id,
                version_id=version.id,
                slot_id=slot.id,
                binding_type="value",
                value_json={"value": "Product"},
                asset_id=None,
                source_revision=None,
                created_at=self.now,
                updated_at=self.now,
            )
            run = WorkflowRun(
                id="workflow-run-1",
                instance_id=instance.id,
                owner_user_id=self.user_id,
                project_id=self.project_id,
                canvas_id=self.canvas_id,
                status="ready",
                preflight_fingerprint="b" * 64,
                client_run_id="client-run-1",
                quota_estimate={"text": 1, "image": 1, "video": 0},
                cost_class="standard",
                created_at=self.now,
                updated_at=self.now,
                completed_at=None,
            )
            run_step = WorkflowRunStep(
                id="workflow-run-step-1",
                run_id=run.id,
                instance_id=instance.id,
                instance_step_id=instance_step.id,
                status="ready",
                generation_task_id=None,
                dependency_snapshot={"depends_on": []},
                attempt_count=0,
                error_code=None,
                created_at=self.now,
                updated_at=self.now,
            )
            session.add_all([binding, run, run_step])
            session.commit()
            identifiers = {
                "definition": definition.id,
                "version": version.id,
                "slot": slot.id,
                "instance": instance.id,
                "instance_step": instance_step.id,
                "run": run.id,
                "run_step": run_step.id,
            }

        dispose_engine()
        init_engine()
        with get_session() as session:
            self.assertEqual(
                1,
                session.scalar(
                    select(func.count())
                    .select_from(WorkflowTemplateDefinition)
                    .where(WorkflowTemplateDefinition.id == identifiers["definition"])
                ),
            )
            self.assertIsNotNone(
                session.get(WorkflowTemplateVersion, identifiers["version"])
            )
            self.assertIsNotNone(session.get(WorkflowTemplateSlot, identifiers["slot"]))
            self.assertIsNotNone(
                session.get(WorkflowTemplateInstance, identifiers["instance"])
            )
            self.assertIsNotNone(
                session.get(
                    WorkflowTemplateInstanceStep,
                    identifiers["instance_step"],
                )
            )
            self.assertIsNotNone(session.get(WorkflowRun, identifiers["run"]))
            self.assertIsNotNone(
                session.get(WorkflowRunStep, identifiers["run_step"])
            )

    def test_unique_lifecycle_and_scope_constraints_fail_closed(self) -> None:
        with get_session() as session:
            definition, version, slot, instance, _ = (
                self._add_template_foundation(session)
            )
            session.commit()

            session.add(
                WorkflowTemplateVersion(
                    id="workflow-version-duplicate",
                    definition_id=definition.id,
                    version=1,
                    schema_id="revid.workflow-template",
                    schema_version=1,
                    lifecycle="draft",
                    manifest={},
                    fingerprint="c" * 64,
                    created_by_user_id=self.user_id,
                    published_at=None,
                    created_at=self.now,
                )
            )
            with self.assertRaises(IntegrityError):
                session.commit()
            session.rollback()

            session.add(
                WorkflowTemplateDefinition(
                    id="workflow-definition-invalid",
                    template_key="user.invalid-scope",
                    owner_user_id=self.user_id,
                    scope="built_in",
                    status="active",
                    name="Invalid scope",
                    category="commercial",
                    description="",
                    created_at=self.now,
                    updated_at=self.now,
                )
            )
            with self.assertRaises(DBAPIError):
                session.commit()
            session.rollback()

            session.add(
                WorkflowTemplateBinding(
                    id="binding-invalid-shape",
                    instance_id=instance.id,
                    version_id=version.id,
                    slot_id=slot.id,
                    binding_type="asset",
                    value_json={"value": "not-an-asset"},
                    asset_id=None,
                    source_revision=None,
                    created_at=self.now,
                    updated_at=self.now,
                )
            )
            with self.assertRaises(DBAPIError):
                session.commit()
            session.rollback()

    def test_cross_canvas_instance_step_fails_closed(self) -> None:
        with get_session() as session:
            _, _, _, instance, _ = self._add_template_foundation(session)
            session.add(
                WorkflowTemplateInstanceStep(
                    id="cross-canvas-step",
                    instance_id=instance.id,
                    canvas_id=self.other_canvas_id,
                    step_key="cross-canvas",
                    node_local_id="script",
                    canvas_node_id=self.other_node_id,
                    status="ready",
                    configuration={},
                    created_at=self.now,
                    updated_at=self.now,
                )
            )
            with self.assertRaises(IntegrityError):
                session.commit()

    def test_fingerprints_require_lowercase_hex(self) -> None:
        with get_session() as session:
            definition, _, _, _, _ = self._add_template_foundation(session)
            session.commit()
            session.add(
                WorkflowTemplateVersion(
                    id="workflow-version-uppercase",
                    definition_id=definition.id,
                    version=2,
                    schema_id="revid.workflow-template",
                    schema_version=1,
                    lifecycle="draft",
                    manifest={},
                    fingerprint="A" * 64,
                    created_by_user_id=self.user_id,
                    published_at=None,
                    created_at=self.now,
                )
            )
            with self.assertRaises(DBAPIError):
                session.commit()

    def test_database_identity_and_revision_mismatch_fail_closed(self) -> None:
        with self.assertRaisesRegex(RuntimeError, "identity gate failed"):
            assert_selected_database(
                init_engine(),
                "revid_test_workflow_template_other",
            )

        stale = MySQLTestDatabase(
            "revid_test_workflow_template_stale_revision",
            revision="b7c8d9e0f1a2",
        )
        stale.start()
        try:
            with self.assertRaisesRegex(RuntimeError, "revision"):
                stale.restart_runtime()
        finally:
            stale.stop()
            dispose_engine()
            init_engine()

    def _seed_scope(self) -> None:
        suffix = sha256(self._testMethodName.encode("utf-8")).hexdigest()[:12]
        self.user_id = f"user-{suffix}"
        self.project_id = f"project-{suffix}"
        self.canvas_id = f"canvas-{suffix}"
        self.other_project_id = f"project-other-{suffix}"
        self.other_canvas_id = f"canvas-other-{suffix}"
        self.other_node_id = f"node-other-{suffix}"
        with get_session() as session:
            session.add(
                User(
                    id=self.user_id,
                    username=self.user_id,
                    email=None,
                    password_hash=None,
                    nickname="Workflow Owner",
                    avatar_url="",
                    role="user",
                    status="active",
                    generation_status="enabled",
                    created_at=self.now,
                    updated_at=self.now,
                    last_login_at=self.now,
                )
            )
            session.flush()
            session.add_all(
                [
                    Project(
                        id=self.project_id,
                        user_id=self.user_id,
                        name="Workflow Project",
                        canvas_order_revision=0,
                        created_at=self.now,
                        updated_at=self.now,
                    ),
                    Project(
                        id=self.other_project_id,
                        user_id=self.user_id,
                        name="Other Workflow Project",
                        canvas_order_revision=0,
                        created_at=self.now,
                        updated_at=self.now,
                    ),
                ]
            )
            session.flush()
            session.add_all(
                [
                    Canvas(
                        id=self.canvas_id,
                        project_id=self.project_id,
                        name="Workflow Canvas",
                        created_at=self.now,
                        updated_at=self.now,
                    ),
                    Canvas(
                        id=self.other_canvas_id,
                        project_id=self.other_project_id,
                        name="Other Canvas",
                        created_at=self.now,
                        updated_at=self.now,
                    ),
                ]
            )
            session.flush()
            session.add(
                CanvasNode(
                    id=self.other_node_id,
                    project_id=self.other_project_id,
                    canvas_id=self.other_canvas_id,
                    node_type="script",
                    content={},
                    position_x=0,
                    position_y=0,
                    width=300,
                    height=200,
                    z_index=0,
                    parent_node_id=None,
                    is_locked=False,
                    is_collapsed=False,
                    status="active",
                    created_at=self.now,
                    updated_at=self.now,
                )
            )
            session.commit()

    def _add_template_foundation(self, session):
        suffix = sha256(self._testMethodName.encode("utf-8")).hexdigest()[:12]
        definition = WorkflowTemplateDefinition(
            id=f"workflow-definition-{suffix}",
            template_key=f"user.product-ad.{suffix}",
            owner_user_id=self.user_id,
            scope="private",
            status="active",
            name="Product Ad",
            category="commercial",
            description="Reusable product advertisement",
            created_at=self.now,
            updated_at=self.now,
        )
        version = WorkflowTemplateVersion(
            id=f"workflow-version-{suffix}",
            definition_id=definition.id,
            version=1,
            schema_id="revid.workflow-template",
            schema_version=1,
            lifecycle="published",
            manifest={"graph": {"nodes": [], "connections": []}},
            fingerprint="a" * 64,
            created_by_user_id=self.user_id,
            published_at=self.now,
            created_at=self.now,
        )
        slot = WorkflowTemplateSlot(
            id=f"workflow-slot-{suffix}",
            version_id=version.id,
            slot_key="product_name",
            slot_kind="variable",
            value_type="text",
            is_required=True,
            position=0,
            definition={"max_length": 120},
            created_at=self.now,
        )
        instance = WorkflowTemplateInstance(
            id=f"workflow-instance-{suffix}",
            definition_id=definition.id,
            version_id=version.id,
            owner_user_id=self.user_id,
            project_id=self.project_id,
            canvas_id=self.canvas_id,
            status="instantiated",
            preflight_fingerprint="a" * 64,
            client_mutation_id=f"mutation-{suffix}",
            node_id_map={"script": f"node-{suffix}"},
            local_overrides={},
            created_at=self.now,
            updated_at=self.now,
            detached_at=None,
        )
        instance_step = WorkflowTemplateInstanceStep(
            id=f"workflow-instance-step-{suffix}",
            instance_id=instance.id,
            canvas_id=self.canvas_id,
            step_key="compile-story",
            node_local_id="script",
            canvas_node_id=None,
            status="ready",
            configuration={},
            created_at=self.now,
            updated_at=self.now,
        )
        session.add(definition)
        session.flush()
        session.add(version)
        session.flush()
        session.add_all([slot, instance])
        session.flush()
        session.add(instance_step)
        session.flush()
        return definition, version, slot, instance, instance_step


if __name__ == "__main__":
    unittest.main()
