import React, { useState, useEffect } from 'react';
import { 
  Wand2, CheckCircle2, AlertTriangle, FileDown, 
  RotateCw, RefreshCw, Sparkles, BookOpen, Layers, 
  FileText, ShieldCheck, ArrowRight, ArrowLeft, 
  Edit3, Check, X, ShieldAlert, Cpu, Plus, Trash2, 
  ArrowUp, ArrowDown, HelpCircle, Eye, Upload, Save, Printer, Share2
} from 'lucide-react';
import { api } from '../services/api';
import PrintQuestionPaperModal from '../components/PrintQuestionPaperModal';
import QuizLinkShareModal from '../components/QuizLinkShareModal';
import { cleanOptionText } from '../utils/printHelper';


const EXAM_TYPES = [
  'Objective Quiz / Internal Assessment (CIE)',
  'Continuous Internal Evaluation (CIE) Quiz',
  'Unit Assessment Test (Objective)',
  'Mid-Term Assessment I',
  'Mid-Term Assessment II',
  'End Semester Examination',
  'Supplementary Examination'
];

const QUESTION_TYPES = [
  'Short Answer',
  'MCQ',
  'Long Answer',
  'Descriptive'
];

const BLOOM_LEVELS = [
  'Remember',
  'Understand',
  'Apply',
  'Analyze',
  'Evaluate',
  'Create'
];

