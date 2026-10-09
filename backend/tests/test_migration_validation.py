import unittest
import uuid
import importlib.util
from pathlib import Path

from alembic.migration import MigrationContext
from alembic.operations import Operations
from sqlalchemy import create_engine, inspect, text

from app.migration_validation import validate_legacy_schema


USER_ID = "11111111-1111-4111-8111-111111111111"
DOCUMENT_ID = "22222222-2222-4222-8222-222222222222"
RECORD_ID = "33333333-3333-4333-8333-333333333333"
CASE_ID = "44444444-4444-4444-8444-444444444444"


def make_legacy_schema(connection, *, primary_keys=True, document_fk_name="documents_uploaded_by_fkey"):
    primary_key = " PRIMARY KEY" if primary_keys else ""
    connection.execute(text(f"CREATE TABLE users (id TEXT{primary_key})"))
    connection.execute(text(
        f"CREATE TABLE documents ("
        f"id TEXT{primary_key}, "
        f"uploaded_by TEXT, "
        f"CONSTRAINT {document_fk_name} FOREIGN KEY(uploaded_by) REFERENCES users(id))"
    ))
    connection.execute(text(
        f"CREATE TABLE records ("
        f"id TEXT{primary_key}, "
        f"document_id TEXT, "
        f"CONSTRAINT records_document_id_fkey FOREIGN KEY(document_id) REFERENCES documents(id))"
    ))
    connection.execute(text(
        f"CREATE TABLE verification_cases ("
        f"id TEXT{primary_key}, "
        f"record_id TEXT, "
        f"assigned_to TEXT, "
        f"CONSTRAINT verification_cases_record_id_fkey FOREIGN KEY(record_id) REFERENCES records(id), "
        f"CONSTRAINT verification_cases_assigned_to_fkey FOREIGN KEY(assigned_to) REFERENCES users(id))"
    ))
    connection.execute(text(
        f"CREATE TABLE audit_logs ("
        f"id TEXT{primary_key}, "
        f"record_id TEXT, "
        f"CONSTRAINT audit_logs_record_id_fkey FOREIGN KEY(record_id) REFERENCES records(id))"
    ))


def insert_consistent_rows(connection):
    connection.execute(text("INSERT INTO users(id) VALUES (:id)"), {"id": USER_ID})
    connection.execute(
        text("INSERT INTO documents(id, uploaded_by) VALUES (:id, :user_id)"),
        {"id": DOCUMENT_ID, "user_id": USER_ID},
    )
    connection.execute(
        text("INSERT INTO records(id, document_id) VALUES (:id, :document_id)"),
        {"id": RECORD_ID, "document_id": DOCUMENT_ID},
    )
    connection.execute(
        text("INSERT INTO verification_cases(id, record_id, assigned_to) VALUES (:id, :record_id, :user_id)"),
        {"id": CASE_ID, "record_id": RECORD_ID, "user_id": USER_ID},
    )
    connection.execute(
        text("INSERT INTO audit_logs(id, record_id) VALUES (:id, :record_id)"),
        {"id": str(uuid.uuid4()), "record_id": RECORD_ID},
    )


def replace_legacy_schema(connection, *, primary_keys=True, document_fk_name="documents_uploaded_by_fkey"):
    for table_name in ("audit_logs", "verification_cases", "records", "documents", "users"):
        connection.execute(text(f"DROP TABLE IF EXISTS {table_name}"))
    make_legacy_schema(
        connection,
        primary_keys=primary_keys,
        document_fk_name=document_fk_name,
    )


class MigrationValidationTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite://")
        self.connection = self.engine.connect()
        self.transaction = self.connection.begin()
        make_legacy_schema(self.connection)
        insert_consistent_rows(self.connection)

    def tearDown(self):
        self.transaction.rollback()
        self.connection.close()
        self.engine.dispose()

    def test_valid_uuids_and_nullable_foreign_keys_pass_without_writes(self):
        self.connection.execute(text(
            "INSERT INTO documents(id, uploaded_by) VALUES (:id, NULL)"
        ), {"id": str(uuid.uuid4())})
        before = self.connection.execute(text("SELECT COUNT(*) FROM documents")).scalar_one()

        issues = validate_legacy_schema(self.connection)

        self.assertEqual(issues, [])
        self.assertEqual(
            self.connection.execute(text("SELECT COUNT(*) FROM documents")).scalar_one(),
            before,
        )

    def test_malformed_foreign_key_value_is_reported(self):
        self.connection.execute(text(
            "UPDATE documents SET uploaded_by = 'not-a-uuid' WHERE id = :id"
        ), {"id": DOCUMENT_ID})

        issues = validate_legacy_schema(self.connection)

        self.assertIn(
            ("invalid_foreign_key", "documents", "uploaded_by", 1),
            [(issue.code, issue.table, issue.column, issue.count) for issue in issues],
        )

    def test_orphaned_but_well_formed_foreign_key_is_reported(self):
        missing_user = str(uuid.uuid4())
        self.connection.execute(text(
            "UPDATE documents SET uploaded_by = :user_id WHERE id = :id"
        ), {"id": DOCUMENT_ID, "user_id": missing_user})

        issues = validate_legacy_schema(self.connection)

        self.assertIn(
            ("orphan_foreign_key", "documents", "uploaded_by", 1),
            [(issue.code, issue.table, issue.column, issue.count) for issue in issues],
        )

    def test_invalid_parent_identifier_is_reported(self):
        self.connection.execute(text("UPDATE users SET id = 'bad-parent-id' WHERE id = :id"), {"id": USER_ID})

        issues = validate_legacy_schema(self.connection)

        self.assertIn(
            ("invalid_identifier", "users", "id", 1),
            [(issue.code, issue.table, issue.column, issue.count) for issue in issues],
        )
        self.assertIn(
            ("orphan_foreign_key", "documents", "uploaded_by", 1),
            [(issue.code, issue.table, issue.column, issue.count) for issue in issues],
        )

    def test_duplicate_parent_identifiers_are_reported(self):
        replace_legacy_schema(self.connection, primary_keys=False)
        insert_consistent_rows(self.connection)
        self.connection.execute(text("INSERT INTO users(id) VALUES (:id)"), {"id": USER_ID})

        issues = validate_legacy_schema(self.connection)

        self.assertIn(
            ("duplicate_identifier", "users", "id", 1),
            [(issue.code, issue.table, issue.column, issue.count) for issue in issues],
        )

    def test_parent_identifier_must_be_unique_for_foreign_key_creation(self):
        replace_legacy_schema(self.connection, primary_keys=False)
        insert_consistent_rows(self.connection)

        issues = validate_legacy_schema(self.connection)

        self.assertIn(
            ("parent_key_not_unique", "users", "id", 1),
            [(issue.code, issue.table, issue.column, issue.count) for issue in issues],
        )

    def test_unexpected_foreign_key_name_is_reported(self):
        replace_legacy_schema(self.connection, document_fk_name="custom_documents_uploader_fk")
        insert_consistent_rows(self.connection)

        issues = validate_legacy_schema(self.connection)

        self.assertIn(
            ("unexpected_foreign_key", "documents", "uploaded_by", 1),
            [(issue.code, issue.table, issue.column, issue.count) for issue in issues],
        )

    def test_migration_rejects_invalid_legacy_data_before_schema_changes(self):
        self.connection.execute(text(
            "UPDATE documents SET uploaded_by = 'not-a-uuid' WHERE id = :id"
        ), {"id": DOCUMENT_ID})
        self.connection.execute(text(
            "CREATE TABLE alembic_version (version_num VARCHAR(32) NOT NULL PRIMARY KEY)"
        ))
        migration_path = (
            Path(__file__).parents[1]
            / "migrations"
            / "versions"
            / "20261008_0001_production_schema.py"
        )
        spec = importlib.util.spec_from_file_location("preflight_test_migration", migration_path)
        migration = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(migration)

        with Operations.context(MigrationContext.configure(self.connection)):
            with self.assertRaisesRegex(RuntimeError, "invalid_foreign_key"):
                migration.upgrade()

        self.assertNotIn("roles", inspect(self.connection).get_table_names())


if __name__ == "__main__":
    unittest.main()
