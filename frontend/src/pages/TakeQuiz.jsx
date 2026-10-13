import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, CheckCircle2, XCircle, AlertTriangle, HelpCircle, 
  ArrowRight, ArrowLeft, Send, Award, BookOpen, Flag, 
  RotateCcw, Printer, Share2, ShieldAlert, Sparkles, ChevronRight, Check
} from 'lucide-react';
import { api } from '../services/api';

export default function TakeQuiz({ quizCode, onExit }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quiz, setQuiz] = useState(null);

  // Flow stages: 'lobby' | 'taking' | 'submitting' | 'result'
  const [stage, setStage] = useState('lobby');

  // Student lobby form
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [studentEmail, setStudentEmail] = useState('');

  // Active quiz state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [questionId]: 'A' | 'B' | ... }
  const [flagged, setFlagged] = useState({}); // { [questionId]: true }
  const [secondsRemaining, setSecondsRemaining] = useState(1200);
  const [startTime, setStartTime] = useState(null);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  // Result state
  const [resultData, setResultData] = useState(null);

  const timerRef = useRef(null);

  // Load public quiz details
  useEffect(() => {
    async function fetchQuiz() {
      try {
        setLoading(true);
        setError('');
        const data = await api.getPublicQuiz(quizCode);
        if (!data.is_active) {
          setError(data.message || 'This quiz is closed by the instructor.');
          setQuiz(data);
          return;
        }
        setQuiz(data);
        setSecondsRemaining((data.duration_minutes || 20) * 60);
      } catch (err) {
        setError(err.message || 'Failed to load quiz');
      } finally {
        setLoading(false);
      }
    }

    if (quizCode) {
      fetchQuiz();
    }
  }, [quizCode]);

  // Countdown timer logic
  useEffect(() => {
    if (stage === 'taking') {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleSubmitQuiz(true); // auto submit on time expiration
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stage]);

  const handleStartExam = (e) => {
    e.preventDefault();
    if (!studentName.trim() || !studentId.trim()) {
      alert('Please enter your full name and student roll number / registration ID.');
      return;
    }
    setStartTime(Date.now());
    setStage('taking');
  };

  const handleSelectOption = (qId, optionLetter) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: optionLetter
    }));
  };

  const handleClearAnswer = (qId) => {
    setAnswers((prev) => {
      const copy = { ...prev };
      delete copy[qId];
      return copy;
    });
  };

  const toggleFlag = (qId) => {
    setFlagged((prev) => ({
      ...prev,
      [qId]: !prev[qId]
    }));
  };

  const handleSubmitQuiz = async (isAuto = false) => {
    if (stage === 'submitting' || stage === 'result') return;
    if (timerRef.current) clearInterval(timerRef.current);

    setStage('submitting');
    setShowConfirmSubmit(false);

    const timeSpent = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;

    try {
      const payload = {
        student_name: studentName,
        student_id: studentId,
        student_email: studentEmail,
        time_spent_seconds: timeSpent,
        answers: answers
      };

      const res = await api.submitPublicQuiz(quizCode, payload);
      setResultData(res);
      setStage('result');
    } catch (err) {
      alert('Error submitting responses: ' + err.message);
      setStage('taking');
    }
  };

  // Helper formatting for timer mm:ss
  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Extract letter from option label (e.g. "A) Apple" -> letter: "A", text: "Apple")
  const parseOption = (optText, idx) => {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    const fallbackLetter = letters[idx] || `${idx + 1}`;
    const cleanStr = String(optText).trim();
    const match = cleanStr.match(/^([A-Da-d])[\)\.\:\-]\s*(.*)$/);
    if (match) {
      return { letter: match[1].toUpperCase(), text: match[2] || cleanStr };
    }
    return { letter: fallbackLetter, text: cleanStr };
  };

  // =========================================================================
  // RENDER: Loading or Error
  // =========================================================================
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-slate-800">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Connecting to Assessment Portal...</h2>
          <p className="text-xs text-slate-500">Loading verified syllabus questions for {quizCode}</p>
        </div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full text-center space-y-4 text-slate-800 shadow-xl">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Assessment Inaccessible</h2>
          <p className="text-xs text-slate-600 leading-relaxed">{error}</p>
          <div className="pt-2">
            {onExit ? (
              <button
                onClick={onExit}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl text-xs transition border border-slate-200"
              >
                Return to Dashboard
              </button>
            ) : (
              <a
                href="/"
                className="inline-block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl text-xs transition shadow-sm"
              >
                Go to ExamForge Home
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  const questions = quiz.questions || [];
  const currentQ = questions[currentIndex] || {};
  const answeredCount = Object.keys(answers).length;
  const flaggedCount = Object.values(flagged).filter(Boolean).length;
  const unansweredCount = questions.length - answeredCount;

  // =========================================================================
  // RENDER: STAGE 1 - LOBBY / REGISTRATION
  // =========================================================================
  if (stage === 'lobby') {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between p-4 sm:p-8 font-sans">
        <div className="max-w-2xl w-full mx-auto space-y-6 my-auto py-8">
          
          {/* Header Badge */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div className="flex items-center space-x-2">
              <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                🎓 ExamForge AI Assessment
              </span>
              <span className="text-xs font-mono text-slate-500">Code: {quiz.quiz_code}</span>
            </div>
            {onExit && (
              <button onClick={onExit} className="text-xs text-slate-500 hover:text-slate-800 underline">
                Exit Portal
              </button>
            )}
          </div>

          {/* Exam Details Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-5 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-indigo-50 rounded-full blur-3xl pointer-events-none" />

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
                {quiz.course_code} &bull; {quiz.course_name || 'Academic Course'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3 tracking-tight">
                {quiz.title}
              </h1>
              {quiz.description && (
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {quiz.description}
                </p>
              )}
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-center">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-medium">Total Questions</span>
                <span className="text-lg font-bold text-slate-900">{questions.length} MCQs</span>
              </div>
              <div className="border-x border-slate-200">
                <span className="text-[10px] text-slate-500 block uppercase font-medium">Time Limit</span>
                <span className="text-lg font-bold text-amber-600">{quiz.duration_minutes} Mins</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-medium">Pass Mark</span>
                <span className="text-lg font-bold text-emerald-600">{quiz.pass_percentage}%</span>
              </div>
            </div>

            {/* Student Registration Form */}
            <form onSubmit={handleStartExam} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Student Roll No / ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 21CS042"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Email Address <span className="text-slate-400 font-normal">(Optional for scorecard receipt)</span>
                </label>
                <input
                  type="email"
                  placeholder="e.g. student@college.edu"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Instructions */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 space-y-1">
                <p className="font-semibold text-slate-700">Examination Instructions:</p>
                <ul className="list-disc list-inside space-y-0.5 pl-1">
                  <li>Timer begins immediately upon clicking the button below.</li>
                  <li>All questions are single-choice objective questions.</li>
                  <li>You may navigate forward, backward, or flag questions for review.</li>
                  <li>Auto-submission triggers when the timer reaches 00:00.</li>
                </ul>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition transform hover:-translate-y-0.5"
              >
                <span>🚀 Begin Examination Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          <p className="text-center text-[11px] text-slate-500">
            ExamForge AI Automated Academic Assessment Engine &bull; Strictly Grounded in Curriculum
          </p>
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER: STAGE 2 - ACTIVE QUIZ PLAYER
  // =========================================================================
  if (stage === 'taking' || stage === 'submitting') {
    const isTimeLow = secondsRemaining < 180; // under 3 mins

    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
        
        {/* Top Navbar */}
        <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-lg">
              {quiz.course_code}
            </span>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                {quiz.title}
              </h2>
              <p className="text-[10px] text-slate-500">
                Candidate: <b className="text-slate-700">{studentName}</b> ({studentId})
              </p>
            </div>
          </div>

          {/* Live Timer & Finish Button */}
          <div className="flex items-center space-x-3">
            <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold border transition ${
              isTimeLow 
                ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse' 
                : 'bg-slate-100 border-slate-200 text-amber-700'
            }`}>
              <Clock className={`w-3.5 h-3.5 ${isTimeLow ? 'text-rose-600' : 'text-amber-600'}`} />
              <span>{formatTimer(secondsRemaining)}</span>
            </div>

            <button
              onClick={() => setShowConfirmSubmit(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow transition flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Submit Test</span>
            </button>
          </div>
        </header>

        {/* Main Quiz Area: Split View (Question + Question Palette) */}
        <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Main Question Card (Columns 1-3) */}
          <div className="lg:col-span-3 flex flex-col justify-between space-y-6">
            
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
              
              {/* Question metadata row */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center space-x-2">
                  <span className="bg-indigo-600 text-white font-extrabold text-xs px-2.5 py-1 rounded-lg">
                    Question {currentIndex + 1} of {questions.length}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                    +{currentQ.marks || 1} Mark
                  </span>
                  {currentQ.blooms_level && (
                    <span className="text-[10px] font-medium text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md hidden sm:inline">
                      {currentQ.blooms_level}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => toggleFlag(currentQ.id || currentIndex + 1)}
                  className={`text-xs px-3 py-1 rounded-lg flex items-center gap-1.5 transition font-semibold ${
                    flagged[currentQ.id || currentIndex + 1]
                      ? 'bg-amber-50 text-amber-700 border border-amber-300'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>{flagged[currentQ.id || currentIndex + 1] ? 'Flagged' : 'Flag'}</span>
                </button>
              </div>

              {/* Question Text */}
              <div className="space-y-2">
                <p className="text-base sm:text-lg font-medium text-slate-900 leading-relaxed">
                  {currentQ.question_text}
                </p>
                {currentQ.topic && (
                  <p className="text-[11px] text-slate-500">
                    Topic: {currentQ.topic}
                  </p>
                )}
              </div>

              {/* Options List */}
              <div className="space-y-3 pt-2">
                {(currentQ.options || []).map((opt, oIdx) => {
                  const { letter, text } = parseOption(opt, oIdx);
                  const isSelected = answers[currentQ.id || currentIndex + 1] === letter;

                  return (
                    <div
                      key={oIdx}
                      onClick={() => handleSelectOption(currentQ.id || currentIndex + 1, letter)}
                      className={`p-4 rounded-2xl border cursor-pointer transition flex items-center space-x-3.5 ${
                        isSelected
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 border transition ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'bg-slate-100 border-slate-200 text-slate-600'
                      }`}>
                        {letter}
                      </div>
                      <span className="text-xs sm:text-sm flex-1 leading-relaxed">
                        {text}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Action row under options */}
              {answers[currentQ.id || currentIndex + 1] && (
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => handleClearAnswer(currentQ.id || currentIndex + 1)}
                    className="text-[11px] text-slate-400 hover:text-slate-600 underline"
                  >
                    Clear my selection
                  </button>
                </div>
              )}

            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition shadow-xs"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <div className="text-xs text-slate-500 font-medium">
                {answeredCount} of {questions.length} Answered
              </div>

              {currentIndex < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white flex items-center gap-1.5 shadow transition"
                >
                  <span>Next Question</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setShowConfirmSubmit(true)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-1.5 shadow transition"
                >
                  <Send className="w-4 h-4" />
                  <span>Review & Finish</span>
                </button>
              )}
            </div>

          </div>

          {/* Right Sidebar: Question Palette & Student Summary (Column 4) */}
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-sm">
              
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Question Palette
                </h3>
                <span className="text-[11px] font-mono font-semibold text-indigo-600">
                  {Math.round((answeredCount / questions.length) * 100)}% Done
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${(answeredCount / questions.length) * 100}%` }}
                />
              </div>

              {/* Legend */}
              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 pt-1">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Answered ({answeredCount})</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                  <span>Unanswered ({unansweredCount})</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>Flagged ({flaggedCount})</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 border border-slate-200" />
                  <span>Current</span>
                </div>
              </div>

              {/* Palette Grid Buttons */}
              <div className="grid grid-cols-5 gap-2 max-h-64 overflow-y-auto p-1">
                {questions.map((q, idx) => {
                  const qId = q.id || idx + 1;
                  const isAnswered = answers[qId] !== undefined;
                  const isFlagged = flagged[qId];
                  const isCurrent = currentIndex === idx;

                  let btnBg = 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100';
                  if (isAnswered) btnBg = 'bg-emerald-600 text-white border-emerald-600';
                  if (isFlagged) btnBg = 'bg-amber-500 text-white border-amber-500';
                  if (isCurrent) btnBg += ' ring-2 ring-indigo-500 ring-offset-2 ring-offset-white';

                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-9 rounded-xl text-xs font-bold border transition flex items-center justify-center ${btnBg}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Submit Test Button */}
              <button
                onClick={() => setShowConfirmSubmit(true)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-sm transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Submit Examination</span>
              </button>

            </div>
          </div>

        </div>

        {/* Confirmation Modal */}
        {showConfirmSubmit && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 text-center space-y-4 text-slate-800 shadow-2xl">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 border border-amber-200 rounded-2xl flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Ready to Submit Examination?</h3>
              
              <div className="bg-slate-50 p-3 rounded-2xl text-xs space-y-1.5 border border-slate-200 text-left">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Questions:</span>
                  <span className="font-bold text-slate-800">{questions.length}</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Questions Answered:</span>
                  <span className="font-bold">{answeredCount}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Unanswered Questions:</span>
                  <span className="font-bold text-slate-800">{unansweredCount}</span>
                </div>
                <div className="flex justify-between text-amber-600 font-medium">
                  <span>Flagged for Review:</span>
                  <span className="font-bold">{flaggedCount}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500">
                Once submitted, responses cannot be altered. Your scorecard will be generated immediately.
              </p>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  onClick={() => setShowConfirmSubmit(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition border border-slate-200"
                >
                  Continue Test
                </button>
                <button
                  onClick={() => handleSubmitQuiz(false)}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow transition"
                >
                  Yes, Submit
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  // =========================================================================
  // RENDER: STAGE 3 - SCORECARD & DETAILED RESULTS
  // =========================================================================
  if (stage === 'result' && resultData) {
    const isPassed = resultData.passed;
    const timeSpentMins = Math.floor((resultData.time_spent_seconds || 0) / 60);
    const timeSpentSecs = (resultData.time_spent_seconds || 0) % 60;

    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-8 font-sans">
        <div className="max-w-3xl w-full mx-auto space-y-6">
          
          {/* Result Banner Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm relative overflow-hidden">
            <div className={`absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 rounded-full blur-3xl pointer-events-none ${
              isPassed ? 'bg-emerald-50' : 'bg-rose-50'
            }`} />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-6 text-center sm:text-left">
              <div className="space-y-1">
                <span className="text-xs font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {resultData.course_code}
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                  {resultData.quiz_title}
                </h1>
                <p className="text-xs text-slate-500">
                  Candidate: <b className="text-slate-700">{resultData.student_name}</b> &bull; Reg: <b className="text-slate-700">{resultData.student_id}</b>
                </p>
              </div>

              {/* Status Badge */}
              <div className={`px-5 py-2.5 rounded-2xl border text-center shadow-xs ${
                isPassed 
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                  : 'bg-rose-50 border-rose-300 text-rose-800'
              }`}>
                <div className="text-xs font-bold uppercase tracking-wider">Verdict</div>
                <div className="text-base font-black">{isPassed ? 'QUALIFIED / PASSED' : 'NEEDS IMPROVEMENT'}</div>
              </div>
            </div>

            {/* Scorecard metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Total Score</span>
                <span className="text-xl font-black text-indigo-600">
                  {resultData.score} / {resultData.total_marks}
                </span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Percentage</span>
                <span className={`text-xl font-black ${isPassed ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {resultData.percentage}%
                </span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Pass Benchmark</span>
                <span className="text-xl font-black text-slate-700">
                  {resultData.pass_percentage}%
                </span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Time Spent</span>
                <span className="text-xl font-black text-amber-600">
                  {timeSpentMins}m {timeSpentSecs}s
                </span>
              </div>
            </div>

            {/* Print / Exit Toolbar */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Scorecard</span>
              </button>

              {onExit ? (
                <button
                  onClick={onExit}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  Return to Dashboard
                </button>
              ) : (
                <a
                  href="/"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  Done &bull; ExamForge
                </a>
              )}
            </div>

          </div>

          {/* Detailed Question Review Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Detailed Academic Solution Review
              </h2>
              <span className="text-xs text-slate-500">
                {resultData.review?.length || 0} Questions Evaluated
              </span>
            </div>

            <div className="space-y-3">
              {(resultData.review || []).map((item, idx) => {
                const isCorrect = item.is_correct;

                return (
                  <div
                    key={idx}
                    className={`bg-white border rounded-2xl p-5 space-y-3 transition shadow-xs ${
                      isCorrect 
                        ? 'border-emerald-200 bg-emerald-50/20' 
                        : 'border-rose-200 bg-rose-50/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                          isCorrect ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                        }`}>
                          {item.q_number}
                        </span>
                        <span className={`text-xs font-bold uppercase tracking-wider ${
                          isCorrect ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                          {isCorrect ? '✓ Correct (+1 Mark)' : '✗ Incorrect (0 Marks)'}
                        </span>
                      </div>

                      {item.blooms_level && (
                        <span className="text-[10px] text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                          {item.blooms_level}
                        </span>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm font-medium text-slate-900 leading-relaxed">
                      {item.question_text}
                    </p>

                    {/* Student Choice vs Correct Choice */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                      <div className={`p-2.5 rounded-xl border ${
                        isCorrect 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                          : 'bg-rose-50 border-rose-200 text-rose-900'
                      }`}>
                        <span className="text-[10px] uppercase font-bold block opacity-75">Your Answer:</span>
                        <span className="font-semibold">Option {item.student_letter || 'Unanswered'}</span>
                      </div>

                      <div className="p-2.5 rounded-xl border bg-slate-50 border-slate-200 text-slate-800">
                        <span className="text-[10px] uppercase font-bold block text-emerald-700">Correct Answer:</span>
                        <span className="font-semibold text-emerald-800">Option {item.correct_letter}</span>
                      </div>
                    </div>

                    {/* Explanation */}
                    {item.explanation && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
                        <b className="text-slate-800">Syllabus Grounding:</b> {item.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    );
  }

  return null;
}
