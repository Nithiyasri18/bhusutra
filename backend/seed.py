"""
Seeds PostgreSQL with realistic demo data for the BhuSutra SIH prototype.
Run: python seed.py   (after creating the database and setting DATABASE_URL in .env)
"""
import random
import datetime as dt
from app.database import SessionLocal, engine, Base
from app import models
from app.auth import hash_password

Base.metadata.create_all(bind=engine)
db = SessionLocal()

print("Clearing existing data...")
db.query(models.AuditLog).delete()
db.query(models.VerificationCase).delete()
db.query(models.Record).delete()
db.query(models.Document).delete()
db.query(models.User).delete()
db.commit()

print("Seeding users...")
users_data = [
    {"name": "Admin User", "email": "admin@bhusutra.gov.in", "role": "Admin", "district": None},
    {"name": "R. Kumar", "email": "verifier@bhusutra.gov.in", "role": "Verifier", "district": "Tiruvallur"},
    {"name": "S. Iyer", "email": "officer@bhusutra.gov.in", "role": "District Officer", "district": "Chennai"},
    {"name": "P. Meena", "email": "auditor@bhusutra.gov.in", "role": "Auditor", "district": None},
]
users = []
for u in users_data:
    user = models.User(
        name=u["name"], email=u["email"], role=u["role"], district=u["district"],
        password_hash=hash_password("demo123"),
    )
    db.add(user)
    users.append(user)
db.commit()
for u in users:
    db.refresh(u)

verifier = users[1]

print("Seeding documents...")
districts = ["Chennai", "Tiruvallur", "Kanchipuram", "Vellore", "Krishnagiri", "Salem"]
villages = ["Thirumazhisai", "Poonamallee", "Sriperumbudur", "Walajabad", "Uthukottai", "Gummidipoondi"]

doc_names = [
    "Patta_142_2A_1987.pdf", "Khata_331_2004.pdf", "Survey_88_1_2019.pdf",
    "Mutation_Register_214.pdf", "Chitta_Extract_512.pdf", "Adangal_2020_417.pdf",
    "Patta_Copy_620.pdf", "FMB_Sketch_88.pdf", "Encumbrance_Cert_331.pdf", "RTC_Extract_142.pdf",
]
documents = []
for i, name in enumerate(doc_names):
    status = random.choices(["Extracted", "OCR Running", "Failed"], weights=[0.75, 0.15, 0.1])[0]
    doc = models.Document(
        filename=name,
        batch_name=f"Krishnagiri_Taluk_Batch_{i % 3 + 1:02d}",
        status=status,
        storage_path=f"./uploads/{name}",
        uploaded_by=verifier.id,
        uploaded_at=dt.datetime.utcnow() - dt.timedelta(days=random.randint(0, 13)),
    )
    db.add(doc)
    documents.append(doc)
db.commit()
for d in documents:
    db.refresh(d)

print("Seeding records...")
owner_names = ["Ramasamy", "Lakshmi Devi", "Muthu Kumar", "Saraswathi", "Venkatesan",
               "Kalaivani", "Selvam", "Anitha", "Govindaraj", "Meenakshi"]

records = []
statuses = ["Auto-Approved", "Needs Review", "Auto-Approved", "Rejected", "Auto-Approved"]
for i in range(40):
    survey = f"{random.randint(10,199)}/{random.choice(['1','2A','3B','1A'])}"
    rec = models.Record(
        survey_no=survey,
        khasra_no=survey.replace("/", "-K"),
        khata_no=str(random.randint(100, 999)),
        owner_name=random.choice(owner_names),
        district=random.choice(districts),
        village=random.choice(villages),
        area_acres=round(random.uniform(0.5, 4.5), 2),
        status=random.choice(statuses),
        confidence_score=round(random.uniform(55, 99), 1),
        document_id=random.choice(documents).id,
        created_at=dt.datetime.utcnow() - dt.timedelta(days=random.randint(0, 13), hours=random.randint(0,23)),
    )
    db.add(rec)
    records.append(rec)
db.commit()
for r in records:
    db.refresh(r)

print("Seeding verification cases (for Needs Review records)...")
needs_review = [r for r in records if r.status == "Needs Review"]
cases = []
for r in needs_review:
    case = models.VerificationCase(
        record_id=r.id,
        risk_score=random.randint(40, 95),
        assigned_to=verifier.id if random.random() > 0.4 else None,
        status="Open",
        created_at=dt.datetime.utcnow() - dt.timedelta(hours=random.randint(1, 48)),
    )
    db.add(case)
    cases.append(case)
db.commit()

print("Seeding audit logs...")
actions = [
    "Document uploaded", "OCR extraction completed", "Identifier resolution completed",
    "Cross-record validation run", "GIS boundary check completed",
    "Record auto-approved", "Sent to human verification", "Verification case approved",
    "Verification case rejected", "Record exported to DILRMP",
]
for i in range(60):
    rec = random.choice(records)
    action = random.choice(actions)
    db.add(models.AuditLog(
        record_id=rec.id,
        action=action,
        performed_by=random.choice(users).name,
        prev_value="Pending" if "approved" in action or "rejected" in action else None,
        new_value=rec.status if "approved" in action or "rejected" in action else None,
        timestamp=dt.datetime.utcnow() - dt.timedelta(hours=random.randint(0, 300)),
    ))
db.commit()

print(f"Done. Seeded {len(users)} users, {len(documents)} documents, {len(records)} records, "
      f"{len(cases)} verification cases, 60 audit logs.")
print("\nDemo login accounts (password: demo123):")
for u in users_data:
    print(f"  {u['role']:<18} {u['email']}")

db.close()
