import json
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from backend.app.models.models import (
    User, Syllabus, SyllabusChunk, QuestionBank, Question, PaperTemplate, GeneratedPaper, AuditLog
)
from backend.app.core.security import get_password_hash
from backend.app.services.rag_engine import RAGEngine

def seed_initial_data(db: Session):
    """Initializes rich seed data including users, syllabus, question banks, and templates."""
    
    # 1. Users
    admin_user = db.query(User).filter(User.username == "admin").first()
    if not admin_user:
        admin_user = User(
            username="admin",
            email="admin@university.edu",
            hashed_password=get_password_hash("admin123"),
            full_name="Dr. Arthur Vance (Dean/Administrator)",
            role="administrator",
            department="Academic Affairs & Examination Branch"
        )
        db.add(admin_user)

    setter_user = db.query(User).filter(User.username == "prof_sharma").first()
    if not setter_user:
        setter_user = User(
            username="prof_sharma",
            email="sharma@university.edu",
            hashed_password=get_password_hash("setter123"),
            full_name="Prof. Rajesh Sharma (Paper Setter)",
            role="paper_setter",
            department="Computer Science & Engineering"
        )
        db.add(setter_user)

    moderator_user = db.query(User).filter(User.username == "dr_kapoor").first()
    if not moderator_user:
        moderator_user = User(
            username="dr_kapoor",
            email="kapoor@university.edu",
            hashed_password=get_password_hash("moderator123"),
            full_name="Dr. Anita Kapoor (Exam Board Moderator)",
            role="moderator",
            department="Board of Examiners"
        )
        db.add(moderator_user)

    db.commit()
    db.refresh(admin_user)
    db.refresh(setter_user)
    db.refresh(moderator_user)

    # 2. Syllabi
    s_dsa = db.query(Syllabus).filter(Syllabus.course_code == "CS301").first()
    if not s_dsa:
        dsa_units = [
            {
                "unit_num": 1,
                "title": "Linear Data Structures & Arrays",
                "topics": ["Array ADT", "Dynamic Arrays", "Singly & Doubly Linked Lists", "Circular Linked Lists", "Asymptotic Notations (Big-O, Omega, Theta)"],
                "weightage": 20
            },
            {
                "unit_num": 2,
                "title": "Stacks, Queues and Recursion",
                "topics": ["Stack ADT", "Infix to Postfix Conversion", "Evaluation of Postfix Expression", "Queue ADT", "Circular Queue", "Priority Queue", "Double Ended Queue (Deque)"],
                "weightage": 20
            },
            {
                "unit_num": 3,
                "title": "Trees & Binary Search Trees",
                "topics": ["Binary Tree Traversals (Inorder, Preorder, Postorder)", "Binary Search Tree Operations", "AVL Trees & Balance Factors", "Red-Black Trees", "B-Trees & B+ Trees"],
                "weightage": 20
            },
            {
                "unit_num": 4,
                "title": "Graphs & Path Algorithms",
                "topics": ["Graph Representations (Adjacency Matrix, List)", "Breadth First Search (BFS)", "Depth First Search (DFS)", "Dijkstra's Shortest Path", "Bellman-Ford Algorithm", "Prim's & Kruskal's Minimum Spanning Tree"],
                "weightage": 20
            },
            {
                "unit_num": 5,
                "title": "Sorting, Searching & Hashing",
                "topics": ["Divide and Conquer (Merge Sort, Quick Sort)", "Heap Sort", "Hash Functions", "Collision Resolution (Chaining, Open Addressing, Linear Probing)", "Bloom Filters"],
                "weightage": 20
            }
        ]
        raw_dsa = """
COURSE: CS301 DATA STRUCTURES & ALGORITHMS
UNIT I: Linear Data Structures & Arrays: Array ADT, Dynamic Arrays, Singly & Doubly Linked Lists, Circular Linked Lists, Asymptotic Notations (Big-O, Omega, Theta).
UNIT II: Stacks, Queues and Recursion: Stack ADT, Infix to Postfix Conversion, Evaluation of Postfix Expression, Queue ADT, Circular Queue, Priority Queue, Double Ended Queue.
UNIT III: Trees & Binary Search Trees: Binary Tree Traversals, Binary Search Tree Operations, AVL Trees & Balance Factors, Red-Black Trees, B-Trees & B+ Trees.
UNIT IV: Graphs & Path Algorithms: Graph Representations, BFS, DFS, Dijkstra's Shortest Path, Bellman-Ford Algorithm, Prim's and Kruskal's MST.
UNIT V: Sorting, Searching & Hashing: Merge Sort, Quick Sort, Heap Sort, Hash Functions, Collision Resolution, Chaining, Open Addressing.
"""
        s_dsa = Syllabus(
            title="Data Structures and Algorithms Syllabus",
            course_code="CS301",
            course_name="Data Structures and Algorithms",
            department="Computer Science & Engineering",
            semester="Semester III",
            academic_year="2026-2027",
            raw_text=raw_dsa.strip(),
            units_json=json.dumps(dsa_units),
            created_by=setter_user.id
        )
        db.add(s_dsa)
        db.commit()
        db.refresh(s_dsa)

        # Generate RAG chunks
        chunks = RAGEngine.chunk_syllabus(dsa_units)
        for c in chunks:
            chunk_rec = SyllabusChunk(
                syllabus_id=s_dsa.id,
                unit_number=c["unit_number"],
                unit_title=c["unit_title"],
                topic=c["topic"],
                content=c["content"],
                keywords=c["keywords"]
            )
            db.add(chunk_rec)
        db.commit()

    s_dbms = db.query(Syllabus).filter(Syllabus.course_code == "CS402").first()
    if not s_dbms:
        dbms_units = [
            {
                "unit_num": 1,
                "title": "Relational Data Model & SQL",
                "topics": ["ER Modeling", "Relational Algebra", "Tuple Relational Calculus", "Advanced SQL Joins", "Subqueries & Aggregations"],
                "weightage": 20
            },
            {
                "unit_num": 2,
                "title": "Relational Database Design & Normalization",
                "topics": ["Functional Dependencies", "Armstrong's Axioms", "First Normal Form (1NF)", "Second Normal Form (2NF)", "Third Normal Form (3NF)", "Boyce-Codd Normal Form (BCNF)", "Lossless Join Decomposition"],
                "weightage": 20
            },
            {
                "unit_num": 3,
                "title": "Transaction Processing & Concurrency Control",
                "topics": ["ACID Properties", "Serializability (Conflict and View)", "Two-Phase Locking (2PL)", "Timestamp Ordering", "Deadlock Detection & Prevention", "Log-based Recovery"],
                "weightage": 20
            },
            {
                "unit_num": 4,
                "title": "Storage, Indexing & Query Processing",
                "topics": ["B+ Tree Indexing", "Hash Indexing", "Query Optimization", "Cost-based Evaluation", "External Merge Sort"],
                "weightage": 20
            },
            {
                "unit_num": 5,
                "title": "Distributed Databases & NoSQL",
                "topics": ["CAP Theorem", "Distributed Transactions & 2PC", "Document Stores (MongoDB)", "Key-Value Stores", "Columnar Databases"],
                "weightage": 20
            }
        ]
        s_dbms = Syllabus(
            title="Database Management Systems Syllabus",
            course_code="CS402",
            course_name="Database Management Systems",
            department="Computer Science & Engineering",
            semester="Semester IV",
            academic_year="2026-2027",
            raw_text="UNIT I: Relational Data Model & SQL\nUNIT II: Normalization & Functional Dependencies\nUNIT III: Transactions & Concurrency Control\nUNIT IV: Storage & B+ Tree Indexing\nUNIT V: Distributed Databases & NoSQL",
            units_json=json.dumps(dbms_units),
            created_by=setter_user.id
        )
        db.add(s_dbms)
        db.commit()
        db.refresh(s_dbms)

        chunks = RAGEngine.chunk_syllabus(dbms_units)
        for c in chunks:
            db.add(SyllabusChunk(
                syllabus_id=s_dbms.id,
                unit_number=c["unit_number"],
                unit_title=c["unit_title"],
                topic=c["topic"],
                content=c["content"],
                keywords=c["keywords"]
            ))
        db.commit()

    # 3. Question Bank & Questions
    qb_dsa = db.query(QuestionBank).filter(QuestionBank.course_code == "CS301").first()
    if not qb_dsa:
        qb_dsa = QuestionBank(
            name="CS301 Master Question Bank",
            course_code="CS301",
            department="Computer Science & Engineering",
            description="Verified bank of algorithmic questions aligned to Bloom's Revised Taxonomy.",
            created_by=setter_user.id
        )
        db.add(qb_dsa)
        db.commit()
        db.refresh(qb_dsa)

        sample_questions = [
            # Unit 1
            ("CS301", 1, "Asymptotic Notations", "Define Big-O notation and explain how it characterizes the upper bound of an algorithm's running time.", "Short", 2, "Easy", "Remember"),
            ("CS301", 1, "Singly & Doubly Linked Lists", "Differentiate between Singly Linked List and Doubly Linked List in terms of memory overhead and traversal flexibility.", "Short", 2, "Easy", "Understand"),
            ("CS301", 1, "Dynamic Arrays", "Analyze the amortized time complexity of resizing operations in dynamic arrays (geometric expansion vs arithmetic expansion).", "Short", 5, "Medium", "Analyze"),
            # Unit 2
            ("CS301", 2, "Stack ADT", "State two real-world computer systems applications where the Stack data structure is fundamentally indispensable.", "Short", 2, "Easy", "Remember"),
            ("CS301", 2, "Infix to Postfix Conversion", "Convert the given infix expression into postfix using stack evaluation: (A + B) * (C - D) / (E ^ F). Show stepwise stack trace.", "Short", 6, "Medium", "Apply"),
            ("CS301", 2, "Circular Queue", "Explain how circular queues overcome the limitation of linear array queue space wastage. Provide enqueue and dequeue algorithms.", "Short", 6, "Medium", "Understand"),
            # Unit 3
            ("CS301", 3, "Binary Search Tree Operations", "Define a Binary Search Tree (BST). State the time complexity of searching an element in balanced vs degenerate BST.", "Short", 2, "Easy", "Understand"),
            ("CS301", 3, "AVL Trees & Balance Factors", "Explain the four rotation mechanisms (LL, RR, LR, RL) used in AVL trees with before-and-after tree diagrams.", "Long", 10, "Hard", "Apply"),
            ("CS301", 3, "Red-Black Trees", "List the five core invariant properties of Red-Black Trees. Prove that the height of a Red-Black tree is at most 2 log(n+1).", "Long", 10, "Hard", "Analyze"),
            # Unit 4
            ("CS301", 4, "Breadth First Search (BFS)", "What is the time complexity of BFS traversal when represented using (a) Adjacency Matrix and (b) Adjacency List?", "Short", 2, "Easy", "Understand"),
            ("CS301", 4, "Dijkstra's Shortest Path", "Apply Dijkstra's algorithm to compute single-source shortest paths from vertex A in a directed weighted graph. Trace priority queue states.", "Long", 10, "Hard", "Apply"),
            ("CS301", 4, "Prim's & Kruskal's MST", "Compare and contrast Prim's and Kruskal's algorithms for finding Minimum Spanning Tree. Which is preferred for dense graphs and why?", "Short", 6, "Medium", "Analyze"),
            # Unit 5
            ("CS301", 5, "Divide and Conquer (Quick Sort)", "Explain the role of pivot selection in Quick Sort. Describe the randomized Quick Sort approach to avoid worst-case O(n^2) behavior.", "Short", 6, "Medium", "Evaluate"),
            ("CS301", 5, "Hash Functions & Collision Resolution", "What is hashing? Explain how open addressing with quadratic probing handles collision compared to separate chaining.", "Short", 6, "Medium", "Understand"),
            ("CS301", 5, "Heap Sort", "Construct a Max-Heap for the sequence [45, 12, 89, 34, 78, 23, 67] and demonstrate the step-by-step extraction phase of Heap Sort.", "Long", 10, "Hard", "Apply")
        ]

        for code, u_num, topic, text, qtype, marks, diff, bloom in sample_questions:
            q = Question(
                question_bank_id=qb_dsa.id,
                syllabus_id=s_dsa.id,
                course_code=code,
                unit_number=u_num,
                topic=topic,
                question_text=text,
                question_type=qtype,
                marks=marks,
                difficulty=diff,
                blooms_level=bloom,
                model_answer=f"Official model answer for {topic}. Covers standard mathematical derivations and illustrations.",
                usage_count=1 if "Dijkstra" in text or "Big-O" in text else 0,
                created_by=setter_user.id
            )
            db.add(q)
        db.commit()

    # 4. Standard Paper Template
    tpl_100 = db.query(PaperTemplate).filter(PaperTemplate.title.like("%100 Marks%")).first()
    if not tpl_100:
        blueprint = [
            {
                "section_id": "A",
                "title": "Part A (Objective & Short Answer)",
                "question_count": 10,
                "marks_per_question": 2,
                "required_count": 10,
                "question_type": "Short",
                "difficulty_split": {"Easy": 6, "Medium": 4, "Hard": 0},
                "blooms_levels": ["Remember", "Understand"],
                "unit_coverage": [1, 2, 3, 4, 5]
            },
            {
                "section_id": "B",
                "title": "Part B (Analytical & Problem Solving)",
                "question_count": 7,
                "marks_per_question": 6,
                "required_count": 5,
                "question_type": "Short",
                "difficulty_split": {"Easy": 1, "Medium": 4, "Hard": 2},
                "blooms_levels": ["Apply", "Analyze"],
                "unit_coverage": [1, 2, 3, 4, 5]
            },
            {
                "section_id": "C",
                "title": "Part C (Comprehensive & System Design)",
                "question_count": 5,
                "marks_per_question": 10,
                "required_count": 5,
                "question_type": "Long",
                "difficulty_split": {"Easy": 0, "Medium": 2, "Hard": 3},
                "blooms_levels": ["Analyze", "Evaluate", "Create"],
                "unit_coverage": [1, 2, 3, 4, 5]
            }
        ]
        tpl_100 = PaperTemplate(
            title="University Standard 100 Marks (3 Hours Blueprint)",
            course_code="CS301",
            total_marks=100,
            duration_minutes=180,
            instructions="1. Part A is compulsory (10 x 2 = 20 Marks).\n2. In Part B, answer any 5 out of 7 questions (5 x 6 = 30 Marks).\n3. In Part C, answer all questions with internal choice (5 x 10 = 50 Marks).\n4. Assume suitable data if necessary.",
            blueprint_json=json.dumps(blueprint),
            created_by=admin_user.id
        )
        db.add(tpl_100)
        db.commit()

    # 5. Preloaded Past Paper (for deduplication cross-referencing)
    past_paper = db.query(GeneratedPaper).filter(GeneratedPaper.title.like("%Mid-Term%")).first()
    if not past_paper and s_dsa:
        sample_past_sections = [
            {
                "section_id": "A",
                "title": "Part A (Short Answer)",
                "marks_per_question": 2,
                "required_count": 5,
                "total_section_marks": 10,
                "questions": [
                    {"q_number": 1, "question_text": "Define Big-O notation and explain how it characterizes the upper bound of an algorithm's running time.", "marks": 2, "blooms_level": "Remember", "difficulty": "Easy", "unit_number": 1, "topic": "Asymptotic Notations"},
                    {"q_number": 2, "question_text": "State two real-world computer systems applications where the Stack data structure is fundamentally indispensable.", "marks": 2, "blooms_level": "Remember", "difficulty": "Easy", "unit_number": 2, "topic": "Stack ADT"},
                    {"q_number": 3, "question_text": "Define a Binary Search Tree (BST). State the time complexity of searching an element in balanced vs degenerate BST.", "marks": 2, "blooms_level": "Understand", "difficulty": "Easy", "unit_number": 3, "topic": "BST Operations"},
                    {"q_number": 4, "question_text": "What is the time complexity of BFS traversal when represented using (a) Adjacency Matrix and (b) Adjacency List?", "marks": 2, "blooms_level": "Understand", "difficulty": "Easy", "unit_number": 4, "topic": "BFS"},
                    {"q_number": 5, "question_text": "What is hashing? Explain how open addressing with quadratic probing handles collision.", "marks": 2, "blooms_level": "Understand", "difficulty": "Easy", "unit_number": 5, "topic": "Hashing"}
                ]
            }
        ]
        past_paper = GeneratedPaper(
            template_id=tpl_100.id if tpl_100 else None,
            syllabus_id=s_dsa.id,
            title="Mid-Term Theory Assessment - Spring 2026",
            course_code="CS301",
            course_name="Data Structures and Algorithms",
            institution_name="NATIONAL INSTITUTE OF TECHNOLOGY & SCIENCE",
            department="Department of Computer Science & Engineering",
            exam_name="Mid-Term Assessment",
            semester="Semester III",
            academic_year="2025-2026",
            date_of_exam="15-Mar-2026",
            total_marks=50,
            duration_minutes=90,
            status="approved",
            moderator_notes="Approved by Board of Examiners without modifications.",
            sections_json=json.dumps(sample_past_sections),
            syllabus_coverage_json=json.dumps({"Unit 1": 20, "Unit 2": 20, "Unit 3": 20, "Unit 4": 20, "Unit 5": 20}),
            difficulty_stats_json=json.dumps({"Easy": 60, "Medium": 40, "Hard": 0}),
            blooms_stats_json=json.dumps({"Remember": 40, "Understand": 60}),
            duplicate_risk_score=0.0,
            diversity_score=100.0,
            created_by=setter_user.id,
            approved_by=moderator_user.id
        )
        db.add(past_paper)
        db.commit()

    # 6. Audit log entry
    initial_log = db.query(AuditLog).first()
    if not initial_log:
        db.add(AuditLog(
            user_id=admin_user.id,
            username="admin",
            role="administrator",
            action="SYSTEM_INIT",
            entity_type="system",
            entity_id="1",
            details="Database initialized with default syllabi, users, question banks, and blueprints.",
            ip_address="127.0.0.1"
        ))
        db.commit()
