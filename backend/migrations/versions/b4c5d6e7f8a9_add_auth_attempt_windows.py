"""add cross-process authentication attempt windows

Revision ID: b4c5d6e7f8a9
Revises: a3b4c5d6e7f8
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b4c5d6e7f8a9"
down_revision: Union[str, Sequence[str], None] = "a3b4c5d6e7f8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "auth_attempt_windows",
        sa.Column(
            "bucket",
            sa.String(length=32),
            primary_key=True,
            comment="Authentication endpoint bucket",
        ),
        sa.Column(
            "subject_digest",
            sa.String(length=64),
            primary_key=True,
            comment="HMAC-SHA256 digest of the private throttle subject",
        ),
        sa.Column(
            "window_started_at",
            sa.DateTime(timezone=True),
            nullable=False,
            comment="UTC start time of the current fixed attempt window",
        ),
        sa.Column(
            "attempt_count",
            sa.Integer(),
            nullable=False,
            server_default=sa.text("0"),
            comment="Recorded attempts in the current fixed window",
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            comment="UTC time of the latest throttle decision",
        ),
        comment="Cross-process fixed windows for authentication throttling",
        mysql_engine="InnoDB",
        mysql_charset="utf8mb4",
    )


def downgrade() -> None:
    op.drop_table("auth_attempt_windows")
