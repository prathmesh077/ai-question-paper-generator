import React from 'react';
import { 
  LayoutDashboard, BookOpen, Wand2, Database, 
  Files, CheckSquare, Users, Sliders, ShieldCheck, HelpCircle, Sparkles
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, currentUser }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard & Metrics', icon: LayoutDashboard },
    { id: 'syllabus', label: 'Syllabus & RAG Hub', icon: BookOpen },
    { id: 'generator', label: 'AI Paper Generator', icon: Wand2, highlight: true },
    { id: 'quizzes', label: 'Quiz Links & Tests', icon: HelpCircle, badge: 'Live' },
    { id: 'questions', label: 'Question Bank Manager', icon: Database },
    { id: 'repository', label: 'Exam Papers Repository', icon: Files },
    { id: 'moderation', label: 'Board Moderation', icon: CheckSquare, badge: 'Review' },
    { id: 'users', label: 'Role & User Access', icon: Users, adminOnly: true },
    { id: 'settings', label: 'AI Engine & Settings', icon: Sliders },
  ];

  return (
    <aside className="w-64 bg-white/95 backdrop-blur-md border-r border-slate-200 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto p-4 flex flex-col justify-between shrink-0 z-20 transition-colors text-slate-800">
      <div className="space-y-1">

        <div className="px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          Main Navigation
        </div>
        
        {navItems.map((item) => {
          if (item.adminOnly && currentUser?.role !== 'administrator') {
            return null;
          }

          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 font-semibold'
                  : item.highlight
                  ? 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.highlight ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && !isActive && (
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* RBAC Info Card */}
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl transition-colors">
        <div className="flex items-center space-x-2 text-indigo-700 font-semibold text-xs mb-1">
          <ShieldCheck className="w-4 h-4" />
          <span>Active Role</span>
        </div>
        <p className="text-xs text-slate-900 font-semibold capitalize">
          {currentUser?.role === 'paper_setter' ? 'Paper Setter (Faculty)' : currentUser?.role}
        </p>
        <p className="text-[11px] text-slate-500 mt-1">
          {currentUser?.role === 'administrator' && 'Full system control, users & audit logs'}
          {currentUser?.role === 'paper_setter' && 'Can upload syllabus, generate papers & manage question bank'}
          {currentUser?.role === 'moderator' && 'Authorized to review, approve & reject papers'}
        </p>
      </div>
    </aside>
  );
}
