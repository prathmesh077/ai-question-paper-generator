import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, BookOpen, Wand2, ShieldCheck, 
  Files, ChevronLeft, ChevronRight, 
  ArrowRight,
  Database, CheckCircle2, QrCode, 
  Clock, Award, CheckSquare, Layers
} from 'lucide-react';

export default function ThreeDSlides({ setActiveTab, isCompact = false }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  // All 5 slides represent the sequential WORK PROCESS in a sleek futuristic BLACK DESIGN
  const slides = [
    {
      id: 'step1',
      stepNumber: 1,
      phase: 'Step 01 • Curriculum Ingestion',
      title: 'Step 1: Upload Syllabus & Build RAG Vectors',
      subtitle: 'Faculty uploads official curriculum documents (PDF/DOCX). The system chunks units and computes vector embeddings in ChromaDB for 100% grounded question generation.',
      targetTab: 'syllabus',
      btnText: 'Start Step 1: Upload Syllabus Hub',
      accentColor: 'from-indigo-600 via-indigo-700 to-violet-800',
      badgeColor: 'bg-indigo-950/80 text-indigo-300 border-indigo-500/40',
      metrics: [
        { label: 'Ingestion Format', val: 'PDF & DOCX' },
        { label: 'Grounding Rate', val: '100% RAG' },
        { label: 'Hallucinations', val: '0.0%' },
      ],
      features: [
        'Automatic semantic unit chunking by textbook chapters',
        'High-density vector embeddings stored in local ChromaDB',
        'Direct citation mapping on every generated question'
      ],
      scene: 'step1-scene'
    },
    {
      id: 'step2',
      stepNumber: 2,
      phase: "Step 02 • Blueprint & Bloom's Setup",
      title: "Step 2: Configure Blueprint & Cognitive Matrix",
      subtitle: 'Set exam parameters (course code, duration, total marks) and calibrate Bloom’s Taxonomy cognitive levels with standard 30:50:20 difficulty benchmark.',
      targetTab: 'generator',
      btnText: 'Proceed to Step 2: Paper Wizard',
      accentColor: 'from-blue-600 via-indigo-700 to-purple-800',
      badgeColor: 'bg-blue-950/80 text-blue-300 border-blue-500/40',
      metrics: [
        { label: 'Cognitive Tiers', val: '6 Levels' },
        { label: 'Difficulty Ratio', val: '30:50:20' },
        { label: 'Blueprint Match', val: '100%' },
      ],
      features: [
        'Cognitive weighting: Remember, Understand, Apply, Analyze, Evaluate, Create',
        'Sectional matrices: Part A (MCQ), Part B (Short), Part C (Long)',
        'Automatic scoring rubric formulation with marking criteria'
      ],
      scene: 'step2-scene'
    },
    {
      id: 'step3',
      stepNumber: 3,
      phase: 'Step 03 • AI Synthesis & Scan',
      title: 'Step 3: AI Paper Generation & Anti-Duplicate Scan',
      subtitle: 'Gemini AI generates questions and answers while Levenshtein and Bigram similarity algorithms scan historical 5-year archives to eliminate repeats.',
      targetTab: 'generator',
      btnText: 'Inspect Step 3: AI Paper Generator',
      accentColor: 'from-purple-600 via-indigo-700 to-rose-700',
      badgeColor: 'bg-purple-950/80 text-purple-300 border-purple-500/40',
      metrics: [
        { label: 'Question Uniqueness', val: '99.2%' },
        { label: 'Cycle Overlap', val: '< 15% Max' },
        { label: 'Anti-Leak Shield', val: 'Active' },
      ],
      features: [
        'Context-aware question formulation from syllabus chunks',
        'Real-time similarity check against past university exam papers',
        'Automatic answer key & step-by-step marking schemes'
      ],
      scene: 'step3-scene'
    },
    {
      id: 'step4',
      stepNumber: 4,
      phase: 'Step 04 • Quality & Exam Verification',
      title: 'Step 4: Examination Review & Archival',
      subtitle: 'Review paper drafts, verify difficulty balance, and store examination papers with complete versioning.',
      targetTab: 'repository',
      btnText: 'Open Step 4: Paper Repository',
      accentColor: 'from-amber-600 via-orange-600 to-indigo-800',
      badgeColor: 'bg-amber-950/80 text-amber-300 border-amber-500/40',
      metrics: [
        { label: 'RBAC Security', val: 'Multi-Role' },
        { label: 'Review Queue', val: 'Moderated' },
        { label: 'Compliance Audit', val: '100% Tracked' },
      ],
      features: [
        'Dedicated workflow: Paper Setter submits → Moderator approves/rejects',
        'Interactive feedback with modification request notes',
        'Tamper-proof audit trail for university exam security'
      ],
      scene: 'step4-scene'
    },
    {
      id: 'step5',
      stepNumber: 5,
      phase: 'Step 05 • Publishing & Delivery',
      title: 'Step 5: Institutional Export & Live Quiz Links',
      subtitle: 'Download standardized ReportLab PDFs & editable Word DOCX, or generate 1-click online quiz links with QR codes and instant student grading.',
      targetTab: 'repository',
      btnText: 'Access Step 5: Paper Repository',
      accentColor: 'from-emerald-600 via-teal-700 to-indigo-800',
      badgeColor: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40',
      metrics: [
        { label: 'Print Output', val: 'ReportLab PDF' },
        { label: 'Editable Docs', val: 'Word DOCX' },
        { label: 'Online Testing', val: 'Live Links' },
      ],
      features: [
        'Official university examination header & roll-number block',
        '1-Click shareable student quiz URLs with anti-cheat protection',
        'Instant automated scoring, leaderboards, and PDF exports'
      ],
      scene: 'step5-scene'
    }
  ];

  const total = slides.length;

  // Auto-play timer
  useEffect(() => {
    if (!isAutoPlay || isHovered) return;

    const interval = 40;
    const step = 100 / (5000 / interval); // 5 seconds per slide

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setCurrentIndex((idx) => (idx + 1) % total);
          return 0;
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isAutoPlay, isHovered, currentIndex, total]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % total);
    setProgress(0);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
    setProgress(0);
  };

  const handleSelectSlide = (index) => {
    setCurrentIndex(index);
    setProgress(0);
  };

  // Mouse Parallax 3D Tilt handler
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const rotX = -(y / (rect.height / 2)) * 12;
    const rotY = (x / (rect.width / 2)) * 12;
    setTilt({ x: rotX, y: rotY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  };

  // 3D Coverflow Transform calculation with deep obsidian black depth shadows
  const getSlideStyle = (index) => {
    let diff = index - currentIndex;
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;

    const isActive = diff === 0;

    if (isActive) {
      return {
        transform: `translateX(0px) translateZ(130px) rotateY(${tilt.y}deg) rotateX(${tilt.x}deg) scale(1)`,
        zIndex: 30,
        opacity: 1,
        filter: 'drop-shadow(0 25px 40px rgba(0,0,0,0.9)) drop-shadow(0 0 25px rgba(99,102,241,0.25))',
        pointerEvents: 'auto'
      };
    } else if (diff === 1) {
      return {
        transform: 'translateX(320px) translateZ(-100px) rotateY(-36deg) scale(0.85)',
        zIndex: 20,
        opacity: 0.65,
        filter: 'brightness(0.65) drop-shadow(0 15px 25px rgba(0,0,0,0.8))',
        pointerEvents: 'auto'
      };
    } else if (diff === -1) {
      return {
        transform: 'translateX(-320px) translateZ(-100px) rotateY(36deg) scale(0.85)',
        zIndex: 20,
        opacity: 0.65,
        filter: 'brightness(0.65) drop-shadow(0 15px 25px rgba(0,0,0,0.8))',
        pointerEvents: 'auto'
      };
    } else if (diff === 2) {
      return {
        transform: 'translateX(560px) translateZ(-260px) rotateY(-50deg) scale(0.7)',
        zIndex: 10,
        opacity: 0.25,
        filter: 'brightness(0.4)',
        pointerEvents: 'auto'
      };
    } else {
      return {
        transform: 'translateX(-560px) translateZ(-260px) rotateY(50deg) scale(0.7)',
        zIndex: 10,
        opacity: 0.25,
        filter: 'brightness(0.4)',
        pointerEvents: 'auto'
      };
    }
  };

  // Render 3D work process scene graphic per step in sleek BLACK DESIGN
  const renderSlideGraphic = (slide) => {
    switch (slide.id) {
      case 'step1':
        return (
          <div className="relative w-full h-44 sm:h-52 rounded-2xl bg-black/90 border border-indigo-500/30 overflow-hidden flex items-center justify-center p-4 shadow-inner">
            <div className="absolute inset-0 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:16px_16px] opacity-25"></div>
            
            {/* Center Vector Neural Orb */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/60 border border-indigo-300/40 animate-float-slow">
                <Database className="w-8 h-8" />
              </div>
              <span className="text-[10px] font-mono font-bold text-indigo-300 mt-2 px-2.5 py-0.5 rounded-lg bg-indigo-950/90 border border-indigo-500/40 shadow-xs">
                ChromaDB Vector Embeddings
              </span>
            </div>

            {/* Orbiting Syllabus Chips */}
            <div className="absolute top-4 left-4 bg-slate-900/90 border border-indigo-500/40 px-2.5 py-1 rounded-xl text-[10px] font-semibold text-indigo-200 shadow-md flex items-center gap-1.5 animate-float-reverse">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>Unit 1-5 Chunking</span>
            </div>

            <div className="absolute bottom-4 right-4 bg-slate-900/90 border border-emerald-500/40 px-2.5 py-1 rounded-xl text-[10px] font-semibold text-emerald-300 shadow-md flex items-center gap-1.5 animate-float-slow">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cosine Similarity 0.94</span>
            </div>

            <div className="absolute top-5 right-4 bg-slate-900/90 border border-purple-500/40 px-2.5 py-1 rounded-xl text-[10px] font-mono font-medium text-purple-300 shadow-md">
              0.0% Hallucinations
            </div>
          </div>
        );

      case 'step2':
        return (
          <div className="relative w-full h-44 sm:h-52 rounded-2xl bg-black/90 border border-blue-500/30 overflow-hidden flex flex-col justify-center p-4 shadow-inner">
            <div className="text-[10px] font-semibold text-blue-300 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Bloom's 6-Tier Cognitive Matrix</span>
              <span className="font-mono text-emerald-400 font-bold">30 : 50 : 20 Ratio</span>
            </div>
            
            {/* Tiered steps visual */}
            <div className="space-y-1.5 w-full">
              {[
                { name: 'Create', color: 'bg-indigo-500', pct: '100%', tag: 'Tier 6' },
                { name: 'Evaluate', color: 'bg-rose-500', pct: '88%', tag: 'Tier 5' },
                { name: 'Analyze', color: 'bg-purple-500', pct: '74%', tag: 'Tier 4' },
                { name: 'Apply', color: 'bg-amber-500', pct: '60%', tag: 'Tier 3' },
                { name: 'Understand', color: 'bg-emerald-500', pct: '48%', tag: 'Tier 2' },
                { name: 'Remember', color: 'bg-blue-500', pct: '34%', tag: 'Tier 1' },
              ].map((tier) => (
                <div key={tier.name} className="flex items-center gap-2 text-[10px]">
                  <span className="w-16 font-semibold text-slate-300 shrink-0">{tier.name}</span>
                  <div className="flex-1 bg-slate-900/90 rounded-full h-2.5 overflow-hidden border border-slate-800">
                    <div 
                      className={`${tier.color} h-full rounded-full transition-all duration-700`}
                      style={{ width: tier.pct }}
                    />
                  </div>
                  <span className="text-slate-400 font-mono w-10 text-right shrink-0">{tier.tag}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'step3':
        return (
          <div className="relative w-full h-44 sm:h-52 rounded-2xl bg-black/90 border border-rose-500/30 overflow-hidden flex items-center justify-center p-4 shadow-inner">
            <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-[0_0_15px_#f43f5e] animate-scan-laser z-20 pointer-events-none"></div>

            {/* Central 3D Shield */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-rose-600/60 border border-rose-400/40 animate-pulse-glow">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <span className="text-[10px] font-mono font-bold text-rose-300 mt-2 px-2.5 py-0.5 rounded-lg bg-rose-950/90 border border-rose-500/40 shadow-xs">
                Levenshtein + Bigram Scan
              </span>
            </div>

            <div className="absolute top-4 left-4 bg-slate-900/90 border border-rose-500/40 px-2.5 py-1 rounded-xl text-[10px] font-semibold text-rose-200 shadow-md">
              Similarity &lt; 15% Max
            </div>
            <div className="absolute bottom-4 left-4 bg-slate-900/90 border border-purple-500/40 px-2.5 py-1 rounded-xl text-[10px] font-semibold text-purple-200 shadow-md">
              5-Year Cycle Archive
            </div>
            <div className="absolute top-4 right-4 bg-slate-900/90 border border-emerald-500/40 px-2.5 py-1 rounded-xl text-[10px] font-semibold text-emerald-300 shadow-md">
              Zero Exam Leakage
            </div>
          </div>
        );

      case 'step4':
        return (
          <div className="relative w-full h-44 sm:h-52 rounded-2xl bg-black/90 border border-amber-500/30 overflow-hidden flex items-center justify-center p-4 shadow-inner">
            <div className="w-full space-y-3 z-10">
              <div className="flex items-center justify-between text-[10px] font-semibold text-slate-300 px-3">
                <span>Faculty Setter</span>
                <span className="text-amber-400 font-bold">Board Moderator</span>
                <span className="text-emerald-400 font-bold">Approved Paper</span>
              </div>
              <div className="flex items-center justify-between relative px-6">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-md">1</div>
                <div className="flex-1 h-0.5 bg-gradient-to-r from-indigo-500 to-amber-500 mx-2"></div>
                <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs font-bold shadow-md animate-pulse">2</div>
                <div className="flex-1 h-0.5 bg-gradient-to-r from-amber-500 to-emerald-500 mx-2"></div>
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-md">✓</div>
              </div>
              <div className="bg-slate-900/90 border border-emerald-500/40 rounded-xl p-2.5 flex items-center justify-between text-xs shadow-md">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-slate-200 font-semibold text-[11px]">Audit Verified • Seal Issued</span>
                </div>
                <span className="bg-emerald-950 text-emerald-300 font-mono text-[9px] px-2 py-0.5 rounded border border-emerald-800 font-semibold">
                  Status: Approved
                </span>
              </div>
            </div>
          </div>
        );

      case 'step5':
        return (
          <div className="relative w-full h-44 sm:h-52 rounded-2xl bg-black/90 border border-emerald-500/30 overflow-hidden flex items-center justify-between p-4 gap-3 shadow-inner">
            {/* Paper Sheet Preview */}
            <div className="w-1/2 bg-white rounded-lg shadow-xl border border-slate-300 p-2 text-slate-900 transform -rotate-2">
              <div className="text-center border-b border-black pb-0.5">
                <span className="text-[7px] font-bold uppercase tracking-wider block font-sans">
                  UNIVERSITY EXAM
                </span>
              </div>
              <div className="mt-1 space-y-0.5 text-[6px]">
                <div className="flex justify-between border-b border-slate-200 pb-0.5">
                  <span>CS301</span>
                  <span>100 Marks</span>
                </div>
                <p className="text-[6px] text-slate-700">Q1. Explain AVL tree...</p>
              </div>
              <div className="mt-1 flex gap-1">
                <span className="bg-indigo-600 text-white text-[7px] font-bold px-1.5 py-0.5 rounded shadow-2xs">PDF</span>
                <span className="bg-blue-600 text-white text-[7px] font-bold px-1.5 py-0.5 rounded shadow-2xs">DOCX</span>
              </div>
            </div>

            {/* Live Student Quiz with QR Code */}
            <div className="w-1/2 bg-slate-900/90 border border-emerald-500/40 rounded-xl p-2.5 flex flex-col items-center justify-center gap-1.5 shadow-md">
              <div className="w-12 h-12 rounded-lg bg-white p-0.5 flex items-center justify-center shadow-xs">
                <QrCode className="w-11 h-11 text-slate-900" />
              </div>
              <span className="text-[9px] font-mono font-semibold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded text-center">
                Live URL Quiz
              </span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const containerHeight = isFullscreen ? 'h-[85vh]' : isCompact ? 'h-[420px]' : 'h-[530px]';

  return (
    <div className={`relative w-full ${isFullscreen ? 'fixed inset-0 z-50 bg-black/95 backdrop-blur-md p-6 flex flex-col justify-center' : 'my-4'}`}>
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
              <Sparkles className="w-3 h-3" /> 5-Step Work Process
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              End-to-End System Work Process Pipeline
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Follow the autonomous 5-step workflow from syllabus ingestion to AI generation, moderation, and publishing.
          </p>
        </div>


      </div>

      {/* 3D Stage / Viewport in Light Design */}
      <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        className={`relative w-full ${containerHeight} rounded-3xl bg-gradient-to-b from-indigo-50/70 via-slate-50 to-indigo-50/70 border border-slate-200 shadow-sm overflow-hidden perspective-1200 flex items-center justify-center select-none`}
      >
        {/* Background Ambient Glow & Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* 3D Carousel Stage */}
        <div className="relative w-full max-w-lg sm:max-w-xl h-full flex items-center justify-center transform-style-3d">
          {slides.map((slide, index) => {
            const style = getSlideStyle(index);

            return (
              <div
                key={slide.id}
                onClick={() => handleSelectSlide(index)}
                style={style}
                className="absolute w-[90%] sm:w-[500px] bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xl transition-all duration-700 ease-out cursor-pointer transform-style-3d overflow-hidden text-slate-800"
              >
                {/* Work Process Step Tracker across all 5 steps */}
                <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 mb-3 text-[10px] font-semibold">
                  {[
                    { num: 1, label: 'Upload' },
                    { num: 2, label: 'Blueprint' },
                    { num: 3, label: 'AI Gen' },
                    { num: 4, label: 'Review' },
                    { num: 5, label: 'Publish' }
                  ].map((st, sIdx) => {
                    const isPast = sIdx < index;
                    const isCurr = sIdx === index;
                    return (
                      <div key={st.num} className="flex items-center gap-1">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold transition ${
                          isCurr 
                            ? 'bg-indigo-600 text-white ring-2 ring-indigo-300 shadow-xs' 
                            : isPast 
                            ? 'bg-emerald-100 border border-emerald-300 text-emerald-700' 
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          {isPast ? '✓' : st.num}
                        </div>
                        <span className={`hidden sm:inline ${isCurr ? 'text-indigo-700 font-bold' : isPast ? 'text-emerald-700' : 'text-slate-500'}`}>
                          {st.label}
                        </span>
                        {sIdx < 4 && <span className="text-slate-300 mx-0.5">→</span>}
                      </div>
                    );
                  })}
                </div>

                {/* Step Tag & Counter */}
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${slide.badgeColor}`}>
                    {slide.phase}
                  </span>
                  <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg shadow-xs">
                    Step {slide.stepNumber} of {total}
                  </span>
                </div>

                {/* Slide Title & Subtitle */}
                <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-snug">
                  {slide.title}
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {slide.subtitle}
                </p>

                {/* 3D Visual Scene */}
                <div className="my-3">
                  {renderSlideGraphic(slide)}
                </div>

                {/* KPI Metrics Row */}
                <div className="grid grid-cols-3 gap-2 my-2.5 border-t border-slate-100 pt-2.5">
                  {slide.metrics.map((m, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-1.5 text-center">
                      <span className="text-[9px] text-slate-500 block font-medium">{m.label}</span>
                      <span className="text-xs sm:text-sm font-bold text-indigo-700 mt-0.5 block">{m.val}</span>
                    </div>
                  ))}
                </div>

                {/* Features Bullet Points */}
                <div className="space-y-1 mb-3 hidden sm:block">
                  {slide.features.slice(0, 2).map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-center text-[10px] text-slate-600 gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                {/* Active Action Button */}
                <div className="pt-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (setActiveTab) setActiveTab(slide.targetTab);
                      if (isFullscreen) setIsFullscreen(false);
                    }}
                    className={`w-full bg-gradient-to-r ${slide.accentColor} hover:brightness-105 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-indigo-100 transition active:scale-95`}
                  >
                    <span>{slide.btnText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* 3D Navigation Arrows */}
        <button
          onClick={handlePrev}
          className="absolute left-3 sm:left-6 z-40 p-2.5 sm:p-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-md backdrop-blur-md transition hover:scale-110 active:scale-95 cursor-pointer"
          title="Previous Step"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        <button
          onClick={handleNext}
          className="absolute right-3 sm:right-6 z-40 p-2.5 sm:p-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-md backdrop-blur-md transition hover:scale-110 active:scale-95 cursor-pointer"
          title="Next Step"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Bottom Slide Indicators & Progress Bar */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2">
          {/* Progress Bar for Auto-play */}
          {isAutoPlay && (
            <div className="w-36 sm:w-48 bg-slate-200 rounded-full h-1 overflow-hidden border border-slate-300">
              <div 
                className="bg-indigo-600 h-full rounded-full transition-all duration-75"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Slide Indicator Dots */}
          <div className="flex items-center space-x-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
            {slides.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => handleSelectSlide(idx)}
                className={`transition-all rounded-full ${
                  idx === currentIndex 
                    ? 'w-6 h-2 bg-indigo-600 shadow-xs' 
                    : 'w-2 h-2 bg-slate-300 hover:bg-slate-400'
                }`}
                title={`Step ${idx + 1}: ${s.title}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
