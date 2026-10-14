import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import SyllabusUpload from './pages/SyllabusUpload';
import GeneratorWizard from './pages/GeneratorWizard';
import PaperRepository from './pages/PaperRepository';
import UserManagement from './pages/UserManagement';
import QuizManager from './pages/QuizManager';
import TakeQuiz from './pages/TakeQuiz';
import LoginPage from './pages/LoginPage';
import ThreeDSlides from './components/ThreeDSlides';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activeQuizCode, setActiveQuizCode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('quiz') || null;
  });

  useEffect(() => {
    document.documentElement.classList.remove('dark');
    try {
      localStorage.removeItem('theme');
    } catch (e) {}
  }, []);

  useEffect(() => {
    // Check if user session already exists in localStorage
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (token && savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
        setIsAuthenticated(true);
      } catch (e) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setCheckingAuth(false);
  }, []);

  function handleLoginSuccess(user) {
    setCurrentUser(user);
    setIsAuthenticated(true);
    setActiveTab('dashboard');
  }

  function handleLogout() {
    api.logout();
    setCurrentUser(null);
    setIsAuthenticated(false);
  }

  function handleExitQuiz() {
    setActiveQuizCode(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('quiz');
    window.history.pushState({}, '', url.pathname + url.search);
  }

  async function handleSwitchUser(username) {
    const passwords = {
      admin: 'admin123',
      prof_sharma: 'setter123',
      dr_kapoor: 'moderator123'
    };
    try {
      const data = await api.login(username, passwords[username] || 'admin123');
      setCurrentUser(data.user);
    } catch (e) {
      console.error(e);
    }
  }

  // If a student or faculty has an active quiz link (?quiz=qz_...), render the TakeQuiz portal!
  if (activeQuizCode) {
    return <TakeQuiz quizCode={activeQuizCode} onExit={handleExitQuiz} />;
  }

  if (checkingAuth) {
    return null; // Brief initial render check
  }

  // If not authenticated, render dedicated Login / Registration Page!
  if (!isAuthenticated || !currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="h-screen bg-slate-50 flex flex-col font-sans selection:bg-indigo-500 selection:text-white text-slate-800 overflow-hidden relative">
      {/* Top Navigation */}
      <Navbar 
        currentUser={currentUser} 
        onSwitchUser={handleSwitchUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex w-full overflow-hidden relative z-10">
        {/* Sidebar */}
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          currentUser={currentUser} 
        />

        {/* Main Content Area */}
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto min-w-0 h-full bg-slate-50 relative z-10 text-slate-800">
          {activeTab === 'dashboard' && <Dashboard setActiveTab={setActiveTab} />}
          {activeTab === 'slides3d' && <ThreeDSlides setActiveTab={setActiveTab} />}
          {activeTab === 'syllabus' && <SyllabusUpload />}
          {activeTab === 'generator' && (
            <GeneratorWizard 
              setActiveTab={setActiveTab} 
              onOpenQuiz={(code) => setActiveQuizCode(code)}
            />
          )}
          {activeTab === 'quizzes' && (
            <QuizManager 
              onOpenQuiz={(code) => setActiveQuizCode(code)}
              setActiveTab={setActiveTab}
            />
          )}
          {activeTab === 'repository' && (
            <PaperRepository 
              setActiveTab={setActiveTab}
              onOpenQuiz={(code) => setActiveQuizCode(code)}
            />
          )}
          {activeTab === 'users' && <UserManagement currentUser={currentUser} />}
        </main>
      </div>
    </div>
  );
}
