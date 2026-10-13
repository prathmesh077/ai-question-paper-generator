import React, { useRef, useState } from 'react';

export default function Interactive3DCard({
  children,
  className = '',
  glowColor = 'indigo', // 'indigo' | 'emerald' | 'purple' | 'rose' | 'amber' | 'blue'
  delayMs = 0,
  maxTilt = 8,
  onClick
}) {
  const cardRef = useRef(null);
  const [transform, setTransform] = useState('perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)');
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const glowColors = {
    indigo: 'hover:shadow-[0_15px_30px_-10px_rgba(99,102,241,0.2)] hover:border-indigo-300',
    emerald: 'hover:shadow-[0_15px_30px_-10px_rgba(16,185,129,0.2)] hover:border-emerald-300',
    purple: 'hover:shadow-[0_15px_30px_-10px_rgba(168,85,247,0.2)] hover:border-purple-300',
    rose: 'hover:shadow-[0_15px_30px_-10px_rgba(244,63,94,0.2)] hover:border-rose-300',
    amber: 'hover:shadow-[0_15px_30px_-10px_rgba(245,158,11,0.2)] hover:border-amber-300',
    blue: 'hover:shadow-[0_15px_30px_-10px_rgba(59,130,246,0.2)] hover:border-blue-300',
  };

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const normX = (x / rect.width) * 2 - 1; // -1 to 1
    const normY = (y / rect.height) * 2 - 1; // -1 to 1

    const rotX = -normY * maxTilt;
    const rotY = normX * maxTilt;

    setTransform(`perspective(1000px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) translateZ(8px)`);
    setGlarePos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.15
    });
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)');
    setGlarePos((prev) => ({ ...prev, opacity: 0 }));
    setIsHovered(false);
  };

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform,
        animationDelay: `${delayMs}ms`,
      }}
      className={`relative bg-white border border-slate-200 rounded-2xl shadow-sm text-slate-800 transition-all duration-200 ease-out transform-style-3d overflow-hidden animate-slide-3d ${glowColors[glowColor] || glowColors.indigo} ${className}`}
    >
      {/* Dynamic 3D Specular Light Glare following mouse */}
      <div
        className="pointer-events-none absolute inset-0 z-30 transition-opacity duration-300 rounded-2xl"
        style={{
          opacity: glarePos.opacity,
          background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.1) 40%, transparent 70%)`
        }}
      />

      {/* Card Content with 3D child elevation support */}
      <div className={`relative z-10 w-full h-full transform-style-3d transition-transform duration-200 ${isHovered ? '[&_[data-depth=true]]:translate-z-6' : ''}`}>
        {children}
      </div>
    </div>
  );
}
