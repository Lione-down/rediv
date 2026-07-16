"""add generation task request parameters

Revision ID: d0e1f2a3b4c5
Revises: c9d0e1f2a3b4
Create Date: 2026-07-16

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "d0e1f2a3b4c5"
down_revision: Union[str, Sequence[str], None] = "c9d0e1f2a3b4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _require_mysql() -> None:
    if op.get_bind().dialect.name != "mysql":
        raise RuntimeError("The generation task request parameters migration requires MySQL")


def upgrade() -> None:
    _require_mysql()
    op.add_column(
        "generation_tasks",
        sa.Column(
            "request_parameters",
            sa.JSON(),
            nullable=True,
            comment="Immutable sanitized generation request parameters",
        ),
    )


def downgrade() -> None:
    _require_mysql()
    op.drop_column("generation_tasks", "request_parameters")
