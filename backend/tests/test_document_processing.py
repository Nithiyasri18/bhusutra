import asyncio
import io
import os
import tempfile
import unittest
import uuid
from pathlib import Path
from unittest.mock import patch

from alembic.migration import MigrationContext
from alembic.operations import Operations
from fastapi import HTTPException
from sqlalchemy import create_engine, inspect, select
from sqlalchemy.orm import sessionmaker
from starlette.datastructures import Headers
from starlette.datastructures import UploadFile as StarletteUploadFile

from app import auth, models, schemas
from app.database import Base
from app.integrations.official_land_records import (
    OfficialVerificationUnavailable,
    verify_with_official_provider,
)
from app.routers.copilot_router import CopilotRequest
from app.routers import copilot_router, documents_router
from app.routers.auth_router import login, register
from app.services.document_processing import create_verification_score


class DocumentProcessingTests(unittest.TestCase):
    def test_score_never_claims_official_ownership_verification(self):
        fields = {
            "survey_number": "12/3",
            "khata_number": "42",
            "khasra_number": "12-K3",
            "owner_name": "Applicant",
            "village_name": "Village",
            "district": "District",
        }

        score, components, reasons = create_verification_score(fields, 100)

        self.assertEqual(score, 50)
        self.assertEqual(components["identifier_match"]["status"], "unavailable")
        self.assertEqual(components["ownership_match"]["status"], "unavailable")
        self.assertTrue(any("official registry" in reason for reason in reasons))

    def test_score_reports_missing_fields_and_low_ocr(self):
        score, components, reasons = create_verification_score({"survey_number": "12"}, 40)

        self.assertLess(score, 90)
        self.assertEqual(components["document_completeness"]["points"], 4)
        self.assertEqual(components["ocr_confidence"]["points"], 10)
        self.assertIn("Missing Khata Number", reasons)
        self.assertIn("Low OCR Confidence", reasons)

    def test_unconfigured_official_provider_fails_explicitly(self):
        for provider in ("DILRMP", "LRMS", "Bhulekh", "state_land_records"):
            with self.subTest(provider=provider), self.assertRaises(OfficialVerificationUnavailable):
                verify_with_official_provider(provider, {"survey_number": "12/3"})

    def test_unknown_provider_does_not_fake_success(self):
        with self.assertRaises(OfficialVerificationUnavailable):
            verify_with_official_provider("unknown", {})

    def test_initial_migration_creates_production_schema_and_only_roles(self):
        import importlib.util
        from sqlalchemy import text

        migration_path = Path(__file__).parents[1] / "migrations" / "versions" / "20261008_0001_production_schema.py"
        spec = importlib.util.spec_from_file_location("production_schema_migration", migration_path)
        migration = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(migration)
        engine = create_engine("sqlite://")
        try:
            with engine.begin() as connection:
                connection.execute(text(
                    "CREATE TABLE alembic_version (version_num VARCHAR(32) NOT NULL PRIMARY KEY)"
                ))
                with Operations.context(MigrationContext.configure(connection)):
                    migration.upgrade()
                table_names = set(inspect(connection).get_table_names())
                self.assertTrue({
                    "users", "roles", "documents", "verification_cases",
                    "audit_logs", "ocr_results", "verification_scores",
                }.issubset(table_names))
                roles = set(connection.execute(select(models.Role.name)).scalars())
                self.assertEqual(roles, {"Citizen", "Officer", "Admin", "Auditor"})
                self.assertEqual(connection.execute(select(models.User.id)).scalars().all(), [])
        finally:
            engine.dispose()

    def test_copilot_only_accepts_bounded_alternating_turns(self):
        valid = CopilotRequest(turns=[
            {"role": "user", "content": " What is mutation? "},
            {"role": "model", "content": "A land-record update."},
            {"role": "user", "content": "Thanks"},
        ])
        self.assertEqual(valid.turns[0].content, "What is mutation?")
        with self.assertRaises(ValueError):
            CopilotRequest(turns=[
                {"role": "user", "content": "question"},
                {"role": "user", "content": "not alternating"},
            ])

    def test_copilot_requires_key_and_rejects_non_citizen_role(self):
        engine = create_engine("sqlite://")
        Base.metadata.create_all(engine)
        db = sessionmaker(bind=engine)()
        citizen = models.User(id=str(uuid.uuid4()), name="Citizen", email="citizen@example.org", password_hash="unused", role="Citizen")
        officer = models.User(id=str(uuid.uuid4()), name="Officer", email="officer@example.org", password_hash="unused", role="Officer")
        original_secret = os.environ.pop("GEMINI_API_KEY", None)
        try:
            request = CopilotRequest(turns=[{"role": "user", "content": "What is a khata number?"}])
            with self.assertRaises(HTTPException) as missing_key:
                copilot_router.ask_copilot(request, db, citizen)
            self.assertEqual(missing_key.exception.status_code, 503)
            with self.assertRaises(HTTPException) as forbidden:
                auth.require_roles("Citizen")(current_user=officer)
            self.assertEqual(forbidden.exception.status_code, 403)
        finally:
            if original_secret is not None:
                os.environ["GEMINI_API_KEY"] = original_secret
            db.close()
            engine.dispose()

    def test_upload_persists_ocr_score_review_case_and_audit(self):
        engine = create_engine("sqlite://")
        Base.metadata.create_all(engine)
        db = sessionmaker(bind=engine)()
        citizen = models.User(id=str(uuid.uuid4()), name="Account Holder", email="citizen@example.org", password_hash="unused", role="Citizen")
        db.add_all([models.Role(name="Citizen", description="Citizen"), citizen])
        db.commit()
        contents = b"%PDF-1.4 test document"
        upload = StarletteUploadFile(
            filename="land-record.pdf",
            file=io.BytesIO(contents),
            headers=Headers({"content-type": "application/pdf"}),
        )
        fields = {
            "survey_number": "12/3",
            "khata_number": "42",
            "khasra_number": "12-K3",
            "owner_name": "Account Holder",
            "village_name": "Village",
            "district": "District",
        }
        try:
            with tempfile.TemporaryDirectory() as storage, \
                    patch.object(documents_router, "UPLOAD_DIR", Path(storage)), \
                    patch.object(documents_router, "extract_land_fields", return_value=(fields, {}, 100.0)):
                result = asyncio.run(documents_router.upload_document(upload, db, citizen))
            self.assertEqual(result["status"], "High Risk")
            self.assertEqual(result["score"], 50)
            self.assertEqual(result["ocr_fields"], fields)
            self.assertEqual(db.query(models.VerificationCase).count(), 1)
            audit = db.query(models.AuditLog).filter_by(document_id=result["id"]).all()
            self.assertEqual(len(audit), 2)
        finally:
            db.close()
            engine.dispose()

    def test_citizen_registration_hashes_password_and_login_is_audited(self):
        engine = create_engine("sqlite://")
        Base.metadata.create_all(engine)
        session_factory = sessionmaker(bind=engine)
        db = session_factory()
        original_secret = auth.SECRET_KEY
        auth.SECRET_KEY = "unit-test-only-secret-key-that-is-at-least-32-characters"
        try:
            db.add_all([
                models.Role(name="Citizen", description="Citizen"),
                models.Role(name="Officer", description="Officer"),
                models.Role(name="Admin", description="Admin"),
                models.Role(name="Auditor", description="Auditor"),
            ])
            db.commit()
            registration = schemas.RegistrationRequest.model_validate({
                "name": "Account Holder",
                "email": "account@example.org",
                "mobile_number": "+1 555 010 4567",
                "password": "unit-test-password-at-least-12",
                "role": "Admin",
            })
            registered = register(registration, db)
            user = db.query(models.User).filter_by(email="account@example.org").one()
            self.assertEqual(user.role, "Citizen")
            self.assertEqual(user.mobile_number, "+1 555 010 4567")
            self.assertNotEqual(user.password_hash, "unit-test-password-at-least-12")
            self.assertTrue(user.password_hash.startswith("$pbkdf2-sha256$"))
            self.assertTrue(auth.verify_password("unit-test-password-at-least-12", user.password_hash))

            authenticated = login(schemas.LoginRequest(
                email="account@example.org",
                password="unit-test-password-at-least-12",
            ), db)
            self.assertEqual(auth.get_current_user(authenticated.access_token, db).role, "Citizen")
            self.assertEqual(registered.id, authenticated.id)
            self.assertEqual(db.query(models.AuditLog).count(), 2)
        finally:
            auth.SECRET_KEY = original_secret
            db.close()
            engine.dispose()


if __name__ == "__main__":
    unittest.main()
