import React from 'react';
import { 
  FileText, Shield, User, Sparkles, CheckCircle2, 
  Settings, Key, Cpu, GraduationCap, ChevronDown, LogOut
} from 'lucide-react';

export default function Navbar({ currentUser, onSwitchUser, activeTab, setActiveTab, onLogout }) {
  const users = [
    { username: 'admin', name: 'Dr. Arthur Vance', role: 'administrator', label: 'Admin / Dean' },
    { username: 'prof_sharma', name: 'Prof. Rajesh Sharma', role: 'paper_setter', label: 'Paper Setter (Faculty)' },
    { username: 'dr_kapoor', name: 'Dr. Anita Kapoor', role: 'moderator', label: 'Exam Moderator' },
  ];

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 shadow-xs w-full transition-colors">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo & Project Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">ExamForge AI</span>
                <span className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 border border-indigo-200">
                  <Sparkles className="w-3 h-3 text-indigo-500" /> RAG Grounded
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                AI Question Paper & Quiz Generation Platform
              </p>
            </div>
          </div>

          {/* Quick Actions & Role Switcher */}
          <div className="flex items-center space-x-3">
            {/* Active AI Engine Badge */}
            <div 
              className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200"
            >
              <Cpu className="w-3.5 h-3.5 text-indigo-600" />
              <span>AI Engine:</span>
              <span className="text-indigo-600 font-semibold">Gemini / Academic RAG</span>
            </div>

            {/* Role Switcher Pill */}
            <div className="relative group">
              <div className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 py-1.5 rounded-xl cursor-pointer transition">
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                  {currentUser?.full_name ? currentUser.full_name.charAt(0) : 'U'}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-semibold text-slate-800 leading-tight">{currentUser?.full_name || 'User'}</p>
                  <p className="text-[10px] text-indigo-600 font-medium capitalize">
                    {currentUser?.role === 'paper_setter' ? 'Faculty / Paper Setter' : currentUser?.role}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-700" />
              </div>

              {/* Dropdown Menu to switch active role */}
              <div className="absolute right-0 mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-xl py-2 hidden group-hover:block z-50">
                <div className="px-3 py-1.5 border-b border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Switch Test Role (RBAC)</p>
                </div>
                {users.map(u => (
                  <button
                    key={u.username}
                    onClick={() => onSwitchUser(u.username)}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-indigo-50 transition ${
                      currentUser?.username === u.username ? 'bg-indigo-50/70 font-semibold text-indigo-700' : 'text-slate-700'
                    }`}
                  >
                    <div>
                      <p className="text-slate-900 font-medium">{u.name}</p>
                      <p className="text-[10px] text-slate-500">{u.label}</p>
                    </div>
                    {currentUser?.username === u.username && (
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    )}
                  </button>
                ))}

                <div className="pt-1 mt-1 border-t border-slate-100">
                  <button
                    onClick={onLogout}
                    className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition font-semibold"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Direct Logout Icon Button */}
            <button
              onClick={onLogout}
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
