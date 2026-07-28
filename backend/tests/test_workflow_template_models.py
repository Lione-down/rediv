from __future__ import annotations

import unittest

from models.template import Template
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


class WorkflowTemplateModelContractTests(unittest.TestCase):
    def test_foundation_models_have_distinct_commented_mysql_tables(self) -> None:
        expected = {
            WorkflowTemplateDefinition: "workflow_template_definitions",
            WorkflowTemplateVersion: "workflow_template_versions",
            WorkflowTemplateSlot: "workflow_template_slots",
            WorkflowTemplateInstance: "workflow_template_instances",
            WorkflowTemplateBinding: "workflow_template_bindings",
            WorkflowTemplateInstanceStep: "workflow_template_instance_steps",
            WorkflowRun: "workflow_runs",
            WorkflowRunStep: "workflow_run_steps",
        }

        self.assertEqual(
            set(expected.values()),
            {model.__table__.name for model in expected},
        )
        for model, table_name in expected.items():
            table = model.__table__
            self.assertEqual(table_name, table.name)
            self.assertTrue(table.comment)
            self.assertEqual("InnoDB", table.dialect_options["mysql"]["engine"])
            self.assertEqual("utf8mb4", table.dialect_options["mysql"]["charset"])
            self.assertTrue(table.columns)
            self.assertTrue(all(column.comment for column in table.columns))

    def test_foundation_models_freeze_required_database_guards(self) -> None:
        constraints = {
            table.name: {
                constraint.name
                for constraint in table.constraints
                if constraint.name is not None
            }
            for table in (
                WorkflowTemplateDefinition.__table__,
                WorkflowTemplateVersion.__table__,
                WorkflowTemplateSlot.__table__,
                WorkflowTemplateInstance.__table__,
                WorkflowTemplateBinding.__table__,
                WorkflowTemplateInstanceStep.__table__,
                WorkflowRun.__table__,
                WorkflowRunStep.__table__,
            )
        }

        self.assertTrue(
            {
                "ck_workflow_template_definitions_scope_owner",
                "ck_workflow_template_definitions_status",
                "uq_workflow_template_definitions_template_key",
            }.issubset(constraints["workflow_template_definitions"])
        )
        self.assertTrue(
            {
                "ck_workflow_template_versions_lifecycle",
                "ck_workflow_template_versions_fingerprint",
                "uq_workflow_template_versions_definition_version",
                "uq_workflow_template_versions_definition_id",
            }.issubset(constraints["workflow_template_versions"])
        )
        self.assertTrue(
            {
                "ck_workflow_template_slots_kind",
                "uq_workflow_template_slots_version_key",
                "uq_workflow_template_slots_version_id",
            }.issubset(constraints["workflow_template_slots"])
        )
        self.assertTrue(
            {
                "ck_workflow_template_instances_status",
                "ck_workflow_template_instances_fingerprint",
                "uq_workflow_template_instances_canvas_mutation",
                "uq_workflow_template_instances_definition_version",
                "uq_workflow_template_instances_version_id",
                "uq_workflow_template_instances_canvas_id",
                "uq_workflow_template_instances_scope_id",
            }.issubset(constraints["workflow_template_instances"])
        )
        self.assertTrue(
            {
                "ck_workflow_template_bindings_shape",
                "uq_workflow_template_bindings_instance_slot",
            }.issubset(constraints["workflow_template_bindings"])
        )
        self.assertTrue(
            {
                "ck_workflow_template_instance_steps_status",
                "uq_workflow_template_instance_steps_key",
                "uq_workflow_template_instance_steps_node",
                "uq_workflow_template_instance_steps_instance_id",
            }.issubset(constraints["workflow_template_instance_steps"])
        )
        self.assertTrue(
            {
                "ck_workflow_runs_status",
                "ck_workflow_runs_fingerprint",
                "uq_workflow_runs_owner_client",
                "uq_workflow_runs_instance_id",
            }.issubset(constraints["workflow_runs"])
        )
        self.assertTrue(
            {
                "ck_workflow_run_steps_status",
                "uq_workflow_run_steps_run_instance_step",
            }.issubset(constraints["workflow_run_steps"])
        )

    def test_legacy_graph_template_model_remains_unchanged(self) -> None:
        self.assertEqual("templates", Template.__tablename__)
        self.assertEqual(
            {
                "id",
                "user_id",
                "name",
                "node_data",
                "schema_version",
                "graph_data",
                "node_count",
                "created_at",
            },
            set(Template.__table__.columns.keys()),
        )


if __name__ == "__main__":
    unittest.main()
