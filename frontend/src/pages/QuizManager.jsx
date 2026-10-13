import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, Share2, Plus, Copy, Check, ExternalLink, 
  Trash2, RefreshCw, Users, Award, Clock, CheckCircle2, 
  XCircle, QrCode, ToggleLeft, ToggleRight, Sparkles, 
  BookOpen, Eye, X, ChevronRight, Search, FileText
} from 'lucide-react';
import { api } from '../services/api';
import QuizLinkShareModal from '../components/QuizLinkShareModal';

export default function QuizManager({ onOpenQuiz, setActiveTab }) {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Modals state
  const [shareQuiz, setShareQuiz] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewSubmissionsQuiz, setViewSubmissionsQuiz] = useState(null);
  const [submissionsData, setSubmissionsData] = useState(null);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [selectedStudentReview, setSelectedStudentReview] = useState(null);

  // Creation form state
  const [createMode, setCreateMode] = useState('from_paper'); // 'from_paper' | 'ai_generate'
  const [papersList, setPapersList] = useState([]);
  const [selectedPaperId, setSelectedPaperId] = useState('');
  const [syllabiList, setSyllabiList] = useState([]);
  const [aiForm, setAiForm] = useState({
    course_code: 'CS301',
    title: 'Data Structures Quick CIE Assessment',
    question_count: 10,
    duration_minutes: 15,
    pass_percentage: 40
  });
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadQuizzes();
    loadPapersAndSyllabi();
  }, []);

  async function loadQuizzes() {
    try {
      setLoading(true);
      const data = await api.getQuizzes();
      setQuizzes(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function loadPapersAndSyllabi() {
    try {
      const [papers, syllabi] = await Promise.all([
        api.getPapers(),
        api.getSyllabi()
      ]);
      setPapersList(papers);
      setSyllabiList(syllabi);
      if (papers.length > 0) setSelectedPaperId(papers[0].id);
    } catch (e) {
      console.error(e);
    }
  }

  const handleCopyLink = (quiz) => {
    const origin = window.location.origin || 'http://localhost:5173';
    const link = `${origin}/?quiz=${quiz.quiz_code}`;
    navigator.clipboard.writeText(link);
    setCopiedId(quiz.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleToggleStatus = async (quiz) => {
    try {
      await api.toggleQuizStatus(quiz.id, !quiz.is_active);
      loadQuizzes();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm("Are you sure you want to delete this quiz link and all student submissions?")) return;
    try {
      await api.deleteQuiz(quizId);
      loadQuizzes();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleViewSubmissions = async (quiz) => {
    try {
      setViewSubmissionsQuiz(quiz);
      setLoadingSubmissions(true);
      setSelectedStudentReview(null);
      const data = await api.getQuizSubmissions(quiz.quiz_code);
      setSubmissionsData(data);
    } catch (e) {
      alert(e.message);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleCreateFromPaper = async (e) => {
    e.preventDefault();
    if (!selectedPaperId) return;
    try {
      setGenerating(true);
      const res = await api.generateQuizFromPaper(selectedPaperId);
      setShowCreateModal(false);
      await loadQuizzes();
      // Open share modal immediately!
      const newQuiz = {
        quiz_code: res.quiz_code,
        title: res.title,
        course_code: res.course_code,
        course_name: res.course_name,
        duration_minutes: res.duration_minutes,
        total_marks: res.total_marks,
        questions_count: res.questions_count
      };
      setShareQuiz(newQuiz);
    } catch (e) {
      alert(e.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleCreateWithAI = async (e) => {
    e.preventDefault();
    try {
      setGenerating(true);
      const res = await api.generateAIQuiz(aiForm);
      setShowCreateModal(false);
      await loadQuizzes();
      const newQuiz = {
        quiz_code: res.quiz_code,
        title: res.title,
        course_code: res.course_code,
        duration_minutes: res.duration_minutes,
        total_marks: res.total_marks,
        questions_count: res.questions_count
      };
      setShareQuiz(newQuiz);
    } catch (e) {
      alert(e.message);
    } finally {
      setGenerating(false);
    }
  };

  // Aggregated performance statistics
  const totalAttempts = quizzes.reduce((sum, q) => sum + (q.attempts_count || 0), 0);
  const activeQuizzesCount = quizzes.filter(q => q.is_active).length;
  const avgPerformance = quizzes.length > 0
    ? Math.round(quizzes.reduce((sum, q) => sum + (q.average_score || 0), 0) / quizzes.length)
    : 0;

  const filteredQuizzes = quizzes.filter(q => 
    q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.course_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.quiz_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900">Online Quiz Links & Testing Hub</h1>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full">
              Live Links
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Generate shareable student quiz URLs with real-time automated evaluation, QR codes, and instant leaderboards.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadQuizzes}
            className="p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition"
            title="Refresh Quiz Links"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-200 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Quiz Link</span>
          </button>
        </div>
      </div>

      {/* Analytics KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">Active Quiz Links</span>
            <span className="text-lg font-bold text-slate-900">{activeQuizzesCount} / {quizzes.length}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">Student Submissions</span>
            <span className="text-lg font-bold text-slate-900">{totalAttempts} Attempts</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">Average Class Score</span>
            <span className="text-lg font-bold text-purple-700">{avgPerformance}%</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">Automated Grading</span>
            <span className="text-lg font-bold text-emerald-600">100% Instant</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by quiz title, course code, or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-sm"
          />
        </div>

        <span className="text-xs text-slate-500">
          Showing <b>{filteredQuizzes.length}</b> quiz links
        </span>
      </div>

      {/* Quiz Cards Grid */}
      {loading ? (
        <div className="p-16 text-center text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
          <p className="text-xs">Loading active examination quiz links...</p>
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <div className="bg-white p-16 rounded-3xl border border-slate-200 text-center space-y-3">
          <HelpCircle className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No Quiz Links Generated Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            You can convert any generated examination paper into a live online quiz link with 1 click, or generate a fresh AI quiz.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow"
          >
            Create Your First Quiz Link
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredQuizzes.map((quiz) => {
            const origin = window.location.origin || 'http://localhost:5173';
            const shareUrl = `${origin}/?quiz=${quiz.quiz_code}`;
            const isCopied = copiedId === quiz.id;

            return (
              <div
                key={quiz.id}
                className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Top status bar */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-md">
                      {quiz.course_code}
                    </span>

                    <button
                      onClick={() => handleToggleStatus(quiz)}
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 transition ${
                        quiz.is_active
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                      title="Click to toggle active / closed"
                    >
                      {quiz.is_active ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-slate-400" />}
                      <span>{quiz.is_active ? 'Active & Open' : 'Closed'}</span>
                    </button>
                  </div>

                  {/* Title & Metadata */}
                  <h3 className="text-sm font-bold text-slate-900 mt-2.5 leading-snug line-clamp-2">
                    {quiz.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {quiz.course_name || 'Academic Examination'}
                  </p>

                  {/* Specs Pill */}
                  <div className="grid grid-cols-3 gap-1.5 p-2 bg-slate-50 border border-slate-100 rounded-xl text-center text-[11px] mt-3">
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase">Questions</span>
                      <span className="font-bold text-slate-800">{quiz.questions_count} MCQs</span>
                    </div>
                    <div className="border-x border-slate-200">
                      <span className="text-[9px] text-slate-400 block uppercase">Duration</span>
                      <span className="font-bold text-slate-800">{quiz.duration_minutes}m</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase">Attempts</span>
                      <span className="font-bold text-indigo-600">{quiz.attempts_count}</span>
                    </div>
                  </div>

                  {/* Shareable Link Box */}
                  <div className="mt-3.5 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-semibold">Student Link:</span>
                      <span className="font-mono text-[10px] text-slate-400">{quiz.quiz_code}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                      <div className="flex-1 text-[11px] font-mono text-slate-700 truncate px-1 select-all">
                        {shareUrl}
                      </div>
                      <button
                        onClick={() => handleCopyLink(quiz)}
                        className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition shrink-0 ${
                          isCopied 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-white hover:bg-slate-200 text-slate-700 shadow-xs'
                        }`}
                        title="Copy link to clipboard"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-indigo-600" />}
                      </button>
                    </div>
                  </div>

                  {/* Performance Summary */}
                  {quiz.attempts_count > 0 && (
                    <div className="mt-3 p-2 bg-indigo-50/70 border border-indigo-100 rounded-xl text-[11px] flex items-center justify-between text-indigo-900">
                      <span>Avg Score: <b>{quiz.average_score}%</b></span>
                      <span>Pass Rate: <b>{quiz.pass_rate}%</b></span>
                      <span>High: <b>{quiz.highest_score}%</b></span>
                    </div>
                  )}
                </div>

                {/* Bottom Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleViewSubmissions(quiz)}
                      className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 transition"
                      title="View Student Submissions and Leaderboard"
                    >
                      <Users className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Results ({quiz.attempts_count})</span>
                    </button>

                    <button
                      onClick={() => setShareQuiz(quiz)}
                      className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      title="Share & QR Code"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        if (onOpenQuiz) onOpenQuiz(quiz.quiz_code);
                        else window.open(shareUrl, '_blank');
                      }}
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                      title="Preview Test as Student"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleDeleteQuiz(quiz.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Delete Quiz"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Generate New Quiz Link */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                  <Plus className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Generate Student Quiz Link</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switch Tabs */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setCreateMode('from_paper')}
                className={`py-2 rounded-lg transition ${
                  createMode === 'from_paper' 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                From Exam Paper (1-Click)
              </button>
              <button
                type="button"
                onClick={() => setCreateMode('ai_generate')}
                className={`py-2 rounded-lg transition ${
                  createMode === 'ai_generate' 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🤖 AI Syllabus Generator
              </button>
            </div>

            {/* TAB 1: From Existing Paper */}
            {createMode === 'from_paper' && (
              <form onSubmit={handleCreateFromPaper} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">
                    Select Examination Paper from Repository:
                  </label>
                  <select
                    value={selectedPaperId}
                    onChange={(e) => setSelectedPaperId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  >
                    {papersList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.course_code}: {p.title} ({p.total_marks}M / {p.duration_minutes}m)
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400">
                    Instantly extracts all objective multiple-choice and short questions from this paper and generates an active student link.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={generating || !selectedPaperId}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-200 transition"
                >
                  {generating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Generating Quiz Link...</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      <span>Generate Shareable Quiz Link</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* TAB 2: AI Syllabus Generator */}
            {createMode === 'ai_generate' && (
              <form onSubmit={handleCreateWithAI} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Course / Syllabus:</label>
                  <select
                    value={aiForm.course_code}
                    onChange={(e) => setAiForm({ ...aiForm, course_code: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  >
                    {syllabiList.map((s) => (
                      <option key={s.id} value={s.course_code}>
                        {s.course_code} &mdash; {s.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Quiz Title:</label>
                  <input
                    type="text"
                    required
                    value={aiForm.title}
                    onChange={(e) => setAiForm({ ...aiForm, title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Questions:</label>
                    <select
                      value={aiForm.question_count}
                      onChange={(e) => setAiForm({ ...aiForm, question_count: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs"
                    >
                      <option value={5}>5 MCQs</option>
                      <option value={10}>10 MCQs</option>
                      <option value={15}>15 MCQs</option>
                      <option value={20}>20 MCQs</option>
                      <option value={25}>25 MCQs</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Time Limit:</label>
                    <select
                      value={aiForm.duration_minutes}
                      onChange={(e) => setAiForm({ ...aiForm, duration_minutes: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs"
                    >
                      <option value={10}>10 Mins</option>
                      <option value={15}>15 Mins</option>
                      <option value={20}>20 Mins</option>
                      <option value={30}>30 Mins</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Pass Mark:</label>
                    <select
                      value={aiForm.pass_percentage}
                      onChange={(e) => setAiForm({ ...aiForm, pass_percentage: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs"
                    >
                      <option value={35}>35%</option>
                      <option value={40}>40%</option>
                      <option value={50}>50%</option>
                      <option value={60}>60%</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={generating}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-200 transition"
                >
                  {generating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Synthesizing MCQs from Syllabus...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-indigo-200" />
                      <span>Synthesize with AI & Generate Link</span>
                    </>
                  )}
                </button>
              </form>
            )}

          </div>
        </div>
      )}

      {/* Modal: View Submissions Leaderboard */}
      {viewSubmissionsQuiz && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                  {viewSubmissionsQuiz.course_code} &bull; Code: {viewSubmissionsQuiz.quiz_code}
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Student Submissions & Performance Leaderboard
                </h3>
              </div>
              <button onClick={() => setViewSubmissionsQuiz(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingSubmissions ? (
              <div className="p-16 text-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
                <p className="text-xs">Fetching candidate submissions...</p>
              </div>
            ) : !submissionsData || submissionsData.submissions?.length === 0 ? (
              <div className="p-16 text-center space-y-2">
                <Users className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700">No Student Submissions Yet</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Share the quiz link with students. As soon as candidates finish the test, their scores and answer sheets will appear here in real time.
                </p>
                <button
                  onClick={() => {
                    setShareQuiz(viewSubmissionsQuiz);
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs mt-2"
                >
                  Copy & Share Quiz Link
                </button>
              </div>
            ) : (
              <div className="overflow-y-auto space-y-4 flex-1 pr-1">
                {/* Stats summary bar */}
                <div className="grid grid-cols-4 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Submissions</span>
                    <span className="font-bold text-slate-800">{submissionsData.total_submissions}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Average Score</span>
                    <span className="font-bold text-indigo-600">{submissionsData.average_score}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Highest Score</span>
                    <span className="font-bold text-emerald-600">{submissionsData.highest_score}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Qualified</span>
                    <span className="font-bold text-slate-800">{submissionsData.pass_count} Passed</span>
                  </div>
                </div>

                {/* Submissions Table */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 w-12 text-center">Rank</th>
                        <th className="py-2.5 px-3">Student Name</th>
                        <th className="py-2.5 px-3">Roll No / ID</th>
                        <th className="py-2.5 px-3 text-center">Score</th>
                        <th className="py-2.5 px-3 text-center">Percentage</th>
                        <th className="py-2.5 px-3 text-center">Result</th>
                        <th className="py-2.5 px-3 text-center">Time</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {submissionsData.submissions.map((sub) => {
                        const mins = Math.floor(sub.time_spent_seconds / 60);
                        const secs = sub.time_spent_seconds % 60;

                        return (
                          <tr key={sub.id} className="hover:bg-slate-50 transition">
                            <td className="py-2.5 px-3 text-center font-bold text-slate-500">
                              #{sub.rank}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-slate-900">
                              {sub.student_name}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-600">
                              {sub.student_id}
                            </td>
                            <td className="py-2.5 px-3 text-center font-semibold text-slate-900">
                              {sub.score} / {sub.total_marks}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold">
                              <span className={sub.passed ? 'text-emerald-600' : 'text-rose-600'}>
                                {sub.percentage}%
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                sub.passed 
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}>
                                {sub.passed ? 'Passed' : 'Failed'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-500">
                              {mins}m {secs}s
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                onClick={() => setSelectedStudentReview(sub)}
                                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg text-[11px] transition"
                              >
                                View Sheet
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Student Individual Review Sheet Drawer/View */}
                {selectedStudentReview && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 mt-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">
                          Answer Sheet: {selectedStudentReview.student_name} ({selectedStudentReview.student_id})
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          Score: <b>{selectedStudentReview.score} / {selectedStudentReview.total_marks}</b> &bull; Percentage: <b>{selectedStudentReview.percentage}%</b>
                        </span>
                      </div>
                      <button 
                        onClick={() => setSelectedStudentReview(null)}
                        className="text-slate-400 hover:text-slate-600 text-xs"
                      >
                        Close Sheet
                      </button>
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1 text-xs">
                      {(selectedStudentReview.review || []).map((rev, rIdx) => (
                        <div 
                          key={rIdx}
                          className={`p-3 rounded-xl border ${
                            rev.is_correct ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">Q{rev.q_number}. {rev.question_text}</span>
                            <span className={`text-[10px] font-bold ${rev.is_correct ? 'text-emerald-700' : 'text-rose-700'}`}>
                              {rev.is_correct ? 'Correct (+1)' : 'Incorrect (0)'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-600 mt-1">
                            <span>Selected: <b>Option {rev.student_letter || 'None'}</b></span>
                            <span>Correct: <b className="text-emerald-700">Option {rev.correct_letter}</b></span>
                          </div>
                          {rev.explanation && (
                            <p className="text-[10px] text-slate-500 mt-1 italic">
                              {rev.explanation}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setViewSubmissionsQuiz(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Share Modal */}
      {shareQuiz && (
        <QuizLinkShareModal
          quiz={shareQuiz}
          onClose={() => setShareQuiz(null)}
          onOpenQuiz={onOpenQuiz}
        />
      )}

    </div>
  );
}
