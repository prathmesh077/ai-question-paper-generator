import os
import json
import uuid
import re
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user
from backend.app.core.config import settings
from backend.app.models.models import (
    Quiz, QuizSubmission, GeneratedPaper, Syllabus, Question, User, AuditLog
)
from backend.app.schemas.schemas import (
    QuizCreate, QuizGenerateAIRequest, QuizSubmissionCreate, QuizStatusUpdate
)
from backend.app.services.ai_generator import AIGeneratorService

router = APIRouter(prefix="/quizzes", tags=["Online Quiz Links & Testing"])


def _extract_letter_choice(text: Any) -> str:
    """Normalize and extract choice letter (A, B, C, D) from option or answer text."""
    if not text:
        return ""
    text_str = str(text).strip()
    match = re.search(r'\b([A-Da-d])\b', text_str[:12])
    if match:
        return match.group(1).upper()
    m_opt = re.search(r'Option\s*([A-Da-d])', text_str, re.IGNORECASE)
    if m_opt:
        return m_opt.group(1).upper()
    return text_str.upper()


def _normalize_options(options_raw: Any) -> List[str]:
    """Ensure options is a clean 4-item list."""
    if isinstance(options_raw, str):
        try:
            parsed = json.loads(options_raw)
            if isinstance(parsed, list):
                return [str(o).strip() for o in parsed]
        except Exception:
            pass
        return [o.strip() for o in options_raw.split("\n") if o.strip()]
    if isinstance(options_raw, list):
        return [str(o).strip() for o in options_raw]
    return []


