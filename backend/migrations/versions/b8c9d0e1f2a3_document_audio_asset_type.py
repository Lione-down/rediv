"""document audio asset type

Revision ID: b8c9d0e1f2a3
Revises: a6b7c8d9e0f1
Create Date: 2026-07-13

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "b8c9d0e1f2a3"
down_revision: Union[str, Sequence[str], None] = "a6b7c8d9e0f1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _require_mysql() -> None:
    if op.get_bind().dialect.name != "mysql":
        raise RuntimeError("The audio asset type migration requires MySQL")


def upgrade() -> None:
    _require_mysql()
    op.alter_column(
        "assets",
        "type",
        existing_type=sa.String(32),
        existing_nullable=False,
        existing_comment="资源类型: image/video/text/prompt",
        comment="资源类型: image/video/audio/text/prompt",
    )


def downgrade() -> None:
    _require_mysql()
    op.alter_column(
        "assets",
        "type",
        existing_type=sa.String(32),
        existing_nullable=False,
        existing_comment="资源类型: image/video/audio/text/prompt",
        comment="资源类型: image/video/text/prompt",
    )