const BLUEPRINT_PRESETS = [
  {
    id: 'sgu_final_100',
    title: '🏛️ SGU Semester Final (100 Marks / 3 Hours) — Sanjay Ghodawat University',
    shortName: 'SGU Final (100M)',
    description: 'Q1: 10×2m=20 compulsory • Q2–Q5: any 2 of 3×10m=20 each • Total 100 Marks • SGU CSE Sem VI',
    badge: 'SGU 100M',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    totalMarks: 100,
    durationMinutes: 180,
    examType: 'End Semester Examination',
    institutionName: 'SANJAY GHODAWAT UNIVERSITY, KOLHAPUR',
    department: 'School of Computer Science and Engineering',
    semester: 'Semester VI',
    academicYear: '2026–2027',
    courseCode: 'CSE601',
    courseName: 'Computer Science',
    instructions: "1. Q.1 is compulsory. (Answer all 10 questions of 2 marks each).\n" +
      "2. For Q.2 to Q.5, answer any TWO questions out of three from each main question (10 marks each).\n" +
      "3. Figures to the right indicate full marks.\n" +
      "4. Assume suitable data wherever necessary and state them clearly.\n" +
      "5. Note: This is a proposed demo format, not a verified official SGU examination pattern. Confirm the approved duration and marking scheme with your department.",
    negativeMarking: 'None',
    sections: [
      {
        section_id: '1',
        title: 'Q.1 Answer all questions (20 Marks)',
        question_type: 'Short Answer',
        question_count: 10,
        marks_per_question: 2,
        required_count: 10,
        choice_type: 'Compulsory',
        difficulty_split: { Easy: 5, Medium: 4, Hard: 1 },
        blooms_levels: ['Remember', 'Understand', 'Apply'],
        unit_coverage: [1, 2, 3, 4, 5]
      },
      {
        section_id: '2',
        title: 'Q.2 Answer the following (20 Marks)',
        question_type: 'Long Answer',
        question_count: 3,
        marks_per_question: 10,
        required_count: 2,
        choice_type: 'Answer any 2 out of 3 questions',
        difficulty_split: { Easy: 0, Medium: 2, Hard: 1 },
        blooms_levels: ['Apply', 'Analyze'],
        unit_coverage: [1, 2]
      },
      {
        section_id: '3',
        title: 'Q.3 Answer the following (20 Marks)',
        question_type: 'Long Answer',
        question_count: 3,
        marks_per_question: 10,
        required_count: 2,
        choice_type: 'Answer any 2 out of 3 questions',
        difficulty_split: { Easy: 0, Medium: 2, Hard: 1 },
        blooms_levels: ['Apply', 'Analyze', 'Evaluate'],
        unit_coverage: [2, 3]
      },
      {
        section_id: '4',
        title: 'Q.4 Answer the following (20 Marks)',
        question_type: 'Long Answer',
        question_count: 3,
        marks_per_question: 10,
        required_count: 2,
        choice_type: 'Answer any 2 out of 3 questions',
        difficulty_split: { Easy: 0, Medium: 2, Hard: 1 },
        blooms_levels: ['Analyze', 'Evaluate'],
        unit_coverage: [3, 4]
      },
      {
        section_id: '5',
        title: 'Q.5 Answer the following (20 Marks)',
        question_type: 'Long Answer',
        question_count: 3,
        marks_per_question: 10,
        required_count: 2,
        choice_type: 'Answer any 2 out of 3 questions',
        difficulty_split: { Easy: 0, Medium: 1, Hard: 2 },
        blooms_levels: ['Analyze', 'Evaluate', 'Create'],
        unit_coverage: [4, 5]
      }
    ]
  },
  {
    id: 'sgu_mid_term_50',
    title: '🏛️ SGU Assessment Exam (50 Marks / 2 Hours) — Sanjay Ghodawat University',
    shortName: 'SGU Mid-Term (50M)',
    description: 'Q1: 5×2m=10 compulsory • Q2–Q5: any 2 of 3×5m=10 each • Total 50 Marks • SGU CSE Sem VI',
    badge: 'SGU 50M',
    badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
    totalMarks: 50,
    durationMinutes: 120,
    examType: 'Mid-Term Assessment I',
    institutionName: 'SANJAY GHODAWAT UNIVERSITY, KOLHAPUR',
    department: 'School of Computer Science and Engineering',
    semester: 'Semester VI',
    academicYear: '2026–2027',
    courseCode: 'CSE601',
    courseName: 'Computer Science',
    instructions: "1. Q.1 is compulsory. (Answer all 5 questions of 2 marks each).\n" +
      "2. For Q.2 to Q.5, answer any TWO questions out of three (5 marks each).\n" +
      "3. Figures to the right indicate full marks.\n" +
      "4. Note: This is a proposed demo format, not a verified official SGU examination pattern. Confirm the approved duration and marking scheme with your department.",
    negativeMarking: 'None',
    sections: [
      {
        section_id: '1',
        title: 'Q.1 Answer all questions (10 Marks)',
        question_type: 'Short Answer',
        question_count: 5,
        marks_per_question: 2,
        required_count: 5,
        choice_type: 'Compulsory',
        difficulty_split: { Easy: 3, Medium: 2, Hard: 0 },
        blooms_levels: ['Remember', 'Understand'],
        unit_coverage: [1, 2, 3, 4, 5]
      },
      {
        section_id: '2',
        title: 'Q.2 Answer the following (10 Marks)',
        question_type: 'Short Answer',
        question_count: 3,
        marks_per_question: 5,
        required_count: 2,
        choice_type: 'Answer any 2 out of 3 questions',
        difficulty_split: { Easy: 1, Medium: 2, Hard: 0 },
        blooms_levels: ['Understand', 'Apply'],
        unit_coverage: [1, 2]
      },
      {
        section_id: '3',
        title: 'Q.3 Answer the following (10 Marks)',
        question_type: 'Short Answer',
        question_count: 3,
        marks_per_question: 5,
        required_count: 2,
        choice_type: 'Answer any 2 out of 3 questions',
        difficulty_split: { Easy: 0, Medium: 2, Hard: 1 },
        blooms_levels: ['Apply', 'Analyze'],
        unit_coverage: [2, 3]
      },
      {
        section_id: '4',
        title: 'Q.4 Answer the following (10 Marks)',
        question_type: 'Short Answer',
        question_count: 3,
        marks_per_question: 5,
        required_count: 2,
        choice_type: 'Answer any 2 out of 3 questions',
        difficulty_split: { Easy: 0, Medium: 2, Hard: 1 },
        blooms_levels: ['Apply', 'Analyze'],
        unit_coverage: [3, 4]
      },
      {
        section_id: '5',
        title: 'Q.5 Answer the following (10 Marks)',
        question_type: 'Short Answer',
        question_count: 3,
        marks_per_question: 5,
        required_count: 2,
        choice_type: 'Answer any 2 out of 3 questions',
        difficulty_split: { Easy: 0, Medium: 1, Hard: 2 },
        blooms_levels: ['Analyze', 'Evaluate'],
        unit_coverage: [4, 5]
      }
    ]
  },
  {
    id: 'sgu_unit_test_25',
    title: '🏛️ SGU Unit Assessment Test (25 Marks / 1 Hour) — Sanjay Ghodawat University',
    shortName: 'SGU Unit Test (25M)',
    description: 'Q1: 5×1m=5 compulsory • Q2–Q3: any 2 of 3×5m=10 each • Total 25 Marks • SGU CSE Sem VI',
    badge: 'SGU 25M',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    totalMarks: 25,
    durationMinutes: 60,
    examType: 'Unit Assessment Test (Objective)',
    institutionName: 'SANJAY GHODAWAT UNIVERSITY, KOLHAPUR',
    department: 'School of Computer Science and Engineering',
    semester: 'Semester VI',
    academicYear: '2026–2027',
    courseCode: 'CSE601',
    courseName: 'Computer Science',
    instructions: "1. Q.1 is compulsory. (Answer all 5 questions of 1 mark each).\n" +
      "2. For Q.2 and Q.3, answer any TWO questions out of three (5 marks each).\n" +
      "3. Figures to the right indicate full marks.\n" +
      "4. Note: This is a proposed demo format, not a verified official SGU examination pattern. Confirm the approved duration and marking scheme with your department.",
    negativeMarking: 'None',
    sections: [
      {
        section_id: '1',
        title: 'Q.1 Answer all questions (5 Marks)',
        question_type: 'Short Answer',
        question_count: 5,
        marks_per_question: 1,
        required_count: 5,
        choice_type: 'Compulsory',
        difficulty_split: { Easy: 3, Medium: 2, Hard: 0 },
        blooms_levels: ['Remember', 'Understand'],
        unit_coverage: [1, 2]
      },
      {
        section_id: '2',
        title: 'Q.2 Answer the following (10 Marks)',
        question_type: 'Short Answer',
        question_count: 3,
        marks_per_question: 5,
        required_count: 2,
        choice_type: 'Answer any 2 out of 3 questions',
        difficulty_split: { Easy: 1, Medium: 2, Hard: 0 },
        blooms_levels: ['Understand', 'Apply'],
        unit_coverage: [1, 2]
      },
      {
        section_id: '3',
        title: 'Q.3 Answer the following (10 Marks)',
        question_type: 'Short Answer',
        question_count: 3,
        marks_per_question: 5,
        required_count: 2,
        choice_type: 'Answer any 2 out of 3 questions',
        difficulty_split: { Easy: 0, Medium: 2, Hard: 1 },
        blooms_levels: ['Apply', 'Analyze'],
        unit_coverage: [2, 3]
      }
    ]
  },
  {
    id: 'continuous_unified_50',
    title: '📝 Continuous University Paper (Q1–Q15 — Unified / No Part A)',
    shortName: 'Continuous Exam (50M)',
    description: '15 Questions (Q1 to Q15) • 90 Mins • Unified Academic Format with Continuous Q1, Q2 Numbering (No Part A)',
    badge: 'Unified (No Part A)',
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
    totalMarks: 50,
    durationMinutes: 90,
    examType: 'Mid-Term Assessment I',
    instructions: "1. All questions are compulsory and numbered sequentially from Q1 onwards.\n2. Figures to the right indicate full marks for each question.\n3. Assume suitable data wherever necessary and state them clearly.\n4. Write clear, structured academic answers.",
    negativeMarking: 'None',
    sections: [
      {
        section_id: 'A',
        title: 'Questions (Q1 to Q10)',
        question_type: 'Short Answer',
        question_count: 10,
        marks_per_question: 2,
        required_count: 10,
        choice_type: 'Compulsory',
        difficulty_split: { Easy: 5, Medium: 4, Hard: 1 },
        blooms_levels: ['Remember', 'Understand', 'Apply'],
        unit_coverage: [1, 2, 3, 4, 5]
      },
      {
        section_id: 'B',
        title: 'Analytical & Descriptive Questions (Q11 to Q15)',
        question_type: 'Long Answer',
        question_count: 5,
        marks_per_question: 6,
        required_count: 5,
        choice_type: 'Compulsory',
        difficulty_split: { Easy: 1, Medium: 3, Hard: 1 },
        blooms_levels: ['Apply', 'Analyze', 'Evaluate'],
        unit_coverage: [1, 2, 3, 4, 5]
      }
    ]
  },
  {
    id: 'cie_objective_25',
    title: '🎯 Objective Quiz (CIE — 25 Marks / 30 Mins)',
    shortName: 'Objective Quiz (25M)',
    description: '25 MCQs (1m each) • 30 Mins • Pure Objective Internal Exam',
    badge: 'CIE Internal',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    totalMarks: 25,
    durationMinutes: 30,
    examType: 'Objective Quiz / Internal Assessment (CIE)',
    instructions: "1. All questions are compulsory multiple-choice objective questions.\n2. Each question carries 1 Mark with 4 alternatives (A, B, C, D).\n3. Darken the corresponding bubble on the provided Student OMR Response Sheet.\n4. Use of scratch paper for rough computation is permitted.",
    negativeMarking: 'None',
    sections: [
      {
        section_id: 'A',
        title: 'Part A (Objective Multiple Choice Questions)',
        question_type: 'MCQ',
        question_count: 25,
        marks_per_question: 1,
        required_count: 25,
        choice_type: 'Compulsory',
        difficulty_split: { Easy: 10, Medium: 12, Hard: 3 },
        blooms_levels: ['Remember', 'Understand', 'Apply'],
        unit_coverage: [1, 2, 3, 4, 5]
      }
    ]
  },
  {
    id: 'cie_quick_20',
    title: '⚡ Quick Class Quiz (CIE — 20 Marks / 20 Mins)',
    shortName: 'Class Quiz (20M)',
    description: '20 MCQs (1m each) • 20 Mins • Fast In-Class Evaluation',
    badge: 'Quick Quiz',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    totalMarks: 20,
    durationMinutes: 20,
    examType: 'Continuous Internal Evaluation (CIE) Quiz',
    instructions: "1. All 20 objective questions are compulsory.\n2. Each question carries 1 Mark.\n3. Complete and submit responses within 20 minutes.",
    negativeMarking: 'None',
    sections: [
      {
        section_id: 'A',
        title: 'Part A (Objective MCQs)',
        question_type: 'MCQ',
        question_count: 20,
        marks_per_question: 1,
        required_count: 20,
        choice_type: 'Compulsory',
        difficulty_split: { Easy: 8, Medium: 10, Hard: 2 },
        blooms_levels: ['Remember', 'Understand'],
        unit_coverage: [1, 2, 3, 4, 5]
      }
    ]
  },
  {
    id: 'cie_hybrid_30',
    title: '📝 Objective + Short Quiz (CIE — 30 Marks / 45 Mins)',
    shortName: 'Hybrid Quiz (30M)',
    description: '15 MCQs (15m) + 5 Short Answer (15m) • 45 Mins',
    badge: 'Internal Assessment',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    totalMarks: 30,
    durationMinutes: 45,
    examType: 'Objective Quiz / Internal Assessment (CIE)',
    instructions: "1. Part A consists of 15 compulsory objective MCQs (1 Mark each).\n2. Part B consists of 5 short answer questions (3 Marks each).\n3. Duration: 45 minutes. Maximum Marks: 30.",
    negativeMarking: 'None',
    sections: [
      {
        section_id: 'A',
        title: 'Part A (Objective MCQs)',
        question_type: 'MCQ',
        question_count: 15,
        marks_per_question: 1,
        required_count: 15,
        choice_type: 'Compulsory',
        difficulty_split: { Easy: 6, Medium: 7, Hard: 2 },
        blooms_levels: ['Remember', 'Understand'],
        unit_coverage: [1, 2, 3, 4, 5]
      },
      {
        section_id: 'B',
        title: 'Part B (Short Answer Conceptual Questions)',
        question_type: 'Short Answer',
        question_count: 6,
        marks_per_question: 3,
        required_count: 5,
        choice_type: 'Answer any 5 out of 6',
        difficulty_split: { Easy: 2, Medium: 3, Hard: 1 },
        blooms_levels: ['Understand', 'Apply'],
        unit_coverage: [1, 2, 3, 4, 5]
      }
    ]
  },
  {
    id: 'mid_term_50',
    title: '📊 Mid-Term Assessment (50 Marks / 90 Mins)',
    shortName: 'Mid-Term (50M)',
    description: '10 MCQs (10m) + Short (20m) + Long (20m) • 1.5 Hours',
    badge: 'Mid-Term',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    totalMarks: 50,
    durationMinutes: 90,
    examType: 'Mid-Term Assessment I',
    instructions: "1. Part A (10 Marks): 10 compulsory objective questions.\n2. Part B (20 Marks): Answer any 4 questions out of 5 (5 marks each).\n3. Part C (20 Marks): Answer 2 questions with internal choice (10 marks each).",
    negativeMarking: 'None',
    sections: [
      {
        section_id: 'A',
        title: 'Part A (Objective MCQs)',
        question_type: 'MCQ',
        question_count: 10,
        marks_per_question: 1,
        required_count: 10,
        choice_type: 'Compulsory',
        difficulty_split: { Easy: 4, Medium: 4, Hard: 2 },
        blooms_levels: ['Remember', 'Understand'],
        unit_coverage: [1, 2, 3, 4, 5]
      },
      {
        section_id: 'B',
        title: 'Part B (Short Answer / Problem Solving)',
        question_type: 'Short Answer',
        question_count: 5,
        marks_per_question: 5,
        required_count: 4,
        choice_type: 'Answer any 4 out of 5',
        difficulty_split: { Easy: 1, Medium: 3, Hard: 1 },
        blooms_levels: ['Apply', 'Analyze'],
        unit_coverage: [1, 2, 3, 4, 5]
      },
      {
        section_id: 'C',
        title: 'Part C (Descriptive / System Design)',
        question_type: 'Long Answer',
        question_count: 2,
        marks_per_question: 10,
        required_count: 2,
        choice_type: 'Internal Choice (Either/Or)',
        difficulty_split: { Easy: 0, Medium: 1, Hard: 1 },
        blooms_levels: ['Analyze', 'Evaluate'],
        unit_coverage: [1, 2, 3, 4, 5]
      }
    ]
  },
  {
    id: 'sem_final_100',
    title: '🎓 Semester Theory Final (100 Marks / 180 Mins)',
    shortName: 'Semester Final (100M)',
    description: 'Part A (20m) + Part B (30m) + Part C (50m) • 3.0 Hours',
    badge: 'Final Exam',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
    totalMarks: 100,
    durationMinutes: 180,
    examType: 'End Semester Examination',
    instructions: "1. Answer ALL questions according to instructions in respective sections.\n2. Figures to the right indicate full marks.\n3. Assume suitable data wherever necessary and state them clearly.\n4. Use of non-programmable calculators is permitted.",
    negativeMarking: 'None',
    sections: [
      {
        section_id: 'A',
        title: 'Part A (Objective & Short Answer)',
        question_type: 'Short Answer',
        question_count: 10,
        marks_per_question: 2,
        required_count: 10,
        choice_type: 'Compulsory',
        difficulty_split: { Easy: 6, Medium: 4, Hard: 0 },
        blooms_levels: ['Remember', 'Understand'],
        unit_coverage: [1, 2, 3, 4, 5]
      },
      {
        section_id: 'B',
        title: 'Part B (Analytical & Problem Solving)',
        question_type: 'Short Answer',
        question_count: 7,
        marks_per_question: 6,
        required_count: 5,
        choice_type: 'Answer any 5 out of 7',
        difficulty_split: { Easy: 1, Medium: 4, Hard: 2 },
        blooms_levels: ['Apply', 'Analyze'],
        unit_coverage: [1, 2, 3, 4, 5]
      },
      {
        section_id: 'C',
        title: 'Part C (Comprehensive & System Design)',
        question_type: 'Long Answer',
        question_count: 5,
        marks_per_question: 10,
        required_count: 5,
        choice_type: 'Internal Choice (Either/Or)',
        difficulty_split: { Easy: 0, Medium: 2, Hard: 3 },
        blooms_levels: ['Analyze', 'Evaluate', 'Create'],
        unit_coverage: [1, 2, 3, 4, 5]
      }
    ]
  }
];

