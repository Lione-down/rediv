"""add password auth columns to users

Revision ID: b7d4c2e9f001
Revises: a1b2c3d4e5f6
Create Date: 2026-07-10

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision: str = "b7d4c2e9f001"
down_revision: Union[str, Sequence[str], None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("users") as batch_op:
        batch_op.add_column(sa.Column("username", sa.String(length=64), nullable=True, comment="Login username"))
        batch_op.add_column(sa.Column("email", sa.String(length=255), nullable=True, comment="Login email"))
        batch_op.add_column(sa.Column("password_hash", sa.String(length=255), nullable=True, comment="Bcrypt password hash"))
        batch_op.alter_column(
            "generation_status",
            existing_type=sa.String(length=32),
            comment="Generation status: enabled/frozen",
        )
        batch_op.create_index("ix_users_username", ["username"], unique=True)
        batch_op.create_index("ix_users_email", ["email"], unique=True)


def downgrade() -> None:
    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_index("ix_users_email")
        batch_op.drop_index("ix_users_username")
        batch_op.alter_column(
            "generation_status",
            existing_type=sa.String(length=32),
            comment="Legacy generation status comment",
        )
        batch_op.drop_column("password_hash")
        batch_op.drop_column("email")
        batch_op.drop_column("username")
