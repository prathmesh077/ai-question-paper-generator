import React, { useState, useEffect } from 'react';
import { 
  Files, FileDown, Eye, CheckCircle2, AlertTriangle, 
  Clock, XCircle, Trash2, RefreshCw, BookOpen, X, ShieldCheck, Printer, Share2 
} from 'lucide-react';
import { api } from '../services/api';
import PrintQuestionPaperModal from '../components/PrintQuestionPaperModal';
import QuizLinkShareModal from '../components/QuizLinkShareModal';

export default function PaperRepository({ setActiveTab, onOpenQuiz }) {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [printPaper, setPrintPaper] = useState(null);
  const [shareQuiz, setShareQuiz] = useState(null);
  const [generatingQuizId, setGeneratingQuizId] = useState(null);

  useEffect(() => {
    loadPapers();
  }, [filterStatus]);

  async function handleGenerateQuizLink(paperId) {
    try {
      setGeneratingQuizId(paperId);
      const res = await api.generateQuizFromPaper(paperId);
      setShareQuiz(res);
    } catch (err) {
      alert(err.message || 'Failed to generate quiz link');
    } finally {
      setGeneratingQuizId(null);
    }
  }

  async function loadPapers() {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus) params.status = filterStatus;
      const data = await api.getPapers(params);
      setPapers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleViewDetails(id) {
    try {
      const details = await api.getPaperDetails(id);
      setSelectedPaper(details);
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this examination paper?")) return;
    try {
      await api.deletePaper(id);
      loadPapers();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Examination Papers Repository</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Archive of all generated question papers with standardized PDF/Word exports, version history, and moderation workflows.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium">
          <button
            onClick={() => setFilterStatus('')}
            className={`px-3 py-1.5 rounded-lg transition ${filterStatus === '' ? 'bg-white text-indigo-600 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
          >
            All Papers ({papers.length})
          </button>
          <button
            onClick={() => setFilterStatus('approved')}
            className={`px-3 py-1.5 rounded-lg transition ${filterStatus === 'approved' ? 'bg-white text-emerald-700 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Approved
          </button>
          <button
            onClick={() => setFilterStatus('pending_moderation')}
            className={`px-3 py-1.5 rounded-lg transition ${filterStatus === 'pending_moderation' ? 'bg-white text-amber-700 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
          >
            In Moderation
          </button>
          <button
            onClick={() => setFilterStatus('draft')}
            className={`px-3 py-1.5 rounded-lg transition ${filterStatus === 'draft' ? 'bg-white text-slate-800 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Drafts
          </button>
        </div>
      </div>

      {/* Paper List Grid */}
      {loading ? (
        <div className="p-16 text-center text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
          <p className="text-xs">Loading examination repository...</p>
        </div>
      ) : papers.length === 0 ? (
        <div className="bg-white p-16 rounded-2xl border border-slate-200 text-center text-slate-400">
          <Files className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <p className="text-xs">No examination papers found matching this filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {papers.map((p) => {
            const isApproved = p.status === 'approved';
            const isPending = p.status === 'pending_moderation';
            const isRejected = p.status === 'rejected';

            return (
              <div key={p.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-md">
                      {p.course_code}
                    </span>
                    
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                      isApproved ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      isPending ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      isRejected ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {isApproved && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                      {isPending && <Clock className="w-3 h-3 text-amber-600" />}
                      {isRejected && <XCircle className="w-3 h-3 text-rose-600" />}
                      <span className="capitalize">{p.status.replace('_', ' ')}</span>
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mt-2.5 leading-snug">
                    {p.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{p.course_name}</p>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 mt-3 pt-3 border-t border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Total Marks:</span>
                      <span className="font-semibold text-slate-800">{p.total_marks} Marks</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Duration:</span>
                      <span className="font-semibold text-slate-800">{p.duration_minutes} Mins</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Diversity Index:</span>
                      <span className="font-semibold text-emerald-600">{p.diversity_score || 98.4}%</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Created Date:</span>
                      <span className="text-slate-600">{new Date(p.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {p.moderator_notes && (
                    <div className="mt-2.5 p-2 bg-slate-50 rounded-lg text-[11px] text-slate-600 italic border border-slate-100">
                      <b>Board Note:</b> {p.moderator_notes}
                    </div>
                  )}
                </div>

                {/* Download and actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
                  <div className="flex items-center space-x-1">
                    <a
                      href={api.getDownloadPdfUrl(p.id)}
                      download
                      className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 transition"
                      title="Download Standardized PDF Question Paper"
                    >
                      <FileDown className="w-3.5 h-3.5 text-rose-400" />
                      <span>PDF</span>
                    </a>

                    <a
                      href={api.getDownloadDocxUrl(p.id)}
                      download
                      className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition"
                      title="Download Editable Word Document (.docx)"
                    >
                      <FileDown className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Word</span>
                    </a>

                    <button
                      onClick={async () => {
                        try {
                          const details = await api.getPaperDetails(p.id);
                          setPrintPaper(details);
                        } catch (err) {
                          alert(err.message);
                        }
                      }}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 transition"
                      title="Print Question Paper"
                    >
                      <Printer className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Print</span>
                    </button>

                    <button
                      onClick={() => handleGenerateQuizLink(p.id)}
                      disabled={generatingQuizId === p.id}
                      className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition"
                      title="Generate / Share Live Student Quiz Link"
                    >
                      <Share2 className={`w-3.5 h-3.5 text-emerald-600 ${generatingQuizId === p.id ? 'animate-spin' : ''}`} />
                      <span>Quiz Link</span>
                    </button>
                  </div>


                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleViewDetails(p.id)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                      title="View Full Question Paper"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete Paper"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: View Full Question Paper Sheet */}
      {selectedPaper && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                  {selectedPaper.course_code} &bull; {selectedPaper.exam_name}
                </span>
                <h3 className="text-base font-bold text-slate-900">{selectedPaper.title}</h3>
              </div>
              <button onClick={() => setSelectedPaper(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Paper Details Container */}
            <div className="overflow-y-auto space-y-6 flex-1 pr-1 text-xs">
              {/* Institutional Header simulation */}
              <div className="text-center border-b border-slate-200 pb-4">
                <h4 className="font-bold text-slate-900 uppercase text-sm">{selectedPaper.institution_name}</h4>
                <p className="text-slate-600">{selectedPaper.department}</p>
                <div className="mt-2 text-[11px] grid grid-cols-4 gap-2 border border-slate-200 p-2 rounded-lg bg-slate-50 text-slate-700">
                  <span><b>Code:</b> {selectedPaper.course_code}</span>
                  <span><b>Subject:</b> {selectedPaper.course_name}</span>
                  <span><b>Marks:</b> {selectedPaper.total_marks}</span>
                  <span><b>Time:</b> {selectedPaper.duration_minutes} Mins</span>
                </div>
              </div>

              {/* Sections & Questions */}
              {selectedPaper.sections?.map((sec) => (
                <div key={sec.section_id} className="space-y-3">
                  <div className="bg-slate-100 p-2 rounded-lg font-bold text-slate-800 flex justify-between items-center">
                    <span>{sec.title}</span>
                    <span className="text-[11px] font-semibold text-slate-600">
                      Answer {sec.required_count} &times; {sec.marks_per_question} Marks = {sec.total_section_marks} Marks
                    </span>
                  </div>

                  <div className="space-y-2.5 pl-2">
                    {sec.questions?.map((q, idx) => (
                      <div key={idx} className="flex items-start space-x-2 text-xs">
                        <span className="font-bold text-indigo-700 min-w-8 shrink-0">
                          {typeof q.q_number === 'string' && q.q_number.startsWith('Q') ? q.q_number : `Q${q.q_number}`}.
                        </span>
                        <div className="flex-1 space-y-1">
                          <p className="text-slate-800 leading-relaxed">{q.question_text}</p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500">
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                              Unit {q.unit_number}: {q.topic}
                            </span>
                            <span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-medium">
                              {q.blooms_level}
                            </span>
                          </div>
                        </div>
                        <span className="font-bold text-slate-900 shrink-0">[{q.marks}]</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Diversity: <b>{selectedPaper.diversity_score}%</b> | Status: <b>{selectedPaper.status}</b>
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleGenerateQuizLink(selectedPaper.id)}
                  disabled={generatingQuizId === selectedPaper.id}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                  title="Generate or share online quiz link for this paper"
                >
                  <Share2 className={`w-3.5 h-3.5 ${generatingQuizId === selectedPaper.id ? 'animate-spin' : ''}`} />
                  <span>Share Quiz Link</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintPaper(selectedPaper)}
                  className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-400" /> Print Paper
                </button>
                <a
                  href={api.getDownloadPdfUrl(selectedPaper.id)}
                  download
                  className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <FileDown className="w-3.5 h-3.5 text-rose-400" /> Download PDF
                </a>
                <a
                  href={api.getDownloadDocxUrl(selectedPaper.id)}
                  download
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <FileDown className="w-3.5 h-3.5 text-blue-200" /> Download Word
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Print Examination Paper */}
      {printPaper && (
        <PrintQuestionPaperModal
          paper={printPaper}
          onClose={() => setPrintPaper(null)}
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

