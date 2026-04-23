"""initial schema

Revision ID: e58f79b4fa34
Revises:
Create Date: 2026-04-14 16:54:45.492225

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e58f79b4fa34"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


user_role_enum = sa.Enum(
    "student", "trainer", "utec_staff", "admin_staff", name="userrole"
)
exit_method_enum = sa.Enum(
    "manual", "geofence_timeout", "auto_kill", name="exitmethod"
)


def upgrade() -> None:
    op.create_table(
        "faculties",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("code", sa.String(length=10), nullable=False),
        sa.Column("email_prefix", sa.String(length=20), nullable=True),
        sa.Column(
            "total_points",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
        sa.Column("logo_url", sa.String(length=255), nullable=True),
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("true"),
        ),
        sa.UniqueConstraint("code", name="uq_faculties_code"),
    )

    op.create_table(
        "gym_config",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column(
            "name",
            sa.String(length=120),
            nullable=False,
            server_default="UTEC Gym",
        ),
        sa.Column(
            "capacity", sa.Integer(), nullable=False, server_default="100"
        ),
        sa.Column("location", sa.String(length=255), nullable=True),
        sa.Column("geofence_lat", sa.Float(), nullable=True),
        sa.Column("geofence_lng", sa.Float(), nullable=True),
        sa.Column(
            "geofence_radius_m",
            sa.Integer(),
            nullable=False,
            server_default="100",
        ),
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("true"),
        ),
    )

    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("full_name", sa.String(length=120), nullable=False),
        sa.Column("role", user_role_enum, nullable=False, server_default="student"),
        sa.Column(
            "faculty_id",
            sa.Uuid(as_uuid=True),
            sa.ForeignKey("faculties.id"),
            nullable=True,
        ),
        sa.Column("points", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("push_token", sa.String(length=255), nullable=True),
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("true"),
        ),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.UniqueConstraint("email", name="uq_users_email"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "training_sessions",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            sa.Uuid(as_uuid=True),
            sa.ForeignKey("users.id"),
            nullable=False,
        ),
        sa.Column(
            "gym_id",
            sa.Uuid(as_uuid=True),
            sa.ForeignKey("gym_config.id"),
            nullable=True,
        ),
        sa.Column(
            "hora_entrada",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column("hora_salida", sa.DateTime(timezone=True), nullable=True),
        sa.Column("metodo_salida", exit_method_enum, nullable=True),
        sa.Column("puntos_otorgados", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index(
        "ix_training_sessions_active",
        "training_sessions",
        ["hora_salida"],
        postgresql_where=sa.text("hora_salida IS NULL"),
    )
    op.create_index(
        "ix_training_sessions_user_entrada",
        "training_sessions",
        ["user_id", "hora_entrada"],
    )
    op.create_index(
        "ix_training_sessions_gym_entrada",
        "training_sessions",
        ["gym_id", "hora_entrada"],
    )

    op.create_table(
        "used_tokens",
        sa.Column("jti", sa.String(length=36), primary_key=True),
        sa.Column(
            "user_id",
            sa.Uuid(as_uuid=True),
            sa.ForeignKey("users.id"),
            nullable=False,
        ),
        sa.Column(
            "used_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(
        "ix_used_tokens_expires_at", "used_tokens", ["expires_at"]
    )


def downgrade() -> None:
    op.drop_index("ix_used_tokens_expires_at", table_name="used_tokens")
    op.drop_table("used_tokens")
    op.drop_index(
        "ix_training_sessions_gym_entrada", table_name="training_sessions"
    )
    op.drop_index(
        "ix_training_sessions_user_entrada", table_name="training_sessions"
    )
    op.drop_index("ix_training_sessions_active", table_name="training_sessions")
    op.drop_table("training_sessions")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
    op.drop_table("gym_config")
    op.drop_table("faculties")
    exit_method_enum.drop(op.get_bind(), checkfirst=True)
    user_role_enum.drop(op.get_bind(), checkfirst=True)
