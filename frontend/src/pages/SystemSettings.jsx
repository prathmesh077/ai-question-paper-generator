import React, { useState, useEffect } from 'react';
import { 
  Sliders, Cpu, Key, CheckCircle2, 
  Server, Shield, RefreshCw, Sparkles, BookOpen 
} from 'lucide-react';
import { api } from '../services/api';

export default function SystemSettings() {
  const [settings, setSettings] = useState(null);
  const [provider, setProvider] = useState('auto');
  const [geminiKey, setGeminiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [savedMsg, setSavedMsg] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      const data = await api.getSettings();
      setSettings(data);
      setProvider(data.ai_provider);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    try {
      setLoading(true);
      await api.updateSettings({
        ai_provider: provider,
        gemini_api_key: geminiKey,
        openai_api_key: openaiKey
      });
      setSavedMsg('Settings updated successfully!');
      await loadSettings();
      setTimeout(() => setSavedMsg(null), 3000);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header */}

      <div>
        <h1 className="text-xl font-bold text-slate-900">AI Engine & System Configuration</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure Generative AI Large Language Model APIs, RAG vector grounding parameters, and system infrastructure.
        </p>
      </div>

      {savedMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{savedMsg}</span>
        </div>
      )}

      {/* Settings Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Primary Generative AI Provider
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'auto', label: 'Auto (Recommended)', desc: 'Uses Gemini if configured, otherwise falls back to smart local synthesizer.' },
                { id: 'gemini', label: 'Google Gemini', desc: 'Direct integration with Google Gemini 1.5/2.0 Flash models.' },
                { id: 'local', label: 'Built-in Academic AI', desc: '100% offline heuristic academic question synthesis generator.' },
              ].map((p) => (
                <div
                  key={p.id}
                  onClick={() => setProvider(p.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition ${
                    provider === p.id
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-900">{p.label}</span>
                    {provider === p.id && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-indigo-600" />
                <span>Google Gemini API Key</span>
              </label>
              <input
                type="password"
                placeholder={settings?.gemini_api_key_set ? "•••••••••••••••• (API Key Active)" : "Enter Gemini API key"}
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Keys can be generated free from Google AI Studio (aistudio.google.com).
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-indigo-600" />
                <span>OpenAI API Key (Optional)</span>
              </label>
              <input
                type="password"
                placeholder={settings?.openai_api_key_set ? "•••••••••••••••• (API Key Active)" : "Enter OpenAI API key"}
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-md shadow-indigo-200 transition flex items-center gap-2"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>Save System Settings</span>
            </button>
          </div>
        </form>
      </div>

      {/* System Specifications Card (Directly matching user's synopsis specs) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
          <Server className="w-4 h-4 text-indigo-600" />
          Technical Stack & Architecture Specifications
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-[10px] font-semibold uppercase">Frontend Layer</span>
            <span className="font-semibold text-slate-800">React (Vite) + Tailwind CSS</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-[10px] font-semibold uppercase">Backend Framework</span>
            <span className="font-semibold text-slate-800">Python 3.12 / 3.14 + FastAPI REST API</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-[10px] font-semibold uppercase">Generative AI Engine</span>
            <span className="font-semibold text-slate-800">Google Gemini API / Academic LLM Synthesizer</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-[10px] font-semibold uppercase">Syllabus Grounding (RAG)</span>
            <span className="font-semibold text-slate-800">PyPDF Text Extraction & Vector Semantic Chunks</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-[10px] font-semibold uppercase">Anti-Duplicate Engine</span>
            <span className="font-semibold text-slate-800">N-gram Jaccard + Levenshtein Similarity</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-[10px] font-semibold uppercase">Paper Export Formats</span>
            <span className="font-semibold text-slate-800">ReportLab (Standard PDF) & python-docx (Word)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
