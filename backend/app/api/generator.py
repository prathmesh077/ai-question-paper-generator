import os
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user
from backend.app.core.config import settings
from backend.app.models.models import (
    User, Syllabus, PaperTemplate, GeneratedPaper, Question, AuditLog
)
from backend.app.schemas.schemas import (
    PaperTemplateCreate, PaperGenerateRequest, QuestionSwapRequest
)
from backend.app.services.ai_generator import AIGeneratorService
from backend.app.services.deduplication import DeduplicationEngine
from backend.app.services.export_pdf import PDFExporter
from backend.app.services.export_docx import DocxExporter

router = APIRouter(prefix="/generator", tags=["AI Question Paper Generation Engine"])

# --- Paper Templates & Blueprints ---

@router.get("/templates")
def get_templates(db: Session = Depends(get_db)):
    return db.query(PaperTemplate).all()

@router.post("/templates")
def create_template(
    data: PaperTemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sections_dict = [s.model_dump() for s in data.sections]
    tpl = PaperTemplate(
        title=data.title,
        course_code=data.course_code or "",
        total_marks=data.total_marks,
        duration_minutes=data.duration_minutes,
        instructions=data.instructions,
        blueprint_json=json.dumps(sections_dict),
        created_by=current_user.id
    )
    db.add(tpl)
    db.commit()
    db.refresh(tpl)
    return tpl

# --- Paper Generation ---

@router.post("/generate")
async def generate_paper(
    req: PaperGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Fetch syllabus
    syllabus = db.query(Syllabus).filter(Syllabus.id == req.syllabus_id).first()
    if not syllabus:
        raise HTTPException(status_code=404, detail="Syllabus not found")

    try:
        syllabus_units = json.loads(syllabus.units_json)
    except Exception:
        syllabus_units = []

    sections_specs = [s.model_dump() for s in req.sections]

    # 2. Invoke Generative AI pipeline
    generated_sections = await AIGeneratorService.generate_complete_paper(
        syllabus_units=syllabus_units,
        sections_spec=sections_specs,
        api_key=req.api_key or settings.GEMINI_API_KEY
    )

    # 3. Retrieve comparison pools for Anti-Duplicate verification
    past_papers = db.query(GeneratedPaper).filter(GeneratedPaper.course_code == req.course_code).all()
    past_questions = []
    for pp in past_papers:
        try:
            p_secs = json.loads(pp.sections_json)
            for ps in p_secs:
                for pq in ps.get("questions", []):
                    past_questions.append({
                        "id": pp.id,
                        "question_text": pq.get("question_text", ""),
                        "paper_title": pp.title,
                        "course_code": pp.course_code
                    })
        except Exception:
            pass

    bank_questions = db.query(Question).filter(Question.course_code == req.course_code).all()
    bank_pool = [{"id": bq.id, "question_text": bq.question_text, "course_code": bq.course_code} for bq in bank_questions]

    # 4. Run Deduplication & Diversity Analysis
    diversity_eval = DeduplicationEngine.evaluate_paper_diversity(
        sections=generated_sections,
        past_paper_questions=past_questions,
        bank_questions=bank_pool,
        threshold=req.deduplication_threshold
    )

    # 5. Compute syllabus coverage & difficulty distribution
    coverage_counts = {}
    difficulty_counts = {"Easy": 0, "Medium": 0, "Hard": 0}
    blooms_counts = {}
    total_q_count = 0

    for sec in generated_sections:
        for q in sec.get("questions", []):
            total_q_count += 1
            u_key = f"Unit {q.get('unit_number', 1)}"
            coverage_counts[u_key] = coverage_counts.get(u_key, 0) + 1
            d_key = q.get("difficulty", "Medium")
            difficulty_counts[d_key] = difficulty_counts.get(d_key, 0) + 1
            b_key = q.get("blooms_level", "Understand")
            blooms_counts[b_key] = blooms_counts.get(b_key, 0) + 1

    # Convert to percentages
    coverage_pct = {k: round((v / max(1, total_q_count)) * 100, 1) for k, v in coverage_counts.items()}
    difficulty_pct = {k: round((v / max(1, total_q_count)) * 100, 1) for k, v in difficulty_counts.items()}
    blooms_pct = {k: round((v / max(1, total_q_count)) * 100, 1) for k, v in blooms_counts.items()}

    # 6. Save GeneratedPaper record
    paper = GeneratedPaper(
        syllabus_id=syllabus.id,
        title=req.title,
        course_code=req.course_code,
        course_name=req.course_name,
        institution_name=req.institution_name,
        department=req.department,
        exam_name=req.exam_name,
        semester=req.semester,
        academic_year=req.academic_year,
        date_of_exam=req.date_of_exam or "",
        total_marks=req.total_marks,
        duration_minutes=req.duration_minutes,
        instructions=req.instructions or "",
        status="draft",
        sections_json=json.dumps(generated_sections),
        syllabus_coverage_json=json.dumps(coverage_pct),
        difficulty_stats_json=json.dumps(difficulty_pct),
        blooms_stats_json=json.dumps(blooms_pct),
        duplicate_risk_score=diversity_eval["duplicate_risk_score"],
        diversity_score=diversity_eval["diversity_score"],
        created_by=current_user.id
    )
    db.add(paper)
    db.commit()
    db.refresh(paper)

    # 7. Pre-render PDF and DOCX exports
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
        "sections": generated_sections
    }

    pdf_filename = f"paper_{paper.id}_{paper.course_code}.pdf"
    docx_filename = f"paper_{paper.id}_{paper.course_code}.docx"
    pdf_path = os.path.join(settings.EXPORT_DIR, pdf_filename)
    docx_path = os.path.join(settings.EXPORT_DIR, docx_filename)

    try:
        PDFExporter.generate_pdf(paper_dict, output_path=pdf_path)
        paper.pdf_filename = pdf_filename
    except Exception as e:
        print(f"PDF generation error: {e}")

    try:
        DocxExporter.generate_docx(paper_dict, output_path=docx_path)
        paper.docx_filename = docx_filename
    except Exception as e:
        print(f"DOCX generation error: {e}")

    db.commit()

    # Log action
    db.add(AuditLog(
        user_id=current_user.id,
        username=current_user.username,
        role=current_user.role,
        action="GENERATE_QUESTION_PAPER",
        entity_type="paper",
        entity_id=str(paper.id),
        details=f"Generated {req.title} for {req.course_code}. Diversity: {paper.diversity_score}%, Duplicate Risk: {paper.duplicate_risk_score}%."
    ))
    db.commit()

    return {
        "paper_id": paper.id,
        "title": paper.title,
        "status": paper.status,
        "sections": generated_sections,
        "syllabus_coverage": coverage_pct,
        "difficulty_distribution": difficulty_pct,
        "blooms_distribution": blooms_pct,
        "diversity_evaluation": diversity_eval,
        "pdf_available": bool(paper.pdf_filename),
        "docx_available": bool(paper.docx_filename)
    }

@router.post("/papers/{paper_id}/regenerate-question")
async def regenerate_question_in_paper(
    paper_id: int,
    section_id: str,
    question_index: int,
    api_key: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    paper = db.query(GeneratedPaper).filter(GeneratedPaper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    sections = json.loads(paper.sections_json)
    target_sec = next((s for s in sections if s["section_id"] == section_id), None)
    if not target_sec or question_index >= len(target_sec["questions"]):
        raise HTTPException(status_code=400, detail="Invalid section or question index")

    old_q = target_sec["questions"][question_index]
    unit_num = old_q.get("unit_number", 1)
    marks = old_q.get("marks", 2)
    diff = old_q.get("difficulty", "Medium")
    bloom = old_q.get("blooms_level", "Understand")
    q_type = old_q.get("question_type", "Short")

    # Fetch syllabus
    syllabus = db.query(Syllabus).filter(Syllabus.id == paper.syllabus_id).first()
    syllabus_units = json.loads(syllabus.units_json) if syllabus else []

    # Generate fresh alternative
    new_q = await AIGeneratorService.generate_single_question(
        syllabus_units=syllabus_units,
        unit_number=unit_num,
        marks=marks,
        difficulty=diff,
        blooms_level=bloom,
        question_type=q_type,
        api_key=api_key or settings.GEMINI_API_KEY
    )
    new_q["q_number"] = old_q.get("q_number", question_index + 1)
    target_sec["questions"][question_index] = new_q

    # Update paper
    paper.sections_json = json.dumps(sections)

    # Re-export files
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
        "sections": sections
    }
    pdf_path = os.path.join(settings.EXPORT_DIR, f"paper_{paper.id}_{paper.course_code}.pdf")
    docx_path = os.path.join(settings.EXPORT_DIR, f"paper_{paper.id}_{paper.course_code}.docx")
    try:
        PDFExporter.generate_pdf(paper_dict, output_path=pdf_path)
    except Exception:
        pass
    try:
        DocxExporter.generate_docx(paper_dict, output_path=docx_path)
    except Exception:
        pass

    db.commit()

    return {
        "message": f"Successfully regenerated Question {new_q['q_number']}",
        "new_question": new_q,
        "sections": sections
    }

class UpdatePaperSectionsRequest(BaseModel if False else object):
    pass

@router.put("/papers/{paper_id}/update-sections")
def update_paper_sections(
    paper_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    paper = db.query(GeneratedPaper).filter(GeneratedPaper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    sections = payload.get("sections", [])
    
    # Recalculate total marks across sections
    total_calculated_marks = 0
    for sec in sections:
        req_count = sec.get("required_count", len(sec.get("questions", [])))
        marks_per_q = sec.get("marks_per_question", 2)
        total_calculated_marks += req_count * marks_per_q

    paper.sections_json = json.dumps(sections)
    if "total_marks" in payload:
        paper.total_marks = payload["total_marks"]
    else:
        paper.total_marks = total_calculated_marks

    # Re-export files with updated content
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
        "sections": sections
    }
    pdf_path = os.path.join(settings.EXPORT_DIR, f"paper_{paper.id}_{paper.course_code}.pdf")
    docx_path = os.path.join(settings.EXPORT_DIR, f"paper_{paper.id}_{paper.course_code}.docx")
    try:
        PDFExporter.generate_pdf(paper_dict, output_path=pdf_path)
    except Exception as e:
        print("PDF re-export error:", e)
    try:
        DocxExporter.generate_docx(paper_dict, output_path=docx_path)
    except Exception as e:
        print("DOCX re-export error:", e)

    db.commit()

    return {
        "message": "Paper sections and marks successfully updated",
        "paper_id": paper.id,
        "total_marks": paper.total_marks,
        "sections": sections
    }

