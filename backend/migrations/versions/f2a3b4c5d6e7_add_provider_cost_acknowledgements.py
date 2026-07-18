"""add provider cost acknowledgements

Revision ID: f2a3b4c5d6e7
Revises: e1f2a3b4c5d6
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f2a3b4c5d6e7"
down_revision: Union[str, Sequence[str], None] = "e1f2a3b4c5d6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "provider_cost_acknowledgements",
        sa.Column("id", sa.String(length=36), nullable=False, comment="Unique acknowledgement identifier"),
        sa.Column("user_id", sa.String(length=36), nullable=False, comment="Authenticated user that accepted the provider cost reminder"),
        sa.Column("provider_id", sa.String(length=64), nullable=False, comment="Stable provider identity covered by this acknowledgement"),
        sa.Column("acknowledged_until", sa.DateTime(timezone=True), nullable=False, comment="Exclusive expiry time after which execution is blocked"),
        sa.Column("cancelled_at", sa.DateTime(timezone=True), nullable=True, comment="Cancellation time; non-null acknowledgements are inactive"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, comment="Creation time"),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, comment="Last update time"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "provider_id", name="uq_provider_cost_ack_user_provider"),
        comment="Time-bounded user acknowledgements for user-billed provider execution",
        mysql_engine="InnoDB",
        mysql_charset="utf8mb4",
    )
    op.create_index("ix_provider_cost_acknowledgements_user_id", "provider_cost_acknowledgements", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_provider_cost_acknowledgements_user_id", table_name="provider_cost_acknowledgements")
    op.drop_table("provider_cost_acknowledgements")
