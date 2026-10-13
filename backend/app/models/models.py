from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, Float, DateTime, ForeignKey
)
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(30), default="paper_setter", nullable=False) # administrator, paper_setter, moderator
    department = Column(String(100), default="Computer Science & Engineering")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    syllabi = relationship("Syllabus", back_populates="creator")
    question_banks = relationship("QuestionBank", back_populates="creator")
    questions = relationship("Question", back_populates="creator")
    generated_papers = relationship("GeneratedPaper", foreign_keys="GeneratedPaper.created_by", back_populates="creator")


class Syllabus(Base):
    __tablename__ = "syllabi"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    course_code = Column(String(50), index=True, nullable=False)
    course_name = Column(String(200), nullable=False)
    department = Column(String(100), default="Computer Science & Engineering")
    semester = Column(String(20), default="Semester V")
    academic_year = Column(String(20), default="2026-2027")
    raw_text = Column(Text, nullable=False)
    file_name = Column(String(255), nullable=True)
    # Stored as JSON string: list of unit dicts [{"unit_num": 1, "title": "...", "topics": [...], "weightage": 20}]
    units_json = Column(Text, nullable=False, default="[]")
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    creator = relationship("User", back_populates="syllabi")
    chunks = relationship("SyllabusChunk", back_populates="syllabus", cascade="all, delete-orphan")
    questions = relationship("Question", back_populates="syllabus")
    papers = relationship("GeneratedPaper", back_populates="syllabus")


class SyllabusChunk(Base):
    __tablename__ = "syllabus_chunks"

    id = Column(Integer, primary_key=True, index=True)
    syllabus_id = Column(Integer, ForeignKey("syllabi.id"), nullable=False)
    unit_number = Column(Integer, default=1)
    unit_title = Column(String(200), default="")
    topic = Column(String(200), default="")
    content = Column(Text, nullable=False)
    # Keyword list or serialized vector for RAG retrieval
    keywords = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    syllabus = relationship("Syllabus", back_populates="chunks")


class QuestionBank(Base):
    __tablename__ = "question_banks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    course_code = Column(String(50), index=True, nullable=False)
    department = Column(String(100), default="Computer Science & Engineering")
    description = Column(Text, default="")
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    creator = relationship("User", back_populates="question_banks")
    questions = relationship("Question", back_populates="question_bank", cascade="all, delete-orphan")


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    question_bank_id = Column(Integer, ForeignKey("question_banks.id"), nullable=True)
    syllabus_id = Column(Integer, ForeignKey("syllabi.id"), nullable=True)
    course_code = Column(String(50), index=True, nullable=False)
    unit_number = Column(Integer, default=1)
    topic = Column(String(200), default="")
    question_text = Column(Text, nullable=False)
    question_type = Column(String(50), default="Short") # MCQ, Short, Long, Numerical, Analytical
    marks = Column(Integer, default=2)
    difficulty = Column(String(20), default="Medium") # Easy, Medium, Hard
    blooms_level = Column(String(30), default="Understand") # Remember, Understand, Apply, Analyze, Evaluate, Create
    # Options for MCQ (JSON list string)
    options_json = Column(Text, default="[]")
    model_answer = Column(Text, default="")
    explanation = Column(Text, default="")
    
    # Anti-duplicate tracking
    usage_count = Column(Integer, default=0)
    last_used_paper_id = Column(Integer, nullable=True)
    last_used_at = Column(DateTime, nullable=True)

    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    question_bank = relationship("QuestionBank", back_populates="questions")
    syllabus = relationship("Syllabus", back_populates="questions")
    creator = relationship("User", back_populates="questions")


