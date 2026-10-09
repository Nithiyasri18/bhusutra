import importlib
import re
import unittest
from pathlib import Path


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]


class RenderConfigurationTests(unittest.TestCase):
    def test_render_python_and_commands_match_repository_layout(self):
        python_version = (REPOSITORY_ROOT / ".python-version").read_text(encoding="utf-8").strip()
        requirements = (REPOSITORY_ROOT / "backend" / "requirements.txt").read_text(encoding="utf-8")
        render_config = (REPOSITORY_ROOT / "render.yaml").read_text(encoding="utf-8")

        self.assertRegex(python_version, r"^3\.12\.\d+$")
        self.assertIn("fastapi==0.115.0", requirements)
        self.assertIn("pydantic==2.9.2", requirements)
        self.assertIn("sqlalchemy==2.0.35", requirements)
        self.assertRegex(render_config, r"(?m)^\s+runtime: python$")
        self.assertRegex(render_config, r"(?m)^\s+buildCommand: python -m pip install -r backend/requirements\.txt$")
        self.assertRegex(render_config, r"(?m)^\s+preDeployCommand: cd backend && python -m alembic upgrade head$")
        self.assertRegex(
            render_config,
            r"(?m)^\s+startCommand: python -m uvicorn app\.main:app .*--app-dir backend$",
        )

    def test_initial_migration_does_not_delete_existing_data(self):
        migration = (
            REPOSITORY_ROOT
            / "backend"
            / "migrations"
            / "versions"
            / "20261008_0001_production_schema.py"
        ).read_text(encoding="utf-8")

        self.assertNotRegex(migration, r"(?i)\bdelete\s+from\b")

    def test_fastapi_application_imports_with_registered_routes(self):
        application = importlib.import_module("app.main").app
        routes = {route.path for route in application.routes}

        self.assertEqual(application.title, "BhuSutra API")
        self.assertIn("/auth/register", routes)
        self.assertIn("/documents/upload", routes)
        self.assertIn("/api/copilot", routes)
        self.assertIn("/verification/cases", routes)


if __name__ == "__main__":
    unittest.main()
