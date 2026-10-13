import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, UploadCloud, FileText, CheckCircle2, 
  Layers, Search, RefreshCw, Eye, Sparkles, AlertCircle, 
  Trash2, X, AlertTriangle, Calendar, Building2, GraduationCap,
  ChevronRight, ShieldAlert, Check
} from 'lucide-react';
import { api } from '../services/api';

export default function SyllabusUpload() {
  const [syllabi, setSyllabi] = useState([]);
  const [selectedSyllabus, setSelectedSyllabus] = useState(null);
  const [chunks, setChunks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('list'); // 'list', 'upload_pdf', 'paste_text'

  // Deletion and Confirmation Modal state
  const [syllabusToDelete, setSyllabusToDelete] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [cascadeRequired, setCascadeRequired] = useState(false);
  const [cascadeErrorMessage, setCascadeErrorMessage] = useState('');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('');

  // Form states for uploading / creating syllabus
  const [courseCode, setCourseCode] = useState('CS503');
  const [courseName, setCourseName] = useState('Design and Analysis of Algorithms');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [semester, setSemester] = useState('Semester V');
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [pdfFile, setPdfFile] = useState(null);
  const [rawText, setRawText] = useState('');

  // Toast notification state
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', text: string }

  // Auto-dismiss toast after 4.5 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    loadSyllabi();
  }, []);

  async function loadSyllabi(preserveSelectedId = null) {
    try {
      setLoading(true);
      const data = await api.getSyllabi();
      setSyllabi(data);

      if (data.length > 0) {
        if (preserveSelectedId) {
          const match = data.find(s => s.id === preserveSelectedId);
          if (match) {
            handleSelectSyllabus(match);
          } else {
            handleSelectSyllabus(data[0]);
          }
        } else if (!selectedSyllabus) {
          handleSelectSyllabus(data[0]);
        }
      } else {
        setSelectedSyllabus(null);
        setChunks([]);
      }
    } catch (e) {
      console.error(e);
      setToast({ type: 'error', text: 'Failed to load syllabi catalog.' });
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectSyllabus(syllabus) {
    setSelectedSyllabus(syllabus);
    try {
      const chunkData = await api.getSyllabusChunks(syllabus.id);
      setChunks(chunkData);
    } catch (e) {
      console.error(e);
    }
  }

  // Opens the Delete Confirmation Popup
  function openDeleteModal(syllabus, e) {
    if (e) e.stopPropagation();
    if (!syllabus) return;
    setSyllabusToDelete(syllabus);
    setCascadeRequired(false);
    setCascadeErrorMessage('');
  }

  // Closes the Delete Confirmation Popup
  function closeDeleteModal() {
    if (deletingId) return; // Prevent closing while in the middle of a deletion request
    setSyllabusToDelete(null);
    setCascadeRequired(false);
    setCascadeErrorMessage('');
  }

  // Executes confirmed deletion
  async function handleConfirmDelete(cascade = false) {
    if (!syllabusToDelete) return;
    if (deletingId) return; // Prevent multiple deletion requests from repeated clicks

    const targetId = syllabusToDelete.id;
    const targetCode = syllabusToDelete.course_code;

    try {
      setDeletingId(targetId);

      const res = await api.deleteSyllabus(targetId, cascade);

      // Display required success toast
      setToast({ 
        type: 'success', 
        text: res.message || 'Syllabus deleted successfully!' 
      });

      // Update state and refresh list
      const updatedList = syllabi.filter(s => s.id !== targetId);
      setSyllabi(updatedList);

      if (selectedSyllabus?.id === targetId) {
        if (updatedList.length > 0) {
          handleSelectSyllabus(updatedList[0]);
        } else {
          setSelectedSyllabus(null);
          setChunks([]);
        }
      }

      // Close modal
      setSyllabusToDelete(null);
      setCascadeRequired(false);
      setCascadeErrorMessage('');
    } catch (err) {
      console.error('Delete syllabus error:', err);
      // Check if error is due to linked exam papers
      if (err.message && err.message.includes('Confirm cascade delete')) {
        setCascadeRequired(true);
        setCascadeErrorMessage(err.message);
      } else {
        setToast({ 
          type: 'error', 
          text: err.message || 'Failed to delete syllabus.' 
        });
        setSyllabusToDelete(null);
      }
    } finally {
      setDeletingId(null);
    }
  }

  async function handleUploadPdf(e) {
    e.preventDefault();
    if (!pdfFile) {
      setToast({ type: 'error', text: 'Please select a PDF syllabus document to upload.' });
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', pdfFile);
      formData.append('course_code', courseCode);
      formData.append('course_name', courseName);
      formData.append('department', department);
      formData.append('semester', semester);
      formData.append('academic_year', academicYear);

      const res = await api.uploadSyllabusPdf(formData);
      setToast({ 
        type: 'success', 
        text: `Syllabus uploaded successfully! Parsed ${res.units_count} units (${res.chunks_indexed} RAG chunks indexed).` 
      });
      setPdfFile(null);
      await loadSyllabi(res.syllabus_id);
      setTab('list');
    } catch (err) {
      setToast({ type: 'error', text: err.message || 'Failed to upload syllabus PDF.' });
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateText(e) {
    e.preventDefault();
    if (!rawText.trim()) {
      setToast({ type: 'error', text: 'Please enter syllabus curriculum text.' });
      return;
    }

    try {
      setLoading(true);
      const res = await api.createSyllabusText({
        title: `${courseCode}: ${courseName} Syllabus`,
        course_code: courseCode,
        course_name: courseName,
        department,
        semester,
        academic_year: academicYear,
        raw_text: rawText
      });
      setToast({ 
        type: 'success', 
        text: 'Syllabus indexed successfully with RAG vector grounding!' 
      });
      setRawText('');
      await loadSyllabi(res.syllabus_id);
      setTab('list');
    } catch (err) {
      setToast({ type: 'error', text: err.message || 'Failed to save syllabus text.' });
    } finally {
      setLoading(false);
    }
  }

  // Filtered syllabi
  const filteredSyllabi = useMemo(() => {
    return syllabi.filter(s => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        s.course_name?.toLowerCase().includes(q) ||
        s.course_code?.toLowerCase().includes(q) ||
        s.department?.toLowerCase().includes(q) ||
        s.semester?.toLowerCase().includes(q) ||
        (s.file_name && s.file_name.toLowerCase().includes(q));

      const matchesDept = !selectedDeptFilter || s.department === selectedDeptFilter;

      return matchesSearch && matchesDept;
    });
  }, [syllabi, searchQuery, selectedDeptFilter]);

  const uniqueDepartments = useMemo(() => {
    const set = new Set(syllabi.map(s => s.department).filter(Boolean));
    return Array.from(set);
  }, [syllabi]);

  const selectedUnits = selectedSyllabus ? JSON.parse(selectedSyllabus.units_json || '[]') : [];

  return (
    <div className="space-y-6 text-slate-800 max-w-7xl mx-auto pb-12">
      {/* Toast Notification Container */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 max-w-md animate-slide-3d">
          <div className={`p-4 rounded-2xl shadow-xl border flex items-start gap-3 backdrop-blur-xl ${
            toast.type === 'success' 
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200 shadow-emerald-100' 
              : 'bg-rose-50 text-rose-900 border-rose-200 shadow-rose-100'
          }`}>
            <div className={`p-1.5 rounded-xl shrink-0 mt-0.5 ${
              toast.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
            }`}>
              {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            </div>
            <div className="flex-1 pr-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                {toast.type === 'success' ? 'Success' : 'Notice'}
              </p>
              <p className="text-xs font-medium leading-relaxed">{toast.text}</p>
            </div>
            <button 
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-black/5 transition"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-50 via-white to-indigo-50/60 p-6 rounded-2xl border border-indigo-100 shadow-xs relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-600" />
              Syllabus Management & RAG Grounding Hub
            </h1>
            <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Grounding Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Manage university curriculum syllabuses, inspect vector chunks, and maintain curriculum integrity. 
            All generated questions are strictly grounded in these verified syllabuses.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center bg-slate-100 border border-slate-200 p-1 rounded-xl text-xs font-medium shrink-0 relative z-10">
          <button
            onClick={() => setTab('list')}
            className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
              tab === 'list' 
                ? 'bg-white text-indigo-700 shadow-sm font-semibold' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
            <span>Syllabus List ({syllabi.length})</span>
          </button>
          <button
            onClick={() => setTab('upload_pdf')}
            className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
              tab === 'upload_pdf' 
                ? 'bg-white text-indigo-700 shadow-sm font-semibold' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5 text-indigo-600" />
            <span>Upload PDF</span>
          </button>
          <button
            onClick={() => setTab('paste_text')}
            className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
              tab === 'paste_text' 
                ? 'bg-white text-indigo-700 shadow-sm font-semibold' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            <span>Paste Text</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: PROFESSIONAL SYLLABUS DIRECTORY & TABLE (REQUIREMENT 1, 2, 3, 4, 5)
          ========================================================================= */}
      {tab === 'list' && (
        <div className="space-y-6">
          {/* Table Container Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative">
            {/* Top Toolbar / Filters */}
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Uploaded Syllabuses</span>
                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[11px] font-mono border border-slate-200">
                    {filteredSyllabi.length} of {syllabi.length}
                  </span>
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Complete institutional syllabus inventory with direct removal and chunk inspection.
                </p>
              </div>

              {/* Search & Actions */}
              <div className="flex items-center flex-wrap gap-2.5">
                {/* Search input */}
                <div className="relative min-w-[220px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by subject, code, department..."
                    className="w-full text-xs pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Department filter */}
                {uniqueDepartments.length > 1 && (
                  <select
                    value={selectedDeptFilter}
                    onChange={(e) => setSelectedDeptFilter(e.target.value)}
                    className="text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-indigo-500 transition"
                  >
                    <option value="">All Departments</option>
                    {uniqueDepartments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                )}

                {/* Refresh button */}
                <button
                  onClick={() => loadSyllabi()}
                  disabled={loading}
                  title="Reload syllabus catalog"
                  className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition flex items-center justify-center cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
                </button>
              </div>
            </div>

            {/* Syllabuses Table */}
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/90 text-slate-600 text-[11px] font-semibold uppercase tracking-wider">
                    <th scope="col" className="py-3.5 px-4 sm:px-6">Subject Name</th>
                    <th scope="col" className="py-3.5 px-4">Semester</th>
                    <th scope="col" className="py-3.5 px-4">Department</th>
                    <th scope="col" className="py-3.5 px-4">Uploaded Date</th>
                    <th scope="col" className="py-3.5 px-4">File Name</th>
                    <th scope="col" className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading && syllabi.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin text-indigo-600 mx-auto mb-2" />
                        <p className="text-xs">Loading syllabus records...</p>
                      </td>
                    </tr>
                  ) : filteredSyllabi.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-500">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-3 text-slate-400">
                          <BookOpen className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-semibold text-slate-800">No syllabuses found</p>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                          {searchQuery 
                            ? `No syllabus matched the search filter "${searchQuery}". Clear your search or upload a new syllabus.`
                            : 'No syllabuses have been uploaded yet. Upload a syllabus PDF or paste raw text to get started.'}
                        </p>
                        <div className="mt-4 flex items-center justify-center gap-2">
                          {searchQuery && (
                            <button
                              onClick={() => setSearchQuery('')}
                              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
                            >
                              Clear Search
                            </button>
                          )}
                          <button
                            onClick={() => setTab('upload_pdf')}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-xs text-white font-medium shadow-sm transition"
                          >
                            + Upload New Syllabus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredSyllabi.map((s) => {
                      const isSelected = selectedSyllabus?.id === s.id;
                      const units = JSON.parse(s.units_json || '[]');
                      const isBeingDeleted = deletingId === s.id;
                      const uploadDate = s.created_at 
                        ? new Date(s.created_at).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })
                        : 'N/A';

                      return (
                        <tr
                          key={s.id}
                          onClick={() => handleSelectSyllabus(s)}
                          className={`group transition-colors cursor-pointer ${
                            isSelected 
                              ? 'bg-indigo-50/50 hover:bg-indigo-50/70' 
                              : 'hover:bg-slate-50/80'
                          }`}
                        >
                          {/* Subject Name Column */}
                          <td className="py-4 px-4 sm:px-6">
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-xl shrink-0 mt-0.5 border ${
                                isSelected 
                                  ? 'bg-indigo-100 text-indigo-700 border-indigo-200' 
                                  : 'bg-slate-100 text-slate-500 border-slate-200 group-hover:text-indigo-600 transition'
                              }`}>
                                <BookOpen className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-slate-900 text-xs">
                                    {s.course_name}
                                  </span>
                                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                                    {s.course_code}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                                  <span>{units.length} Curriculum Units</span>
                                  <span>&bull;</span>
                                  <span className="text-emerald-600 flex items-center gap-1 font-medium">
                                    <Sparkles className="w-3 h-3 text-emerald-500" /> Grounded
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Semester Column */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                              <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{s.semester || 'N/A'}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 block mt-0.5">
                              {s.academic_year || 'Session 2026-27'}
                            </span>
                          </td>

                          {/* Department Column */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-1.5 text-slate-700 text-xs">
                              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[200px]" title={s.department}>
                                {s.department || 'Computer Science & Engineering'}
                              </span>
                            </div>
                          </td>

                          {/* Uploaded Date Column */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-slate-600 text-xs">
                              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{uploadDate}</span>
                            </div>
                          </td>

                          {/* File Name Column */}
                          <td className="py-4 px-4">
                            {s.file_name ? (
                              <div 
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-mono transition max-w-[200px]"
                                title={s.file_name}
                              >
                                <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                <span className="truncate">{s.file_name}</span>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-slate-500 bg-slate-100 border border-slate-200 italic font-mono">
                                Curated Text
                              </span>
                            )}
                          </td>

                          {/* Actions Column */}
                          <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                              {/* Inspect details button */}
                              <button
                                type="button"
                                onClick={() => handleSelectSyllabus(s)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition flex items-center gap-1.5 cursor-pointer ${
                                  isSelected 
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                                }`}
                                title="Inspect curriculum breakdown & semantic vector chunks"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Inspect</span>
                              </button>

                              {/* Red Delete Button with Trash Icon */}
                              <button
                                type="button"
                                onClick={(e) => openDeleteModal(s, e)}
                                disabled={isBeingDeleted}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 hover:border-rose-600 transition-all duration-200 shadow-xs hover:shadow-rose-100 flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group/del"
                                title={`Delete ${s.course_code}: ${s.course_name}`}
                                aria-label={`Delete ${s.course_code} syllabus`}
                              >
                                {isBeingDeleted ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-600" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5 text-rose-600 group-hover/del:text-white transition-colors" />
                                )}
                                <span className="font-semibold">Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer info */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-200 px-6 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
              <span>Showing {filteredSyllabi.length} institutional syllabus curriculum entries</span>
              <span className="flex items-center gap-1 text-slate-500">
                Tip: Click any row to inspect its units and vector chunks below.
              </span>
            </div>
          </div>

          {/* =========================================================================
              SELECTED SYLLABUS DETAILS & RAG VECTOR CHUNKS INSPECTOR
              ========================================================================= */}
          {selectedSyllabus && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 relative overflow-hidden animate-slide-3d">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-md">
                      {selectedSyllabus.course_code}
                    </span>
                    <span className="text-slate-400 text-xs">&bull;</span>
                    <span className="text-xs text-slate-600 font-medium">
                      {selectedSyllabus.department}
                    </span>
                    <span className="text-slate-400 text-xs">&bull;</span>
                    <span className="text-xs text-slate-500">
                      {selectedSyllabus.semester} ({selectedSyllabus.academic_year})
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {selectedSyllabus.course_name}
                  </h2>
                </div>

                {/* Direct Action buttons */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 hidden md:inline">
                    Indexed on {new Date(selectedSyllabus.created_at).toLocaleDateString()}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => openDeleteModal(selectedSyllabus, e)}
                    disabled={deletingId === selectedSyllabus.id}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 hover:border-rose-600 transition-all duration-200 shadow-xs hover:shadow-rose-100 flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Delete This Syllabus</span>
                  </button>
                </div>
              </div>

              {/* Units Breakdown Grid */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    Curriculum Unit Breakdown ({selectedUnits.length} Units)
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">Weightage Balanced</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {selectedUnits.map((u) => (
                    <div 
                      key={u.unit_num} 
                      className="bg-slate-50 p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-900">
                          Unit {u.unit_num}: {u.title}
                        </span>
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded font-mono font-semibold">
                          {u.weightage || 20}%
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {(u.topics || []).map((t, idx) => (
                          <span 
                            key={idx} 
                            className="bg-white text-slate-700 border border-slate-200 text-[10px] px-2 py-0.5 rounded-md"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Semantic Vector Chunks Inspector */}
              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      RAG Vector Grounding Chunks ({chunks.length} Semantic Chunks)
                    </h3>
                  </div>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" /> Ready for AI Generation
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  These semantic chunks are queried by the Generative AI engine to ensure every generated question is factually bounded within the institutional syllabus.
                </p>

                <div className="max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {chunks.map((c) => (
                    <div 
                      key={c.id} 
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 hover:border-slate-300 transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900">
                          Unit {c.unit_number}: {c.topic}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Chunk #{c.id}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed font-sans">{c.content}</p>
                      {c.keywords && (
                        <p className="text-[10px] text-indigo-600 font-mono pt-1">
                          Keywords: {c.keywords}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: PDF UPLOAD FORM
          ========================================================================= */}
      {tab === 'upload_pdf' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="max-w-2xl mx-auto space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-indigo-600" />
                Upload Institutional Syllabus Document (PDF)
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Upload official PDF syllabus documents. The backend parser extracts unit headers, topic breakdowns, and creates semantic RAG embeddings automatically.
              </p>
            </div>

            <form onSubmit={handleUploadPdf} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Course Code</label>
                  <input
                    type="text"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    required
                    placeholder="e.g. CS503"
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Course Title</label>
                  <input
                    type="text"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    required
                    placeholder="e.g. Design and Analysis of Algorithms"
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Semester & Academic Year</label>
                  <input
                    type="text"
                    value={`${semester} (${academicYear})`}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* File upload drag/drop zone */}
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-indigo-400 transition bg-slate-50/50">
                <UploadCloud className="w-10 h-10 text-indigo-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-800">Select Syllabus PDF Document</p>
                <p className="text-[11px] text-slate-500 mt-1">Automatic parsing of Unit titles, topics & learning outcomes</p>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setPdfFile(e.target.files[0])}
                  className="mt-4 text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                />
                {pdfFile && (
                  <p className="text-xs text-emerald-600 font-semibold mt-3">
                    Selected: {pdfFile.name} ({(pdfFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTab('list')}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>{loading ? 'Processing & Indexing Vector Chunks...' : 'Parse & Save Syllabus'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: PASTE TEXT FORM
          ========================================================================= */}
      {tab === 'paste_text' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="max-w-2xl mx-auto space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Paste Raw Syllabus Curriculum Text
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Directly paste syllabus text containing Unit/Module headings (e.g. "UNIT 1: ...", "UNIT 2: ...").
              </p>
            </div>

            <form onSubmit={handleCreateText} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Course Code</label>
                  <input
                    type="text"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    required
                    placeholder="e.g. CS503"
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Course Title</label>
                  <input
                    type="text"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    required
                    placeholder="e.g. Design and Analysis of Algorithms"
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Syllabus Text</label>
                <textarea
                  rows={8}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={`UNIT 1: Linear Data Structures - Arrays, Stacks, Queues, Linked Lists\nUNIT 2: Non-Linear Data Structures - Binary Trees, Traversals, BST, AVL Trees\nUNIT 3: Graph Algorithms - BFS, DFS, Dijkstra Shortest Path, Minimum Spanning Tree\nUNIT 4: Sorting & Searching - Quick Sort, Merge Sort, Heap Sort, Hash Tables\nUNIT 5: Algorithm Design Techniques - Divide and Conquer, Greedy Method, Dynamic Programming`}
                  className="w-full text-xs font-mono p-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTab('list')}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>{loading ? 'Chunking & Indexing...' : 'Save & Ground Syllabus'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          CONFIRMATION POPUP MODAL (REQUIREMENT 2 & 5) - LIGHT MODE STYLING
          ========================================================================= */}
      {syllabusToDelete && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={closeDeleteModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
        >
          <div 
            className="relative w-full max-w-lg bg-white border border-rose-200 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-900 overflow-hidden transform transition-all animate-slide-3d"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient top red accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent" />

            {/* Top Close Button */}
            <button
              type="button"
              onClick={closeDeleteModal}
              disabled={deletingId !== null}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-xl hover:bg-slate-100 transition"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Danger Icon Header */}
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto mb-4 shadow-xs">
                <Trash2 className="w-7 h-7 text-rose-600" />
              </div>

              <h3 id="delete-dialog-title" className="text-lg font-bold text-slate-900 tracking-tight">
                Delete Syllabus Confirmation
              </h3>

              {/* Exact Required Prompt Message */}
              <p className="text-xs text-rose-700 font-medium mt-2 leading-relaxed">
                Are you sure you want to delete this syllabus? This action cannot be undone.
              </p>
            </div>

            {/* Targeted Syllabus Summary Card */}
            <div className="my-5 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {syllabusToDelete.course_code}
                </span>
                <span className="text-[11px] text-slate-500">
                  {syllabusToDelete.semester}
                </span>
              </div>

              <h4 className="text-sm font-semibold text-slate-900">
                {syllabusToDelete.course_name}
              </h4>

              <div className="text-[11px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-200">
                <span>{syllabusToDelete.department}</span>
                {syllabusToDelete.file_name && (
                  <span className="font-mono text-slate-700 truncate max-w-[150px]">
                    {syllabusToDelete.file_name}
                  </span>
                )}
              </div>
            </div>

            {/* Cascade Notice Warning if linked papers detected */}
            {cascadeRequired && (
              <div className="mb-5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-900">Linked Examination Papers Detected</p>
                  <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                    {cascadeErrorMessage || 'This syllabus is currently linked to generated examination papers. Deleting it requires confirming cascade delete to also remove linked papers.'}
                  </p>
                </div>
              </div>
            )}

            {/* Modal Action Buttons (Requirement 2: Cancel & Confirm Delete) */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deletingId !== null}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>

              {cascadeRequired ? (
                <button
                  type="button"
                  onClick={() => handleConfirmDelete(true)}
                  disabled={deletingId !== null}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {deletingId ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Deleting All...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Confirm Force Delete</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleConfirmDelete(false)}
                  disabled={deletingId !== null}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {deletingId ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Confirm Delete</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
