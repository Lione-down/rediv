"""add generation task progress

Revision ID: e1f2a3b4c5d6
Revises: d0e1f2a3b4c5
Create Date: 2026-07-16

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "e1f2a3b4c5d6"
down_revision: Union[str, Sequence[str], None] = "d0e1f2a3b4c5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _require_mysql() -> None:
    if op.get_bind().dialect.name != "mysql":
        raise RuntimeError("The generation task progress migration requires MySQL")


def upgrade() -> None:
    _require_mysql()
    op.add_column(
        "generation_tasks",
        sa.Column(
            "progress_percent",
            sa.Float(),
            nullable=True,
            comment="Last valid provider progress percentage",
        ),
    )
    op.add_column(
        "generation_tasks",
        sa.Column(
            "progress_stage",
            sa.String(length=32),
            nullable=True,
            comment="Durable progress stage: queued/provider/persisting",
        ),
    )
    op.create_check_constraint(
        "ck_generation_tasks_progress_percent",
        "generation_tasks",
        "progress_percent IS NULL OR (progress_percent >= 0 AND progress_percent <= 100)",
    )
    op.create_check_constraint(
        "ck_generation_tasks_progress_stage",
        "generation_tasks",
        "progress_stage IS NULL OR progress_stage IN ('queued', 'provider', 'persisting')",
    )


def downgrade() -> None:
    _require_mysql()
    op.drop_constraint(
        "ck_generation_tasks_progress_stage",
        "generation_tasks",
        type_="check",
    )
    op.drop_constraint(
        "ck_generation_tasks_progress_percent",
        "generation_tasks",
        type_="check",
    )
    op.drop_column("generation_tasks", "progress_stage")
    op.drop_column("generation_tasks", "progress_percent")