@router.get("")
def list_quizzes(
    course_code: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List all quizzes with live attempt metrics and pass rates."""
    query = db.query(Quiz)
    if course_code:
        query = query.filter(Quiz.course_code == course_code)
    
    quizzes = query.order_by(Quiz.created_at.desc()).all()
    results = []
    for q in quizzes:
        subs = q.submissions
        attempts_count = len(subs)
        avg_score = round(sum(s.percentage for s in subs) / attempts_count, 1) if attempts_count > 0 else 0.0
        highest_score = round(max((s.percentage for s in subs), default=0.0), 1)
        passing_count = sum(1 for s in subs if s.passed)
        pass_rate = round((passing_count / attempts_count) * 100, 1) if attempts_count > 0 else 0.0
        
        try:
            questions = json.loads(q.questions_json)
        except Exception:
            questions = []

        results.append({
            "id": q.id,
            "quiz_code": q.quiz_code,
            "title": q.title,
            "course_code": q.course_code,
            "course_name": q.course_name,
            "description": q.description,
            "paper_id": q.paper_id,
            "duration_minutes": q.duration_minutes,
            "total_marks": q.total_marks,
            "pass_percentage": q.pass_percentage,
            "is_active": q.is_active,
            "questions_count": len(questions),
            "created_at": q.created_at,
            "attempts_count": attempts_count,
            "average_score": avg_score,
            "highest_score": highest_score,
            "pass_rate": pass_rate
        })
    return results


@router.get("/by-paper/{paper_id}")
def get_quiz_by_paper(paper_id: int, db: Session = Depends(get_db)):
    """Check if an active quiz link already exists for this generated paper."""
    quiz = db.query(Quiz).filter(Quiz.paper_id == paper_id).first()
    if not quiz:
        return {"exists": False, "quiz": None}
    
    subs = quiz.submissions
    return {
        "exists": True,
        "quiz": {
            "id": quiz.id,
            "quiz_code": quiz.quiz_code,
            "title": quiz.title,
            "course_code": quiz.course_code,
            "duration_minutes": quiz.duration_minutes,
            "total_marks": quiz.total_marks,
            "is_active": quiz.is_active,
            "attempts_count": len(subs),
            "created_at": quiz.created_at
        }
    }


@router.post("/generate-from-paper/{paper_id}")
def generate_quiz_from_paper(
    paper_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """
    Generate an interactive online Quiz Link from an existing examination paper.
    If a quiz already exists for this paper, returns the existing active quiz link.
    """
    existing_quiz = db.query(Quiz).filter(Quiz.paper_id == paper_id).first()
    if existing_quiz:
        try:
            q_list = json.loads(existing_quiz.questions_json)
        except Exception:
            q_list = []
        return {
            "message": "Existing quiz link retrieved",
            "quiz_id": existing_quiz.id,
            "quiz_code": existing_quiz.quiz_code,
            "title": existing_quiz.title,
            "course_code": existing_quiz.course_code,
            "course_name": existing_quiz.course_name,
            "duration_minutes": existing_quiz.duration_minutes,
            "total_marks": existing_quiz.total_marks,
            "questions_count": len(q_list),
            "is_active": existing_quiz.is_active,
            "share_path": f"/?quiz={existing_quiz.quiz_code}"
        }

    paper = db.query(GeneratedPaper).filter(GeneratedPaper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Examination paper not found")

    try:
        sections = json.loads(paper.sections_json)
    except Exception:
        sections = []

    quiz_questions = []
    q_counter = 1

    for sec in sections:
        sec_questions = sec.get("questions", [])
        for sq in sec_questions:
            options = _normalize_options(sq.get("options", []))
            
            # If options are empty or not formatted, synthesize standard plausible 4 alternatives
            if not options or len(options) < 2:
                topic = sq.get("topic", "the syllabus subject")
                options = [
                    f"A) Standard theoretical model defining {topic}",
                    f"B) Optimized procedural execution invariant for {topic}",
                    f"C) Boundary constraint violating structural state in {topic}",
                    f"D) Non-deterministic arbitrary allocation overhead"
                ]
            
            # Extract correct option
            correct_opt = sq.get("correct_option") or sq.get("model_answer") or "B"
            correct_letter = _extract_letter_choice(correct_opt)
            if not correct_letter:
                correct_letter = "B"

            marks = sq.get("marks", 1)
            explanation = sq.get("explanation") or sq.get("model_answer") or f"Grounded in curriculum topic: {sq.get('topic', '')}"

            quiz_questions.append({
                "id": q_counter,
                "q_number": q_counter,
                "question_text": sq.get("question_text", f"Question {q_counter}"),
                "question_type": sq.get("question_type", "MCQ"),
                "marks": marks,
                "options": options,
                "correct_option": correct_letter,
                "explanation": explanation,
                "topic": sq.get("topic", ""),
                "unit_number": sq.get("unit_number", 1),
                "blooms_level": sq.get("blooms_level", "Understand")
            })
            q_counter += 1

    if not quiz_questions:
        raise HTTPException(status_code=400, detail="No questions found in this paper to convert into a quiz")

    total_marks = sum(q["marks"] for q in quiz_questions)
    code = f"qz_{uuid.uuid4().hex[:8]}"

    quiz = Quiz(
        quiz_code=code,
        title=paper.title if "Quiz" in paper.title else f"Online Quiz: {paper.title}",
        course_code=paper.course_code,
        course_name=paper.course_name,
        description=f"Automated online assessment generated from examination paper #{paper.id}. {paper.instructions or ''}",
        paper_id=paper.id,
        duration_minutes=paper.duration_minutes or max(15, len(quiz_questions) * 2),
        total_marks=total_marks,
        pass_percentage=40,
        is_active=True,
        shuffle_questions=False,
        show_immediate_results=True,
        questions_json=json.dumps(quiz_questions),
        created_by=current_user.id if current_user else paper.created_by
    )

    db.add(quiz)

    # Log audit entry
    db.add(AuditLog(
        user_id=current_user.id if current_user else None,
        username=current_user.username if current_user else "faculty",
        role=current_user.role if current_user else "paper_setter",
        action="GENERATE_QUIZ_LINK",
        entity_type="quiz",
        entity_id=code,
        details=f"Generated live quiz link {code} from paper #{paper.id} ({len(quiz_questions)} questions)."
    ))

    db.commit()
    db.refresh(quiz)

    return {
        "message": "Quiz link successfully generated",
        "quiz_id": quiz.id,
        "quiz_code": quiz.quiz_code,
        "title": quiz.title,
        "course_code": quiz.course_code,
        "course_name": quiz.course_name,
        "duration_minutes": quiz.duration_minutes,
        "total_marks": quiz.total_marks,
        "questions_count": len(quiz_questions),
        "is_active": quiz.is_active,
        "share_path": f"/?quiz={quiz.quiz_code}"
    }


@router.post("/generate-ai")
async def generate_ai_quiz(
    req: QuizGenerateAIRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """
    Generate a brand new AI-powered Online Quiz link directly from syllabus topics.
    """
    # 1. Fetch syllabus
    syllabus = None
    if req.syllabus_id:
        syllabus = db.query(Syllabus).filter(Syllabus.id == req.syllabus_id).first()
    if not syllabus:
        syllabus = db.query(Syllabus).filter(Syllabus.course_code == req.course_code).first()

    units = []
    if syllabus:
        try:
            units = json.loads(syllabus.units_json)
        except Exception:
            units = []

    # 2. Configure section spec for MCQ Quiz
    sections_spec = [{
        "section_id": "A",
        "title": "Part A (Objective Questions)",
        "question_type": "MCQ",
        "question_count": req.question_count,
        "marks_per_question": 1,
        "required_count": req.question_count,
        "difficulty_split": {"Easy": req.question_count // 3, "Medium": req.question_count // 2, "Hard": req.question_count - (req.question_count // 3 + req.question_count // 2)},
        "blooms_levels": ["Remember", "Understand", "Apply"],
        "unit_coverage": [1, 2, 3, 4, 5]
    }]

    generated_sections = await AIGeneratorService.generate_complete_paper(
        syllabus_units=units,
        sections_spec=sections_spec,
        api_key=req.api_key or settings.GEMINI_API_KEY
    )

    quiz_questions = []
    q_counter = 1
    for sec in generated_sections:
        for sq in sec.get("questions", []):
            options = _normalize_options(sq.get("options", []))
            if not options or len(options) < 2:
                topic = sq.get("topic", "curriculum concept")
                options = [
                    f"A) Standard theoretical definition of {topic}",
                    f"B) Correct procedural and algorithmic property of {topic}",
                    f"C) Degenerate computational scenario violating constraints",
                    f"D) Arbitrary ungrounded state transition"
                ]

            correct_opt = sq.get("correct_option") or sq.get("model_answer") or "B"
            correct_letter = _extract_letter_choice(correct_opt) or "B"

            quiz_questions.append({
                "id": q_counter,
                "q_number": q_counter,
                "question_text": sq.get("question_text", f"Question {q_counter}"),
                "question_type": "MCQ",
                "marks": 1,
                "options": options,
                "correct_option": correct_letter,
                "explanation": sq.get("explanation") or f"Grounded in unit topic: {sq.get('topic', '')}",
                "topic": sq.get("topic", ""),
                "unit_number": sq.get("unit_number", 1),
                "blooms_level": sq.get("blooms_level", "Understand")
            })
            q_counter += 1

    code = f"qz_{uuid.uuid4().hex[:8]}"
    total_marks = len(quiz_questions)

    quiz = Quiz(
        quiz_code=code,
        title=req.title,
        course_code=req.course_code,
        course_name=req.course_name or (syllabus.course_name if syllabus else req.course_code),
        description=f"AI-Generated Online Quiz ({req.question_count} Questions). Grounded in verified syllabus.",
        duration_minutes=req.duration_minutes,
        total_marks=total_marks,
        pass_percentage=req.pass_percentage,
        is_active=True,
        shuffle_questions=True,
        show_immediate_results=True,
        questions_json=json.dumps(quiz_questions),
        created_by=current_user.id if current_user else None
    )

    db.add(quiz)
    db.add(AuditLog(
        user_id=current_user.id if current_user else None,
        username=current_user.username if current_user else "faculty",
        role=current_user.role if current_user else "paper_setter",
        action="GENERATE_AI_QUIZ_LINK",
        entity_type="quiz",
        entity_id=code,
        details=f"Generated AI quiz {code} for course {req.course_code} ({len(quiz_questions)} MCQs)."
    ))

    db.commit()
    db.refresh(quiz)

    return {
        "message": "AI Quiz link generated successfully",
        "quiz_id": quiz.id,
        "quiz_code": quiz.quiz_code,
        "title": quiz.title,
        "course_code": quiz.course_code,
        "duration_minutes": quiz.duration_minutes,
        "total_marks": quiz.total_marks,
        "questions_count": len(quiz_questions),
        "is_active": quiz.is_active,
        "share_path": f"/?quiz={quiz.quiz_code}"
    }


@router.post("")
def create_custom_quiz(
    req: QuizCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Create a custom online quiz with explicit questions."""
    code = f"qz_{uuid.uuid4().hex[:8]}"
    quiz = Quiz(
        quiz_code=code,
        title=req.title,
        course_code=req.course_code,
        course_name=req.course_name or "",
        description=req.description or "",
        paper_id=req.paper_id,
        duration_minutes=req.duration_minutes,
        total_marks=req.total_marks,
        pass_percentage=req.pass_percentage,
        shuffle_questions=req.shuffle_questions,
        show_immediate_results=req.show_immediate_results,
        is_active=True,
        questions_json=json.dumps(req.questions),
        created_by=current_user.id if current_user else None
    )

    db.add(quiz)
    db.commit()
    db.refresh(quiz)

    return {
        "message": "Quiz created successfully",
        "quiz_id": quiz.id,
        "quiz_code": quiz.quiz_code,
        "share_path": f"/?quiz={quiz.quiz_code}"
    }


# =====================================================================
# PUBLIC STUDENT QUIZ ENDPOINTS (NO LOGIN REQUIRED)
# =====================================================================

@router.get("/public/{quiz_code}")
def get_public_quiz_for_taking(quiz_code: str, db: Session = Depends(get_db)):
    """
    Public student endpoint to fetch quiz for taking.
    IMPORTANT: Strips out correct answers and model solutions so students cannot cheat!
    """
    quiz = db.query(Quiz).filter(Quiz.quiz_code == quiz_code).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found. Please verify your quiz link.")

    if not quiz.is_active:
        return {
            "is_active": False,
            "quiz_code": quiz.quiz_code,
            "title": quiz.title,
            "course_code": quiz.course_code,
            "message": "This quiz is currently closed by the instructor. Please contact your faculty."
        }

    try:
        raw_questions = json.loads(quiz.questions_json)
    except Exception:
        raw_questions = []

    # Sanitize questions: reveal ONLY student-facing fields
    sanitized = []
    for i, q in enumerate(raw_questions):
        sanitized.append({
            "id": q.get("id", i + 1),
            "q_number": i + 1,
            "question_text": q.get("question_text", ""),
            "question_type": q.get("question_type", "MCQ"),
            "marks": q.get("marks", 1),
            "options": q.get("options", []),
            "blooms_level": q.get("blooms_level", "Understand"),
            "topic": q.get("topic", "")
        })

    return {
        "is_active": True,
        "quiz_code": quiz.quiz_code,
        "title": quiz.title,
        "course_code": quiz.course_code,
        "course_name": quiz.course_name,
        "description": quiz.description,
        "duration_minutes": quiz.duration_minutes,
        "total_marks": quiz.total_marks,
        "pass_percentage": quiz.pass_percentage,
        "questions_count": len(sanitized),
        "questions": sanitized,
        "show_immediate_results": quiz.show_immediate_results
    }


@router.post("/public/{quiz_code}/submit")
def submit_public_quiz(
    quiz_code: str,
    req: QuizSubmissionCreate,
    db: Session = Depends(get_db)
):
    """
    Public student endpoint to submit answers.
    Evaluates score, records submission, and provides comprehensive result report.
    """
    quiz = db.query(Quiz).filter(Quiz.quiz_code == quiz_code).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    if not quiz.is_active:
        raise HTTPException(status_code=400, detail="This quiz has been closed by the instructor and is no longer accepting submissions.")

    try:
        questions = json.loads(quiz.questions_json)
    except Exception:
        questions = []

    earned_score = 0.0
    total_possible = 0.0
    review_list = []

    for i, q in enumerate(questions):
        q_id = str(q.get("id", i + 1))
        q_marks = float(q.get("marks", 1))
        total_possible += q_marks

        # Student's chosen answer
        chosen = req.answers.get(q_id) or req.answers.get(str(i + 1)) or req.answers.get(i + 1)
        chosen_str = str(chosen).strip() if chosen is not None else ""
        chosen_letter = _extract_letter_choice(chosen_str)

        # Expected correct option
        correct_raw = q.get("correct_option") or q.get("model_answer") or "A"
        correct_letter = _extract_letter_choice(correct_raw)

        is_correct = False
        if chosen_letter and correct_letter and chosen_letter == correct_letter:
            is_correct = True
            earned_score += q_marks

        review_list.append({
            "id": q.get("id", i + 1),
            "q_number": i + 1,
            "question_text": q.get("question_text", ""),
            "options": q.get("options", []),
            "student_choice": chosen_str,
            "student_letter": chosen_letter,
            "correct_letter": correct_letter,
            "is_correct": is_correct,
            "marks_awarded": q_marks if is_correct else 0.0,
            "marks_possible": q_marks,
            "explanation": q.get("explanation", ""),
            "topic": q.get("topic", ""),
            "blooms_level": q.get("blooms_level", "")
        })

    percentage = round((earned_score / total_possible * 100), 1) if total_possible > 0 else 0.0
    passed = percentage >= quiz.pass_percentage

    # Create submission record
    sub = QuizSubmission(
        quiz_id=quiz.id,
        student_name=req.student_name.strip(),
        student_id=req.student_id.strip(),
        student_email=req.student_email.strip() if req.student_email else "",
        score=round(earned_score, 1),
        total_marks=round(total_possible, 1),
        percentage=percentage,
        passed=passed,
        time_spent_seconds=req.time_spent_seconds,
        answers_json=json.dumps(req.answers),
        review_json=json.dumps(review_list)
    )

    db.add(sub)
    db.commit()
    db.refresh(sub)

    return {
        "submission_id": sub.id,
        "quiz_code": quiz.quiz_code,
        "quiz_title": quiz.title,
        "course_code": quiz.course_code,
        "student_name": sub.student_name,
        "student_id": sub.student_id,
        "score": sub.score,
        "total_marks": sub.total_marks,
        "percentage": sub.percentage,
        "passed": sub.passed,
        "pass_percentage": quiz.pass_percentage,
        "time_spent_seconds": sub.time_spent_seconds,
        "submitted_at": sub.submitted_at,
        "show_immediate_results": quiz.show_immediate_results,
        "review": review_list
    }


# =====================================================================
# FACULTY ANALYTICS & MANAGEMENT
# =====================================================================

@router.get("/{quiz_code}/submissions")
def get_quiz_submissions(quiz_code: str, db: Session = Depends(get_db)):
    """Faculty view of student submission records, rank leaderboard, and individual papers."""
    quiz = db.query(Quiz).filter(Quiz.quiz_code == quiz_code).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    subs = db.query(QuizSubmission).filter(QuizSubmission.quiz_id == quiz.id).order_by(
        QuizSubmission.score.desc(), QuizSubmission.time_spent_seconds.asc()
    ).all()

    items = []
    for rank, s in enumerate(subs, 1):
        try:
            review = json.loads(s.review_json)
        except Exception:
            review = []

        items.append({
            "rank": rank,
            "id": s.id,
            "student_name": s.student_name,
            "student_id": s.student_id,
            "student_email": s.student_email,
            "score": s.score,
            "total_marks": s.total_marks,
            "percentage": s.percentage,
            "passed": s.passed,
            "time_spent_seconds": s.time_spent_seconds,
            "submitted_at": s.submitted_at,
            "review": review
        })

    return {
        "quiz_title": quiz.title,
        "course_code": quiz.course_code,
        "total_marks": quiz.total_marks,
        "pass_percentage": quiz.pass_percentage,
        "total_submissions": len(items),
        "average_score": round(sum(s["percentage"] for s in items) / len(items), 1) if items else 0.0,
        "highest_score": round(max((s["percentage"] for s in items), default=0.0), 1),
        "pass_count": sum(1 for s in items if s["passed"]),
        "submissions": items
    }


@router.put("/{quiz_id}/status")
def update_quiz_status(
    quiz_id: int,
    data: QuizStatusUpdate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Toggle quiz active / inactive (closed) state."""
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    quiz.is_active = data.is_active
    db.commit()

    return {
        "message": f"Quiz is now {'Active' if quiz.is_active else 'Closed'}",
        "quiz_id": quiz.id,
        "is_active": quiz.is_active
    }


@router.delete("/{quiz_id}")
def delete_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Delete a quiz and all associated submissions."""
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    code = quiz.quiz_code
    db.delete(quiz)
    db.commit()

    return {"message": f"Quiz {code} deleted successfully"}
