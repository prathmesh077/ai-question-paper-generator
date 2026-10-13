import React, { useState } from 'react';
import { 
  Check, Copy, ExternalLink, QrCode, Share2, 
  X, Sparkles, Clock, HelpCircle, CheckCircle2, MessageCircle, Mail
} from 'lucide-react';

export default function QuizLinkShareModal({ quiz, onClose, onOpenQuiz, onGoToHub }) {
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showQr, setShowQr] = useState(true);

  if (!quiz) return null;

  const origin = window.location.origin || 'http://localhost:5173';
  const shareUrl = `${origin}/?quiz=${quiz.quiz_code}`;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(shareUrl)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(quiz.quiz_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `🎓 Online Examination / Quiz Link: ${quiz.title} (${quiz.course_code})\n\nClick link to attempt the test:\n${shareUrl}\n\nQuiz Code: ${quiz.quiz_code}\nDuration: ${quiz.duration_minutes} Mins`
  )}`;

  const mailUrl = `mailto:?subject=${encodeURIComponent(`Online Assessment: ${quiz.title}`)}&body=${encodeURIComponent(
    `Dear Students,\n\nPlease find the online examination / quiz link below:\n\nCourse: ${quiz.course_code} - ${quiz.course_name || ''}\nTest: ${quiz.title}\nQuestions: ${quiz.questions_count || quiz.total_marks}\nDuration: ${quiz.duration_minutes} minutes\n\nLink to attempt test:\n${shareUrl}\n\nBest regards,\nExamination Cell`
  )}`;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm">
              <Share2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Quiz Link Active
                </span>
                <span className="text-xs font-bold text-slate-500">
                  {quiz.course_code}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-0.5 leading-snug">
                {quiz.title}
              </h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick specs pill */}
        <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs">
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Questions</span>
            <span className="font-bold text-slate-800">{quiz.questions_count || quiz.total_marks} MCQs</span>
          </div>
          <div className="border-x border-slate-200">
            <span className="text-[10px] text-slate-400 block font-medium">Time Allowed</span>
            <span className="font-bold text-slate-800">{quiz.duration_minutes} Mins</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Total Marks</span>
            <span className="font-bold text-indigo-600">{quiz.total_marks} Marks</span>
          </div>
        </div>

        {/* Shareable Link Box */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
            <span>Shareable Student Examination Link:</span>
            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> No Login Required for Students
            </span>
          </label>

          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-slate-100 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-mono truncate select-all">
              {shareUrl}
            </div>
            <button
              onClick={handleCopyLink}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shrink-0 ${
                copied 
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center space-x-2 text-xs text-slate-600">
              <span className="text-slate-400">Quiz Code:</span>
              <code className="bg-slate-100 px-2 py-0.5 rounded text-indigo-700 font-bold font-mono">
                {quiz.quiz_code}
              </code>
              <button 
                onClick={handleCopyCode} 
                className="text-[11px] text-slate-400 hover:text-indigo-600 underline font-medium"
              >
                {copiedCode ? 'Copied code!' : 'Copy Code'}
              </button>
            </div>

            {/* Social Share Buttons */}
            <div className="flex items-center space-x-1.5">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium flex items-center gap-1 transition"
                title="Share via WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span className="text-[10px] hidden sm:inline">WhatsApp</span>
              </a>
              <a
                href={mailUrl}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1 transition"
                title="Share via Email"
              >
                <Mail className="w-3.5 h-3.5" />
                <span className="text-[10px] hidden sm:inline">Email</span>
              </a>
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        {showQr && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center space-x-4">
            <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm shrink-0">
              <img 
                src={qrApiUrl} 
                alt="Quiz QR Code" 
                className="w-24 h-24 object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-900 flex items-center gap-1">
                <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                Scan to Launch on Mobile
              </p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Project this QR code in the classroom or print it on paper. Students scan it with any camera to take the quiz directly on their phones.
              </p>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          {onGoToHub && (
            <button
              onClick={() => {
                onClose();
                onGoToHub();
              }}
              className="text-xs font-semibold text-slate-600 hover:text-indigo-600 py-2 px-3 rounded-xl hover:bg-slate-50 transition"
            >
              View in Quiz Hub
            </button>
          )}

          <div className="flex items-center space-x-2 ml-auto">
            <button
              onClick={() => {
                onClose();
                if (onOpenQuiz) onOpenQuiz(quiz.quiz_code);
                else window.open(shareUrl, '_blank');
              }}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition"
            >
              <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
              <span>Take Quiz (Preview)</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
            >
              Done
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
