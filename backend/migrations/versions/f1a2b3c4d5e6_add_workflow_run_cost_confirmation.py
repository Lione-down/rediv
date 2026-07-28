"""add workflow-run cost confirmation

Revision ID: f1a2b3c4d5e6
Revises: e0f1a2b3c4d5
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "f1a2b3c4d5e6"
down_revision: Union[str, Sequence[str], None] = "e0f1a2b3c4d5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _require_mysql() -> None:
    if op.get_bind().dialect.name != "mysql":
        raise RuntimeError("Workflow-run cost confirmation requires MySQL")


def _require_disposable_database() -> None:
    database_name = op.get_bind().execute(sa.text("SELECT DATABASE()")).scalar_one()
    suffix = database_name.removeprefix("revid_test_")
    if (
        not database_name.startswith("revid_test_")
        or not suffix
        or not suffix.isascii()
        or not suffix.replace("_", "").isalnum()
    ):
        raise RuntimeError(
            "Destructive downgrade is restricted to a guarded revid_test_* database"
        )


def upgrade() -> None:
    _require_mysql()
    op.add_column(
        "workflow_runs",
        sa.Column(
            "cost_confirmed",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
            comment="Exact explicit cost-confirmation fact used for run idempotency",
        ),
    )
    op.alter_column(
        "workflow_runs",
        "cost_confirmed",
        existing_type=sa.Boolean(),
        existing_nullable=False,
        existing_server_default=sa.false(),
        server_default=None,
        existing_comment=(
            "Exact explicit cost-confirmation fact used for run idempotency"
        ),
    )


def downgrade() -> None:
    _require_mysql()
    _require_disposable_database()
    op.drop_column("workflow_runs", "cost_confirmed")
