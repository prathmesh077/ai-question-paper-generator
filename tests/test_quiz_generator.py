import sys
import os
import pytest
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from backend.app.main import app

from backend.app.core.database import SessionLocal
from backend.app.models.models import Quiz, QuizSubmission, GeneratedPaper, User

client = TestClient(app)

def test_quiz_lifecycle_full():
    db = SessionLocal()
    try:
        # Find paper #7 or first paper
        paper = db.query(GeneratedPaper).first()
        assert paper is not None, "At least one paper should exist in the database"
        paper_id = paper.id

        # 1. Generate quiz link from existing paper
        resp = client.post(f"/api/quizzes/generate-from-paper/{paper_id}")
        assert resp.status_code == 200
        data = resp.json()
        assert "quiz_code" in data
        assert data["quiz_code"].startswith("qz_")
        assert data["is_active"] is True
        quiz_code = data["quiz_code"]

        # 2. Fetch public quiz as a student (verify no answer leak)
        pub_resp = client.get(f"/api/quizzes/public/{quiz_code}")
        assert pub_resp.status_code == 200
        pub_data = pub_resp.json()
        assert pub_data["is_active"] is True
        assert len(pub_data["questions"]) > 0

        # Security assertion: student must NOT receive answers or explanations
        first_q = pub_data["questions"][0]
        assert "correct_option" not in first_q
        assert "model_answer" not in first_q
        assert "explanation" not in first_q
        assert len(first_q["options"]) >= 2

        # 3. Submit quiz responses as a student
        student_answers = {"1": "B", "2": "A"}
        sub_payload = {
            "student_name": "Test Student Aarav",
            "student_id": "21CS099",
            "student_email": "aarav@test.edu",
            "time_spent_seconds": 320,
            "answers": student_answers
        }
        sub_resp = client.post(f"/api/quizzes/public/{quiz_code}/submit", json=sub_payload)
        assert sub_resp.status_code == 200
        sub_data = sub_resp.json()
        assert sub_data["student_name"] == "Test Student Aarav"
        assert sub_data["student_id"] == "21CS099"
        assert "score" in sub_data
        assert "percentage" in sub_data
        assert "passed" in sub_data
        assert len(sub_data["review"]) == len(pub_data["questions"])

        # 4. Check faculty leaderboard / submissions
        lead_resp = client.get(f"/api/quizzes/{quiz_code}/submissions")
        assert lead_resp.status_code == 200
        lead_data = lead_resp.json()
        assert lead_data["total_submissions"] >= 1
        assert lead_data["submissions"][0]["student_name"] == "Test Student Aarav"

        # 5. Toggle quiz status to closed
        quiz_obj = db.query(Quiz).filter(Quiz.quiz_code == quiz_code).first()
        toggle_resp = client.put(f"/api/quizzes/{quiz_obj.id}/status", json={"is_active": False})
        assert toggle_resp.status_code == 200
        assert toggle_resp.json()["is_active"] is False

        # 6. Verify closed quiz rejects new student submissions
        closed_sub = client.post(f"/api/quizzes/public/{quiz_code}/submit", json=sub_payload)
        assert closed_sub.status_code == 400

        # Re-open quiz
        client.put(f"/api/quizzes/{quiz_obj.id}/status", json={"is_active": True})

    finally:
        db.close()


def test_ai_quiz_generation():
    payload = {
        "title": "Automated Unit 1 DSA Quiz",
        "course_code": "CS301",
        "question_count": 5,
        "duration_minutes": 10,
        "pass_percentage": 40
    }
    resp = client.post("/api/quizzes/generate-ai", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["quiz_code"].startswith("qz_")
    assert data["questions_count"] == 5
    assert data["duration_minutes"] == 10
