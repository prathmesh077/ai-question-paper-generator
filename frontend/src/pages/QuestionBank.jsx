import React, { useState, useEffect } from 'react';
import { 
  Database, Search, Filter, PlusCircle, Trash2, 
  Edit3, ShieldAlert, CheckCircle2, AlertTriangle, 
  RefreshCw, Sparkles, BookOpen, X, Printer 
} from 'lucide-react';
import { api } from '../services/api';
import PrintQuestionPaperModal from '../components/PrintQuestionPaperModal';

export default function QuestionBank() {
  const [questions, setQuestions] = useState([]);
  const [syllabi, setSyllabi] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  const [printPaper, setPrintPaper] = useState(null);

  // Filters
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedDiff, setSelectedDiff] = useState('');
  const [selectedBloom, setSelectedBloom] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Form states for new question
  const [newText, setNewText] = useState('');
  const [newCourse, setNewCourse] = useState('CS301');
  const [newUnit, setNewUnit] = useState(1);
  const [newTopic, setNewTopic] = useState('Linear Structures');
  const [newType, setNewType] = useState('Short');
  const [newMarks, setNewMarks] = useState(2);
  const [newDiff, setNewDiff] = useState('Medium');
  const [newBloom, setNewBloom] = useState('Understand');
  const [newModelAnswer, setNewModelAnswer] = useState('');

  // Live Duplicate Check states
  const [dupResult, setDupResult] = useState(null);
  const [checkingDup, setCheckingDup] = useState(false);

  useEffect(() => {
    loadQuestions();
    loadSyllabi();
  }, [selectedCourse, selectedUnit, selectedDiff, selectedBloom, searchQuery]);

  async function loadQuestions() {
    try {
      setLoading(true);
      const params = {};
      if (selectedCourse) params.course_code = selectedCourse;
      if (selectedUnit) params.unit_number = selectedUnit;
      if (selectedDiff) params.difficulty = selectedDiff;
      if (selectedBloom) params.blooms_level = selectedBloom;
      if (searchQuery) params.search = searchQuery;

      const data = await api.getQuestions(params);
      setQuestions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function loadSyllabi() {
    try {
      const data = await api.getSyllabi();
      setSyllabi(data);
    } catch (e) {
      console.error(e);
    }
  }

  // Real-time duplicate check debounced on text input
  useEffect(() => {
    if (!newText || newText.trim().length < 15) {
      setDupResult(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setCheckingDup(true);
        const res = await api.checkDuplicate(newText, newCourse);
        setDupResult(res);
      } catch (e) {
        console.error(e);
      } finally {
        setCheckingDup(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [newText, newCourse]);

  async function handleCreateQuestion(e) {
    e.preventDefault();
    if (dupResult?.is_duplicate) {
      alert("Cannot save: A critical duplicate exists in the database. Please modify wording or concept.");
      return;
    }

    try {
      await api.createQuestion({
        course_code: newCourse,
        unit_number: Number(newUnit),
        topic: newTopic,
        question_text: newText,
        question_type: newType,
        marks: Number(newMarks),
        difficulty: newDiff,
        blooms_level: newBloom,
        model_answer: newModelAnswer
      });
      setIsModalOpen(false);
      setNewText('');
      setNewModelAnswer('');
      setDupResult(null);
      loadQuestions();
      alert("Question successfully added to master question bank!");
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to remove this question?")) return;
    try {
      await api.deleteQuestion(id);
      loadQuestions();
    } catch (err) {
      alert(err.message);
    }
  }

  function handleToggleSelect(id) {
    setSelectedQuestionIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  function handleToggleSelectAll() {
    if (selectedQuestionIds.length === questions.length) {
      setSelectedQuestionIds([]);
    } else {
      setSelectedQuestionIds(questions.map(q => q.id));
    }
  }

  function handlePrintQuestionSet() {
    const questionsToPrint = selectedQuestionIds.length > 0
      ? questions.filter(q => selectedQuestionIds.includes(q.id))
      : questions;

    if (questionsToPrint.length === 0) {
      alert("No questions available to print. Please adjust your filters or add questions.");
      return;
    }

    const activeCourse = syllabi.find(s => s.course_code === selectedCourse);
    const totalMarks = questionsToPrint.reduce((acc, q) => acc + Number(q.marks || 0), 0);

    // Group into sections by unit number
    const unitMap = {};
    questionsToPrint.forEach(q => {
      const u = q.unit_number || 1;
      if (!unitMap[u]) unitMap[u] = [];
      unitMap[u].push(q);
    });

    const sections = Object.keys(unitMap).sort((a, b) => Number(a) - Number(b)).map(unitNum => ({
      section_id: `Unit-${unitNum}`,
      title: `Part / Unit ${unitNum} - ${unitMap[unitNum][0]?.topic || 'Curriculum Topics'}`,
      required_count: unitMap[unitNum].length,
      total_section_marks: unitMap[unitNum].reduce((acc, q) => acc + Number(q.marks || 0), 0),
      questions: unitMap[unitNum].map((q, idx) => ({
        q_number: idx + 1,
        question_text: q.question_text,
        marks: q.marks,
        blooms_level: q.blooms_level,
        difficulty: q.difficulty,
        topic: q.topic,
        unit_number: q.unit_number,
        model_answer: q.model_answer,
        options: q.options || []
      }))
    }));

    const compiledPaper = {
      title: selectedCourse 
        ? `${selectedCourse} - Master Question Paper Set` 
        : 'University Master Question Bank - Examination Set',
      institution_name: 'NATIONAL INSTITUTE OF TECHNOLOGY & SCIENCE',
      department: activeCourse?.department || 'Department of Computer Science & Engineering',
      course_code: selectedCourse || (questionsToPrint[0]?.course_code || 'CS301'),
      course_name: activeCourse?.course_name || 'Question Bank Examination Repository',
      semester: activeCourse?.semester || 'Academic Session 2026-2027',
      academic_year: '2026-2027',
      duration_minutes: 180,
      total_marks: totalMarks,
      instructions: "1. Official Question Paper Set compiled from Master Question Bank.\n2. Cognitive Bloom Taxonomy levels and marks are indicated against each question.\n3. Assume suitable data wherever necessary and state them clearly.\n4. Strictly confidential examination repository.",
      sections: sections
    };

    setPrintPaper(compiledPaper);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Master Question Bank Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize, update, and retrieve questions efficiently with Bloom's taxonomy tags and automated duplicate prevention.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Print Question Paper Set Button */}
          <button
            onClick={handlePrintQuestionSet}
            disabled={questions.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-200 transition active:scale-95"
            title="Print Question Paper Set from active questions"
          >
            <Printer className="w-4 h-4 text-white" />
            <span>
              {selectedQuestionIds.length > 0 
                ? `Print Question Paper Set (${selectedQuestionIds.length} Selected)` 
                : 'Print Question Paper Set'}
            </span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-200 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Question (With Live Anti-Duplicate)</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Search */}
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by keywords, algorithms, topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Course filter */}
          <div>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Courses</option>
              {syllabi.map((s) => (
                <option key={s.id} value={s.course_code}>
                  {s.course_code}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty */}
          <div>
            <select
              value={selectedDiff}
              onChange={(e) => setSelectedDiff(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Difficulties</option>
              <option value="Easy">Easy (Recall / Definition)</option>
              <option value="Medium">Medium (Application / Trace)</option>
              <option value="Hard">Hard (Analysis / Design)</option>
            </select>
          </div>

          {/* Bloom */}
          <div>
            <select
              value={selectedBloom}
              onChange={(e) => setSelectedBloom(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Bloom Levels</option>
              <option value="Remember">Remember (L1)</option>
              <option value="Understand">Understand (L2)</option>
              <option value="Apply">Apply (L3)</option>
              <option value="Analyze">Analyze (L4)</option>
              <option value="Evaluate">Evaluate (L5)</option>
              <option value="Create">Create (L6)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Question Table / Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="select-all-q"
              checked={questions.length > 0 && selectedQuestionIds.length === questions.length}
              onChange={handleToggleSelectAll}
              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="select-all-q" className="font-semibold text-slate-700 cursor-pointer">
              {selectedQuestionIds.length > 0 
                ? `${selectedQuestionIds.length} of ${questions.length} Questions Selected for Set` 
                : `Total Filtered: ${questions.length} Questions`}
            </label>
          </div>

          <div className="flex items-center space-x-2">
            {selectedQuestionIds.length > 0 && (
              <button
                onClick={() => setSelectedQuestionIds([])}
                className="text-xs text-slate-500 hover:text-slate-800 underline pr-1"
              >
                Clear Selection
              </button>
            )}
            <button
              onClick={handlePrintQuestionSet}
              disabled={questions.length === 0}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition active:scale-95"
              title="Print Question Paper Set"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>Print Set</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
            <p className="text-xs">Loading questions...</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Database className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-xs">No questions found matching your filter criteria.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {questions.map((q) => {
              const isSelected = selectedQuestionIds.includes(q.id);
              return (
                <div key={q.id} className={`p-4 hover:bg-slate-50/70 transition space-y-2 ${isSelected ? 'bg-indigo-50/40 border-l-4 border-indigo-600' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelect(q.id)}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer shrink-0"
                      title="Select question for Question Paper Set"
                    />
                    <div className="flex-1 space-y-1.5">
                      <p className="text-xs font-medium text-slate-900 leading-relaxed cursor-pointer" onClick={() => handleToggleSelect(q.id)}>
                        {q.question_text}
                      </p>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded">
                        {q.course_code}
                      </span>
                      <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded">
                        Unit {q.unit_number}: {q.topic}
                      </span>
                      <span className="bg-purple-50 text-purple-700 text-[10px] font-semibold px-2 py-0.5 rounded">
                        Bloom: {q.blooms_level}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        q.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-700' :
                        q.difficulty === 'Medium' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {q.difficulty}
                      </span>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                        {q.marks} Marks
                      </span>
                      <span className="text-[10px] text-slate-400 pl-2">
                        Used in {q.usage_count || 0} examination papers
                      </span>
                    </div>

                    {q.model_answer && (
                      <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1">
                        <b>Model Outline:</b> {q.model_answer}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => handleDelete(q.id)}
                    className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition shrink-0"
                    title="Delete Question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>

      {/* Modal: Add New Question with Live Anti-Duplicate Engine */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Add New Question</h3>
                <p className="text-xs text-slate-500">Live duplicate detection monitors text while you type</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuestion} className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Course Code</label>
                  <select
                    value={newCourse}
                    onChange={(e) => setNewCourse(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 border border-slate-200 rounded-lg"
                  >
                    {syllabi.map((s) => (
                      <option key={s.id} value={s.course_code}>{s.course_code}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Unit Number</label>
                  <select
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 border border-slate-200 rounded-lg"
                  >
                    {[1, 2, 3, 4, 5].map((u) => (
                      <option key={u} value={u}>Unit {u}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Marks</label>
                  <input
                    type="number"
                    min={1}
                    value={newMarks}
                    onChange={(e) => setNewMarks(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Difficulty</label>
                  <select
                    value={newDiff}
                    onChange={(e) => setNewDiff(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 border border-slate-200 rounded-lg"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Topic Name</label>
                  <input
                    type="text"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    required
                    className="w-full text-xs px-2.5 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Bloom's Taxonomy</label>
                  <select
                    value={newBloom}
                    onChange={(e) => setNewBloom(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 border border-slate-200 rounded-lg"
                  >
                    <option value="Remember">Remember (L1)</option>
                    <option value="Understand">Understand (L2)</option>
                    <option value="Apply">Apply (L3)</option>
                    <option value="Analyze">Analyze (L4)</option>
                    <option value="Evaluate">Evaluate (L5)</option>
                    <option value="Create">Create (L6)</option>
                  </select>
                </div>
              </div>

              {/* Question Text with Live Duplicate Feedback */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Question Text / Problem Statement
                </label>
                <textarea
                  rows={4}
                  required
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="e.g. Define Big-O notation and explain how it characterizes upper bound of algorithm..."
                  className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
                />

                {/* Real-time Duplicate Status Banner */}
                {checkingDup && (
                  <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin text-indigo-600" />
                    <span>Scanning master bank and past examination papers for duplicates...</span>
                  </p>
                )}

                {dupResult && !checkingDup && (
                  <div className={`mt-2 p-3 rounded-xl border text-xs space-y-1 ${
                    dupResult.is_duplicate 
                      ? 'bg-rose-50 border-rose-200 text-rose-900' 
                      : dupResult.highest_similarity > 0.45 
                      ? 'bg-amber-50 border-amber-200 text-amber-900' 
                      : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  }`}>
                    <div className="flex items-center justify-between font-semibold">
                      <div className="flex items-center space-x-1.5">
                        {dupResult.is_duplicate ? (
                          <ShieldAlert className="w-4 h-4 text-rose-600" />
                        ) : dupResult.highest_similarity > 0.45 ? (
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        )}
                        <span>
                          {dupResult.is_duplicate ? 'High Duplicate Risk Detected!' : 'Question Uniqueness Confirmed'}
                        </span>
                      </div>
                      <span className="font-mono text-xs">
                        Similarity: {Math.round(dupResult.highest_similarity * 100)}%
                      </span>
                    </div>

                    {dupResult.matches && dupResult.matches.length > 0 && (
                      <div className="pt-1 text-[11px]">
                        <p className="font-medium">Top Match from {dupResult.matches[0].source_type}:</p>
                        <p className="italic text-slate-700 bg-white/70 p-1.5 rounded mt-0.5">
                          "{dupResult.matches[0].existing_question_text}"
                        </p>
                        <p className="mt-1 font-semibold">{dupResult.matches[0].recommendation}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Model Answer / Solution Outline (Optional)
                </label>
                <textarea
                  rows={2}
                  value={newModelAnswer}
                  onChange={(e) => setNewModelAnswer(e.target.value)}
                  placeholder="Official grading rubric / key formulas / reference answer..."
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={dupResult?.is_duplicate}
                  className={`px-5 py-2 rounded-xl text-xs font-semibold text-white transition ${
                    dupResult?.is_duplicate ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200'
                  }`}
                >
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Print Question Paper Set */}
      {printPaper && (
        <PrintQuestionPaperModal
          paper={printPaper}
          onClose={() => setPrintPaper(null)}
        />
      )}
    </div>
  );
}
