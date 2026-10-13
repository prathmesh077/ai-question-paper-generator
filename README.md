# 🎓 ExamForge AI: AI-Based Question Paper Generation & Management System

An enterprise-grade, end-to-end academic platform designed for universities and autonomous colleges to automatically generate standardized examination papers from institutional syllabi using Generative AI (LLMs) and Retrieval-Augmented Generation (RAG), manage secure question banks, prevent duplicate questions, balance Bloom's taxonomy cognitive levels, and export university-compliant PDF and Word documents.

---

## 🌟 Primary Objectives Implemented

| Objective | Implementation Details |
| :--- | :--- |
| **1. Syllabus-Grounded Question Generation** | Automated PDF and text syllabus parser with **Retrieval-Augmented Generation (RAG)**. Chunks syllabus units and grounds generative queries strictly within syllabus boundaries. Powered by **Google Gemini API** (`gemini-1.5-flash` / `gemini-2.0-flash`) with a built-in offline Academic LLM Synthesizer fallback. |
| **2. Secure Question Bank Management** | Full CRUD question bank with multi-attribute tagging: Course Code, Unit Number (1–5), Topic, Marks, Question Type (MCQ, Short, Long, Analytical), Difficulty (Easy/Medium/Hard), Bloom's Taxonomy Cognitive Level, Model Answers, and examination usage metrics. |
| **3. Dual Standardized Paper Export (PDF & Word)** | Generates official university examination papers with institutional headers, metadata boxes (Time Allowed, Maximum Marks, Course Code, Reg No), general instructions, and structured sections (Part A, Part B, Part C) using **ReportLab** for PDF and **python-docx** for Word `.docx`. |
| **4. Role-Based Access Control (RBAC)** | Strict JWT authentication and access control supporting three dedicated roles: **Administrator** (full system control, user roles, audit trail), **Paper Setter / Faculty** (syllabus upload, paper generation wizard, question authoring), and **Moderator / Exam Board** (review, approve, or request revisions). |
| **5. Anti-Duplicate & Question Diversity Engine** | Multi-algorithm similarity detection (**Token Jaccard**, **Word Bigram Jaccard**, and **Levenshtein Sequence Matching**) that flags duplicate questions against both the active Question Bank and past examination papers. Features real-time duplicate checking while typing and single-click question regeneration or bank swapping. |

---

## 🛠️ Technology Stack (As Specified in Project Synopsis)

- **Frontend:** React (Vite) + Tailwind CSS + Lucide Icons
- **Backend Framework:** Python FastAPI (REST API with automatic Swagger OpenAPI documentation at `/docs`)
- **Database & ORM:** SQLite / PostgreSQL with SQLAlchemy ORM
- **Generative AI:** Hosted LLM API (Google Gemini / OpenAI GPT) + Academic Rule-Based Synthesizer
- **Syllabus Grounding (RAG):** PyPDF text extractor, unit segmentation, semantic keyword chunking & vector cosine matching
- **Paper Export:** ReportLab (standardized university PDF) and `python-docx` (Word `.docx`)
- **Authentication:** Native bcrypt password hashing + JWT tokens with RBAC claims

---

## 🚀 Live Application URL

