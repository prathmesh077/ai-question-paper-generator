import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, CheckCircle2, XCircle, AlertTriangle, 
  FileDown, Eye, RefreshCw, ShieldCheck, MessageSquare, Printer 
} from 'lucide-react';
import { api } from '../services/api';
import PrintQuestionPaperModal from '../components/PrintQuestionPaperModal';

export default function ModerationReview({ currentUser }) {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [modNotes, setModNotes] = useState('');
  const [actionSuccess, setActionSuccess] = useState(null);
  const [printPaper, setPrintPaper] = useState(null);

  useEffect(() => {
    loadPendingPapers();
  }, []);

  async function loadPendingPapers() {
    try {
      setLoading(true);
      // Fetch papers pending moderation, or all papers
      const data = await api.getPapers();
      setPapers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectPaper(id) {
    try {
      const details = await api.getPaperDetails(id);
      setSelectedPaper(details);
      setModNotes(details.moderator_notes || '');
      setActionSuccess(null);
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleUpdateStatus(status) {
    if (!selectedPaper) return;
    try {
      await api.updatePaperStatus(selectedPaper.id, status, modNotes);
      setActionSuccess(`Paper status successfully updated to ${status.toUpperCase()}!`);
      await loadPendingPapers();
      const updated = await api.getPaperDetails(selectedPaper.id);
      setSelectedPaper(updated);
    } catch (err) {
      alert(err.message);
    }
  }

  const isModeratorOrAdmin = currentUser?.role === 'moderator' || currentUser?.role === 'administrator';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-bold text-slate-900">Examination Board Moderation Station</h1>
          <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Quality Assurance
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Independent review portal for moderators to verify syllabus coverage, cognitive balance, and question originality before releasing final papers.
        </p>
      </div>

      {!isModeratorOrAdmin && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            You are currently viewing as <b>{currentUser?.role}</b>. To approve or reject examination papers, switch to the <b>Exam Moderator (Dr. Anita Kapoor)</b> role in the top header.
          </span>
        </div>
      )}

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Papers Queue */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-800">Submitted Papers Queue</span>
            <button onClick={loadPendingPapers} className="text-slate-400 hover:text-slate-600">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {papers.map((p) => {
              const isSelected = selectedPaper?.id === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => handleSelectPaper(p.id)}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                      {p.course_code}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                      p.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                      p.status === 'pending_moderation' ? 'bg-amber-100 text-amber-800' :
                      p.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {p.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h3 className="text-xs font-semibold text-slate-900 mt-1.5 leading-snug">
                    {p.title}
                  </h3>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
                    <span>{p.total_marks} Marks</span>
                    <span className="text-emerald-600 font-semibold">{p.diversity_score}% Diversity</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Moderator Deep Inspection & Decision Console */}
        <div className="lg:col-span-2 space-y-4">
          {selectedPaper ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              {/* Paper Details */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs bg-slate-100 text-slate-700 font-mono px-2 py-0.5 rounded">
                    {selectedPaper.course_code} • {selectedPaper.semester}
                  </span>
                  <h2 className="text-base font-bold text-slate-900 mt-1">
                    {selectedPaper.title}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedPaper.institution_name} &bull; Max Marks: {selectedPaper.total_marks} &bull; Time: {selectedPaper.duration_minutes} Mins
                  </p>
                </div>

                <div className="text-right">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider block ${
                    selectedPaper.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                    selectedPaper.status === 'pending_moderation' ? 'bg-amber-100 text-amber-800' :
                    selectedPaper.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {selectedPaper.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Metrics audit bar */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Diversity Index</span>
                  <span className="text-base font-bold text-emerald-600">{selectedPaper.diversity_score}%</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Duplicate Risk</span>
                  <span className="text-base font-bold text-slate-800">{selectedPaper.duplicate_risk_score}%</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Sections Count</span>
                  <span className="text-base font-bold text-indigo-600">{selectedPaper.sections?.length || 0} Sections</span>
                </div>
              </div>

              {/* Questions List for Moderator Inspection */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Question Items & Cognitive Tagging
                </h3>

                <div className="max-h-72 overflow-y-auto space-y-3 pr-1 text-xs">
                  {selectedPaper.sections?.map((sec) => (
                    <div key={sec.section_id} className="space-y-2">
                      <div className="bg-slate-100 p-2 rounded-lg font-bold text-slate-700 flex justify-between">
                        <span>{sec.title}</span>
                        <span>{sec.total_section_marks} Marks</span>
                      </div>
                      <div className="space-y-1.5 pl-2">
                        {sec.questions?.map((q) => (
                          <div key={q.q_number} className="p-2 border border-slate-100 rounded-lg bg-white space-y-1">
                            <div className="flex items-start justify-between">
                              <span className="font-semibold text-slate-900">
                                {typeof q.q_number === 'string' && q.q_number.startsWith('Q') ? q.q_number : `Q${q.q_number}`}. {q.question_text}
                              </span>
                              <span className="font-bold text-indigo-600 shrink-0 ml-2">[{q.marks}M]</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500">
                              <span>Unit {q.unit_number}: {q.topic}</span>
                              <span>•</span>
                              <span>Bloom: {q.blooms_level}</span>
                              <span>•</span>
                              <span>Difficulty: {q.difficulty}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Moderator Decision Box */}
              <div className="border-t border-slate-100 pt-5 space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                  Moderator Evaluation Notes & Official Verdict
                </h3>

                <textarea
                  rows={3}
                  value={modNotes}
                  onChange={(e) => setModNotes(e.target.value)}
                  placeholder="Enter moderation feedback, compliance remarks, or reasons for rejection..."
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setPrintPaper(selectedPaper)}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl flex items-center gap-1 transition"
                      title="Print hard copy for Board of Examiners review"
                    >
                      <Printer className="w-4 h-4 text-emerald-400" />
                      <span>Print Paper</span>
                    </button>

                    <a
                      href={api.getDownloadPdfUrl(selectedPaper.id)}
                      download
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1 transition"
                    >
                      <FileDown className="w-4 h-4 text-rose-500" /> Inspect PDF
                    </a>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleUpdateStatus('rejected')}
                      disabled={!isModeratorOrAdmin}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                        isModeratorOrAdmin
                          ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject & Request Changes</span>
                    </button>

                    <button
                      onClick={() => handleUpdateStatus('approved')}
                      disabled={!isModeratorOrAdmin}
                      className={`px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 text-white shadow-md transition ${
                        isModeratorOrAdmin
                          ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                          : 'bg-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve Question Paper</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-16 rounded-2xl border border-slate-200 text-center text-slate-400">
              <CheckSquare className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-xs">Select a submitted paper from the queue to conduct moderation inspection.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Print Examination Paper */}
      {printPaper && (
        <PrintQuestionPaperModal
          paper={printPaper}
          onClose={() => setPrintPaper(null)}
        />
      )}
    </div>
  );
}
