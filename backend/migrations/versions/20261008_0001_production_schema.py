"""Create production roles and citizen verification schema.

Revision ID: 20261008_0001
Revises:
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20261008_0001"
down_revision = None
branch_labels = None
depends_on = None


def _columns(inspector, table):
    return {column["name"] for column in inspector.get_columns(table)}


def _drop_foreign_key(table, name):
    keys = sa.inspect(op.get_bind()).get_foreign_keys(table)
    if any(key.get("name") == name for key in keys):
        op.drop_constraint(name, table, type_="foreignkey")


def _create_fresh_schema(bind):
    op.create_table(
        "roles",
        sa.Column("name", sa.String(length=32), nullable=False),
        sa.Column("description", sa.String(length=120), nullable=False),
        sa.PrimaryKeyConstraint("name"),
    )
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("mobile_number", sa.String(length=32), nullable=True),
        sa.Column("password_hash", sa.String(), nullable=False),
        sa.Column("role", sa.String(length=32), nullable=False),
        sa.Column("district", sa.String(length=120), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column("password_reset_token_hash", sa.String(length=64), nullable=True),
        sa.Column("password_reset_expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_login", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["role"], ["roles.name"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_table(
        "documents",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("filename", sa.String(length=255), nullable=False),
        sa.Column("batch_name", sa.String(length=120), nullable=True),
        sa.Column("content_type", sa.String(length=100), nullable=False),
        sa.Column("size_bytes", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("storage_path", sa.String(), nullable=False),
        sa.Column("uploaded_by", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("uploaded_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["uploaded_by"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_documents_uploaded_by", "documents", ["uploaded_by"])
    op.create_table(
        "records",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("survey_no", sa.String(), nullable=True),
        sa.Column("khasra_no", sa.String(), nullable=True),
        sa.Column("khata_no", sa.String(), nullable=True),
        sa.Column("owner_name", sa.String(), nullable=True),
        sa.Column("district", sa.String(), nullable=True),
        sa.Column("village", sa.String(), nullable=True),
        sa.Column("area_acres", sa.Float(), nullable=True),
        sa.Column("status", sa.String(), nullable=True),
        sa.Column("confidence_score", sa.Float(), nullable=True),
        sa.Column("document_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["document_id"], ["documents.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "verification_cases",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("record_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("document_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("risk_score", sa.Integer(), nullable=True),
        sa.Column("assigned_to", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["assigned_to"], ["users.id"]),
        sa.ForeignKeyConstraint(["document_id"], ["documents.id"]),
        sa.ForeignKeyConstraint(["record_id"], ["records.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_verification_cases_document_id", "verification_cases", ["document_id"])
    op.create_table(
        "audit_logs",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("record_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("document_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("case_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("action", sa.String(), nullable=False),
        sa.Column("performed_by", sa.String(), nullable=True),
        sa.Column("prev_value", sa.String(), nullable=True),
        sa.Column("new_value", sa.String(), nullable=True),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["case_id"], ["verification_cases.id"]),
        sa.ForeignKeyConstraint(["document_id"], ["documents.id"]),
        sa.ForeignKeyConstraint(["record_id"], ["records.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_audit_logs_user_id", "audit_logs", ["user_id"])
    op.create_index("ix_audit_logs_document_id", "audit_logs", ["document_id"])
    op.create_index("ix_audit_logs_case_id", "audit_logs", ["case_id"])
    op.create_table(
        "ocr_results",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("document_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("extracted_fields", sa.JSON(), nullable=False),
        sa.Column("field_confidence", sa.JSON(), nullable=False),
        sa.Column("average_confidence", sa.Float(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["document_id"], ["documents.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("document_id"),
    )
    op.create_table(
        "verification_scores",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("document_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("score", sa.Integer(), nullable=False),
        sa.Column("components", sa.JSON(), nullable=False),
        sa.Column("reasons", sa.JSON(), nullable=False),
        sa.Column("official_status", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["document_id"], ["documents.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("document_id"),
    )
    role_descriptions = {
        "Citizen": "Registered land-record applicant",
        "Officer": "Land-record verification officer",
        "Admin": "BhuSutra administrator",
        "Auditor": "Read-only audit reviewer",
    }
    for name, description in role_descriptions.items():
        bind.execute(
            sa.text("INSERT INTO roles (name, description) VALUES (:name, :description)"),
            {"name": name, "description": description},
        )


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())

    if "users" not in tables:
        if tables:
            raise RuntimeError("An unversioned partial database exists; back it up and reconcile its schema before migration.")
        _create_fresh_schema(bind)
        return

    if "roles" not in tables:
        op.create_table(
            "roles",
            sa.Column("name", sa.String(length=32), primary_key=True),
            sa.Column("description", sa.String(length=120), nullable=False),
        )

    # Remove only accounts and records known to have been created by the old demo seed.
    old_demo_emails = (
        "admin@bhusutra.gov.in",
        "verifier@bhusutra.gov.in",
        "officer@bhusutra.gov.in",
        "auditor@bhusutra.gov.in",
    )
    if "documents" in tables and "records" in tables and "verification_cases" in tables:
        if "audit_logs" in tables:
            bind.execute(sa.text("""
                DELETE FROM audit_logs
                WHERE record_id IN (
                    SELECT r.id FROM records r JOIN documents d ON d.id = r.document_id
                    WHERE d.uploaded_by::text IN (
                        SELECT id::text FROM users WHERE email IN :emails
                    )
                )
            """).bindparams(sa.bindparam("emails", expanding=True)), {"emails": old_demo_emails})
        bind.execute(sa.text("""
            DELETE FROM verification_cases
            WHERE record_id IN (
                SELECT r.id FROM records r JOIN documents d ON d.id = r.document_id
                WHERE d.uploaded_by::text IN (
                    SELECT id::text FROM users WHERE email IN :emails
                )
            )
        """).bindparams(sa.bindparam("emails", expanding=True)), {"emails": old_demo_emails})
        bind.execute(sa.text("""
            DELETE FROM verification_cases WHERE assigned_to::text IN (
                SELECT id::text FROM users WHERE email IN :emails
            )
        """).bindparams(sa.bindparam("emails", expanding=True)), {"emails": old_demo_emails})
        bind.execute(sa.text("""
            DELETE FROM records
            WHERE document_id IN (
                SELECT id FROM documents WHERE uploaded_by::text IN (
                    SELECT id::text FROM users WHERE email IN :emails
                )
            )
        """).bindparams(sa.bindparam("emails", expanding=True)), {"emails": old_demo_emails})
        bind.execute(sa.text("""
            DELETE FROM documents WHERE uploaded_by::text IN (
                SELECT id::text FROM users WHERE email IN :emails
            )
        """).bindparams(sa.bindparam("emails", expanding=True)), {"emails": old_demo_emails})
    bind.execute(
        sa.text("DELETE FROM users WHERE email IN :emails").bindparams(
            sa.bindparam("emails", expanding=True)
        ),
        {"emails": old_demo_emails},
    )

    role_descriptions = {
        "Citizen": "Registered land-record applicant",
        "Officer": "Land-record verification officer",
        "Admin": "BhuSutra administrator",
        "Auditor": "Read-only audit reviewer",
    }
    for name, description in role_descriptions.items():
        bind.execute(
            sa.text("INSERT INTO roles (name, description) VALUES (:name, :description) ON CONFLICT (name) DO NOTHING"),
            {"name": name, "description": description},
        )

    inspector = sa.inspect(bind)
    users_columns = _columns(inspector, "users")
    for column, definition in (
        ("mobile_number", sa.Column("mobile_number", sa.String(length=32), nullable=True)),
        ("is_active", sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true())),
        ("password_reset_token_hash", sa.Column("password_reset_token_hash", sa.String(length=64), nullable=True)),
        ("password_reset_expires_at", sa.Column("password_reset_expires_at", sa.DateTime(timezone=True), nullable=True)),
    ):
        if column not in users_columns:
            op.add_column("users", definition)

    bind.execute(sa.text("""
        UPDATE users
        SET role = CASE
            WHEN lower(role) IN ('citizen', 'common man') THEN 'Citizen'
            WHEN lower(role) IN ('admin', 'administrator') THEN 'Admin'
            WHEN lower(role) = 'auditor' THEN 'Auditor'
            WHEN lower(role) IN ('officer', 'verifier', 'verification officer', 'district officer') THEN 'Officer'
            ELSE 'Auditor'
        END
    """))

    inspector = sa.inspect(bind)
    if "documents" in set(inspector.get_table_names()):
        document_columns = _columns(inspector, "documents")
        for column, definition in (
            ("content_type", sa.Column("content_type", sa.String(length=100), nullable=False, server_default="application/octet-stream")),
            ("size_bytes", sa.Column("size_bytes", sa.Integer(), nullable=False, server_default="0")),
        ):
            if column not in document_columns:
                op.add_column("documents", definition)
        _drop_foreign_key("documents", "documents_uploaded_by_fkey")
        op.alter_column("documents", "uploaded_by", type_=postgresql.UUID(as_uuid=False), postgresql_using="uploaded_by::uuid", nullable=True)
        op.create_foreign_key("documents_uploaded_by_fkey", "documents", "users", ["uploaded_by"], ["id"])

    inspector = sa.inspect(bind)
    if "records" in set(inspector.get_table_names()):
        _drop_foreign_key("records", "records_document_id_fkey")
        op.alter_column("records", "document_id", type_=postgresql.UUID(as_uuid=False), postgresql_using="document_id::uuid", nullable=True)
        op.create_foreign_key("records_document_id_fkey", "records", "documents", ["document_id"], ["id"])
    inspector = sa.inspect(bind)
    if "verification_cases" in set(inspector.get_table_names()):
        case_columns = _columns(inspector, "verification_cases")
        if "document_id" not in case_columns:
            op.add_column("verification_cases", sa.Column("document_id", postgresql.UUID(as_uuid=False), nullable=True))
        op.alter_column("verification_cases", "record_id", type_=postgresql.UUID(as_uuid=False), postgresql_using="record_id::uuid", nullable=True)
        op.alter_column("verification_cases", "assigned_to", type_=postgresql.UUID(as_uuid=False), postgresql_using="assigned_to::uuid", nullable=True)
        _drop_foreign_key("verification_cases", "verification_cases_record_id_fkey")
        _drop_foreign_key("verification_cases", "verification_cases_assigned_to_fkey")
        _drop_foreign_key("verification_cases", "verification_cases_document_id_fkey")
        op.create_foreign_key("verification_cases_record_id_fkey", "verification_cases", "records", ["record_id"], ["id"])
        op.create_foreign_key("verification_cases_document_id_fkey", "verification_cases", "documents", ["document_id"], ["id"])
        op.create_foreign_key("verification_cases_assigned_to_fkey", "verification_cases", "users", ["assigned_to"], ["id"])
    inspector = sa.inspect(bind)
    if "audit_logs" in set(inspector.get_table_names()):
        audit_columns = _columns(inspector, "audit_logs")
        if "user_id" not in audit_columns:
            op.add_column("audit_logs", sa.Column("user_id", postgresql.UUID(as_uuid=False), nullable=True))
        if "document_id" not in audit_columns:
            op.add_column("audit_logs", sa.Column("document_id", postgresql.UUID(as_uuid=False), nullable=True))
        if "case_id" not in audit_columns:
            op.add_column("audit_logs", sa.Column("case_id", postgresql.UUID(as_uuid=False), nullable=True))
        op.alter_column("audit_logs", "record_id", type_=postgresql.UUID(as_uuid=False), postgresql_using="record_id::uuid", nullable=True)
        _drop_foreign_key("audit_logs", "audit_logs_record_id_fkey")
        op.create_foreign_key("audit_logs_record_id_fkey", "audit_logs", "records", ["record_id"], ["id"])
        for name, column, table in (
            ("audit_logs_user_id_fkey", "user_id", "users"),
            ("audit_logs_document_id_fkey", "document_id", "documents"),
            ("audit_logs_case_id_fkey", "case_id", "verification_cases"),
        ):
            if not any(fk["name"] == name for fk in sa.inspect(bind).get_foreign_keys("audit_logs")):
                op.create_foreign_key(name, "audit_logs", table, [column], ["id"])

    from app.database import Base
    from app import models  # noqa: F401
    Base.metadata.create_all(bind=bind, checkfirst=True)
    if not any(fk["name"] == "users_role_fkey" for fk in sa.inspect(bind).get_foreign_keys("users")):
        op.create_foreign_key("users_role_fkey", "users", "roles", ["role"], ["name"])
    for table, name, columns in (
        ("documents", "ix_documents_uploaded_by", ["uploaded_by"]),
        ("verification_cases", "ix_verification_cases_document_id", ["document_id"]),
        ("audit_logs", "ix_audit_logs_user_id", ["user_id"]),
        ("audit_logs", "ix_audit_logs_document_id", ["document_id"]),
        ("audit_logs", "ix_audit_logs_case_id", ["case_id"]),
    ):
        existing_indexes = {index["name"] for index in sa.inspect(bind).get_indexes(table)}
        if name not in existing_indexes:
            op.create_index(name, table, columns)


def downgrade():
    raise RuntimeError("This production data migration is irreversible; restore a database backup to roll back.")
