import os
import json
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user
from backend.app.models.models import User, Syllabus, SyllabusChunk, AuditLog, GeneratedPaper, Question, Quiz
from backend.app.schemas.schemas import SyllabusCreate, SyllabusResponse
from backend.app.services.rag_engine import RAGEngine
from backend.app.core.config import settings

router = APIRouter(prefix="/syllabus", tags=["Syllabus & RAG Grounding"])

class CuratedUnit(BaseModel):
    unit_num: int
    title: str
    topics: List[str]
    learning_outcomes: Optional[List[str]] = []
    weightage: Optional[int] = 20

class SaveCuratedSyllabusRequest(BaseModel):
    course_code: str
    course_name: str
    department: str = "Computer Science & Engineering"
    semester: str = "Semester V"
    academic_year: str = "2026-2027"
    units: List[CuratedUnit]

@router.get("", response_model=List[SyllabusResponse])
def get_all_syllabi(db: Session = Depends(get_db)):
    return db.query(Syllabus).order_by(Syllabus.created_at.desc()).all()

@router.get("/{syllabus_id}", response_model=SyllabusResponse)
def get_syllabus(syllabus_id: int, db: Session = Depends(get_db)):
    s = db.query(Syllabus).filter(Syllabus.id == syllabus_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Syllabus not found")
    return s

@router.post("/parse-document")
async def parse_document(
    file: UploadFile = File(...)
):
    """
    Parses an uploaded PDF or DOCX syllabus document.
    Extracts curriculum units, modular topics, and learning outcomes without saving to DB yet,
    allowing the user to inspect and correct extraction errors in Step 2.
    """
    filename_lower = file.filename.lower()
    content_bytes = await file.read()
    
    if filename_lower.endswith(".pdf"):
        raw_text = RAGEngine.extract_text_from_pdf(content_bytes)
    elif filename_lower.endswith(".docx") or filename_lower.endswith(".doc"):
        raw_text = RAGEngine.extract_text_from_docx(content_bytes)
    else:
        raise HTTPException(status_code=400, detail="Only PDF or DOCX files are supported")

    if not raw_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from document. Ensure it contains selectable text.")

    units = RAGEngine.parse_syllabus_units(raw_text)

    return {
        "filename": file.filename,
        "raw_text_length": len(raw_text),
        "units": units,
        "sample_preview": raw_text[:500]
    }

@router.post("/save-curated")
def save_curated_syllabus(
    req: SaveCuratedSyllabusRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Stores user-verified and corrected syllabus content, executes semantic chunking,
    and indexes passages for strict RAG retrieval during question generation.
    """
    units_dict = [u.model_dump() for u in req.units]
    
    # Generate structured raw text summary
    raw_lines = [f"COURSE: {req.course_code} - {req.course_name}"]
    for u in units_dict:
        raw_lines.append(f"\nUNIT {u['unit_num']}: {u['title']}")
        if u.get('learning_outcomes'):
            raw_lines.append(f"Learning Outcomes: {'; '.join(u['learning_outcomes'])}")
        raw_lines.append(f"Topics: {', '.join(u.get('topics', []))}")
    raw_text = "\n".join(raw_lines)

    syllabus = Syllabus(
        title=f"{req.course_code}: {req.course_name} Syllabus",
        course_code=req.course_code,
        course_name=req.course_name,
        department=req.department,
        semester=req.semester,
        academic_year=req.academic_year,
        raw_text=raw_text,
        units_json=json.dumps(units_dict),
        created_by=current_user.id
    )
    db.add(syllabus)
    db.commit()
    db.refresh(syllabus)

    # Chunk and index for RAG
    chunks = RAGEngine.chunk_syllabus(units_dict)
    for c in chunks:
        db.add(SyllabusChunk(
            syllabus_id=syllabus.id,
            unit_number=c["unit_number"],
            unit_title=c["unit_title"],
            topic=c["topic"],
            content=c["content"],
            keywords=c.get("keywords", "")
        ))
    db.commit()

    db.add(AuditLog(
        user_id=current_user.id,
        username=current_user.username,
        role=current_user.role,
        action="SAVE_CURATED_SYLLABUS",
        entity_type="syllabus",
        entity_id=str(syllabus.id),
        details=f"Saved curated syllabus for {req.course_code} with {len(units_dict)} units and {len(chunks)} RAG chunks."
    ))
    db.commit()

    return {
        "message": "Syllabus saved and RAG indexed successfully",
        "syllabus_id": syllabus.id,
        "units": units_dict,
        "chunks_indexed": len(chunks)
    }

@router.post("/upload-pdf")
async def upload_syllabus_pdf(
    file: UploadFile = File(...),
    course_code: str = Form(...),
    course_name: str = Form(...),
    department: str = Form("Computer Science & Engineering"),
    semester: str = Form("Semester V"),
    academic_year: str = Form("2026-2027"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    filename_lower = file.filename.lower()
    content_bytes = await file.read()
    
    if filename_lower.endswith(".pdf"):
        raw_text = RAGEngine.extract_text_from_pdf(content_bytes)
    elif filename_lower.endswith(".docx") or filename_lower.endswith(".doc"):
        raw_text = RAGEngine.extract_text_from_docx(content_bytes)
    else:
        raise HTTPException(status_code=400, detail="Only PDF or DOCX syllabus documents are supported")

    if not raw_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from uploaded document.")

    # Save uploaded file
    file_path = os.path.join(settings.UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as f:
        f.write(content_bytes)

    # Parse Units, Topics, Outcomes
    units = RAGEngine.parse_syllabus_units(raw_text)

    syllabus = Syllabus(
        title=f"{course_code}: {course_name} Syllabus",
        course_code=course_code,
        course_name=course_name,
        department=department,
        semester=semester,
        academic_year=academic_year,
        raw_text=raw_text,
        file_name=file.filename,
        units_json=json.dumps(units),
        created_by=current_user.id
    )
    db.add(syllabus)
    db.commit()
    db.refresh(syllabus)

    chunks = RAGEngine.chunk_syllabus(units)
    for c in chunks:
        db.add(SyllabusChunk(
            syllabus_id=syllabus.id,
            unit_number=c["unit_number"],
            unit_title=c["unit_title"],
            topic=c["topic"],
            content=c["content"],
            keywords=c["keywords"]
        ))
    db.commit()

    return {
        "message": "Syllabus uploaded and RAG indexed successfully",
        "syllabus_id": syllabus.id,
        "units_count": len(units),
        "chunks_indexed": len(chunks),
        "units": units
    }

@router.get("/{syllabus_id}/chunks")
def get_syllabus_chunks(syllabus_id: int, db: Session = Depends(get_db)):
    chunks = db.query(SyllabusChunk).filter(SyllabusChunk.syllabus_id == syllabus_id).all()
    return [{
        "id": c.id,
        "unit_number": c.unit_number,
        "unit_title": c.unit_title,
        "topic": c.topic,
        "content": c.content,
        "keywords": c.keywords
    } for c in chunks]

@router.post("/create-text")
def create_syllabus_text(
    data: SyllabusCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Creates a syllabus directly from raw curriculum text and indexes RAG chunks.
    """
    if not data.raw_text.strip():
        raise HTTPException(status_code=400, detail="Syllabus text cannot be empty")

    units = RAGEngine.parse_syllabus_units(data.raw_text)
    syllabus = Syllabus(
        title=data.title or f"{data.course_code}: {data.course_name} Syllabus",
        course_code=data.course_code,
        course_name=data.course_name,
        department=data.department,
        semester=data.semester,
        academic_year=data.academic_year,
        raw_text=data.raw_text,
        file_name=None,
        units_json=json.dumps(units),
        created_by=current_user.id
    )
    db.add(syllabus)
    db.commit()
    db.refresh(syllabus)

    chunks = RAGEngine.chunk_syllabus(units)
    for c in chunks:
        db.add(SyllabusChunk(
            syllabus_id=syllabus.id,
            unit_number=c["unit_number"],
            unit_title=c["unit_title"],
            topic=c["topic"],
            content=c["content"],
            keywords=c.get("keywords", "")
        ))
    db.commit()

    db.add(AuditLog(
        user_id=current_user.id,
        username=current_user.username,
        role=current_user.role,
        action="CREATE_SYLLABUS_TEXT",
        entity_type="syllabus",
        entity_id=str(syllabus.id),
        details=f"Created syllabus {syllabus.course_code} from text with {len(units)} units"
    ))
    db.commit()

    return {
        "message": "Syllabus created and RAG indexed successfully",
        "syllabus_id": syllabus.id,
        "units_count": len(units),
        "chunks_indexed": len(chunks),
        "units": units
    }

@router.delete("/{syllabus_id}")
def delete_syllabus(
    syllabus_id: int,
    cascade: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Deletes a syllabus and all its RAG chunks.
    If cascade is True, also removes linked generated papers.
    Otherwise, raises an error if linked papers exist so user can confirm cascade.
    """
    if syllabus_id <= 0:
        raise HTTPException(status_code=400, detail="Invalid syllabus ID")

    syllabus = db.query(Syllabus).filter(Syllabus.id == syllabus_id).first()
    if not syllabus:
        raise HTTPException(status_code=404, detail="Syllabus not found")

    # Only admin, paper_setter, or original creator can delete
    if current_user.role not in ["administrator", "paper_setter"] and syllabus.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this syllabus")

    # Check for linked generated exam papers
    linked_papers = db.query(GeneratedPaper).filter(GeneratedPaper.syllabus_id == syllabus_id).all()
    if linked_papers and not cascade:
        raise HTTPException(
            status_code=400,
            detail=f"This syllabus is linked to {len(linked_papers)} generated exam paper(s). Confirm cascade delete to delete this syllabus along with its papers."
        )

    # If cascade is True, delete linked papers
    if linked_papers and cascade:
        for p in linked_papers:
            # Unlink quizzes referencing this paper
            db.query(Quiz).filter(Quiz.paper_id == p.id).update({Quiz.paper_id: None})
            db.delete(p)

    # Unlink questions that point to this syllabus
    db.query(Question).filter(Question.syllabus_id == syllabus_id).update({Question.syllabus_id: None})

    # Remove physical uploaded file if present
    if syllabus.file_name:
        try:
            file_path = os.path.join(settings.UPLOAD_DIR, syllabus.file_name)
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception as file_err:
            print(f"Warning: could not delete physical file {syllabus.file_name}: {file_err}")

    course_code = syllabus.course_code
    course_name = syllabus.course_name

    # Audit log
    db.add(AuditLog(
        user_id=current_user.id,
        username=current_user.username,
        role=current_user.role,
        action="DELETE_SYLLABUS",
        entity_type="syllabus",
        entity_id=str(syllabus_id),
        details=f"Deleted syllabus {course_code} - {course_name} (ID: {syllabus_id})"
    ))

    # Chunks are deleted automatically via cascade="all, delete-orphan"
    try:
        db.delete(syllabus)
        db.commit()
    except Exception as db_err:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Database error while deleting syllabus: {str(db_err)}"
        )

    return {
        "message": "Syllabus deleted successfully!",
        "deleted_id": syllabus_id,
        "course_code": course_code,
        "course_name": course_name
    }

