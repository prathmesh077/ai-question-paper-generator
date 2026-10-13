import React, { useState } from 'react';
import { 
  GraduationCap, Sparkles, Shield, User, Lock, 
  Eye, EyeOff, ArrowRight, CheckCircle2, AlertCircle, 
  Cpu, BookOpen, Layers, Files, Key, RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import BackAnimation3D from '../components/BackAnimation3D';

export default function LoginPage({ onLoginSuccess }) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Login form state
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regDepartment, setRegDepartment] = useState('Computer Science & Engineering');
  const [regRole, setRegRole] = useState('paper_setter');

  // Quick Demo Logins
  const demoAccounts = [
    {
      role: 'administrator',
      title: 'Dean / Administrator',
      user: 'admin',
      pass: 'admin123',
      name: 'Dr. Arthur Vance',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200'
    },
    {
      role: 'paper_setter',
      title: 'Paper Setter (Faculty)',
      user: 'prof_sharma',
      pass: 'setter123',
      name: 'Prof. Rajesh Sharma',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200'
    },
    {
      role: 'moderator',
      title: 'Exam Board Moderator',
      user: 'dr_kapoor',
      pass: 'moderator123',
      name: 'Dr. Anita Kapoor',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200'
    }
  ];

  async function handleLoginSubmit(e) {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const data = await api.login(username, password);
      onLoginSuccess(data.user);
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  }

  async function handleQuickLogin(userAccount) {
    setUsername(userAccount.user);
    setPassword(userAccount.pass);
    setErrorMsg(null);
    setLoading(true);

    try {
      const data = await api.login(userAccount.user, userAccount.pass);
      onLoginSuccess(data.user);
    } catch (err) {
      setErrorMsg(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegisterSubmit(e) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      await api.register({
        full_name: regFullName,
        username: regUsername,
        email: regEmail,
        password: regPassword,
        department: regDepartment,
        role: regRole
      });

      setSuccessMsg('Account registered successfully! You can now sign in.');
      setIsRegisterMode(false);
      setUsername(regUsername);
      setPassword(regPassword);
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-70"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-100 rounded-full blur-3xl opacity-70"></div>
      </div>

      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-slate-200">
        
        {/* LEFT COLUMN: Academic Suite Hero & Highlights (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 p-8 sm:p-10 text-white flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-200">
          <div>
            {/* Logo */}
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/40 border border-indigo-400/30">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <span className="font-bold text-xl tracking-tight text-white block">ExamForge AI</span>
                <span className="text-[11px] text-indigo-200 flex items-center gap-1 font-medium">
                  <Sparkles className="w-3 h-3 text-indigo-400" /> Academic Exam Suite
                </span>
              </div>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-snug">
              AI Question Paper Generation & Management System
            </h1>
            <p className="text-xs text-indigo-200 mt-2 leading-relaxed">
              Automated examination formulation grounded in institution curriculum via RAG. Enforces Bloom's Taxonomy, prevents paper duplication, and outputs university-compliant PDF & Word documents.
            </p>

            {/* Core Pillars */}
            <div className="mt-8 space-y-3.5 text-xs">
              <div className="flex items-start space-x-3 text-indigo-100">
                <div className="w-6 h-6 rounded-lg bg-indigo-700/50 flex items-center justify-center shrink-0 mt-0.5 border border-indigo-500/30">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-300" />
                </div>
                <div>
                  <span className="font-semibold text-white">Syllabus RAG Grounding</span>
                  <p className="text-[11px] text-indigo-200">Strictly maps questions to verified curriculum units without hallucinations.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 text-indigo-100">
                <div className="w-6 h-6 rounded-lg bg-indigo-700/50 flex items-center justify-center shrink-0 mt-0.5 border border-indigo-500/30">
                  <Shield className="w-3.5 h-3.5 text-indigo-300" />
                </div>
                <div>
                  <span className="font-semibold text-white">Anti-Duplicate Protection</span>
                  <p className="text-[11px] text-indigo-200">Levenshtein & Bigram Jaccard similarity alerts against previous exams.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 text-indigo-100">
                <div className="w-6 h-6 rounded-lg bg-indigo-700/50 flex items-center justify-center shrink-0 mt-0.5 border border-indigo-500/30">
                  <Files className="w-3.5 h-3.5 text-indigo-300" />
                </div>
                <div>
                  <span className="font-semibold text-white">Standardized Export</span>
                  <p className="text-[11px] text-indigo-200">Official ReportLab university PDF & editable python-docx Word outputs.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-indigo-700/50 text-[11px] text-indigo-300 flex items-center justify-between">
            <span>Enterprise Academic v1.0</span>
            <span className="text-emerald-400 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3 h-3" /> System Operational
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: Authentication Form (7 cols) */}
        <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-between bg-white text-slate-800">
          <div>
            {/* Header / Mode Switcher */}
            <div className="flex items-center justify-between pb-6 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {isRegisterMode ? 'Register Faculty Account' : 'Portal Sign In'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isRegisterMode ? 'Create a secure academic profile' : 'Enter credentials or pick a demo role to sign in'}
                </p>
              </div>

              <div className="flex items-center bg-slate-100 border border-slate-200 p-1 rounded-xl text-xs font-medium">
                <button
                  type="button"
                  onClick={() => { setIsRegisterMode(false); setErrorMsg(null); }}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    !isRegisterMode ? 'bg-indigo-600 text-white font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setIsRegisterMode(true); setErrorMsg(null); }}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    isRegisterMode ? 'bg-indigo-600 text-white font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Register
                </button>
              </div>
            </div>

            {/* Error or Success Alerts */}
            {errorMsg && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* SIGN IN FORM */}
            {!isRegisterMode && (
              <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Username</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. admin or prof_sharma"
                      className="w-full text-xs pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full text-xs pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-xs font-semibold shadow-md shadow-indigo-200 transition flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
                </button>
              </form>
            )}

            {/* REGISTER FORM */}
            {isRegisterMode && (
              <form onSubmit={handleRegisterSubmit} className="mt-6 space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="e.g. Dr. Ramesh Kumar"
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Username</label>
                    <input
                      type="text"
                      required
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="e.g. ramesh_k"
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Institutional Email</label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="e.g. ramesh@university.edu"
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Choose strong password"
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Department</label>
                    <input
                      type="text"
                      value={regDepartment}
                      onChange={(e) => setRegDepartment(e.target.value)}
                      placeholder="Computer Science & Engineering"
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Requested Role</label>
                    <select
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white font-medium focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="paper_setter">Paper Setter (Faculty)</option>
                      <option value="moderator">Exam Board Moderator</option>
                      <option value="administrator">Administrator</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-xs font-semibold shadow-md shadow-indigo-200 transition flex items-center justify-center gap-2 mt-4"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Register Account</span>
                </button>
              </form>
            )}

            {/* QUICK 1-CLICK DEMO ACCESS PERSONAS */}
            {!isRegisterMode && (
              <div className="mt-8 pt-6 border-t border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    ⚡ 1-Click Fast Demo Login
                  </span>
                  <span className="text-[10px] text-slate-500">Click to test role permissions</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {demoAccounts.map((acc) => (
                    <button
                      key={acc.user}
                      type="button"
                      onClick={() => handleQuickLogin(acc)}
                      disabled={loading}
                      className="p-3 border border-slate-200 bg-slate-50 rounded-xl text-left hover:border-indigo-400 hover:bg-indigo-50/50 transition group shadow-xs"
                    >
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border block w-fit mb-1 ${acc.badgeColor}`}>
                        {acc.title}
                      </span>
                      <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition">
                        {acc.name}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        @{acc.user}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 text-center text-[11px] text-slate-500">
            Protected by JWT role-based token authentication &amp; bcrypt password hashing.
          </div>
        </div>
      </div>
    </div>
  );
}
