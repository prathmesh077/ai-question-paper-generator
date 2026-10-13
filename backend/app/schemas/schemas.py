from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

# Auth & Users
class UserLogin(BaseModel):
    username: str
    password: str

class UserRegister(BaseModel):
    username: str
    email: str
    password: str
    full_name: str
    role: str = "paper_setter" # administrator, paper_setter, moderator
    department: Optional[str] = "Computer Science & Engineering"

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    role: str
    department: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Syllabus
class UnitTopic(BaseModel):
    unit_num: int
    title: str
    topics: List[str]
    weightage: Optional[int] = 20

class SyllabusCreate(BaseModel):
    title: str
    course_code: str
    course_name: str
    department: str = "Computer Science & Engineering"
    semester: str = "Semester V"
    academic_year: str = "2026-2027"
    raw_text: str
    units: Optional[List[UnitTopic]] = None

class SyllabusResponse(BaseModel):
    id: int
    title: str
    course_code: str
    course_name: str
    department: str
    semester: str
    academic_year: str
    units_json: str
    file_name: Optional[str] = None
    created_by: int
    created_at: datetime

    class Config:
        from_attributes = True

# Questions
class QuestionCreate(BaseModel):
    question_bank_id: Optional[int] = None
    syllabus_id: Optional[int] = None
    course_code: str
    unit_number: int = 1
    topic: str = ""
    question_text: str
    question_type: str = "Short" # MCQ, Short, Long, Numerical, Analytical
    marks: int = 2
    difficulty: str = "Medium" # Easy, Medium, Hard
    blooms_level: str = "Understand" # Remember, Understand, Apply, Analyze, Evaluate, Create
    options: Optional[List[str]] = []
    model_answer: Optional[str] = ""
    explanation: Optional[str] = ""

class QuestionUpdate(BaseModel):
    question_text: Optional[str] = None
    question_type: Optional[str] = None
    marks: Optional[int] = None
    difficulty: Optional[str] = None
    blooms_level: Optional[str] = None
    topic: Optional[str] = None
    unit_number: Optional[int] = None
    options: Optional[List[str]] = None
    model_answer: Optional[str] = None
    explanation: Optional[str] = None

class QuestionResponse(BaseModel):
    id: int
    question_bank_id: Optional[int]
    syllabus_id: Optional[int]
    course_code: str
    unit_number: int
    topic: str
    question_text: str
    question_type: str
    marks: int
    difficulty: str
    blooms_level: str
    options_json: str
    model_answer: Optional[str]
    usage_count: int
    created_at: datetime

    class Config:
        from_attributes = True

class QuestionBankCreate(BaseModel):
    name: str
    course_code: str
    department: str = "Computer Science & Engineering"
    description: Optional[str] = ""

class QuestionBankResponse(BaseModel):
    id: int
    name: str
    course_code: str
    department: str
    description: str
    question_count: Optional[int] = 0
    created_at: datetime

    class Config:
        from_attributes = True

# Deduplication
class DuplicateCheckRequest(BaseModel):
    question_text: str
    course_code: Optional[str] = None
    threshold: Optional[float] = 0.65

class DuplicateMatch(BaseModel):
    existing_question_id: int
    existing_question_text: str
    course_code: str
    source_type: str # "question_bank" or "past_paper"
    similarity_score: float # 0.0 to 1.0
    similarity_percentage: int
    recommendation: str

class DuplicateCheckResult(BaseModel):
    is_duplicate: bool
    highest_similarity: float
    matches: List[DuplicateMatch]

# Paper Generation & Templates
class SectionSpec(BaseModel):
    section_id: str # "A", "B", "C"
    title: str # "Part A (Objective & Short Answer)"
    question_count: int # 10
    marks_per_question: int # 2
    required_count: int # 10
    question_type: str = "Short"
    difficulty_split: Dict[str, int] = {"Easy": 5, "Medium": 4, "Hard": 1}
    blooms_levels: List[str] = ["Remember", "Understand"]
    unit_coverage: Optional[List[int]] = None

class PaperTemplateCreate(BaseModel):
    title: str
    course_code: Optional[str] = ""
    total_marks: int = 100
    duration_minutes: int = 180
    instructions: str
    sections: List[SectionSpec]

class PaperGenerateRequest(BaseModel):
    syllabus_id: int
    title: str
    exam_name: str = "End Semester Theory Examination"
    course_code: str
    course_name: str
    institution_name: str = "NATIONAL INSTITUTE OF TECHNOLOGY & SCIENCE"
    department: str = "Department of Computer Science & Engineering"
    semester: str = "Semester V"
    academic_year: str = "2026-2027"
    date_of_exam: Optional[str] = "20-Nov-2026"
    duration_minutes: int = 180
    total_marks: int = 100
    instructions: Optional[str] = None
    use_ai: bool = True
    ai_provider: Optional[str] = "auto" # auto, gemini, openai, local
    api_key: Optional[str] = None
    deduplication_threshold: float = 0.70
    sections: List[SectionSpec]

class PaperStatusUpdate(BaseModel):
    status: str # "draft", "pending_moderation", "approved", "rejected"
    moderator_notes: Optional[str] = ""

class QuestionSwapRequest(BaseModel):
    section_id: str
    question_index: int
    reason: Optional[str] = "High duplicate similarity with previous exam"

# Quizzes
class QuizCreate(BaseModel):
    title: str
    course_code: str
    course_name: Optional[str] = ""
    description: Optional[str] = ""
    paper_id: Optional[int] = None
    duration_minutes: int = 20
    total_marks: int = 20
    pass_percentage: int = 40
    shuffle_questions: bool = False
    show_immediate_results: bool = True
    questions: List[Dict[str, Any]]

class QuizGenerateAIRequest(BaseModel):
    title: str
    course_code: str
    course_name: Optional[str] = ""
    syllabus_id: Optional[int] = None
    question_count: int = 10
    difficulty: str = "Balanced" # Easy, Medium, Hard, Balanced
    duration_minutes: int = 15
    pass_percentage: int = 40
    api_key: Optional[str] = None

class QuizSubmissionCreate(BaseModel):
    student_name: str
    student_id: str
    student_email: Optional[str] = ""
    time_spent_seconds: int = 0
    answers: Dict[str, Any]

class QuizStatusUpdate(BaseModel):
    is_active: bool

