import React, { useState, useEffect } from 'react';
import { 
  Printer, X, FileText, CheckCircle2, Eye, EyeOff, LayoutList, Table, 
  Award, Sliders, CheckSquare, KeyRound, Plus, Edit3, Trash2, Save, Sparkles, AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { 
  printExamPaper, formatQuestionMarks, cleanOptionText, 
  formatQuestionNumber, formatQuestionNumberTag 
} from '../utils/printHelper';

export default function PrintQuestionPaperModal({ paper, onClose, onPaperUpdated }) {
  const isSguInitial = Boolean(
    paper?.institution_name?.toUpperCase().includes('SANJAY GHODAWAT') ||
    paper?.title?.toUpperCase().includes('SGU')
  );
  const [currentPaper, setCurrentPaper] = useState(paper);
  const [includeSolutions, setIncludeSolutions] = useState(false);
  const [layout, setLayout] = useState(isSguInitial ? 'sgu' : 'standard'); // 'sgu' (SGU Layout), 'standard' (Classic Exam Paper) or 'tabular' (Grid Matrix)
  const [paperMode, setPaperMode] = useState('unified'); // 'unified' (Continuous Q1, Q2... No Part A) or 'sections'
  const [numberingFormat, setNumberingFormat] = useState('Q'); // 'Q' -> Q1., Q2. | 'Q_dot' -> Q.1. | 'num_only' -> 1.
  const [showBloom, setShowBloom] = useState(true);
  const [marksFormat, setMarksFormat] = useState('brackets'); // 'brackets' [10], 'parentheses' (10), 'full' [10 Marks], 'label' Marks: 10
  const [showMarksTable, setShowMarksTable] = useState(false);
  const [showOmrSheet, setShowOmrSheet] = useState(false);
  const [showAnswerKey, setShowAnswerKey] = useState(false);

  // Write / Edit Question Modal State
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState(null); // null for new, or { secIdx, qIdx }
  const [writeForm, setWriteForm] = useState({
    q_number: '',
    question_text: '',
    marks: 2,
    blooms_level: 'Understand',
    question_type: 'Short Answer',
    options: ['', '', '', ''],
    model_answer: '',
    topic: ''
  });
  const [toastMsg, setToastMsg] = useState(null);

  useEffect(() => {
    setCurrentPaper(paper);
    if (paper?.institution_name?.toUpperCase().includes('SANJAY GHODAWAT') || paper?.title?.toUpperCase().includes('SGU')) {
      setLayout('sgu');
    }
  }, [paper]);

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        handlePrint();
      } else if (e.key === 'Escape' && !isWriteModalOpen) {
        onClose?.();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPaper, includeSolutions, layout, paperMode, numberingFormat, showBloom, marksFormat, showMarksTable, showOmrSheet, showAnswerKey, isWriteModalOpen, onClose]);

  if (!currentPaper) return null;

  const sections = Array.isArray(currentPaper.sections) 
    ? currentPaper.sections 
    : (typeof currentPaper.sections_json === 'string' ? JSON.parse(currentPaper.sections_json || '[]') : []);

  // Compute all questions flattened for unified calculation
  const allQuestions = [];
  sections.forEach((sec, sIdx) => {
    (sec.questions || []).forEach((q, qIdx) => {
      allQuestions.push({ ...q, secIdx: sIdx, qIdx });
    });
  });

  const durationHrs = Math.floor((currentPaper.duration_minutes || 180) / 60);
  const durationMins = (currentPaper.duration_minutes || 180) % 60;
  const durStr = `${durationHrs} Hours` + (durationMins ? ` ${durationMins} Mins` : '');

  const totalCalculatedMarks = currentPaper.total_marks || sections.reduce((acc, sec) => {
    return acc + (sec.total_section_marks || (Number(sec.required_count || 0) * Number(sec.marks_per_question || 0)));
  }, 0);

  const defaultInstructions = currentPaper.instructions || (
    "1. Answer ALL questions according to instructions in respective sections.\n" +
    "2. Figures to the right indicate full marks.\n" +
    "3. Assume suitable data wherever necessary and state them clearly.\n" +
    "4. Use of non-programmable calculators is permitted."
  );

  function handlePrint() {
    printExamPaper(currentPaper, { 
      includeSolutions, 
      layout, 
      showBloom, 
      marksFormat, 
      showMarksTable, 
      showOmrSheet, 
      showAnswerKey,
      paperMode,
      showPartHeaders: paperMode === 'sections',
      numberingFormat
    });
  }

  function showToast(msg) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }

  // Recalculate and re-index questions across sections
  function reindexQuestions(secs) {
    let count = 1;
    let totalMarks = 0;
    const newSecs = secs.map(sec => {
      const qList = (sec.questions || []).map(q => {
        const updatedQ = { ...q, q_number: count++ };
        totalMarks += Number(updatedQ.marks || sec.marks_per_question || 2);
        return updatedQ;
      });
      return {
        ...sec,
        questions: qList,
        total_section_marks: qList.reduce((acc, q) => acc + Number(q.marks || 2), 0)
      };
    });
    return { newSecs, totalMarks };
  }

  async function persistPaperChanges(updatedSecs, newTotalMarks) {
    try {
      const updatedPaper = { 
        ...currentPaper, 
        sections: updatedSecs, 
        sections_json: JSON.stringify(updatedSecs),
        total_marks: newTotalMarks 
      };
      setCurrentPaper(updatedPaper);
      if (currentPaper.id) {
        await api.updatePaperSections(currentPaper.id, {
          sections: updatedSecs,
          total_marks: newTotalMarks
        });
      }
      onPaperUpdated?.(updatedPaper);
    } catch (err) {
      console.error("Failed to persist paper updates:", err);
    }
  }

  // Open Write Modal for adding a brand new question
  function handleOpenAddQuestion() {
    const nextQNum = allQuestions.length + 1;
    setEditingTarget(null);
    setWriteForm({
      q_number: nextQNum,
      question_text: '',
      marks: 2,
      blooms_level: 'Understand',
      question_type: 'Short Answer',
      options: ['', '', '', ''],
      model_answer: '',
      topic: 'Core Curriculum'
    });
    setIsWriteModalOpen(true);
  }

  // Open Write Modal for editing an existing question
  function handleOpenEditQuestion(secIdx, qIdx, q) {
    setEditingTarget({ secIdx, qIdx });
    const opts = (q.options && q.options.length >= 4) ? q.options : (q.options || []).concat(['', '', '', '']).slice(0, 4);
    setWriteForm({
      q_number: q.q_number,
      question_text: q.question_text || '',
      marks: q.marks || 2,
      blooms_level: q.blooms_level || 'Understand',
      question_type: q.question_type || 'Short Answer',
      options: opts,
      model_answer: q.model_answer || '',
      topic: q.topic || ''
    });
    setIsWriteModalOpen(true);
  }

  // Save question from Write Question Modal
  async function handleSaveQuestionSubmit(e) {
    e.preventDefault();
    if (!writeForm.question_text.trim()) return;

    const updatedSecs = JSON.parse(JSON.stringify(sections));

    const cleanOpts = writeForm.question_type === 'MCQ'
      ? writeForm.options.filter(o => o.trim())
      : [];

    const newQData = {
      q_number: Number(writeForm.q_number) || (allQuestions.length + 1),
      question_text: writeForm.question_text.trim(),
      marks: Number(writeForm.marks) || 2,
      blooms_level: writeForm.blooms_level,
      question_type: writeForm.question_type,
      options: cleanOpts,
      model_answer: writeForm.model_answer.trim(),
      topic: writeForm.topic.trim() || 'Curriculum Concepts'
    };

    if (editingTarget !== null) {
      // Edit existing
      const { secIdx, qIdx } = editingTarget;
      if (updatedSecs[secIdx] && updatedSecs[secIdx].questions[qIdx]) {
        updatedSecs[secIdx].questions[qIdx] = {
          ...updatedSecs[secIdx].questions[qIdx],
          ...newQData
        };
      }
    } else {
      // Add new question: append to last section or create default section
      if (updatedSecs.length === 0) {
        updatedSecs.push({
          section_id: 'A',
          title: 'Examination Questions',
          marks_per_question: newQData.marks,
          required_count: 1,
          total_section_marks: newQData.marks,
          question_type: newQData.question_type,
          questions: [newQData]
        });
      } else {
        const lastSec = updatedSecs[updatedSecs.length - 1];
        lastSec.questions = lastSec.questions || [];
        lastSec.questions.push(newQData);
        lastSec.required_count = (lastSec.required_count || 0) + 1;
      }
    }

    const { newSecs, totalMarks } = reindexQuestions(updatedSecs);
    await persistPaperChanges(newSecs, totalMarks);
    setIsWriteModalOpen(false);
    showToast(editingTarget ? "Question updated successfully!" : `Question Q${allQuestions.length + 1} added to examination paper!`);
  }

  // Delete a question
  async function handleDeleteQuestion(secIdx, qIdx) {
    if (!window.confirm("Are you sure you want to remove this question from the paper?")) return;
    const updatedSecs = JSON.parse(JSON.stringify(sections));
    if (updatedSecs[secIdx] && updatedSecs[secIdx].questions) {
      updatedSecs[secIdx].questions.splice(qIdx, 1);
      const { newSecs, totalMarks } = reindexQuestions(updatedSecs);
      await persistPaperChanges(newSecs, totalMarks);
      showToast("Question removed from paper.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto modal-backdrop">
      {/* Modal Dialog Container */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden border border-slate-200 print-dialog-wrapper relative">
        
        {/* Top Control Bar (Hidden when printing via .no-print) */}
        <div className="no-print bg-slate-900 text-white px-5 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Print Examination Paper</h3>
              <p className="text-[11px] text-slate-300">
                Official University Exam Format &bull; Custom Question Writer &bull; A4 Ready
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-wrap gap-y-1.5">
            {/* Format Switcher: Unified (No Part A) vs Sectioned */}
            <div className="bg-slate-800 p-0.5 rounded-lg border border-slate-700 flex items-center text-xs">
              <button
                type="button"
                onClick={() => setPaperMode('unified')}
                className={`px-2.5 py-1 rounded-md font-semibold transition ${
                  paperMode === 'unified' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
                }`}
                title="Continuous Question Paper without Part A / Part B section headers"
              >
                <span>Continuous (Q1, Q2... No Part A)</span>
              </button>
              <button
                type="button"
                onClick={() => setPaperMode('sections')}
                className={`px-2.5 py-1 rounded-md font-semibold transition ${
                  paperMode === 'sections' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
                }`}
                title="Traditional paper split into Part A, Part B section headers"
              >
                <span>Sectioned (Part A, B...)</span>
              </button>
            </div>

            {/* Layout Switcher: SGU vs Standard Exam Sheet vs Grid Matrix */}
            <div className="bg-slate-800 p-0.5 rounded-lg border border-slate-700 flex items-center text-xs">
              <button
                type="button"
                onClick={() => setLayout('sgu')}
                className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 transition ${
                  layout === 'sgu' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
                }`}
                title="Sanjay Ghodawat University (SGU) official examination layout"
              >
                <span>🏛️ SGU Format</span>
              </button>
              <button
                type="button"
                onClick={() => setLayout('standard')}
                className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 transition ${
                  layout === 'standard' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
                }`}
                title="Authentic University Examination Sheet typography"
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span>Standard</span>
              </button>
              <button
                type="button"
                onClick={() => setLayout('tabular')}
                className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 transition ${
                  layout === 'tabular' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
                }`}
                title="Tabular matrix with question description and Bloom tags"
              >
                <Table className="w-3.5 h-3.5" />
                <span>Grid</span>
              </button>
            </div>

            {/* Question Prefix Selector (Q1, Q2 vs 1, 2) */}
            <div className="flex items-center space-x-1 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700 text-xs">
              <span className="text-slate-300 font-medium">Q.No:</span>
              <select
                value={numberingFormat}
                onChange={(e) => setNumberingFormat(e.target.value)}
                className="bg-slate-900 text-white rounded px-2 py-0.5 text-xs font-semibold focus:outline-none cursor-pointer border border-slate-700"
                title="Format question numbering with Q1, Q2 or simple numbers"
              >
                <option value="Q">Q1, Q2, Q3...</option>
                <option value="Q_dot">Q.1, Q.2, Q.3...</option>
                <option value="num_only">1, 2, 3...</option>
              </select>
            </div>

            {/* Marks Format Selector */}
            <div className="flex items-center space-x-1 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700 text-xs">
              <span className="text-slate-300 font-medium">Marks:</span>
              <select
                value={marksFormat}
                onChange={(e) => setMarksFormat(e.target.value)}
                className="bg-slate-900 text-white rounded px-2 py-0.5 text-xs font-semibold focus:outline-none cursor-pointer border border-slate-700"
              >
                <option value="brackets">[10]</option>
                <option value="parentheses">(10)</option>
                <option value="full">[10 Marks]</option>
                <option value="label">Marks: 10</option>
              </select>
            </div>

            {/* Write / Add Question Button */}
            <button
              type="button"
              onClick={handleOpenAddQuestion}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition active:scale-95"
              title="Write and insert a new question using standardized writing format"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Question</span>
            </button>

            {/* Print Now Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-900/40 transition active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print Paper</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toast Alert Banner */}
        {toastMsg && (
          <div className="no-print bg-emerald-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-sm animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{toastMsg}</span>
            </div>
            <button onClick={() => setToastMsg(null)} className="text-emerald-100 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Scrollable Printable Paper Sheet */}
        <div className="overflow-y-auto p-6 sm:p-10 flex-1 bg-slate-100 flex justify-center print-scroll-area">
          
          {/* Authentic Examination Paper Sheet */}
          <div className="printable-exam-paper bg-white w-full max-w-[210mm] p-8 sm:p-12 shadow-md border border-slate-300 rounded-sm text-black font-serif leading-normal relative">
            
            {/* 1. University Header */}
            {layout === 'sgu' ? (
              <div className="text-center pb-2.5 border-b-2 border-black space-y-1 font-sans">
                <h1 className="font-bold text-base sm:text-lg tracking-wider uppercase">
                  {currentPaper.institution_name || "SANJAY GHODAWAT UNIVERSITY, KOLHAPUR"}
                </h1>
                <h2 className="font-semibold text-xs sm:text-sm text-slate-800">
                  {currentPaper.department || "School of Computer Science and Engineering"}
                </h2>
                <h3 className="font-bold text-xs sm:text-sm uppercase pt-0.5">
                  {currentPaper.exam_name || currentPaper.title || "END SEMESTER EXAMINATION"}
                </h3>
              </div>
            ) : (
              <div className="text-center pb-3 border-b-2 border-black space-y-1">
                <h1 className="font-bold text-base sm:text-lg tracking-wider uppercase font-sans">
                  {currentPaper.institution_name || "NATIONAL INSTITUTE OF TECHNOLOGY & SCIENCE"}
                </h1>
                <h2 className="font-semibold text-xs sm:text-sm text-slate-800 font-sans">
                  {currentPaper.department || "Department of Computer Science & Engineering"}
                </h2>
                <h3 className="font-bold text-xs sm:text-sm text-slate-900 font-sans pt-0.5">
                  {currentPaper.title || currentPaper.exam_name || "End Semester Theory Examination"}
                </h3>
                {currentPaper.academic_year && (
                  <p className="text-[11px] text-slate-600 font-sans">
                    Academic Session: {currentPaper.academic_year}
                  </p>
                )}
              </div>
            )}

            {/* 2. Official Metadata Header */}
            {layout === 'sgu' ? (
              <>
                <div className="mt-2.5 border-t-2 border-b-2 border-black py-2 px-1 text-xs font-sans space-y-1">
                  <div className="flex justify-between items-center">
                    <div><b>Subject:</b> <span>{currentPaper.course_name || 'Computer Science'}</span></div>
                    <div><b>Semester:</b> <span>{currentPaper.semester || 'VI'}</span></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div><b>Subject Code:</b> <span className="font-mono font-bold">{currentPaper.course_code || 'CSE601'}</span></div>
                    <div><b>Maximum Marks:</b> <b>{totalCalculatedMarks}</b></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div><b>Examination Duration:</b> <span>{durStr}</span></div>
                    <div><b>Academic Year:</b> <span>{currentPaper.academic_year || '2026–27'}</span></div>
                  </div>
                </div>

                {/* SGU Proposed Demo Format Notice */}
                <div className="my-2.5 bg-amber-50 border border-dashed border-amber-500 rounded p-2 text-[11px] text-amber-900 text-center font-sans">
                  <b>Notice:</b> This is a proposed demo format, not a verified official SGU examination pattern. Confirm the approved duration and marking scheme with your department.
                </div>
              </>
            ) : (
              <div className="mt-3 border-t border-black border-b-2 border-black py-2.5 px-1 text-xs font-sans space-y-1.5">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div><b>Course Code:</b> <span className="font-mono font-bold">{currentPaper.course_code || 'CS301'}</span></div>
                  <div><b>Course Title:</b> <span className="font-semibold">{currentPaper.course_name || 'Database Management Systems'}</span></div>
                  <div><b>Semester:</b> <span>{currentPaper.semester || "Semester V"}</span></div>
                </div>
                <div className="flex justify-between items-center pt-1.5 border-t border-dashed border-slate-400 text-xs flex-wrap gap-2">
                  <div><b>Duration:</b> <span className="font-semibold">{durStr}</span></div>
                  <div><b>Maximum Marks:</b> <b>{totalCalculatedMarks} Marks</b></div>
                  <div className="flex items-center">
                    <b>Roll No:</b>
                    <span className="font-mono border border-black px-4 py-0.5 ml-1 bg-white text-slate-400">
                      [&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;]
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 3. General Instructions */}
            <div className="mt-3 text-xs font-sans border-l-2 border-black pl-3 py-1 space-y-0.5 text-slate-800">
              <span className="font-bold text-black uppercase tracking-wider text-[11px] block">
                General Instructions:
              </span>
              {defaultInstructions.split('\n').map((line, idx) => (
                line.trim() && <p key={idx} className="leading-snug">{line.trim()}</p>
              ))}
            </div>

            {/* Optional: Marks Distribution Scheme Table */}
            {showMarksTable && sections.length > 0 && (
              <div className="mt-4 border-2 border-black font-sans text-xs page-break-inside-avoid">
                <div className="bg-slate-100 font-bold px-3 py-1.5 border-b border-black flex justify-between items-center uppercase text-[11px]">
                  <span>Marks Distribution Scheme &amp; Blueprint Matrix</span>
                  <span>Max Marks: {totalCalculatedMarks}</span>
                </div>
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-black font-bold bg-slate-50">
                      <th className="p-2 border-r border-black">Section / Part</th>
                      <th className="p-2 text-center border-r border-black">Questions</th>
                      <th className="p-2 text-center border-r border-black">To Answer</th>
                      <th className="p-2 text-center border-r border-black">Marks / Q</th>
                      <th className="p-2 text-right">Total Marks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black">
                    {sections.map((sec, sIdx) => {
                      const qCount = sec.questions?.length || 0;
                      const reqCount = sec.required_count || qCount;
                      const mpq = sec.marks_per_question ? formatQuestionMarks(sec.marks_per_question, marksFormat) : 'Variable';
                      const secMarks = sec.total_section_marks || (Number(reqCount) * Number(sec.marks_per_question || 0));
                      return (
                        <tr key={sIdx}>
                          <td className="p-2 font-semibold border-r border-black">{sec.title}</td>
                          <td className="p-2 text-center border-r border-black">{qCount}</td>
                          <td className="p-2 text-center border-r border-black">{reqCount}</td>
                          <td className="p-2 text-center font-mono border-r border-black">{mpq}</td>
                          <td className="p-2 text-right font-bold">{secMarks} Marks</td>
                        </tr>
                      );
                    })}
                    <tr className="border-t-2 border-black font-bold bg-slate-100">
                      <td colSpan="4" className="p-2 text-right border-r border-black uppercase text-[11px]">Grand Maximum Marks:</td>
                      <td className="p-2 text-right">{totalCalculatedMarks} Marks</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* 4. Examination Questions (SGU Format, Standard Format, or Tabular Grid) */}
            <div className="mt-5 space-y-5">
              {layout === 'sgu' ? (
                /* ============================================================== */
                /* SANJAY GHODAWAT UNIVERSITY (SGU) EXAMINATION LAYOUT            */
                /* ============================================================== */
                sections.map((sec, sIdx) => {
                  const totalSecMarks = sec.total_section_marks || (Number(sec.required_count || 0) * Number(sec.marks_per_question || 0));
                  let mainTitle = sec.title || `Q.${sIdx + 1} Answer the following`;
                  if (!mainTitle.match(/^Q\.?\s*\d+/i)) {
                    mainTitle = `Q.${sIdx + 1} ${mainTitle}`;
                  }
                  let choiceSubtitle = '';
                  if (sec.choice_type && sec.choice_type !== 'Compulsory') {
                    choiceSubtitle = sec.choice_type;
                  } else if (sec.required_count && sec.questions && sec.required_count < sec.questions.length) {
                    choiceSubtitle = `Answer any ${sec.required_count} out of ${sec.questions.length} questions × ${sec.marks_per_question} marks = ${totalSecMarks}`;
                  }

                  return (
                    <div key={sec.section_id || sIdx} className="space-y-3 page-break-inside-avoid">
                      {/* SGU Section Header Bar */}
                      <div className="flex justify-between items-baseline border-b-2 border-black pb-1 pt-1 font-sans">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="font-bold text-xs sm:text-sm uppercase tracking-wide">
                            {mainTitle}
                          </span>
                          {choiceSubtitle && (
                            <span className="text-xs italic text-slate-700">
                              ({choiceSubtitle})
                            </span>
                          )}
                        </div>
                        <span className="font-bold text-xs sm:text-sm font-sans">
                          [{totalSecMarks}]
                        </span>
                      </div>

                      {/* Subquestions: (a), (b), (c)... */}
                      <div className="space-y-3 pl-3">
                        {sec.questions?.map((q, qIdx) => {
                          const formattedQMarks = formatQuestionMarks(q.marks || sec.marks_per_question, marksFormat);
                          const subqLetter = `(${String.fromCharCode(97 + qIdx)})`;
                          return (
                            <div key={q.q_number || qIdx} className="group relative flex items-start text-xs sm:text-sm leading-relaxed page-break-inside-avoid">
                              <span className="font-bold font-sans w-8 shrink-0 text-black">
                                {subqLetter}
                              </span>
                              <div className="flex-1 pr-4 space-y-1.5 font-serif text-black">
                                <p className="leading-relaxed">{q.question_text}</p>
                                {q.options && q.options.length > 0 && (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 font-sans text-xs">
                                    {q.options.map((opt, oIdx) => (
                                      <div key={oIdx} className="flex items-start space-x-1">
                                        <span className="font-bold">({String.fromCharCode(97 + oIdx)})</span>
                                        <span>{cleanOptionText(opt)}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {includeSolutions && q.model_answer && (
                                  <div className="mt-2 p-2 bg-slate-50 border-l-2 border-emerald-600 font-sans text-[11px] text-slate-700 italic">
                                    <span className="font-bold text-emerald-800 not-italic">Grading Rubric / Answer Key: </span>
                                    {q.model_answer}
                                  </div>
                                )}
                              </div>
                              <div className="w-20 shrink-0 text-right flex flex-col items-end font-sans">
                                <span className="font-bold text-black text-xs sm:text-sm whitespace-nowrap">
                                  {formattedQMarks}
                                </span>
                                {showBloom && (
                                  <span className="text-[10px] text-slate-500 font-mono mt-0.5 italic">
                                    [{q.blooms_level || 'Apply'}]
                                  </span>
                                )}
                              </div>
                              {/* Edit / Delete Buttons */}
                              <div className="no-print absolute -right-2 top-0 opacity-0 group-hover:opacity-100 transition flex items-center gap-1 bg-white/90 border border-slate-200 rounded-lg p-0.5 shadow-sm">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditQuestion(sIdx, qIdx, q)}
                                  className="p-1 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded"
                                  title="Edit / Rewrite Question"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteQuestion(sIdx, qIdx)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                                  title="Remove Question"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              ) : layout === 'standard' ? (
                /* ============================================================== */
                /* CLASSIC UNIVERSITY EXAM PAPER FORMAT (Default - Authentic Sheet) */
                /* ============================================================== */
                sections.map((sec, sIdx) => (
                  <div key={sec.section_id || sIdx} className="space-y-4 page-break-inside-avoid">
                    {/* Centered Part Header Banner (Rendered ONLY in 'sections' mode, suppressed in 'unified' mode) */}
                    {paperMode === 'sections' && (
                      <div className="text-center border-t-2 border-b-2 border-black py-1.5 my-3 font-sans">
                        <h4 className="font-bold text-xs sm:text-sm uppercase tracking-wide">
                          {sec.title}
                        </h4>
                        <p className="text-[11px] italic text-slate-700 mt-0.5">
                          ({sec.marks_per_question 
                            ? `Answer ${sec.required_count || 'ALL'} questions (${sec.required_count} × ${sec.marks_per_question} = ${sec.total_section_marks || (sec.required_count * sec.marks_per_question)} Marks)`
                            : `Answer ${sec.required_count || 'ALL'} questions (Total ${sec.total_section_marks} Marks)`})
                        </p>
                      </div>
                    )}

                    {/* Clean Question Rows */}
                    <div className="space-y-4 px-1">
                      {sec.questions?.map((q, qIdx) => {
                        const formattedQMarks = formatQuestionMarks(q.marks || sec.marks_per_question, marksFormat);
                        return (
                          <div key={q.q_number || qIdx} className="group relative flex items-start text-xs sm:text-sm leading-relaxed page-break-inside-avoid">
                            {/* Question Number (Q1., Q2., etc.) */}
                            <span className="font-bold font-sans w-9 shrink-0 text-black">
                              {formatQuestionNumber(q.q_number, numberingFormat)}
                            </span>

                            {/* Question Statement & Alternatives */}
                            <div className="flex-1 pr-4 space-y-1.5 font-serif text-black">
                              <p className="leading-relaxed">{q.question_text}</p>
                              
                              {/* MCQ Options formatted in neat grid */}
                              {q.options && q.options.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 font-sans text-xs">
                                  {q.options.map((opt, oIdx) => (
                                    <div key={oIdx} className="flex items-start space-x-1">
                                      <span className="font-bold">({String.fromCharCode(97 + oIdx)})</span>
                                      <span>{cleanOptionText(opt)}</span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Optional Model Solution */}
                              {includeSolutions && q.model_answer && (
                                <div className="mt-2 p-2 bg-slate-50 border-l-2 border-emerald-600 font-sans text-[11px] text-slate-700 italic">
                                  <span className="font-bold text-emerald-800 not-italic">Grading Rubric / Answer Key: </span>
                                  {q.model_answer}
                                </div>
                              )}
                            </div>

                            {/* Marks & Cognitive Level */}
                            <div className="w-20 shrink-0 text-right flex flex-col items-end font-sans">
                              <span className="font-bold text-black text-xs sm:text-sm whitespace-nowrap">
                                {formattedQMarks}
                              </span>
                              {showBloom && (
                                <span className="text-[10px] text-slate-500 font-mono mt-0.5 italic">
                                  [{q.blooms_level || 'Apply'}]
                                </span>
                              )}
                            </div>

                            {/* Interactive Quick-Action Buttons (no-print) */}
                            <div className="no-print absolute -right-2 top-0 opacity-0 group-hover:opacity-100 transition flex items-center gap-1 bg-white/90 border border-slate-200 rounded-lg p-0.5 shadow-sm">
                              <button
                                type="button"
                                onClick={() => handleOpenEditQuestion(sIdx, qIdx, q)}
                                className="p-1 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded"
                                title="Edit / Rewrite Question"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteQuestion(sIdx, qIdx)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                                title="Remove Question"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                /* ============================================================== */
                /* TABULAR FORMAT (Grid Matrix Mode)                              */
                /* ============================================================== */
                sections.map((sec, sIdx) => (
                  <div key={sec.section_id || sIdx} className="space-y-3 page-break-inside-avoid">
                    {paperMode === 'sections' && (
                      <div className="flex items-center justify-between border-b border-black pb-1 pt-2 font-sans">
                        <span className="font-bold text-xs sm:text-sm uppercase tracking-wide">
                          {sec.title}
                        </span>
                        <span className="text-xs font-bold">
                          {sec.marks_per_question 
                            ? `(${sec.required_count} × ${sec.marks_per_question} = ${sec.total_section_marks || (sec.required_count * sec.marks_per_question)} Marks)`
                            : `(${sec.required_count || (sec.questions?.length || 0)} Questions • Total ${sec.total_section_marks} Marks)`}
                        </span>
                      </div>
                    )}

                    <table className="w-full text-left text-xs font-sans border-collapse border border-black">
                      <thead>
                        <tr className="bg-slate-100 border-b border-black font-bold">
                          <th className="p-2 w-14 text-center border-r border-black">Q.No</th>
                          <th className="p-2 border-r border-black">Question Description / Problem Statement</th>
                          {showBloom && <th className="p-2 w-24 text-center border-r border-black">Bloom / CO</th>}
                          <th className="p-2 w-20 text-center">Marks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black">
                        {sec.questions?.map((q, qIdx) => {
                          const formattedQMarks = formatQuestionMarks(q.marks || sec.marks_per_question, marksFormat);
                          return (
                            <tr key={q.q_number || qIdx} className="page-break-inside-avoid align-top group relative">
                              <td className="p-2.5 text-center font-bold border-r border-black font-sans">
                                {formatQuestionNumberTag(q.q_number, numberingFormat)}
                              </td>
                              <td className="p-2.5 border-r border-black space-y-1.5 relative">
                                <p className="font-serif text-sm leading-relaxed text-black">
                                  {q.question_text}
                                </p>
                                {q.options && q.options.length > 0 && (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 pl-2 text-xs font-sans">
                                    {q.options.map((opt, oIdx) => (
                                      <div key={oIdx} className="flex items-start space-x-1">
                                        <span className="font-bold">({String.fromCharCode(97 + oIdx)})</span>
                                        <span>{cleanOptionText(opt)}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {includeSolutions && q.model_answer && (
                                  <div className="mt-2 p-2 bg-slate-50 border border-slate-300 rounded text-[11px] text-slate-700 font-sans italic">
                                    <span className="font-bold text-emerald-800 not-italic">Grading Rubric / Answer Key: </span>
                                    {q.model_answer}
                                  </div>
                                )}

                                {/* Row Edit Controls (no-print) */}
                                <div className="no-print absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition flex items-center gap-1 bg-white border border-slate-200 rounded p-0.5 shadow-sm">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditQuestion(sIdx, qIdx, q)}
                                    className="p-1 text-slate-600 hover:text-indigo-600 rounded"
                                    title="Edit Question"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteQuestion(sIdx, qIdx)}
                                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                    title="Delete Question"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>
                              {showBloom && (
                                <td className="p-2.5 text-center font-mono text-[11px] text-slate-600 border-r border-black">
                                  [{q.blooms_level || 'L2'}]
                                </td>
                              )}
                              <td className="p-2.5 text-center font-bold font-sans whitespace-nowrap">
                                {formattedQMarks}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ))
              )}

              {/* Inline Add Question Action (no-print) */}
              <div className="no-print pt-2">
                <button
                  type="button"
                  onClick={handleOpenAddQuestion}
                  className="w-full py-2.5 border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/40 rounded-xl text-xs font-semibold text-slate-600 hover:text-indigo-600 flex items-center justify-center gap-1.5 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Write and Add Next Question (Q{allQuestions.length + 1})</span>
                </button>
              </div>
            </div>

            {/* Optional: Student OMR Bubble Sheet */}
            {showOmrSheet && (() => {
              const allQ = [];
              sections.forEach(s => (s.questions || []).forEach(q => allQ.push(q)));
              const mcqs = allQ.filter(q => (q.options && q.options.length > 0) || (q.question_type && q.question_type.toLowerCase().includes('mcq')));
              const target = mcqs.length > 0 ? mcqs : allQ;
              if (target.length === 0) return null;

              return (
                <div className="mt-6 border-2 border-black font-sans page-break-inside-avoid">
                  <div className="bg-slate-100 p-2.5 border-b-2 border-black text-center">
                    <div className="font-bold text-xs uppercase tracking-wider text-slate-900">
                      STUDENT OMR RESPONSE SHEET • CONTINUOUS INTERNAL EVALUATION (CIE)
                    </div>
                    <div className="text-[10px] text-slate-600 mt-0.5">
                      Darken bubbles completely with blue/black ballpoint pen: <span className="inline-block w-2.5 h-2.5 bg-black rounded-full align-middle mx-1"></span> Correct &nbsp;|&nbsp; <span className="mx-1">✕</span> Incorrect
                    </div>
                  </div>

                  <div className="p-2.5 border-b border-black text-xs flex justify-between bg-white flex-wrap gap-2">
                    <div><b>Candidate Name:</b> ___________________________</div>
                    <div><b>Roll / Reg No:</b> _________________</div>
                    <div><b>Student Sign:</b> __________</div>
                  </div>

                  {/* 4-column bubble grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-white text-xs">
                    {target.map((q, idx) => {
                      const qNumStr = String(q.q_number || (idx + 1)).padStart(2, '0');
                      return (
                        <div key={idx} className="flex items-center justify-between p-1 border-b border-dotted border-slate-300">
                          <span className="font-bold text-slate-800 font-mono text-[11px]">Q.{qNumStr}</span>
                          <div className="flex gap-1">
                            {['A', 'B', 'C', 'D'].map(letter => (
                              <span key={letter} className="w-4 h-4 rounded-full border border-black flex items-center justify-center font-bold text-[9px] hover:bg-slate-200 cursor-pointer">
                                {letter}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t-2 border-black bg-slate-50 p-2.5 text-xs flex justify-between items-center font-bold flex-wrap gap-2">
                    <div>Attempted: [ &nbsp; ]</div>
                    <div>Correct: [ &nbsp; ]</div>
                    <div>Wrong: [ &nbsp; ]</div>
                    <div className="border border-black px-2.5 py-1 bg-white text-black font-bold">
                      Internal Marks Awarded: &nbsp; &nbsp; &nbsp; &nbsp; / {totalCalculatedMarks}
                    </div>
                    <div>Evaluator Sign: ____________</div>
                  </div>
                </div>
              );
            })()}

            {/* Optional: Master Answer Key */}
            {showAnswerKey && (() => {
              const allQ = [];
              sections.forEach(s => (s.questions || []).forEach(q => allQ.push(q)));
              if (allQ.length === 0) return null;

              return (
                <div className="mt-6 border-2 border-black font-sans text-xs page-break-inside-avoid">
                  <div className="bg-slate-900 text-white p-2.5 flex justify-between items-center font-bold uppercase text-[11px]">
                    <span>Master Answer Key • Continuous Internal Evaluation (CIE)</span>
                    <span className="text-amber-300">Official Evaluator Copy</span>
                  </div>
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-black font-bold">
                        <th className="p-2 w-14 text-center border-r border-black">Q.No</th>
                        <th className="p-2 w-14 text-center border-r border-black">Key</th>
                        <th className="p-2 border-r border-black">Model Answer / Description</th>
                        <th className="p-2 w-44">Curriculum Grounding</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black">
                      {allQ.map((q, idx) => {
                        let keyVal = q.correct_option || '';
                        let ansText = q.model_answer || '';
                        if (!keyVal && ansText) {
                          const match = ansText.match(/Option\s*([A-D])/i);
                          if (match) keyVal = match[1].toUpperCase();
                        }
                        return (
                          <tr key={idx}>
                            <td className="p-2 text-center font-bold border-r border-black">{formatQuestionNumberTag(q.q_number, numberingFormat)}</td>
                            <td className="p-2 text-center font-bold border-r border-black bg-slate-50 font-mono text-sm">{keyVal || '-'}</td>
                            <td className="p-2 border-r border-black text-[11px]">{ansText || 'Refer to text'}</td>
                            <td className="p-2 text-[10px] text-slate-600">Unit {q.unit_number || 1}: {q.topic || ''}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}

            {/* SGU Total Marks Banner */}
            {layout === 'sgu' && (
              <div className="mt-6 text-center border-t-2 border-b-2 border-black py-2 font-sans font-bold text-xs sm:text-sm tracking-wider">
                TOTAL: {totalCalculatedMarks} MARKS
              </div>
            )}

            {/* 5. End of Paper Notice */}
            <div className="mt-8 pt-4 border-t border-black text-center text-xs font-sans space-y-1">
              <p className="font-bold tracking-widest text-slate-700 uppercase">
                ********** END OF QUESTION PAPER **********
              </p>
              <p className="text-[10px] text-slate-500 uppercase">
                CONFIDENTIAL &bull; ACADEMIC EXAMINATION DOCUMENT &bull; DO NOT DUPLICATE
              </p>
            </div>

          </div>
        </div>

        {/* Bottom Footer Action Bar (no-print) */}
        <div className="no-print bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Tip: Press <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono text-[10px]">Ctrl+P</kbd> or click <b>Print Paper</b>. Format applied: <b>{paperMode === 'unified' ? 'Continuous (Q1, Q2... No Part A)' : 'Sectioned (Part A, B...)'}</b> with <b>{numberingFormat}</b> numbering.
          </span>
          <button
            type="button"
            onClick={handlePrint}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl font-bold flex items-center gap-1.5 shadow-md shadow-indigo-200 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save as PDF</span>
          </button>
        </div>

      </div>

      {/* ============================================================== */}
      {/* WRITE QUESTION MODAL (Academic Examination Writing Format)     */}
      {/* ============================================================== */}
      {isWriteModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-up">
            
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>{editingTarget !== null ? 'Edit / Rewrite Question' : 'Write Question (Academic Exam Format)'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter question statement, marks weightage, and Bloom's cognitive taxonomy level.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsWriteModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestionSubmit} className="space-y-3.5 text-xs">
              
              {/* Question Number & Marks Row */}
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Q. Number</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={writeForm.q_number}
                    onChange={(e) => setWriteForm({ ...writeForm, q_number: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Marks</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={writeForm.marks}
                    onChange={(e) => setWriteForm({ ...writeForm, marks: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Question Type</label>
                  <select
                    value={writeForm.question_type}
                    onChange={(e) => setWriteForm({ ...writeForm, question_type: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg font-medium text-slate-800 bg-white"
                  >
                    <option value="Short Answer">Short Answer</option>
                    <option value="MCQ">MCQ (Objective)</option>
                    <option value="Long Answer">Long Answer / Descriptive</option>
                    <option value="Problem Solving">Problem Solving</option>
                  </select>
                </div>
              </div>

              {/* Bloom Level & Topic */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bloom's Taxonomy Level</label>
                  <select
                    value={writeForm.blooms_level}
                    onChange={(e) => setWriteForm({ ...writeForm, blooms_level: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg font-medium text-slate-800 bg-white"
                  >
                    <option value="Remember">Remember (L1 - Recall/Define)</option>
                    <option value="Understand">Understand (L2 - Explain/Discuss)</option>
                    <option value="Apply">Apply (L3 - Calculate/Solve)</option>
                    <option value="Analyze">Analyze (L4 - Compare/Differentiate)</option>
                    <option value="Evaluate">Evaluate (L5 - Critically Assess)</option>
                    <option value="Create">Create (L6 - Design/Formulate)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Curriculum Topic / Keyword</label>
                  <input
                    type="text"
                    value={writeForm.topic}
                    onChange={(e) => setWriteForm({ ...writeForm, topic: e.target.value })}
                    placeholder="e.g. Normalization (1NF/BCNF)"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              {/* Question Statement */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Question Statement / Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={writeForm.question_text}
                  onChange={(e) => setWriteForm({ ...writeForm, question_text: e.target.value })}
                  placeholder="e.g. Explain the rules and significance of First Normal Form (1NF) in relational database normalization."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-serif leading-relaxed focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* MCQ Options if MCQ */}
              {writeForm.question_type === 'MCQ' && (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <span className="font-semibold text-slate-700 block">MCQ Alternatives:</span>
                  <div className="grid grid-cols-2 gap-2">
                    {['A', 'B', 'C', 'D'].map((letter, idx) => (
                      <div key={letter} className="flex items-center space-x-1.5">
                        <span className="font-bold text-slate-600 w-4">({letter})</span>
                        <input
                          type="text"
                          value={writeForm.options[idx] || ''}
                          onChange={(e) => {
                            const newOpts = [...writeForm.options];
                            newOpts[idx] = e.target.value;
                            setWriteForm({ ...writeForm, options: newOpts });
                          }}
                          placeholder={`Option ${letter}`}
                          className="flex-1 px-2 py-1 border border-slate-300 rounded text-xs bg-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Model Answer / Rubric */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Model Answer / Grading Rubric (Optional)
                </label>
                <textarea
                  rows={2}
                  value={writeForm.model_answer}
                  onChange={(e) => setWriteForm({ ...writeForm, model_answer: e.target.value })}
                  placeholder="Key concepts, formula, or steps required to award full marks."
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsWriteModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Question to Paper</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
