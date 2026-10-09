"""Read-only preflight checks for the initial PostgreSQL schema migration."""

from __future__ import annotations

import os
import uuid
from dataclasses import dataclass

from dotenv import load_dotenv
from sqlalchemy import MetaData, String, Table, inspect, select
from sqlalchemy.engine import Connection
from sqlalchemy.types import Uuid

REQUIRED_TABLE_COLUMNS = {
    "users": ("id",),
    "documents": ("id", "uploaded_by"),
    "records": ("id", "document_id"),
    "verification_cases": ("id", "record_id", "assigned_to"),
    "audit_logs": ("id", "record_id"),
}

UUID_FOREIGN_KEYS = (
    ("documents", "uploaded_by", "users", "id", "documents_uploaded_by_fkey"),
    ("records", "document_id", "documents", "id", "records_document_id_fkey"),
    ("verification_cases", "record_id", "records", "id", "verification_cases_record_id_fkey"),
    ("verification_cases", "assigned_to", "users", "id", "verification_cases_assigned_to_fkey"),
    ("audit_logs", "record_id", "records", "id", "audit_logs_record_id_fkey"),
)


@dataclass(frozen=True)
class MigrationIssue:
    code: str
    table: str
    column: str
    count: int

    def __str__(self) -> str:
        return f"{self.code}: {self.table}.{self.column} ({self.count} row(s))"


def _uuid_value(value):
    if value is None:
        return None
    try:
        return uuid.UUID(str(value))
    except (AttributeError, TypeError, ValueError):
        return None


def _is_unique_column(inspector, table_name: str, column_name: str) -> bool:
    primary_key = inspector.get_pk_constraint(table_name).get("constrained_columns") or []
    if primary_key == [column_name]:
        return True
    if any(
        constraint.get("column_names") == [column_name]
        for constraint in inspector.get_unique_constraints(table_name)
    ):
        return True
    return any(
        index.get("unique")
        and index.get("column_names") == [column_name]
        for index in inspector.get_indexes(table_name)
    )


def validate_legacy_schema(connection: Connection) -> list[MigrationIssue]:
    """Inspect candidate legacy IDs and references without issuing any writes."""
    inspector = inspect(connection)
    table_names = set(inspector.get_table_names())
    issues: list[MigrationIssue] = []
    missing_tables = set(REQUIRED_TABLE_COLUMNS) - table_names
    for table in sorted(missing_tables):
        issues.append(MigrationIssue("missing_table", table, "*", 1))
    if missing_tables:
        return issues

    metadata = MetaData()
    tables = {
        name: Table(
            name,
            metadata,
            schema=inspector.default_schema_name,
            autoload_with=connection,
        )
        for name in REQUIRED_TABLE_COLUMNS
    }
    for table_name, required_columns in REQUIRED_TABLE_COLUMNS.items():
        table = tables[table_name]
        for column_name in required_columns:
            if column_name not in table.c:
                issues.append(MigrationIssue("missing_column", table_name, column_name, 1))
        if any(column_name not in table.c for column_name in required_columns):
            continue
        for column_name in ("id",):
            if not isinstance(table.c[column_name].type, (String, Uuid)):
                issues.append(MigrationIssue("unsupported_source_type", table_name, column_name, 1))
            values = connection.execute(select(table.c[column_name])).scalars()
            seen = set()
            invalid_count = 0
            duplicate_count = 0
            for value in values:
                parsed = _uuid_value(value)
                if parsed is None:
                    invalid_count += 1
                    continue
                if parsed in seen:
                    duplicate_count += 1
                seen.add(parsed)
            if invalid_count:
                issues.append(MigrationIssue("invalid_identifier", table_name, column_name, invalid_count))
            if duplicate_count:
                issues.append(MigrationIssue("duplicate_identifier", table_name, column_name, duplicate_count))

    for child_name, child_column, parent_name, parent_column, expected_fk_name in UUID_FOREIGN_KEYS:
        child = tables[child_name]
        parent = tables[parent_name]
        if child_column not in child.c or parent_column not in parent.c:
            continue
        if not _is_unique_column(inspector, parent_name, parent_column):
            issues.append(MigrationIssue("parent_key_not_unique", parent_name, parent_column, 1))
        child_type = child.c[child_column].type
        if not isinstance(child_type, (String, Uuid)):
            issues.append(MigrationIssue("unsupported_source_type", child_name, child_column, 1))
        if child.c[child_column].server_default is not None:
            issues.append(MigrationIssue("unsupported_column_default", child_name, child_column, 1))

        parent_ids = set()
        for value in connection.execute(select(parent.c[parent_column])).scalars():
            parsed = _uuid_value(value)
            if parsed is not None:
                parent_ids.add(parsed)

        invalid_count = 0
        orphan_count = 0
        for value in connection.execute(select(child.c[child_column])).scalars():
            if value is None:
                continue
            parsed = _uuid_value(value)
            if parsed is None:
                invalid_count += 1
            elif parsed not in parent_ids:
                orphan_count += 1
        if invalid_count:
            issues.append(MigrationIssue("invalid_foreign_key", child_name, child_column, invalid_count))
        if orphan_count:
            issues.append(MigrationIssue("orphan_foreign_key", child_name, child_column, orphan_count))

        for foreign_key in inspector.get_foreign_keys(child_name):
            if child_column not in foreign_key.get("constrained_columns", []):
                continue
            options = foreign_key.get("options") or {}
            expected = (
                foreign_key.get("name") == expected_fk_name
                and foreign_key.get("referred_table") == parent_name
                and foreign_key.get("referred_columns") == [parent_column]
                and options.get("ondelete") in (None, "NO ACTION")
                and options.get("onupdate") in (None, "NO ACTION")
                and not options.get("deferrable")
            )
            if not expected:
                issues.append(MigrationIssue("unexpected_foreign_key", child_name, child_column, 1))

    return issues


def main() -> int:
    from sqlalchemy import create_engine

    load_dotenv()
    database_url = os.environ.get("DATABASE_URL", "").strip()
    if not database_url:
        print("Set DATABASE_URL to a PostgreSQL staging database restored from a backup.")
        return 2

    engine = create_engine(database_url, pool_pre_ping=True)
    try:
        if engine.dialect.name != "postgresql":
            print("Preflight requires PostgreSQL; no database changes were made.")
            return 2
        with engine.connect() as connection:
            with connection.begin():
                connection.exec_driver_sql("SET TRANSACTION READ ONLY")
                issues = validate_legacy_schema(connection)
        if issues:
            print("Migration preflight found blockers; no database changes were made:")
            for issue in issues:
                print(f"- {issue}")
            return 1
        print("Migration preflight passed. This does not replace a backup, restore test, or schema review.")
        return 0
    finally:
        engine.dispose()


if __name__ == "__main__":
    raise SystemExit(main())
