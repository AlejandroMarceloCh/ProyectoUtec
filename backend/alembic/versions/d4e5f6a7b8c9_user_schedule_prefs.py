"""user schedule prefs + user_metrics cache

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-05-04 04:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "d4e5f6a7b8c9"
down_revision: Union[str, Sequence[str], None] = "c3d4e5f6a7b8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # User: 3 columnas opcionales para preferencias del alumno
    op.add_column("users", sa.Column("preferred_days_per_week", sa.Integer(), nullable=True))
    op.add_column("users", sa.Column("preferred_minutes_per_session", sa.Integer(), nullable=True))
    op.add_column("users", sa.Column("sexo", sa.String(length=10), nullable=True))

    # user_metrics: cache de inferencias (enfoque + frecuencia)
    op.create_table(
        "user_metrics",
        sa.Column("user_id", sa.Uuid(as_uuid=True), sa.ForeignKey("users.id"), primary_key=True),
        sa.Column("enfoque_inferido", sa.String(length=20), nullable=True),
        sa.Column("sesiones_por_semana", sa.Float(), nullable=True),
        sa.Column("last_computed_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("user_metrics")
    op.drop_column("users", "sexo")
    op.drop_column("users", "preferred_minutes_per_session")
    op.drop_column("users", "preferred_days_per_week")
