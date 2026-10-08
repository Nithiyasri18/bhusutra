import getpass
import sys

from sqlalchemy.orm import Session

from app import auth, models
from app.database import SessionLocal


def main():
    db: Session = SessionLocal()
    try:
        if not db.query(models.Role.name).filter(models.Role.name == "Admin").first():
            raise RuntimeError("Run `alembic upgrade head` before bootstrapping an administrator.")
        if db.query(models.User.id).filter(models.User.role == "Admin").first():
            raise RuntimeError("An administrator already exists. Use admin-managed staff provisioning.")
        name = input("Administrator full name: ").strip()
        email = input("Administrator email: ").strip().lower()
        mobile_number = input("Mobile number: ").strip()
        password = getpass.getpass("Password (minimum 12 characters): ")
        confirmation = getpass.getpass("Confirm password: ")
        if not name or not email or not mobile_number or len(password) < 12 or password != confirmation:
            raise ValueError("Provide all identity details and matching passwords of at least 12 characters.")
        if db.query(models.User.id).filter(models.User.email == email).first():
            raise ValueError("An account with this email already exists.")
        user = models.User(
            name=name,
            email=email,
            mobile_number=mobile_number,
            password_hash=auth.hash_password(password),
            role="Admin",
        )
        db.add(user)
        db.flush()
        auth.write_audit(db, user, "Initial administrator provisioned")
        db.commit()
        print("Initial administrator created.")
    except Exception as exc:
        db.rollback()
        print(str(exc), file=sys.stderr)
        raise SystemExit(1) from exc
    finally:
        db.close()


if __name__ == "__main__":
    main()