class PaperTemplate(Base):
    __tablename__ = "paper_templates"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False) # e.g., "End-Semester Standard 100 Marks (3 Hours)"
    course_code = Column(String(50), default="")
    total_marks = Column(Integer, default=100)
    duration_minutes = Column(Integer, default=180)
    instructions = Column(Text, default="1. All questions in Part A are compulsory.\n2. In Part B, answer any 5 out of 7 questions.\n3. Assume suitable data where necessary.")
    # JSON structure specifying sections:
    # [
    #   {"section_id": "A", "title": "Part A (Short Answer)", "question_count": 10, "marks_per_question": 2, "required_count": 10, "difficulty_target": {"Easy": 6, "Medium": 4, "Hard": 0}},
    #   {"section_id": "B", "title": "Part B (Analytical)", "question_count": 7, "marks_per_question": 6, "required_count": 5, "difficulty_target": {"Easy": 2, "Medium": 4, "Hard": 1}},
    #   {"section_id": "C", "title": "Part C (Comprehensive)", "question_count": 5, "marks_per_question": 10, "required_count": 5, "difficulty_target": {"Easy": 0, "Medium": 3, "Hard": 2}}
    # ]
    blueprint_json = Column(Text, nullable=False, default="[]")
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class GeneratedPaper(Base):
    __tablename__ = "generated_papers"

    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("paper_templates.id"), nullable=True)
    syllabus_id = Column(Integer, ForeignKey("syllabi.id"), nullable=False)
    
    title = Column(String(200), nullable=False) # e.g., "End Semester Examination - November 2026"
    course_code = Column(String(50), nullable=False)
    course_name = Column(String(200), nullable=False)
    institution_name = Column(String(200), default="INSTITUTE OF TECHNOLOGY & SCIENCE")
    department = Column(String(100), default="Department of Computer Science & Engineering")
    exam_name = Column(String(100), default="End Semester Theory Examination")
    semester = Column(String(20), default="Semester V")
    academic_year = Column(String(20), default="2026-2027")
    date_of_exam = Column(String(50), default="")
    total_marks = Column(Integer, default=100)
    duration_minutes = Column(Integer, default=180)
    instructions = Column(Text, default="")
    
    # Workflow status: draft, pending_moderation, approved, rejected
    status = Column(String(30), default="draft")
    moderator_notes = Column(Text, default="")
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Stored question paper JSON: array of sections with questions, answers, bloom levels
    sections_json = Column(Text, nullable=False, default="[]")
    
    # Quality & Diversity metrics
    syllabus_coverage_json = Column(Text, default="{}") # e.g. {"Unit 1": 20, "Unit 2": 20, ...}
    difficulty_stats_json = Column(Text, default="{}") # e.g. {"Easy": 30, "Medium": 50, "Hard": 20}
    blooms_stats_json = Column(Text, default="{}")
    duplicate_risk_score = Column(Float, default=0.0) # 0.0 to 100.0 (lower is better, 0 = 100% unique)
    diversity_score = Column(Float, default=100.0) # 100% = completely diverse
    
    # Generated document files
    pdf_filename = Column(String(255), default="")
    docx_filename = Column(String(255), default="")

    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    syllabus = relationship("Syllabus", back_populates="papers")
    creator = relationship("User", foreign_keys=[created_by], back_populates="generated_papers")
    moderator = relationship("User", foreign_keys=[approved_by])
    quizzes = relationship("Quiz", back_populates="paper", cascade="all, delete-orphan")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    username = Column(String(50), default="system")
    role = Column(String(30), default="")
    action = Column(String(100), nullable=False) # e.g. "GENERATE_PAPER", "APPROVE_PAPER", "ADD_QUESTION"
    entity_type = Column(String(50), nullable=False) # e.g. "paper", "question", "syllabus", "user"
    entity_id = Column(String(50), default="")
    details = Column(Text, default="")
    ip_address = Column(String(50), default="127.0.0.1")
    timestamp = Column(DateTime, default=datetime.utcnow)


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    quiz_code = Column(String(64), unique=True, index=True, nullable=False)
    title = Column(String(200), nullable=False)
    course_code = Column(String(50), index=True, nullable=False)
    course_name = Column(String(200), default="")
    description = Column(Text, default="")
    paper_id = Column(Integer, ForeignKey("generated_papers.id"), nullable=True)

    duration_minutes = Column(Integer, default=20)
    total_marks = Column(Integer, default=20)
    pass_percentage = Column(Integer, default=40)
    is_active = Column(Boolean, default=True)
    shuffle_questions = Column(Boolean, default=False)
    show_immediate_results = Column(Boolean, default=True)

    # JSON list of questions
    questions_json = Column(Text, nullable=False, default="[]")

    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)

    paper = relationship("GeneratedPaper", back_populates="quizzes")
    creator = relationship("User")
    submissions = relationship("QuizSubmission", back_populates="quiz", cascade="all, delete-orphan")


class QuizSubmission(Base):
    __tablename__ = "quiz_submissions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    student_name = Column(String(100), nullable=False)
    student_id = Column(String(50), nullable=False) # Roll No / Registration No
    student_email = Column(String(100), default="")

    score = Column(Float, default=0.0)
    total_marks = Column(Float, default=0.0)
    percentage = Column(Float, default=0.0)
    passed = Column(Boolean, default=False)
    time_spent_seconds = Column(Integer, default=0)

    # JSON map of question answers: { "1": "B", "2": "A", ... }
    answers_json = Column(Text, default="{}")
    # JSON detailed evaluation report
    review_json = Column(Text, default="[]")
    submitted_at = Column(DateTime, default=datetime.utcnow)

    quiz = relationship("Quiz", back_populates="submissions")

