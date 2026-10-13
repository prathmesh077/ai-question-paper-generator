import sys
import os
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.database import SessionLocal
from backend.app.models.models import Syllabus, SyllabusChunk, User, GeneratedPaper
from backend.app.core.security import create_access_token
from backend.app.core.config import settings

client = TestClient(app)

def test_syllabus_delete_lifecycle():
    db = SessionLocal()
    try:
        # Get admin user for auth token
        admin = db.query(User).filter(User.username == "admin").first()
        assert admin is not None
        token = create_access_token({"sub": admin.username})
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Create a test syllabus
        create_resp = client.post(
            "/api/syllabus/create-text",
            headers=headers,
            json={
                "title": "TEST101: Test Subject Syllabus",
                "course_code": "TEST101",
                "course_name": "Test Subject Engineering",
                "department": "Computer Science & Engineering",
                "semester": "Semester IV",
                "academic_year": "2026-2027",
                "raw_text": "UNIT 1: Fundamentals of Testing\nUNIT 2: Advanced Testing Strategies\nUNIT 3: Automated Quality Assurance"
            }
        )
        assert create_resp.status_code == 200
        created_data = create_resp.json()
        s_id = created_data["syllabus_id"]
        assert s_id > 0
        assert created_data["units_count"] == 3

        # Create a mock uploaded file in settings.UPLOAD_DIR
        mock_filename = f"test_upload_{s_id}.pdf"
        mock_file_path = os.path.join(settings.UPLOAD_DIR, mock_filename)
        with open(mock_file_path, "w") as f:
            f.write("mock syllabus pdf content")
        assert os.path.exists(mock_file_path)

        # Update syllabus in db with this file_name
        s_obj = db.query(Syllabus).filter(Syllabus.id == s_id).first()
        s_obj.file_name = mock_filename
        db.commit()

        # Verify chunks were created
        chunks_resp = client.get(f"/api/syllabus/{s_id}/chunks")
        assert chunks_resp.status_code == 200
        assert len(chunks_resp.json()) > 0

        # 2. Delete the created syllabus
        del_resp = client.delete(f"/api/syllabus/{s_id}", headers=headers)
        assert del_resp.status_code == 200
        del_data = del_resp.json()
        assert del_data["message"] == "Syllabus deleted successfully!"
        assert del_data["deleted_id"] == s_id

        # 3. Verify it's gone from database
        get_resp = client.get(f"/api/syllabus/{s_id}")
        assert get_resp.status_code == 404

        # Verify chunks cascade deleted
        chunks_after = db.query(SyllabusChunk).filter(SyllabusChunk.syllabus_id == s_id).all()
        assert len(chunks_after) == 0

        # Verify physical uploaded file was deleted
        assert not os.path.exists(mock_file_path)

        # 4. Deleting non-existent ID returns 404
        del_404 = client.delete(f"/api/syllabus/{s_id}", headers=headers)
        assert del_404.status_code == 404

        # 5. Invalid ID (<= 0) returns 400
        del_invalid = client.delete("/api/syllabus/-1", headers=headers)
        assert del_invalid.status_code == 400
    finally:
        db.close()
