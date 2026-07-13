"""add quota revision

Revision ID: c9d0e1f2a3b4
Revises: b8c9d0e1f2a3
Create Date: 2026-07-14

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import mysql


revision: str = "c9d0e1f2a3b4"
down_revision: Union[str, Sequence[str], None] = "b8c9d0e1f2a3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _require_mysql() -> None:
    if op.get_bind().dialect.name != "mysql":
        raise RuntimeError("The quota revision migration requires MySQL")


def upgrade() -> None:
    _require_mysql()
    op.add_column(
        "quotas",
        sa.Column(
            "revision",
            sa.Integer(),
            nullable=False,
            server_default=sa.text("0"),
            comment="Monotonic quota balance revision",
        ),
    )
    op.alter_column(
        "quota_ledger",
        "created_at",
        existing_type=mysql.DATETIME(fsp=0),
        type_=mysql.DATETIME(fsp=6),
        existing_nullable=False,
        existing_comment="创建时间",
    )


def downgrade() -> None:
    _require_mysql()
    op.alter_column(
        "quota_ledger",
        "created_at",
        existing_type=mysql.DATETIME(fsp=6),
        type_=mysql.DATETIME(fsp=0),
        existing_nullable=False,
        existing_comment="创建时间",
    )
    op.drop_column("quotas", "revision")
