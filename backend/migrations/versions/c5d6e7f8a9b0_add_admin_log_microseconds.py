"""preserve admin log insertion precision

Revision ID: c5d6e7f8a9b0
Revises: b4c5d6e7f8a9
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql


revision: str = "c5d6e7f8a9b0"
down_revision: Union[str, Sequence[str], None] = "b4c5d6e7f8a9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "admin_logs",
        "created_at",
        existing_type=sa.DateTime(),
        type_=mysql.DATETIME(fsp=6),
        existing_nullable=False,
        existing_comment="创建时间",
    )


def downgrade() -> None:
    op.alter_column(
        "admin_logs",
        "created_at",
        existing_type=mysql.DATETIME(fsp=6),
        type_=sa.DateTime(),
        existing_nullable=False,
        existing_comment="创建时间",
    )
