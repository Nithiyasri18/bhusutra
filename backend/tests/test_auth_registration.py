import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import auth, models
from app.database import Base, get_db
from app.main import app


class AuthRegistrationTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(self.engine)
        self.session_factory = sessionmaker(bind=self.engine, expire_on_commit=False)
        with self.session_factory() as db:
            db.add(models.Role(name="Citizen", description="Registered land-record applicant"))
            db.commit()

        self.fail_commit = False
        self.secret_patch = patch.object(
            auth,
            "SECRET_KEY",
            "registration-test-secret-key-with-more-than-32-characters",
        )
        self.secret_patch.start()
        app.dependency_overrides[get_db] = self.override_get_db
        self.client = TestClient(app)

    def tearDown(self):
        self.client.close()
        app.dependency_overrides.clear()
        self.secret_patch.stop()
        self.engine.dispose()

    def override_get_db(self):
        db = self.session_factory()
        if self.fail_commit:
            def fail_commit(_session):
                raise SQLAlchemyError("simulated database outage")

            event.listen(db, "before_commit", fail_commit, once=True)
        try:
            yield db
        finally:
            db.close()

    @staticmethod
    def registration_payload(**overrides):
        payload = {
            "name": "Asha Citizen",
            "email": "asha@example.org",
            "mobile_number": "+91 98765 43210",
            "password": "long-enough-test-password-123",
        }
        payload.update(overrides)
        return payload

    def test_registration_persists_hashed_citizen_and_audit_then_returns_token(self):
        response = self.client.post("/auth/register", json=self.registration_payload())

        self.assertEqual(response.status_code, 201, response.text)
        body = response.json()
        self.assertTrue(body["access_token"])
        self.assertEqual(body["role"], "Citizen")
        self.assertEqual(body["name"], "Asha Citizen")
        with self.session_factory() as db:
            user = db.query(models.User).filter_by(email="asha@example.org").one()
            self.assertEqual(user.mobile_number, "+91 98765 43210")
            self.assertNotEqual(user.password_hash, "long-enough-test-password-123")
            self.assertTrue(auth.verify_password("long-enough-test-password-123", user.password_hash))
            self.assertEqual(user.role, "Citizen")
            self.assertEqual(db.query(models.AuditLog).filter_by(user_id=user.id).count(), 1)

    def test_duplicate_email_returns_conflict_without_creating_another_user(self):
        payload = self.registration_payload()
        first = self.client.post("/auth/register", json=payload)
        duplicate = self.client.post(
            "/auth/register",
            json={**payload, "email": "ASHA@example.org"},
        )

        self.assertEqual(first.status_code, 201, first.text)
        self.assertEqual(duplicate.status_code, 409)
        self.assertEqual(duplicate.json()["detail"], "An account with this email already exists")
        with self.session_factory() as db:
            self.assertEqual(db.query(models.User).count(), 1)

    def test_invalid_registration_fields_return_validation_errors(self):
        invalid_payloads = (
            {"email": "not-an-email"},
            {"password": "short"},
            {"mobile_number": "x"},
            {"name": " "},
            {"mobile_number": None},
        )
        for overrides in invalid_payloads:
            with self.subTest(overrides=overrides):
                response = self.client.post(
                    "/auth/register",
                    json=self.registration_payload(**overrides),
                )
                self.assertEqual(response.status_code, 422)
                self.assertIsInstance(response.json()["detail"], list)
        with self.session_factory() as db:
            self.assertEqual(db.query(models.User).count(), 0)

    def test_database_commit_error_returns_actionable_service_error_and_rolls_back(self):
        self.fail_commit = True

        response = self.client.post("/auth/register", json=self.registration_payload())

        self.assertEqual(response.status_code, 503)
        self.assertEqual(
            response.json()["detail"],
            "Registration is temporarily unavailable. Please try again.",
        )
        with self.session_factory() as db:
            self.assertEqual(db.query(models.User).count(), 0)
            self.assertEqual(db.query(models.AuditLog).count(), 0)

    def test_missing_jwt_secret_does_not_commit_an_account(self):
        with patch.object(auth, "SECRET_KEY", ""):
            response = self.client.post("/auth/register", json=self.registration_payload())

        self.assertEqual(response.status_code, 503)
        self.assertEqual(
            response.json()["detail"],
            "Authentication is not configured. Contact your administrator.",
        )
        with self.session_factory() as db:
            self.assertEqual(db.query(models.User).count(), 0)
            self.assertEqual(db.query(models.AuditLog).count(), 0)


if __name__ == "__main__":
    unittest.main()
