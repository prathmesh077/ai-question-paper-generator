import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user
from backend.app.models.models import User, Question, QuestionBank, GeneratedPaper, AuditLog
from backend.app.schemas.schemas import (
    QuestionCreate, QuestionUpdate, QuestionResponse,
    QuestionBankCreate, QuestionBankResponse,
    DuplicateCheckRequest, DuplicateCheckResult, DuplicateMatch
)
from backend.app.services.deduplication import DeduplicationEngine

router = APIRouter(prefix="/questions", tags=["Question Bank & Anti-Duplication"])

# --- Question Banks ---

@router.get("/banks", response_model=List[QuestionBankResponse])
def get_question_banks(db: Session = Depends(get_db)):
    banks = db.query(QuestionBank).all()
    result = []
    for b in banks:
        q_count = db.query(Question).filter(Question.question_bank_id == b.id).count()
        result.append({
            "id": b.id,
            "name": b.name,
            "course_code": b.course_code,
            "department": b.department,
            "description": b.description,
            "question_count": q_count,
            "created_at": b.created_at
        })
    return result

@router.post("/banks", response_model=QuestionBankResponse)
def create_question_bank(
    data: QuestionBankCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    bank = QuestionBank(
        name=data.name,
        course_code=data.course_code,
        department=data.department,
        description=data.description or "",
        created_by=current_user.id
    )
    db.add(bank)
    db.commit()
    db.refresh(bank)
    return {
        "id": bank.id,
        "name": bank.name,
        "course_code": bank.course_code,
        "department": bank.department,
        "description": bank.description,
        "question_count": 0,
        "created_at": bank.created_at
    }

# --- Questions CRUD ---

@router.get("", response_model=List[QuestionResponse])
def get_questions(
    course_code: Optional[str] = None,
    unit_number: Optional[int] = None,
    difficulty: Optional[str] = None,
    blooms_level: Optional[str] = None,
    question_type: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Question)
    if course_code:
        query = query.filter(Question.course_code == course_code)
    if unit_number:
        query = query.filter(Question.unit_number == unit_number)
    if difficulty:
        query = query.filter(Question.difficulty == difficulty)
    if blooms_level:
        query = query.filter(Question.blooms_level == blooms_level)
    if question_type:
        query = query.filter(Question.question_type == question_type)
    if search:
        query = query.filter(Question.question_text.ilike(f"%{search}%"))

    return query.order_by(Question.created_at.desc()).all()

@router.get("/{question_id}", response_model=QuestionResponse)
def get_question_by_id(question_id: int, db: Session = Depends(get_db)):
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    return q

@router.post("", response_model=QuestionResponse)
def create_question(
    data: QuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check for duplicate against existing questions before saving
    existing_questions = db.query(Question).filter(Question.course_code == data.course_code).all()
    pool = [{"id": eq.id, "question_text": eq.question_text, "source": "question_bank"} for eq in existing_questions]
    
    dup_check = DeduplicationEngine.check_question_against_pool(data.question_text, pool, threshold=0.75)
    if dup_check["is_duplicate"]:
        match = dup_check["match"]
        raise HTTPException(
            status_code=400,
            detail=f"Duplicate question detected! Matches Question ID {match['existing_id']} with {match['similarity_percentage']}% similarity. {match['recommendation']}"
        )

    q = Question(
        question_bank_id=data.question_bank_id,
        syllabus_id=data.syllabus_id,
        course_code=data.course_code,
        unit_number=data.unit_number,
        topic=data.topic or "",
        question_text=data.question_text,
        question_type=data.question_type,
        marks=data.marks,
        difficulty=data.difficulty,
        blooms_level=data.blooms_level,
        options_json=json.dumps(data.options or []),
        model_answer=data.model_answer or "",
        explanation=data.explanation or "",
        created_by=current_user.id
    )
    db.add(q)
    db.commit()
    db.refresh(q)
    return q

@router.put("/{question_id}", response_model=QuestionResponse)
def update_question(
    question_id: int,
    data: QuestionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")

    if data.question_text is not None:
        q.question_text = data.question_text
    if data.question_type is not None:
        q.question_type = data.question_type
    if data.marks is not None:
        q.marks = data.marks
    if data.difficulty is not None:
        q.difficulty = data.difficulty
    if data.blooms_level is not None:
        q.blooms_level = data.blooms_level
    if data.topic is not None:
        q.topic = data.topic
    if data.unit_number is not None:
        q.unit_number = data.unit_number
    if data.options is not None:
        q.options_json = json.dumps(data.options)
    if data.model_answer is not None:
        q.model_answer = data.model_answer
    if data.explanation is not None:
        q.explanation = data.explanation

    db.commit()
    db.refresh(q)
    return q

@router.delete("/{question_id}")
def delete_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    db.delete(q)
    db.commit()
    return {"message": "Question deleted successfully"}

# --- Anti-Duplicate & Similarity Detection ---

@router.post("/check-duplicate", response_model=DuplicateCheckResult)
def check_duplicate_question(
    data: DuplicateCheckRequest,
    db: Session = Depends(get_db)
):
    threshold = data.threshold or 0.65
    pool = []

    # 1. Pool from Question Bank
    q_query = db.query(Question)
    if data.course_code:
        q_query = q_query.filter(Question.course_code == data.course_code)
    for q in q_query.all():
        pool.append({
            "id": q.id,
            "question_text": q.question_text,
            "source": "Question Bank",
            "course_code": q.course_code
        })

    # 2. Pool from Past Generated Papers
    papers = db.query(GeneratedPaper).all()
    for p in papers:
        try:
            sections = json.loads(p.sections_json)
            for sec in sections:
                for pq in sec.get("questions", []):
                    pool.append({
                        "id": p.id,
                        "question_text": pq.get("question_text", ""),
                        "source": f"Past Exam ({p.exam_name} - {p.academic_year})",
                        "course_code": p.course_code
                    })
        except Exception:
            pass

    # Check candidate text against pool
    matches: List[DuplicateMatch] = []
    highest_sim = 0.0

    for item in pool:
        sim = DeduplicationEngine.calculate_similarity(data.question_text, item["question_text"])
        if sim > highest_sim:
            highest_sim = sim
        
        if sim >= 0.45: # Return top matches
            rec = "Safe - High uniqueness"
            if sim >= 0.80:
                rec = "Critical: Exact or near-identical question found. Swap immediately to preserve exam integrity."
            elif sim >= threshold:
                rec = "Warning: High conceptual overlap with existing question. Consider modifying wording or variables."
            
            matches.append(DuplicateMatch(
                existing_question_id=item["id"],
                existing_question_text=item["question_text"],
                course_code=item.get("course_code", ""),
                source_type=item["source"],
                similarity_score=sim,
                similarity_percentage=int(sim * 100),
                recommendation=rec
            ))

    # Sort matches by similarity score descending
    matches.sort(key=lambda m: m.similarity_score, reverse=True)

    return DuplicateCheckResult(
        is_duplicate=(highest_sim >= threshold),
        highest_similarity=highest_sim,
        matches=matches[:5]
    )
