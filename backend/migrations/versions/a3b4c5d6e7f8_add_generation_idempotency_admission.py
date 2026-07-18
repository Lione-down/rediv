"""add generation idempotency and Agnes admission guard

Revision ID: a3b4c5d6e7f8
Revises: f2a3b4c5d6e7
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a3b4c5d6e7f8"
down_revision: Union[str, Sequence[str], None] = "f2a3b4c5d6e7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "generation_tasks",
        sa.Column(
            "client_request_id",
            sa.String(length=36),
            nullable=True,
            comment="Authenticated client action identifier used for idempotent delivery",
        ),
    )
    op.add_column(
        "generation_tasks",
        sa.Column(
            "request_fingerprint",
            sa.String(length=64),
            nullable=True,
            comment="SHA-256 fingerprint of the immutable accepted generation request",
        ),
    )
    op.create_index(
        "ix_generation_tasks_client_request_id",
        "generation_tasks",
        ["client_request_id"],
    )
    op.create_unique_constraint(
        "uq_generation_tasks_user_client_request",
        "generation_tasks",
        ["user_id", "client_request_id"],
    )
    op.create_table(
        "agnes_admission_guard",
        sa.Column(
            "id",
            sa.Integer(),
            nullable=False,
            comment="Singleton guard identifier; the only valid runtime row is 1",
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            comment="Last admission decision time",
        ),
        sa.PrimaryKeyConstraint("id"),
        comment="Singleton row serializing cross-process Agnes admission decisions",
        mysql_engine="InnoDB",
        mysql_charset="utf8mb4",
    )
    op.execute(sa.text(
        "INSERT INTO agnes_admission_guard (id, updated_at) VALUES (1, CURRENT_TIMESTAMP)"
    ))


def downgrade() -> None:
    op.drop_table("agnes_admission_guard")
    op.drop_constraint(
        "uq_generation_tasks_user_client_request",
        "generation_tasks",
        type_="unique",
    )
    op.drop_index("ix_generation_tasks_client_request_id", table_name="generation_tasks")
    op.drop_column("generation_tasks", "request_fingerprint")
    op.drop_column("generation_tasks", "client_request_id")
