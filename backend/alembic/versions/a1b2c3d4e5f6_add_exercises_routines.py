"""add exercises, routines, exercise_logs

Revision ID: a1b2c3d4e5f6
Revises: e58f79b4fa34
Create Date: 2026-04-28 19:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ARRAY


revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "e58f79b4fa34"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "exercises",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("nombre", sa.String(), nullable=False, unique=True),
        sa.Column("grupo_primario", sa.String(), nullable=False),
        sa.Column("grupos_secundarios", ARRAY(sa.String()), nullable=False, server_default="{}"),
        sa.Column("equipamiento", sa.String(), nullable=False),
    )

    op.create_table(
        "routines",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("user_id", sa.Uuid(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("dias_semana", sa.Integer(), nullable=False),
        sa.Column("sexo", sa.String(), nullable=False),
        sa.Column("enfoque", sa.String(), nullable=False),
        sa.Column("plan_json", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_routines_user_created", "routines", ["user_id", "created_at"])

    op.create_table(
        "exercise_logs",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("user_id", sa.Uuid(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("session_id", sa.Uuid(as_uuid=True), sa.ForeignKey("training_sessions.id"), nullable=True),
        sa.Column("nombre", sa.String(), nullable=False),
        sa.Column("grupo_primario", sa.String(), nullable=False),
        sa.Column("grupos_secundarios", ARRAY(sa.String()), nullable=False, server_default="{}"),
        sa.Column("series", sa.Integer(), nullable=False),
        sa.Column("reps", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_exercise_logs_user_created", "exercise_logs", ["user_id", "created_at"])


def downgrade() -> None:
    op.drop_index("ix_exercise_logs_user_created", table_name="exercise_logs")
    op.drop_table("exercise_logs")
    op.drop_index("ix_routines_user_created", table_name="routines")
    op.drop_table("routines")
    op.drop_table("exercises")
