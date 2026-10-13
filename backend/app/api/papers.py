import os
import json
import re
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse, Response
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user, require_moderator_or_admin
from backend.app.core.config import settings
from backend.app.models.models import GeneratedPaper, Question, User, AuditLog
from backend.app.schemas.schemas import PaperStatusUpdate
from backend.app.services.export_pdf import PDFExporter
from backend.app.services.export_docx import DocxExporter

router = APIRouter(prefix="/papers", tags=["Examination Papers & Moderation"])

@router.get("")
def get_papers(
    status: Optional[str] = None,
    course_code: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(GeneratedPaper)
    if status:
        query = query.filter(GeneratedPaper.status == status)
    if course_code:
        query = query.filter(GeneratedPaper.course_code == course_code)
    
    papers = query.order_by(GeneratedPaper.created_at.desc()).all()
    results = []
    for p in papers:
        results.append({
            "id": p.id,
            "title": p.title,
            "course_code": p.course_code,
            "course_name": p.course_name,
            "exam_name": p.exam_name,
            "semester": p.semester,
            "academic_year": p.academic_year,
            "total_marks": p.total_marks,
            "duration_minutes": p.duration_minutes,
            "status": p.status,
            "moderator_notes": p.moderator_notes,
            "diversity_score": p.diversity_score,
            "duplicate_risk_score": p.duplicate_risk_score,
            "created_by": p.created_by,
            "created_at": p.created_at,
            "has_pdf": bool(p.pdf_filename),
            "has_docx": bool(p.docx_filename)
        })
    return results

@router.get("/{paper_id}")
def get_paper_details(paper_id: int, db: Session = Depends(get_db)):
    paper = db.query(GeneratedPaper).filter(GeneratedPaper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    return {
        "id": paper.id,
        "title": paper.title,
        "course_code": paper.course_code,
        "course_name": paper.course_name,
        "institution_name": paper.institution_name,
        "department": paper.department,
        "exam_name": paper.exam_name,
        "semester": paper.semester,
        "academic_year": paper.academic_year,
        "date_of_exam": paper.date_of_exam,
        "total_marks": paper.total_marks,
        "duration_minutes": paper.duration_minutes,
        "instructions": paper.instructions,
        "status": paper.status,
        "moderator_notes": paper.moderator_notes,
        "sections": json.loads(paper.sections_json),
        "syllabus_coverage": json.loads(paper.syllabus_coverage_json or "{}"),
        "difficulty_distribution": json.loads(paper.difficulty_stats_json or "{}"),
        "blooms_distribution": json.loads(paper.blooms_stats_json or "{}"),
        "diversity_score": paper.diversity_score,
        "duplicate_risk_score": paper.duplicate_risk_score,
        "created_by": paper.created_by,
        "approved_by": paper.approved_by,
        "created_at": paper.created_at
    }

@router.put("/{paper_id}/status")
def update_paper_status(
    paper_id: int,
    data: PaperStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    paper = db.query(GeneratedPaper).filter(GeneratedPaper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    # If approving or rejecting, verify moderator/admin role
    if data.status in ["approved", "rejected"]:
        if current_user.role not in ["moderator", "administrator"]:
            raise HTTPException(status_code=403, detail="Only Examination Board Moderators or Administrators can approve/reject papers")
        paper.approved_by = current_user.id

    old_status = paper.status
    paper.status = data.status
    if data.moderator_notes is not None:
        paper.moderator_notes = data.moderator_notes

    db.commit()

    db.add(AuditLog(
        user_id=current_user.id,
        username=current_user.username,
        role=current_user.role,
        action="UPDATE_PAPER_STATUS",
        entity_type="paper",
        entity_id=str(paper.id),
        details=f"Paper '{paper.title}' status transitioned from {old_status} to {data.status}. Notes: {data.moderator_notes}"
    ))
    db.commit()

    return {"message": f"Paper status updated to {data.status}", "status": data.status}

@router.get("/{paper_id}/download-pdf")
def download_pdf(paper_id: int, db: Session = Depends(get_db)):
    paper = db.query(GeneratedPaper).filter(GeneratedPaper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    pdf_filename = f"paper_{paper.id}_{paper.course_code}.pdf"
    file_path = os.path.join(settings.EXPORT_DIR, pdf_filename)

    # Regenerate on the fly if file missing
    if not os.path.exists(file_path):
        paper_dict = {
            "institution_name": paper.institution_name,
            "department": paper.department,
            "title": paper.title,
            "course_code": paper.course_code,
            "course_name": paper.course_name,
            "semester": paper.semester,
            "duration_minutes": paper.duration_minutes,
            "total_marks": paper.total_marks,
            "instructions": paper.instructions,
            "sections": json.loads(paper.sections_json)
        }
        PDFExporter.generate_pdf(paper_dict, output_path=file_path)

    return FileResponse(
        file_path,
        media_type="application/pdf",
        filename=f"QuestionPaper_{paper.course_code}_{paper.exam_name.replace(' ', '_')}.pdf"
    )

@router.get("/{paper_id}/download-docx")
def download_docx(paper_id: int, db: Session = Depends(get_db)):
    paper = db.query(GeneratedPaper).filter(GeneratedPaper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    docx_filename = f"paper_{paper.id}_{paper.course_code}.docx"
    file_path = os.path.join(settings.EXPORT_DIR, docx_filename)

    if not os.path.exists(file_path):
        paper_dict = {
            "institution_name": paper.institution_name,
            "department": paper.department,
            "title": paper.title,
            "course_code": paper.course_code,
            "course_name": paper.course_name,
            "semester": paper.semester,
            "duration_minutes": paper.duration_minutes,
            "total_marks": paper.total_marks,
            "instructions": paper.instructions,
            "sections": json.loads(paper.sections_json)
        }
        DocxExporter.generate_docx(paper_dict, output_path=file_path)

    return FileResponse(
        file_path,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename=f"QuestionPaper_{paper.course_code}_{paper.exam_name.replace(' ', '_')}.docx"
    )

@router.post("/{paper_id}/swap-bank-question")
def swap_with_bank_question(
    paper_id: int,
    section_id: str,
    question_index: int,
    bank_question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    paper = db.query(GeneratedPaper).filter(GeneratedPaper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    bank_q = db.query(Question).filter(Question.id == bank_question_id).first()
    if not bank_q:
        raise HTTPException(status_code=404, detail="Question bank item not found")

    sections = json.loads(paper.sections_json)
    target_sec = next((s for s in sections if s["section_id"] == section_id), None)
    if not target_sec or question_index >= len(target_sec["questions"]):
        raise HTTPException(status_code=400, detail="Invalid section or question index")

    old_q = target_sec["questions"][question_index]
    options = json.loads(bank_q.options_json) if bank_q.options_json else []

    target_sec["questions"][question_index] = {
        "q_number": old_q.get("q_number", question_index + 1),
        "question_text": bank_q.question_text,
        "unit_number": bank_q.unit_number,
        "topic": bank_q.topic,
        "marks": old_q.get("marks", bank_q.marks),
        "difficulty": bank_q.difficulty,
        "blooms_level": bank_q.blooms_level,
        "question_type": bank_q.question_type,
        "options": options,
        "model_answer": bank_q.model_answer
    }

    paper.sections_json = json.dumps(sections)
    
    # Track usage count
    bank_q.usage_count = (bank_q.usage_count or 0) + 1
    bank_q.last_used_paper_id = paper.id

    db.commit()

    return {"message": "Question successfully swapped with question bank", "sections": sections}

@router.delete("/{paper_id}")
def delete_paper(
    paper_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    paper = db.query(GeneratedPaper).filter(GeneratedPaper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    
    # Only creator or admin can delete
    if current_user.role != "administrator" and paper.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this paper")

    db.delete(paper)
    db.commit()
    return {"message": "Paper deleted successfully"}
