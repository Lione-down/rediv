"""add durable generation job execution lease

Revision ID: b7c8d9e0f1a2
Revises: c5d6e7f8a9b0
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "b7c8d9e0f1a2"
down_revision: Union[str, Sequence[str], None] = "c5d6e7f8a9b0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _require_mysql() -> None:
    if op.get_bind().dialect.name != "mysql":
        raise RuntimeError("The durable generation job migration requires MySQL")


def upgrade() -> None:
    _require_mysql()
    op.add_column(
        "generation_tasks",
        sa.Column(
            "job_version",
            sa.Integer(),
            nullable=False,
            server_default="1",
            comment="Monotonic compact status version for this generation job",
        ),
    )
    op.add_column(
        "generation_tasks",
        sa.Column(
            "lease_owner",
            sa.String(length=100),
            nullable=True,
            comment="Durable runner instance currently owning provider execution",
        ),
    )
    op.add_column(
        "generation_tasks",
        sa.Column(
            "lease_expires_at",
            sa.DateTime(timezone=True),
            nullable=True,
            comment="Bounded execution lease expiry used for process restart recovery",
        ),
    )
    op.add_column(
        "generation_tasks",
        sa.Column(
            "attempt_count",
            sa.Integer(),
            nullable=False,
            server_default="0",
            comment="Number of durable runner claims including expired lease recovery",
        ),
    )
    op.add_column(
        "generation_tasks",
        sa.Column(
            "retry_count",
            sa.Integer(),
            nullable=False,
            server_default="0",
            comment="Number of explicit user retry transitions for this generation job",
        ),
    )
    op.add_column(
        "generation_tasks",
        sa.Column(
            "cancel_requested_at",
            sa.DateTime(timezone=True),
            nullable=True,
            comment="Time cancellation was requested for queued or running execution",
        ),
    )
    op.create_index(
        "ix_generation_tasks_status_lease",
        "generation_tasks",
        ["status", "lease_expires_at"],
    )


def downgrade() -> None:
    _require_mysql()
    op.drop_index("ix_generation_tasks_status_lease", table_name="generation_tasks")
    op.drop_column("generation_tasks", "cancel_requested_at")
    op.drop_column("generation_tasks", "retry_count")
    op.drop_column("generation_tasks", "attempt_count")
    op.drop_column("generation_tasks", "lease_expires_at")
    op.drop_column("generation_tasks", "lease_owner")
    op.drop_column("generation_tasks", "job_version")