- **Web Dashboard:** [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Interactive API Swagger Docs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Alternative ReDoc:** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## 👥 Default User Accounts (RBAC)

The system is pre-seeded with three accounts representing each stakeholder:

| Role | Username | Password | Full Name | Responsibilities |
| :--- | :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `admin123` | Dr. Arthur Vance | User management, role assignment, system audit trail |
| **Paper Setter** | `prof_sharma` | `setter123` | Prof. Rajesh Sharma | Upload syllabus, design blueprints, generate AI papers |
| **Moderator** | `dr_kapoor` | `moderator123` | Dr. Anita Kapoor | Review generated papers, inspect diversity, approve/reject |

*(You can switch between these roles in 1 click using the profile switcher in the top navigation bar!)*

---

## 🧭 System Workflow & Features

### 0. 🔐 Dedicated Login & Registration Portal
- **Role-Based Authentication:** Clean, modern authentication portal enforcing JWT session tokens and bcrypt password hashing.
- **⚡ 1-Click Fast Demo Login:** Three instant persona buttons (`Admin`, `Paper Setter`, `Moderator`) to test access controls immediately without typing.
- **Faculty Self-Registration:** Allows new faculty members to register their name, email, department, and request academic roles.
- **Safe Session Management:** Real-time token validation, password visibility toggles, and seamless Logout capability in the top header.

### 1. 📊 Dashboard & Analytics
- Master Question Bank size and cognitive distribution (Bloom's Taxonomy).
- Calibrated difficulty ratio tracker (30% Easy, 50% Medium, 20% Hard).
- Diversity Index (e.g. 98.4%) and Duplicate Prevention Rate (99.2%).
- Real-time audit log of paper generations and moderation approvals.

### 2. 📚 Syllabus & RAG Grounding Hub
- **PDF Upload:** Upload university syllabus PDFs parsed automatically with PyPDF.
- **Unit Segmentation:** Automatically parses curriculum into Units/Modules with sub-topics.
- **RAG Inspector:** View indexed semantic chunks and extracted keywords that constrain the generative model.

### 3. ⚡ AI Question Paper Generator Wizard
- **Step 1:** Select grounded syllabus, exam title, semester, marks (100, 50, 25), and time duration.
- **Step 2:** Configure section blueprint (Part A short questions, Part B analytical with choice, Part C comprehensive design).
- **Step 3:** Set AI engine (Google Gemini API or Built-in Academic Synthesizer) and anti-duplicate threshold.
- **Step 4:** Automatic generation with real-time Anti-Duplicate Scan. Flagged questions can be regenerated with AI or swapped from the bank with a single click.
- **Step 5:** Export standardized university PDF or editable Word document, or submit to the Examination Board for Moderation.

### 4. 🗄️ Master Question Bank Manager
- Search and filter questions by Course Code, Unit (1–5), Question Type, Difficulty, and Bloom's Level.
- **Live Anti-Duplicate Typing Guard:** As faculty types a question, the system dynamically queries the database and alerts if a duplicate exists before saving.
- Track usage frequency across past examination papers.

### 5. 📑 Paper Repository
- Complete archive of all generated examination papers with status pills (`Draft`, `In Moderation`, `Approved`, `Rejected`).
- One-click downloads for PDF and Word `.docx`.
- Detailed paper viewer with full question sheets and solutions.
- **⚡ 1-Click Quiz Link Generation:** Convert any examination paper into an interactive online student quiz with a single click.

### 5.1 🌐 Online Quiz Links & Live Testing Hub
- **Shareable Student Examination Links:** Instant generation of public quiz links (e.g., `/?quiz=qz_...`) that students can open and take directly without faculty login credentials.
- **Interactive Quiz Player:** Full-screen assessment portal featuring a real-time countdown timer, dynamic question navigation palette, instant choice selection, and auto-submit upon timer completion.
- **100% Automated Instant Grading:** Automatically evaluates MCQ responses against model keys, calculates percentage scores, determines qualification status, and provides syllabus-grounded explanations.
- **Scannable Classroom QR Codes:** Built-in QR code generator to project in lecture halls or print on paper for instant mobile quiz access.
- **Faculty Performance Leaderboard:** Real-time analytics tracking class average scores, pass rates, submission timestamps, and individual student response sheets.


### 6. ⚖️ Examination Board Moderation Station
- Independent portal for moderators to inspect papers submitted by faculty.
- Approve papers for final exam release or reject with feedback notes.

### 7. 👥 User Management & RBAC
- Administrators can review all faculty accounts, promote users, and inspect security audit logs.

### 8. ⚙️ AI Engine Settings
- Configure Google Gemini API keys, OpenAI keys, or switch to offline operation.

---

## 💻 How to Run

### Backend & Web Server
```powershell
# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Run FastAPI full-stack server
python run_backend.py
```
Visit `http://127.0.0.1:8000` in your web browser.

### Frontend Development (Optional for Hot-Reload)
```powershell
cd frontend
npm run dev
```
Visit `http://localhost:5173` (proxies `/api` automatically to FastAPI on port 8000).