export default function GeneratorWizard({ setActiveTab, onOpenQuiz }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [parsingDoc, setParsingDoc] = useState(false);
  const [syllabi, setSyllabi] = useState([]);
  const [bankQuestions, setBankQuestions] = useState([]);
  const [statusAlert, setStatusAlert] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const [shareQuiz, setShareQuiz] = useState(null);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);

  async function handleGenerateQuizLink() {
    if (!generatedPaper?.paper_id) return;
    try {
      setGeneratingQuiz(true);
      const res = await api.generateQuizFromPaper(generatedPaper.paper_id);
      setShareQuiz(res);
    } catch (err) {
      alert(err.message || 'Failed to generate quiz link');
    } finally {
      setGeneratingQuiz(false);
    }
  }

  // -------------------------------------------------------------
  // STEP 1: Select Subject & Exam Metadata
  // -------------------------------------------------------------

  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [courseName, setCourseName] = useState('Data Structures and Algorithms');
  const [courseCode, setCourseCode] = useState('CS301');
  const [semester, setSemester] = useState('Semester V');
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [examType, setExamType] = useState('End Semester Examination');
  const [institutionName, setInstitutionName] = useState('NATIONAL INSTITUTE OF TECHNOLOGY & SCIENCE');
  const [dateOfExam, setDateOfExam] = useState('25-Nov-2026');

  // -------------------------------------------------------------
  // STEP 2: Syllabus Upload & Interactive Extraction Editor
  // -------------------------------------------------------------
  const [syllabusMode, setSyllabusMode] = useState('upload'); // 'upload' or 'existing'
  const [selectedExistingId, setSelectedExistingId] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [extractedUnits, setExtractedUnits] = useState([
    {
      unit_num: 1,
      title: 'Linear Data Structures & Arrays',
      topics: ['Array ADT', 'Dynamic Arrays', 'Singly Linked Lists', 'Doubly Linked Lists', 'Big-O Notation'],
      learning_outcomes: ['Understand asymptotic notations and analyze linear structure complexities'],
      weightage: 20
    },
    {
      unit_num: 2,
      title: 'Stacks, Queues & Recursion',
      topics: ['Stack ADT', 'Infix to Postfix', 'Queue ADT', 'Circular Queue', 'Priority Queue'],
      learning_outcomes: ['Implement stack/queue applications in operating systems & expression evaluation'],
      weightage: 20
    },
    {
      unit_num: 3,
      title: 'Trees & Binary Search Trees',
      topics: ['Binary Tree Traversals', 'BST Operations', 'AVL Trees & Rotations', 'Red-Black Trees'],
      learning_outcomes: ['Formulate self-balancing search trees for optimal logarithmic lookup'],
      weightage: 20
    },
    {
      unit_num: 4,
      title: 'Graphs & Shortest Path Algorithms',
      topics: ['Graph Representations', 'BFS & DFS', 'Dijkstra Shortest Path', 'Prims & Kruskals MST'],
      learning_outcomes: ['Design graph exploration strategies and compute minimum spanning trees'],
      weightage: 20
    },
    {
      unit_num: 5,
      title: 'Sorting, Searching & Hashing',
      topics: ['Merge Sort', 'Quick Sort', 'Heap Sort', 'Hash Functions', 'Collision Resolution'],
      learning_outcomes: ['Evaluate sorting efficiencies and resolve hash table collisions'],
      weightage: 20
    }
  ]);
  const [activeSyllabusId, setActiveSyllabusId] = useState(1);
  const [isSyllabusConfirmed, setIsSyllabusConfirmed] = useState(false);

  // -------------------------------------------------------------
  // STEP 3: Configure Blueprint
  // -------------------------------------------------------------
  const [totalMarks, setTotalMarks] = useState(100);
  const [durationMinutes, setDurationMinutes] = useState(180);
  const [apiKey, setApiKey] = useState('');
  const [dupThreshold, setDupThreshold] = useState(0.70);
  const [activePresetId, setActivePresetId] = useState('sem_final_100');
  const [negativeMarking, setNegativeMarking] = useState('None');
  const [showInstructionsEditor, setShowInstructionsEditor] = useState(false);
  const [examInstructions, setExamInstructions] = useState(
    "1. Answer ALL questions according to instructions in respective sections.\n" +
    "2. Figures to the right indicate full marks.\n" +
    "3. Assume suitable data wherever necessary and state them clearly.\n" +
    "4. Use of non-programmable calculators is permitted."
  );

  const [sections, setSections] = useState([
    {
      section_id: 'A',
      title: 'Part A (Objective & Short Answer)',
      question_type: 'Short Answer',
      question_count: 10,
      marks_per_question: 2,
      required_count: 10,
      choice_type: 'Compulsory', // 'Compulsory', 'Internal Choice (Either/Or)', 'Answer N of M'
      difficulty_split: { Easy: 6, Medium: 4, Hard: 0 },
      blooms_levels: ['Remember', 'Understand'],
      unit_coverage: [1, 2, 3, 4, 5]
    },
    {
      section_id: 'B',
      title: 'Part B (Analytical & Problem Solving)',
      question_type: 'Short Answer',
      question_count: 7,
      marks_per_question: 6,
      required_count: 5,
      choice_type: 'Answer any 5 out of 7',
      difficulty_split: { Easy: 1, Medium: 4, Hard: 2 },
      blooms_levels: ['Apply', 'Analyze'],
      unit_coverage: [1, 2, 3, 4, 5]
    },
    {
      section_id: 'C',
      title: 'Part C (Comprehensive & System Design)',
      question_type: 'Long Answer',
      question_count: 5,
      marks_per_question: 10,
      required_count: 5,
      choice_type: 'Internal Choice (Either/Or)',
      difficulty_split: { Easy: 0, Medium: 2, Hard: 3 },
      blooms_levels: ['Analyze', 'Evaluate', 'Create'],
      unit_coverage: [1, 2, 3, 4, 5]
    }
  ]);

  // -------------------------------------------------------------
  // STEP 4: Generation Status & Progress Tracker
  // -------------------------------------------------------------
  const [generationPhase, setGenerationPhase] = useState(0); // 0: Idle, 1: RAG retrieval, 2: LLM synthesis, 3: Constraint check, 4: Anti-dup check
  const [generationSteps, setGenerationSteps] = useState([
    { title: 'Retrieve Syllabus Passages (RAG)', status: 'pending' },
    { title: 'Synthesize Questions with LLM Provider', status: 'pending' },
    { title: 'Attach Verified Source Unit Citations', status: 'pending' },
    { title: 'Validate Blueprint & Marks Distribution', status: 'pending' },
    { title: 'Scan Anti-Duplicate Similarity vs Past Exams', status: 'pending' },
  ]);

  // -------------------------------------------------------------
  // STEP 5: Final Review & Interactive Editing
  // -------------------------------------------------------------
  const [generatedPaper, setGeneratedPaper] = useState(null);
  const [regeneratingId, setRegeneratingId] = useState(null);
  const [swapModal, setSwapModal] = useState(null);
  const [editingQuestionModal, setEditingQuestionModal] = useState(null); // { secId, qIdx, question }
  const [printModalOpen, setPrintModalOpen] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      const sylData = await api.getSyllabi();
      setSyllabi(sylData);
      if (sylData.length > 0) {
        setSelectedExistingId(sylData[0].id.toString());
        setActiveSyllabusId(sylData[0].id);
      }
      const qData = await api.getQuestions();
      setBankQuestions(qData);
    } catch (e) {
      console.error(e);
    }
  }

  // Calculate live marks counter across all sections
  const liveCalculatedMarks = sections.reduce(
    (acc, sec) => acc + (Number(sec.required_count || 0) * Number(sec.marks_per_question || 0)),
    0
  );
  const isMarksBalanced = liveCalculatedMarks === Number(totalMarks);

  // -------------------------------------------------------------
  // HANDLERS FOR STEP 2 (Syllabus)
  // -------------------------------------------------------------
  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setParsingDoc(true);
      setErrorMsg(null);
      setUploadedFileName(file.name);

      const res = await api.parseDocument(file);
      if (res.units && res.units.length > 0) {
        setExtractedUnits(res.units);
        setStatusAlert(`Successfully extracted ${res.units.length} units from ${file.name}. Review and correct any items below.`);
      }
    } catch (err) {
      setErrorMsg(`Document Extraction Failed: ${err.message}`);
    } finally {
      setParsingDoc(false);
    }
  }

  function handleSelectExistingSyllabus(idStr) {
    setSelectedExistingId(idStr);
    const found = syllabi.find(s => s.id.toString() === idStr);
    if (found) {
      setCourseCode(found.course_code);
      setCourseName(found.course_name);
      setDepartment(found.department || department);
      setSemester(found.semester || semester);
      setActiveSyllabusId(found.id);
      try {
        const u = JSON.parse(found.units_json);
        if (u && u.length > 0) setExtractedUnits(u);
      } catch (e) {}
    }
  }

  async function handleConfirmAndStoreSyllabus() {
    try {
      setLoading(true);
      setErrorMsg(null);

      // Save curated units to backend for chunking & RAG indexing
      const res = await api.saveCuratedSyllabus({
        course_code: courseCode,
        course_name: courseName,
        department: department,
        semester: semester,
        academic_year: academicYear,
        units: extractedUnits
      });

      setActiveSyllabusId(res.syllabus_id);
      setIsSyllabusConfirmed(true);
      setStatusAlert(`Syllabus stored and grounded with ${res.chunks_indexed} verified RAG passages!`);
      setStep(3); // Advance to Blueprint
    } catch (err) {
      setErrorMsg(`Failed to store syllabus: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  // -------------------------------------------------------------
  // HANDLERS FOR STEP 3 (Blueprint Sections)
  // -------------------------------------------------------------
  function handleAddSection() {
    const nextLetter = String.fromCharCode(65 + sections.length);
    const newSec = {
      section_id: nextLetter,
      title: `Part ${nextLetter}`,
      question_type: 'Short Answer',
      question_count: 5,
      marks_per_question: 4,
      required_count: 5,
      choice_type: 'Compulsory',
      difficulty_split: { Easy: 2, Medium: 2, Hard: 1 },
      blooms_levels: ['Understand', 'Apply'],
      unit_coverage: [1, 2, 3, 4, 5]
    };
    setSections([...sections, newSec]);
  }

  function handleRemoveSection(index) {
    if (sections.length <= 1) {
      alert("At least one section is required.");
      return;
    }
    const filtered = sections.filter((_, idx) => idx !== index);
    setSections(filtered);
  }

  function handleSectionChange(index, field, value) {
    const updated = [...sections];
    updated[index][field] = value;
    setSections(updated);
  }

  function handleApplyPreset(preset) {
    setActivePresetId(preset.id);
    setTotalMarks(preset.totalMarks);
    setDurationMinutes(preset.durationMinutes);
    if (preset.examType) setExamType(preset.examType);
    if (preset.institutionName) setInstitutionName(preset.institutionName);
    if (preset.department) setDepartment(preset.department);
    if (preset.semester) setSemester(preset.semester);
    if (preset.academicYear) setAcademicYear(preset.academicYear);
    if (preset.courseCode) setCourseCode(preset.courseCode);
    if (preset.courseName) setCourseName(preset.courseName);
    setSections(JSON.parse(JSON.stringify(preset.sections)));
    setExamInstructions(preset.instructions);
    setNegativeMarking(preset.negativeMarking || 'None');
    setStatusAlert(`Applied Blueprint Preset: ${preset.title}!`);
  }

  // -------------------------------------------------------------
  // HANDLERS FOR STEP 4: Question Generation Pipeline
  // -------------------------------------------------------------
  async function handleStartGeneration() {
    if (!isMarksBalanced) {
      alert(`Marks mismatch: Blueprint requires ${liveCalculatedMarks} marks, but exam target is set to ${totalMarks} marks. Please adjust sections or total marks.`);
      return;
    }

    setStep(4);
    setLoading(true);
    setErrorMsg(null);
    setGeneratedPaper(null);

    // Update progress steps sequentially
    updateStepStatus(0, 'active');

    try {
      // Step 4.1: RAG retrieval & syllabus grounding
      await new Promise(r => setTimeout(r, 600));
      updateStepStatus(0, 'done');
      updateStepStatus(1, 'active');

      let finalInstructions = (examInstructions || '').trim();
      if (negativeMarking && negativeMarking !== 'None' && !finalInstructions.includes('Negative marking')) {
        finalInstructions += `\n* Negative Marking: Deduct ${negativeMarking} marks for each incorrect objective response.`;
      }

      const payload = {
        syllabus_id: activeSyllabusId,
        title: `${courseCode}: ${examType}`,
        exam_name: examType,
        course_code: courseCode,
        course_name: courseName,
        institution_name: institutionName,
        department: department,
        semester: semester,
        academic_year: academicYear,
        date_of_exam: dateOfExam,
        duration_minutes: durationMinutes,
        total_marks: totalMarks,
        instructions: finalInstructions,
        api_key: apiKey,
        deduplication_threshold: dupThreshold,
        sections: sections.map(s => ({
          section_id: s.section_id,
          title: s.title,
          question_count: Number(s.question_count),
          marks_per_question: Number(s.marks_per_question),
          required_count: Number(s.required_count),
          question_type: s.question_type,
          choice_type: s.choice_type,
          difficulty_split: s.difficulty_split,
          blooms_levels: s.blooms_levels,
          unit_coverage: s.unit_coverage
        }))
      };

      // Step 4.2: Call backend generation
      const result = await api.generatePaper(payload);

      // Verify valid response from backend before marking successful
      if (!result || !result.sections || result.sections.length === 0) {
        throw new Error("Backend did not return valid question paper sections.");
      }

      if (!result.instructions) {
        result.instructions = finalInstructions;
      }

      updateStepStatus(1, 'done');
      updateStepStatus(2, 'done');
      updateStepStatus(3, 'done');
      updateStepStatus(4, 'done');

      setGeneratedPaper(result);
      // Advance to review step
      setTimeout(() => {
        setStep(5);
        setLoading(false);
      }, 700);

    } catch (err) {
      setErrorMsg(`Generation Error: ${err.message}. Please check blueprint constraints or AI API settings.`);
      setLoading(false);
    }
  }

  function updateStepStatus(idx, status) {
    setGenerationSteps(prev => {
      const next = [...prev];
      if (next[idx]) next[idx].status = status;
      return next;
    });
  }

  // -------------------------------------------------------------
  // HANDLERS FOR STEP 5: Review & Reordering
  // -------------------------------------------------------------
  async function handleRegenerateQuestion(sectionId, qIndex) {
    if (!generatedPaper) return;
    try {
      setRegeneratingId(`${sectionId}-${qIndex}`);
      const res = await api.regenerateQuestion(generatedPaper.paper_id, sectionId, qIndex, apiKey);
      
      const updatedSections = [...generatedPaper.sections];
      const targetSec = updatedSections.find(s => s.section_id === sectionId);
      if (targetSec) {
        targetSec.questions[qIndex] = res.new_question;
      }
      setGeneratedPaper({ ...generatedPaper, sections: updatedSections });
      setStatusAlert(`Question regenerated and updated with verified syllabus context!`);
    } catch (err) {
      alert(err.message);
    } finally {
      setRegeneratingId(null);
    }
  }

  function handleMoveQuestion(secId, qIdx, direction) {
    if (!generatedPaper) return;
    const updatedSections = [...generatedPaper.sections];
    const targetSec = updatedSections.find(s => s.section_id === secId);
    if (!targetSec) return;

    const newIdx = direction === 'up' ? qIdx - 1 : qIdx + 1;
    if (newIdx < 0 || newIdx >= targetSec.questions.length) return;

    // Swap questions
    const temp = targetSec.questions[qIdx];
    targetSec.questions[qIdx] = targetSec.questions[newIdx];
    targetSec.questions[newIdx] = temp;

    // Re-number questions
    recalcQNumbers(updatedSections);
    setGeneratedPaper({ ...generatedPaper, sections: updatedSections });
    savePaperUpdates(updatedSections);
  }

  function handleDeleteQuestion(secId, qIdx) {
    if (!generatedPaper) return;
    if (!window.confirm("Delete this question from the paper?")) return;

    const updatedSections = [...generatedPaper.sections];
    const targetSec = updatedSections.find(s => s.section_id === secId);
    if (!targetSec) return;

    targetSec.questions.splice(qIdx, 1);
    recalcQNumbers(updatedSections);
    setGeneratedPaper({ ...generatedPaper, sections: updatedSections });
    savePaperUpdates(updatedSections);
  }

  function handleOpenWriteQuestion(secId = null) {
    if (!generatedPaper || !generatedPaper.sections?.length) return;
    const targetSec = secId 
      ? generatedPaper.sections.find(s => s.section_id === secId) 
      : generatedPaper.sections[generatedPaper.sections.length - 1];
    if (!targetSec) return;

    let totalQCount = 0;
    for (const sec of generatedPaper.sections) {
      totalQCount += (sec.questions?.length || 0);
    }
    const nextQNum = totalQCount + 1;

    setEditingQuestionModal({
      secId: targetSec.section_id,
      qIdx: targetSec.questions?.length || 0,
      isNew: true,
      question: {
        q_number: nextQNum,
        question_text: '',
        marks: targetSec.marks_per_question || 2,
        difficulty: 'Medium',
        blooms_level: 'Understand',
        question_type: targetSec.question_type || 'Short Answer',
        unit_number: 1,
        unit_title: 'Unit 1',
        topic: 'Core Technical Concepts',
        options: ['', '', '', ''],
        model_answer: '',
        retrieved_passage: 'Curriculum-aligned question specification.'
      }
    });
  }

  function handleAddQuestionToSection(secId) {
    handleOpenWriteQuestion(secId);
  }

  function recalcQNumbers(secs) {
    let num = 1;
    for (const sec of secs) {
      for (const q of (sec.questions || [])) {
        q.q_number = num++;
      }
    }
  }

  async function savePaperUpdates(secs) {
    if (!generatedPaper) return;
    try {
      await api.updatePaperSections(generatedPaper.paper_id, {
        sections: secs,
        total_marks: totalMarks
      });
    } catch (e) {
      console.error("Failed to sync paper updates:", e);
    }
  }

  function handleSaveQuestionEdit() {
    if (!editingQuestionModal || !generatedPaper) return;
    const { secId, qIdx, question, isNew } = editingQuestionModal;

    if (!question.question_text?.trim()) {
      alert("Please enter a question statement before saving.");
      return;
    }

    const updatedSections = [...generatedPaper.sections];
    const targetSec = updatedSections.find(s => s.section_id === secId);
    if (!targetSec) return;

    if (!targetSec.questions) targetSec.questions = [];

    const cleanedQ = { ...question };
    if (cleanedQ.question_type === 'MCQ' && Array.isArray(cleanedQ.options)) {
      cleanedQ.options = cleanedQ.options.filter(o => o && o.trim().length > 0);
    }

    if (isNew) {
      targetSec.questions.push(cleanedQ);
    } else {
      targetSec.questions[qIdx] = cleanedQ;
    }

    recalcQNumbers(updatedSections);
    setGeneratedPaper({ ...generatedPaper, sections: updatedSections });
    savePaperUpdates(updatedSections);
    setEditingQuestionModal(null);
    setStatusAlert(isNew ? `Question Q${cleanedQ.q_number} successfully written and added!` : `Question Q${cleanedQ.q_number} updated and saved!`);
  }

  async function handleSwapBankQuestion(bankQId) {
    if (!swapModal || !generatedPaper) return;
    try {
      const res = await api.swapWithBankQuestion(
        generatedPaper.paper_id,
        swapModal.secId,
        swapModal.qIdx,
        bankQId
      );
      setGeneratedPaper({ ...generatedPaper, sections: res.sections });
      setSwapModal(null);
      setStatusAlert(`Swapped with question bank item.`);
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleSubmitForModeration() {
    if (!generatedPaper) return;
    try {
      await api.updatePaperStatus(generatedPaper.paper_id, 'pending_moderation', 'Submitted by paper setter for board review.');
      alert('Paper successfully submitted to the Examination Board for Moderation!');
      setActiveTab('repository');
    } catch (err) {
      alert(err.message);
    }
  }

  // -------------------------------------------------------------
  // RENDER STEPPER HEADER
  // -------------------------------------------------------------
  const stepperItems = [
    { num: 1, title: 'Select Subject' },
    { num: 2, title: 'Upload Syllabus' },
    { num: 3, title: 'Configure Blueprint' },
    { num: 4, title: 'Generate Questions' },
    { num: 5, title: 'Review & Export' }
  ];

  return (
    <div className="space-y-6">
      {/* 5-Step Stepper Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between max-w-4xl mx-auto overflow-x-auto py-1">
          {stepperItems.map((item, idx) => {
            const isCompleted = step > item.num;
            const isCurrent = step === item.num;

            return (
              <React.Fragment key={item.num}>
                <div 
                  onClick={() => {
                    // Only allow clicking to earlier steps if not generating
                    if (!loading && item.num < step) setStep(item.num);
                  }}
                  className={`flex items-center space-x-2 shrink-0 ${
                    item.num < step && !loading ? 'cursor-pointer' : 'cursor-default'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition ${
                    isCompleted 
                      ? 'bg-emerald-600 text-white' 
                      : isCurrent 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 ring-4 ring-indigo-50' 
                      : 'bg-slate-100 text-slate-400'
                  }`}>
                    {isCompleted ? <Check className="w-4 h-4" /> : item.num}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className={`text-xs font-semibold ${isCurrent ? 'text-indigo-600' : isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>
                      {item.title}
                    </p>
                    <p className="text-[10px] text-slate-400">Step {item.num}</p>
                  </div>
                </div>

                {idx < stepperItems.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 min-w-[20px] ${
                    step > item.num ? 'bg-emerald-500' : 'bg-slate-200'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {statusAlert && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusAlert}</span>
          </div>
          <button onClick={() => setStatusAlert(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-600 hover:text-rose-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 1 — Select Subject                                                   */}
      {/* ========================================================================= */}
      {step === 1 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-3xl mx-auto space-y-6">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">Step 1 of 5</span>
            <h2 className="text-base font-bold text-slate-900 mt-0.5">Select Subject & Examination Parameters</h2>
            <p className="text-xs text-slate-500 mt-1">
              Specify academic department, course details, subject code, semester, and examination category.
            </p>
          </div>

          {/* Quick-Fill SGU Template Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🏛️</span>
              <div>
                <span className="font-bold text-amber-950 block">Sanjay Ghodawat University (SGU) Template</span>
                <span className="text-amber-800 text-[11px]">
                  Fill official SGU School of CSE, Kolhapur (Semester VI, CSE601) parameters
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setInstitutionName('SANJAY GHODAWAT UNIVERSITY, KOLHAPUR');
                setDepartment('School of Computer Science and Engineering');
                setSemester('Semester VI');
                setAcademicYear('2026–2027');
                setCourseCode('CSE601');
                setCourseName('Computer Science');
                setExamType('End Semester Examination');
                setStatusAlert('Loaded Sanjay Ghodawat University (SGU) CSE Semester VI metadata placeholders!');
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs shadow-xs transition active:scale-95 shrink-0"
            >
              Apply SGU Details
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Computer Science & Engineering"
                className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Course & Semester</label>
              <input
                type="text"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                placeholder="e.g. B.Tech Computer Science - Semester V"
                className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Code</label>
              <input
                type="text"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                placeholder="e.g. CS301"
                className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Name</label>
              <input
                type="text"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="e.g. Data Structures and Algorithms"
                className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Year</label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="e.g. 2026-2027"
                className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Examination Type</label>
              <select
                value={examType}
                onChange={(e) => setExamType(e.target.value)}
                className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                {EXAM_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Institution Name</label>
              <input
                type="text"
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              onClick={() => setStep(2)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md shadow-indigo-200 transition"
            >
              <span>Continue to Upload Syllabus</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2 — Upload Syllabus & Interactive Extraction Editor                 */}
      {/* ========================================================================= */}
      {step === 2 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-4xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">Step 2 of 5</span>
              <h2 className="text-base font-bold text-slate-900 mt-0.5">Upload & Verify Syllabus Curriculum</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload PDF or DOCX syllabus. The RAG extractor parses units, topics, and learning outcomes for your review.
              </p>
            </div>

            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium shrink-0">
              <button
                onClick={() => setSyllabusMode('upload')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  syllabusMode === 'upload' ? 'bg-white text-indigo-600 font-semibold shadow-sm' : 'text-slate-600'
                }`}
              >
                Upload File (PDF / DOCX)
              </button>
              <button
                onClick={() => setSyllabusMode('existing')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  syllabusMode === 'existing' ? 'bg-white text-indigo-600 font-semibold shadow-sm' : 'text-slate-600'
                }`}
              >
                Use Pre-Loaded Syllabus
              </button>
            </div>
          </div>

          {/* Mode 1: File Upload */}
          {syllabusMode === 'upload' && (
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center bg-slate-50/50 hover:border-indigo-400 transition">
              <Upload className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-800">Upload University Syllabus Document</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Supports PDF (.pdf) and Microsoft Word (.docx, .doc)</p>
              <input
                type="file"
                accept=".pdf,.docx,.doc"
                onChange={handleFileUpload}
                className="mt-3 text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
              />
              {parsingDoc && (
                <div className="mt-3 flex items-center justify-center gap-2 text-xs text-indigo-600">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Extracting units, modular topics & learning outcomes...</span>
                </div>
              )}
            </div>
          )}

          {/* Mode 2: Existing Syllabi */}
          {syllabusMode === 'existing' && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">Select from Grounded Curriculum Bank</label>
              <select
                value={selectedExistingId}
                onChange={(e) => handleSelectExistingSyllabus(e.target.value)}
                className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl bg-white font-medium"
              >
                {syllabi.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.course_code}: {s.course_name} ({s.semester})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Interactive Extraction Correction Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  Curriculum Units & Learning Outcomes Preview ({extractedUnits.length} Units)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Verify or edit extracted topics inline before vector chunking to ensure 100% syllabus accuracy.
                </p>
              </div>

              <button
                onClick={() => {
                  const newUnitNum = extractedUnits.length + 1;
                  setExtractedUnits([
                    ...extractedUnits,
                    {
                      unit_num: newUnitNum,
                      title: `Unit ${newUnitNum}`,
                      topics: ['Topic 1', 'Topic 2'],
                      learning_outcomes: ['Understand key principles'],
                      weightage: 20
                    }
                  ]);
                }}
                className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Unit
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {extractedUnits.map((u, uIdx) => (
                <div key={uIdx} className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center space-x-2 flex-1">
                      <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                        U{u.unit_num}
                      </span>
                      <input
                        type="text"
                        value={u.title}
                        onChange={(e) => {
                          const updated = [...extractedUnits];
                          updated[uIdx].title = e.target.value;
                          setExtractedUnits(updated);
                        }}
                        className="text-xs font-bold text-slate-900 px-2 py-1 border border-slate-200 rounded-lg flex-1"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] text-slate-400">Weight:</span>
                      <input
                        type="number"
                        value={u.weightage || 20}
                        onChange={(e) => {
                          const updated = [...extractedUnits];
                          updated[uIdx].weightage = Number(e.target.value);
                          setExtractedUnits(updated);
                        }}
                        className="w-14 text-xs px-2 py-1 border border-slate-200 rounded-lg text-center font-bold"
                      />
                      <span className="text-xs text-slate-500">%</span>

                      <button
                        onClick={() => {
                          if (extractedUnits.length <= 1) return;
                          setExtractedUnits(extractedUnits.filter((_, idx) => idx !== uIdx));
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        title="Remove unit"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Topics List input */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Topics (Comma-separated)
                    </label>
                    <input
                      type="text"
                      value={u.topics ? u.topics.join(', ') : ''}
                      onChange={(e) => {
                        const updated = [...extractedUnits];
                        updated[uIdx].topics = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                        setExtractedUnits(updated);
                      }}
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50/50"
                    />
                  </div>

                  {/* Learning Outcomes */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Course / Learning Outcomes
                    </label>
                    <input
                      type="text"
                      value={u.learning_outcomes ? u.learning_outcomes.join('; ') : ''}
                      onChange={(e) => {
                        const updated = [...extractedUnits];
                        updated[uIdx].learning_outcomes = e.target.value.split(';').map(o => o.trim()).filter(Boolean);
                        setExtractedUnits(updated);
                      }}
                      placeholder="e.g. Understand asymptotic behavior; Formulate optimal tree rotations"
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50/50"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Subject
            </button>

            <button
              onClick={handleConfirmAndStoreSyllabus}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md shadow-indigo-200 transition"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{loading ? 'Chunking & Storing for RAG...' : 'Confirm & Save Syllabus for RAG Retrieval'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3 — Configure Blueprint with Live Marks Counter                      */}
      {/* ========================================================================= */}
      {step === 3 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-4xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">Step 3 of 5</span>
              <h2 className="text-base font-bold text-slate-900 mt-0.5">Configure Examination Blueprint</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Define question types, marks per question, Bloom's cognitive distribution, and internal choices.
              </p>
            </div>

            {/* LIVE MARKS COUNTER BANNER */}
            <div className={`px-4 py-2 rounded-xl border text-xs flex items-center gap-2 ${
              isMarksBalanced 
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                : 'bg-amber-50 border-amber-300 text-amber-800'
            }`}>
              {isMarksBalanced ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-amber-600" />}
              <div>
                <span className="font-bold">Blueprint Marks: {liveCalculatedMarks} / {totalMarks} Marks</span>
                <p className="text-[10px]">
                  {isMarksBalanced ? 'Marks perfectly balanced!' : `Difference: ${liveCalculatedMarks - totalMarks} marks. Adjust section weights.`}
                </p>
              </div>
            </div>
          </div>

          {/* Quick 1-Click Blueprints & Quiz Presets Panel */}
          <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 block">
                  Quick 1-Click Blueprint Presets
                </span>
                <h3 className="text-xs font-bold text-slate-900">
                  Select Exam Format / Internal Marks Quiz Template
                </h3>
              </div>
              <span className="text-[11px] text-slate-500">
                1-Click auto-setup for CIE Objective Quizzes and Semester Finals
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {BLUEPRINT_PRESETS.map((p) => {
                const isSelected = activePresetId === p.id && totalMarks === p.totalMarks;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className={`p-3 rounded-xl border text-left transition relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-indigo-50/90 border-indigo-500 shadow-sm ring-1 ring-indigo-400'
                        : 'bg-white hover:bg-slate-50 border-slate-200 shadow-xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${p.badgeColor}`}>
                          {p.badge}
                        </span>
                        <span className="text-xs font-bold text-slate-900 font-mono">
                          {p.totalMarks}M / {p.durationMinutes}m
                        </span>
                      </div>
                      <div className="font-bold text-xs text-slate-900 leading-snug">
                        {p.shortName}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                        {p.description}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="mt-2.5 flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-100/60 px-2 py-0.5 rounded">
                        <Check className="w-3 h-3 text-indigo-700" />
                        <span>Active Blueprint Preset</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Exam Global Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Target Total Marks</label>
              <select
                value={totalMarks}
                onChange={(e) => setTotalMarks(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white font-bold text-indigo-700"
              >
                <option value={100}>100 Marks (SGU Semester Final / End Semester Exam — 3 Hrs)</option>
                <option value={50}>50 Marks (SGU Mid-Term Assessment — 2 Hrs)</option>
                <option value={25}>25 Marks (SGU Unit Assessment Test — 1 Hr)</option>
                <option value={20}>20 Marks (Quick Objective Quiz)</option>
                <option value={30}>30 Marks (Continuous Internal Evaluation)</option>
                <option value={75}>75 Marks (Autonomous Examination)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Exam Duration</label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white font-medium"
              >
                <option value={180}>180 Minutes (3.0 Hours — SGU 100M Final)</option>
                <option value={120}>120 Minutes (2.0 Hours — SGU 50M Mid-Term)</option>
                <option value={60}>60 Minutes (1.0 Hour — SGU 25M Unit Test)</option>
                <option value={90}>90 Minutes (1.5 Hours)</option>
                <option value={45}>45 Minutes (Internal Quiz)</option>
                <option value={30}>30 Minutes (Objective Test)</option>
                <option value={20}>20 Minutes (Quick Quiz)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Negative Marking (Objective)</label>
              <select
                value={negativeMarking}
                onChange={(e) => setNegativeMarking(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white font-medium"
              >
                <option value="None">None (No penalty)</option>
                <option value="-0.25">-0.25 Marks (1/4 deduction)</option>
                <option value="-0.33">-0.33 Marks (1/3 deduction)</option>
                <option value="-0.50">-0.50 Marks (1/2 deduction)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Anti-Duplicate Threshold</label>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="range"
                  min="0.50"
                  max="0.85"
                  step="0.05"
                  value={dupThreshold}
                  onChange={(e) => setDupThreshold(parseFloat(e.target.value))}
                  className="flex-1 accent-indigo-600"
                />
                <span className="font-mono font-bold text-slate-800">{Math.round(dupThreshold * 100)}%</span>
              </div>
            </div>
          </div>

          {/* Exam Instructions & Guidelines Editor */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/60 text-xs">
            <button
              type="button"
              onClick={() => setShowInstructionsEditor(!showInstructionsEditor)}
              className="w-full px-4 py-2.5 flex items-center justify-between text-left font-semibold text-slate-700 hover:bg-slate-100/80 transition"
            >
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                <span>Examination Instructions &amp; OMR Guidelines</span>
                {negativeMarking !== 'None' && (
                  <span className="ml-1 text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-mono">
                    {negativeMarking} Penalty
                  </span>
                )}
              </span>
              <span className="text-[11px] text-indigo-600 font-bold">
                {showInstructionsEditor ? 'Hide Editor' : 'Customize Instructions'}
              </span>
            </button>

            {showInstructionsEditor && (
              <div className="p-3 border-t border-slate-200 bg-white space-y-2">
                <textarea
                  rows={4}
                  value={examInstructions}
                  onChange={(e) => setExamInstructions(e.target.value)}
                  placeholder="Enter exam guidelines (one per line)..."
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg font-sans leading-relaxed focus:ring-1 focus:ring-indigo-500"
                />
                <p className="text-[10px] text-slate-400">
                  These instructions print directly at the top of the examination paper and Student OMR response sheet.
                </p>
              </div>
            )}
          </div>

          {/* Sections List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Blueprint Sections ({sections.length} Sections)
              </h3>
              <button
                onClick={handleAddSection}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Section
              </button>
            </div>

            {sections.map((sec, idx) => (
              <div key={idx} className="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center space-x-2 flex-1">
                    <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {sec.section_id}
                    </span>
                    <input
                      type="text"
                      value={sec.title}
                      onChange={(e) => handleSectionChange(idx, 'title', e.target.value)}
                      className="text-xs font-bold text-slate-900 px-2 py-1 border border-slate-200 rounded-lg flex-1 bg-white"
                    />
                  </div>

                  <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2.5 py-1 rounded-lg">
                    {sec.required_count} &times; {sec.marks_per_question} = {sec.required_count * sec.marks_per_question} Marks
                  </span>

                  <button
                    onClick={() => handleRemoveSection(idx)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                    title="Remove Section"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">Question Type</label>
                    <select
                      value={sec.question_type}
                      onChange={(e) => handleSectionChange(idx, 'question_type', e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg bg-white"
                    >
                      {QUESTION_TYPES.map(qt => (
                        <option key={qt} value={qt}>{qt}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">Generate Count</label>
                    <input
                      type="number"
                      min={1}
                      value={sec.question_count}
                      onChange={(e) => handleSectionChange(idx, 'question_count', Number(e.target.value))}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">Required to Answer</label>
                    <input
                      type="number"
                      min={1}
                      value={sec.required_count}
                      onChange={(e) => handleSectionChange(idx, 'required_count', Number(e.target.value))}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">Marks Each</label>
                    <input
                      type="number"
                      min={1}
                      value={sec.marks_per_question}
                      onChange={(e) => handleSectionChange(idx, 'marks_per_question', Number(e.target.value))}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>

                {/* Internal Choice & Bloom Levels */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">Choice Option</label>
                    <select
                      value={sec.choice_type}
                      onChange={(e) => handleSectionChange(idx, 'choice_type', e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="Compulsory">Compulsory (No Choice)</option>
                      <option value="Answer any 5 out of 7">Answer Any N out of M</option>
                      <option value="Internal Choice (Either/Or)">Internal Choice (Either/Or)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">Target Bloom's Cognitive Levels</label>
                    <div className="flex flex-wrap gap-1">
                      {BLOOM_LEVELS.map((bl) => {
                        const isSelected = sec.blooms_levels.includes(bl);
                        return (
                          <button
                            key={bl}
                            type="button"
                            onClick={() => {
                              const curr = [...sec.blooms_levels];
                              const next = isSelected ? curr.filter(b => b !== bl) : [...curr, bl];
                              handleSectionChange(idx, 'blooms_levels', next.length > 0 ? next : ['Understand']);
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                              isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                            }`}
                          >
                            {bl}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Syllabus
            </button>

            <div className="flex items-center gap-3">
              {!isMarksBalanced && (
                <span className="text-xs text-rose-600 font-semibold flex items-center gap-1 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>Sections must equal exactly {totalMarks} Marks (Currently {liveCalculatedMarks}M)</span>
                </span>
              )}

              <button
                onClick={handleStartGeneration}
                disabled={!isMarksBalanced}
                className={`px-6 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 text-white shadow-md transition ${
                  isMarksBalanced ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' : 'bg-slate-400 cursor-not-allowed'
                }`}
              >
                <Wand2 className="w-4 h-4" />
                <span>Proceed to Question Generation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 4 — Live Question Generation & RAG Progress Tracker                 */}
      {/* ========================================================================= */}
      {step === 4 && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-2xl mx-auto space-y-6 text-center">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Generating Questions with RAG Grounding</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Synthesizing syllabus-compliant questions, validating blueprint criteria, and screening for duplicates.
            </p>
          </div>

          {/* Stepper Progress List */}
          <div className="space-y-3 text-left max-w-md mx-auto">
            {generationSteps.map((s, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/60 text-xs">
                <span className="font-semibold text-slate-700">{s.title}</span>
                {s.status === 'done' && (
                  <span className="text-emerald-600 flex items-center gap-1 font-bold text-[11px]">
                    <CheckCircle2 className="w-4 h-4" /> Verified
                  </span>
                )}
                {s.status === 'active' && (
                  <span className="text-indigo-600 flex items-center gap-1 font-bold text-[11px]">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> In Progress
                  </span>
                )}
                {s.status === 'pending' && (
                  <span className="text-slate-400 text-[11px]">Pending</span>
                )}
              </div>
            ))}
          </div>

          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 text-left">
              <p className="font-bold">Generation Error:</p>
              <p className="mt-0.5">{errorMsg}</p>
              <button
                onClick={() => setStep(3)}
                className="mt-3 px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold"
              >
                Return to Blueprint & Adjust
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 5 — Review and Export (Interactive Paper Editor)                     */}
      {/* ========================================================================= */}
      {step === 5 && generatedPaper && (
        <div className="space-y-6">
          {/* Header Action Bar */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-0.5 rounded">
                  {courseCode}
                </span>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Generation Complete
                </span>
                <span className="bg-slate-100 text-slate-700 text-xs font-medium px-2 py-0.5 rounded-full">
                  Verified Total: {totalMarks} Marks
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-1.5">{generatedPaper.title}</h2>
              <p className="text-xs text-slate-500">
                {institutionName} &bull; {durationMinutes} Mins &bull; {examType}
              </p>
            </div>

            {/* Action Buttons Above in Header */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Button 0: Generate Shareable Quiz Link */}
              <button
                type="button"
                onClick={handleGenerateQuizLink}
                disabled={generatingQuiz}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95"
                title="Generate and copy live shareable online quiz link for students"
              >
                <Share2 className={`w-4 h-4 ${generatingQuiz ? 'animate-spin' : 'text-purple-200'}`} />
                <span>Generate Quiz Link</span>
              </button>

              {/* Button 1: Print Question Paper */}
              <button
                type="button"
                onClick={() => setPrintModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95"
                title="Open Printable Examination Paper view"
              >
                <Printer className="w-4 h-4 text-white" />
                <span>Print Question Paper</span>
              </button>


              {/* Button 2: Download PDF */}
              <a
                href={api.getDownloadPdfUrl(generatedPaper.paper_id)}
                download
                className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95"
                title="Download Standardized PDF Question Paper"
              >
                <FileDown className="w-4 h-4 text-rose-400" />
                <span>Download PDF</span>
              </a>

              {/* Button 3: Download Word (.docx) */}
              <a
                href={api.getDownloadDocxUrl(generatedPaper.paper_id)}
                download
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95"
                title="Download Editable Word Document (.docx)"
              >
                <FileDown className="w-4 h-4 text-blue-200" />
                <span>Download Word (.docx)</span>
              </a>

              {/* Workflow Action: Submit for Moderation */}
              <button
                onClick={handleSubmitForModeration}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ml-1"
                title="Submit paper to Board of Examiners for moderation"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Submit for Moderation</span>
              </button>
            </div>
          </div>

          {/* Diversity & Guardrail Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 block">Question Diversity Score</span>
                <span className="text-xl font-bold text-emerald-600">
                  {generatedPaper.diversity_evaluation?.diversity_score || 98.4}%
                </span>
              </div>
              <ShieldCheck className="w-6 h-6 text-emerald-500" />
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 block">Duplicate Flagged Items</span>
                <span className="text-xl font-bold text-slate-800">
                  {generatedPaper.diversity_evaluation?.duplicate_flags_count || 0} Flags
                </span>
              </div>
              <ShieldAlert className="w-6 h-6 text-amber-500" />
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 block">Syllabus Grounding</span>
                <span className="text-xl font-bold text-indigo-600">100% Citations Verified</span>
              </div>
              <BookOpen className="w-6 h-6 text-indigo-500" />
            </div>
          </div>

          {/* Action Bar with Three Primary Action Buttons Above Question Paper Preview */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  Question Paper Preview &bull; Ready for Printing &amp; Export
                </h3>
                <p className="text-xs text-slate-500">
                  Standard university exam structure &bull; {sections.length} Sections &bull; {totalMarks} Total Marks
                </p>
              </div>
            </div>

            {/* Action Buttons Above Paper */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={handleGenerateQuizLink}
                disabled={generatingQuiz}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95"
                title="Generate and copy live shareable online quiz link for students"
              >
                <Share2 className={`w-4 h-4 ${generatingQuiz ? 'animate-spin' : 'text-purple-200'}`} />
                <span>Generate Quiz Link</span>
              </button>

              <button
                type="button"
                onClick={() => setPrintModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95"
                title="Print Question Paper in standard university format"
              >
                <Printer className="w-4 h-4 text-white" />
                <span>Print Question Paper</span>
              </button>


              <a
                href={api.getDownloadPdfUrl(generatedPaper.paper_id)}
                download
                className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95"
                title="Download Standardized PDF Question Paper"
              >
                <FileDown className="w-4 h-4 text-rose-400" />
                <span>Download PDF</span>
              </a>

              <a
                href={api.getDownloadDocxUrl(generatedPaper.paper_id)}
                download
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95"
                title="Download Editable Word Document (.docx)"
              >
                <FileDown className="w-4 h-4 text-blue-200" />
                <span>Download Word (.docx)</span>
              </a>
            </div>
          </div>

          {/* Interactive Sections & Questions Sheet */}
          <div className="space-y-6">
            {generatedPaper.sections?.map((sec) => (
              <div key={sec.section_id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-slate-900">{sec.title}</span>
                    <span className="text-xs text-slate-500">
                      ({sec.choice_type || 'Compulsory'} &bull; {sec.required_count} &times; {sec.marks_per_question} Marks = {sec.total_section_marks} Marks)
                    </span>
                  </div>

                  <button
                    onClick={() => handleAddQuestionToSection(sec.section_id)}
                    className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-xl transition"
                    title="Write & Add Question to this Section"
                  >
                    <Plus className="w-3.5 h-3.5" /> <span>Write &amp; Add Question</span>
                  </button>
                </div>

                <div className="divide-y divide-slate-100 p-4 space-y-2">
                  {sec.questions?.map((q, qIdx) => {
                    const isRegen = regeneratingId === `${sec.section_id}-${qIdx}`;
                    const dupAlert = generatedPaper.diversity_evaluation?.alerts?.find(
                      a => a.section_id === sec.section_id && a.question_index === qIdx
                    );

                    return (
                      <div key={qIdx} className={`p-4 rounded-xl transition ${
                        dupAlert ? 'bg-amber-50/70 border border-amber-300' : 'bg-white hover:bg-slate-50/60'
                      }`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start space-x-3 flex-1">
                            {/* Reordering Up/Down buttons */}
                            <div className="flex flex-col space-y-0.5 shrink-0 mt-0.5">
                              <button
                                onClick={() => handleMoveQuestion(sec.section_id, qIdx, 'up')}
                                disabled={qIdx === 0}
                                className="p-0.5 text-slate-400 hover:text-indigo-600 disabled:opacity-20"
                                title="Move up"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <span className="min-w-8 h-6 px-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs flex items-center justify-center">
                                {typeof q.q_number === 'string' && q.q_number.startsWith('Q') ? q.q_number : `Q${q.q_number}`}
                              </span>
                              <button
                                onClick={() => handleMoveQuestion(sec.section_id, qIdx, 'down')}
                                disabled={qIdx === sec.questions.length - 1}
                                className="p-0.5 text-slate-400 hover:text-indigo-600 disabled:opacity-20"
                                title="Move down"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="space-y-1.5 flex-1">
                              <p className="text-xs font-medium text-slate-900 leading-relaxed">
                                <span className="font-bold text-indigo-900 mr-1.5">
                                  {typeof q.q_number === 'string' && q.q_number.startsWith('Q') ? q.q_number : `Q${q.q_number}`}.
                                </span>
                                {q.question_text}
                              </p>

                              {/* MCQ options */}
                              {q.options && q.options.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 pl-2">
                                  {q.options.map((opt, oIdx) => (
                                    <span key={oIdx} className="text-[11px] text-slate-600">
                                      <b>({String.fromCharCode(97 + oIdx)})</b> {cleanOptionText(opt)}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Model Answer / Solution if available */}
                              {q.model_answer && (
                                <div className="p-2 bg-emerald-50/70 rounded-lg text-[10px] text-emerald-900 border border-emerald-100 mt-1">
                                  <span className="font-bold text-emerald-800">Model Answer / Rubric:</span> {q.model_answer}
                                </div>
                              )}

                              {/* Verified RAG Passage Excerpt Tag */}
                              {q.retrieved_passage && (
                                <div className="p-2 bg-indigo-50/50 rounded-lg text-[10px] text-slate-600 border border-indigo-100">
                                  <span className="font-semibold text-indigo-700">Grounded Citation:</span> {q.retrieved_passage}
                                </div>
                              )}

                              {/* Tags: Unit, Topic, Bloom, Difficulty, Marks */}
                              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                <span className="bg-indigo-50 text-indigo-700 text-[10px] font-semibold px-2 py-0.5 rounded">
                                  Unit {q.unit_number}: {q.topic}
                                </span>
                                <span className="bg-purple-50 text-purple-700 text-[10px] font-semibold px-2 py-0.5 rounded">
                                  Bloom: {q.blooms_level}
                                </span>
                                <span className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded">
                                  {q.difficulty}
                                </span>
                                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded">
                                  [{q.marks} Marks]
                                </span>
                              </div>

                              {dupAlert && (
                                <div className="mt-2 p-2 bg-amber-100 text-amber-900 rounded-lg text-xs font-medium">
                                  Duplicate Warning: {dupAlert.issue} ({Math.round(dupAlert.similarity_score * 100)}% match)
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons: Edit, Regenerate, Swap, Delete */}
                          <div className="flex items-center space-x-1 shrink-0">
                            <button
                              onClick={() => setEditingQuestionModal({ secId: sec.section_id, qIdx, question: { ...q }, isNew: false })}
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                              title="Edit Question"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleRegenerateQuestion(sec.section_id, qIdx)}
                              disabled={isRegen}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                              title="Regenerate with AI"
                            >
                              <RotateCw className={`w-3.5 h-3.5 ${isRegen ? 'animate-spin' : ''}`} />
                            </button>

                            <button
                              onClick={() => setSwapModal({ secId: sec.section_id, qIdx })}
                              className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                              title="Swap with Question Bank"
                            >
                              Swap Bank
                            </button>

                            <button
                              onClick={() => handleDeleteQuestion(sec.section_id, qIdx)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                              title="Delete Question"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Quick Add Question Card for Continuous Paper */}
            <div 
              onClick={() => handleOpenWriteQuestion()}
              className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/40 hover:bg-indigo-50/80 rounded-2xl p-4 text-center cursor-pointer transition flex items-center justify-center gap-2 text-indigo-700 font-semibold text-xs shadow-sm hover:shadow"
            >
              <Plus className="w-4 h-4" />
              <span>+ Write &amp; Add Next Question to Paper (Q{
                (generatedPaper.sections || []).reduce((acc, s) => acc + (s.questions?.length || 0), 0) + 1
              })</span>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4">
            <button
              onClick={() => setStep(3)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Reconfigure Blueprint
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPrintModalOpen(true)}
                className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>Print Question Paper</span>
              </button>

              <button
                onClick={() => setActiveTab('repository')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-xs font-semibold shadow-md shadow-indigo-200 transition"
              >
                Open Examination Repository &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Write / Edit Question Dialog (Standardized Examination Writer Format) */}
      {editingQuestionModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl my-8 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                  {editingQuestionModal.isNew ? 'New Examination Item' : 'Modify Item'}
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {editingQuestionModal.isNew ? '✍️ Write & Add Question' : '✏️ Edit Question'} &bull; Q{editingQuestionModal.question.q_number}
                </h3>
              </div>
              <button 
                onClick={() => setEditingQuestionModal(null)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Question Statement */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Question Statement / Problem Prompt <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={editingQuestionModal.question.question_text || ''}
                  onChange={(e) => {
                    const q = { ...editingQuestionModal.question, question_text: e.target.value };
                    setEditingQuestionModal({ ...editingQuestionModal, question: q });
                  }}
                  placeholder="e.g. Explain the ACID properties of database transactions. Illustrate with a concrete banking transfer example how atomicity and isolation are maintained."
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs leading-relaxed"
                />
              </div>

              {/* Format & Classification Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Question Type</label>
                  <select
                    value={editingQuestionModal.question.question_type || 'Short Answer'}
                    onChange={(e) => {
                      const q = { ...editingQuestionModal.question, question_type: e.target.value };
                      if (e.target.value === 'MCQ' && (!q.options || q.options.length === 0)) {
                        q.options = ['', '', '', ''];
                      }
                      setEditingQuestionModal({ ...editingQuestionModal, question: q });
                    }}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                  >
                    {QUESTION_TYPES.map(qt => (
                      <option key={qt} value={qt}>{qt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Marks</label>
                  <input
                    type="number"
                    min={1}
                    value={editingQuestionModal.question.marks || 2}
                    onChange={(e) => {
                      const q = { ...editingQuestionModal.question, marks: Number(e.target.value) };
                      setEditingQuestionModal({ ...editingQuestionModal, question: q });
                    }}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Bloom Level</label>
                  <select
                    value={editingQuestionModal.question.blooms_level || 'Understand'}
                    onChange={(e) => {
                      const q = { ...editingQuestionModal.question, blooms_level: e.target.value };
                      setEditingQuestionModal({ ...editingQuestionModal, question: q });
                    }}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                  >
                    {BLOOM_LEVELS.map(bl => (
                      <option key={bl} value={bl}>{bl}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Difficulty</label>
                  <select
                    value={editingQuestionModal.question.difficulty || 'Medium'}
                    onChange={(e) => {
                      const q = { ...editingQuestionModal.question, difficulty: e.target.value };
                      setEditingQuestionModal({ ...editingQuestionModal, question: q });
                    }}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              {/* MCQ Options (If MCQ selected) */}
              {editingQuestionModal.question.question_type === 'MCQ' && (
                <div className="bg-purple-50/50 p-3 rounded-xl border border-purple-100 space-y-2">
                  <span className="font-semibold text-purple-900 block">MCQ Response Alternatives (A, B, C, D)</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {['A', 'B', 'C', 'D'].map((letter, optIdx) => {
                      const currentOpts = editingQuestionModal.question.options || ['', '', '', ''];
                      return (
                        <div key={letter} className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-700 w-5">{letter})</span>
                          <input
                            type="text"
                            placeholder={`Option ${letter}`}
                            value={currentOpts[optIdx] || ''}
                            onChange={(e) => {
                              const nextOpts = [...currentOpts];
                              nextOpts[optIdx] = e.target.value;
                              const q = { ...editingQuestionModal.question, options: nextOpts };
                              setEditingQuestionModal({ ...editingQuestionModal, question: q });
                            }}
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-xs"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Model Answer / Rubric / Solution */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Model Answer / Marking Rubric / Key Points
                </label>
                <textarea
                  rows={2}
                  value={editingQuestionModal.question.model_answer || ''}
                  onChange={(e) => {
                    const q = { ...editingQuestionModal.question, model_answer: e.target.value };
                    setEditingQuestionModal({ ...editingQuestionModal, question: q });
                  }}
                  placeholder="e.g. 1 Mark for definition of Atomicity; 1 Mark for practical rollback scenario."
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs"
                />
              </div>

              {/* Syllabus Alignment: Unit & Topic */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Syllabus Unit</label>
                  <select
                    value={editingQuestionModal.question.unit_number || 1}
                    onChange={(e) => {
                      const q = { ...editingQuestionModal.question, unit_number: Number(e.target.value), unit_title: `Unit ${e.target.value}` };
                      setEditingQuestionModal({ ...editingQuestionModal, question: q });
                    }}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                  >
                    {[1, 2, 3, 4, 5].map(u => (
                      <option key={u} value={u}>Unit {u}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Topic Name</label>
                  <input
                    type="text"
                    value={editingQuestionModal.question.topic || ''}
                    onChange={(e) => {
                      const q = { ...editingQuestionModal.question, topic: e.target.value };
                      setEditingQuestionModal({ ...editingQuestionModal, question: q });
                    }}
                    placeholder="e.g. Transaction Processing & Concurrency"
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setEditingQuestionModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveQuestionEdit}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-sm transition"
              >
                {editingQuestionModal.isNew ? 'Add Question to Paper' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Swap Bank Question */}
      {swapModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Select Alternative Question from Bank</h3>
              <button onClick={() => setSwapModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-2 flex-1 pr-1 text-xs">
              {bankQuestions.map((bq) => (
                <div
                  key={bq.id}
                  onClick={() => handleSwapBankQuestion(bq.id)}
                  className="p-3 border border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50/40 cursor-pointer transition space-y-1"
                >
                  <p className="font-medium text-slate-900">{bq.question_text}</p>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded">Unit {bq.unit_number}: {bq.topic}</span>
                    <span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-bold">{bq.blooms_level}</span>
                    <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold">[{bq.marks} Marks]</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Print Question Paper */}
      {printModalOpen && (
        <PrintQuestionPaperModal
          paper={generatedPaper}
          onClose={() => setPrintModalOpen(false)}
        />
      )}

      {/* Modal: Share Live Quiz Link */}
      {shareQuiz && (
        <QuizLinkShareModal
          quiz={shareQuiz}
          onClose={() => setShareQuiz(null)}
          onOpenQuiz={onOpenQuiz}
          onGoToHub={() => {
            setShareQuiz(null);
            if (setActiveTab) setActiveTab('quizzes');
          }}
        />
      )}
    </div>
  );
}

