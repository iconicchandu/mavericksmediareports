import React, { useState, useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';

// ─── Traditional Animated Diya Lamp ──────────────────────────────────────────
export interface DiyaLampProps {
  size?: number;
  className?: string;
  glow?: boolean;
  interactive?: boolean;
  title?: string;
}

export const DiyaLamp: React.FC<DiyaLampProps> = ({
  size = 48,
  className = '',
  glow = true,
  interactive = true,
  title = 'Shubh Deepavali Diya',
}) => {
  const [isSparkling, setIsSparkling] = useState(false);

  const handleClick = () => {
    if (!interactive) return;
    setIsSparkling(true);
    setTimeout(() => setIsSparkling(false), 1200);
  };

  const width = size;
  const height = size * 0.85;

  return (
    <div
      onClick={handleClick}
      title={title}
      className={`relative inline-flex items-center justify-center select-none transition-transform ${
        interactive ? 'cursor-pointer hover:scale-110 active:scale-95' : ''
      } ${className}`}
      style={{ width, height }}
    >
      {/* Golden Aura Glow behind flame */}
      {glow && (
        <div
          className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full pointer-events-none animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(251, 191, 36, 0.45) 0%, rgba(249, 115, 22, 0.2) 50%, transparent 70%)',
            filter: 'blur(4px)',
          }}
        />
      )}

      {/* SVG Diya Lamp */}
      <svg
        viewBox="0 0 100 85"
        className="w-full h-full overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Flame Gradient Outer */}
          <linearGradient id="diyaFlameOuter" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#ea580c" />
            <stop offset="60%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>

          {/* Flame Gradient Mid */}
          <linearGradient id="diyaFlameMid" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="70%" stopColor="#fef08a" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>

          {/* Terracotta Clay Base Gradient */}
          <linearGradient id="diyaClay" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d97706" />
            <stop offset="35%" stopColor="#b45309" />
            <stop offset="75%" stopColor="#92400e" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>

          {/* Golden Rim Trim Gradient */}
          <linearGradient id="diyaGold" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="50%" stopColor="#fef08a" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>

          {/* Flame Glow Filter */}
          <filter id="diyaFlameGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── FLAME (Animated flickering) ── */}
        <g className="animate-flame-flicker origin-bottom" style={{ transformOrigin: '50px 38px' }}>
          {/* Flame Glow Halo */}
          <ellipse
            cx="50"
            cy="24"
            rx="14"
            ry="20"
            fill="url(#diyaFlameOuter)"
            opacity="0.35"
            filter="url(#diyaFlameGlow)"
          />

          {/* Outer Orange Flame */}
          <path
            d="M 50 6 C 41 18, 38 29, 50 38 C 62 29, 59 18, 50 6 Z"
            fill="url(#diyaFlameOuter)"
            filter="url(#diyaFlameGlow)"
          />

          {/* Mid Golden Flame */}
          <path
            d="M 50 12 C 43 20, 42 28, 50 36 C 58 28, 57 20, 50 12 Z"
            fill="url(#diyaFlameMid)"
          />

          {/* Core White Hot Flame */}
          <path
            d="M 50 18 C 46 23, 45 28, 50 34 C 55 28, 54 23, 50 18 Z"
            fill="#ffffff"
          />
        </g>

        {/* ── WICK (Baati) ── */}
        <path
          d="M 49 39 Q 50 34 50 31"
          stroke="#451a03"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* ── CLAY DIYA LAMP BODY ── */}
        {/* Base shadow */}
        <ellipse cx="50" cy="74" rx="36" ry="6" fill="#000000" opacity="0.12" />

        {/* Deep Earthen Bowl */}
        <path
          d="M 12 44 C 14 68, 86 68, 88 44 C 76 56, 24 56, 12 44 Z"
          fill="url(#diyaClay)"
        />

        {/* Upper Rim / Lip (Curved Diya Shape) */}
        <path
          d="M 8 42 C 22 54, 78 54, 92 42 C 82 48, 18 48, 8 42 Z"
          fill="url(#diyaClay)"
        />
        <path
          d="M 8 42 Q 50 51 92 42 Q 50 35 8 42 Z"
          fill="url(#diyaGold)"
          stroke="#b45309"
          strokeWidth="0.8"
        />

        {/* Diya Oil Well (Dark reflective oil puddle inside) */}
        <ellipse cx="50" cy="42" rx="34" ry="4.5" fill="#78350f" />
        <ellipse cx="50" cy="42" rx="31" ry="3" fill="#451a03" opacity="0.6" />

        {/* Ornamental Filigree Beads on the Rim */}
        <circle cx="25" cy="45" r="1.5" fill="#fef08a" />
        <circle cx="35" cy="47" r="1.5" fill="#fef08a" />
        <circle cx="45" cy="47.5" r="1.5" fill="#fef08a" />
        <circle cx="55" cy="47.5" r="1.5" fill="#fef08a" />
        <circle cx="65" cy="47" r="1.5" fill="#fef08a" />
        <circle cx="75" cy="45" r="1.5" fill="#fef08a" />

        {/* Diya Base Stand */}
        <path
          d="M 38 68 C 38 72, 62 72, 62 68 Z"
          fill="#92400e"
          stroke="#78350f"
          strokeWidth="0.8"
        />
      </svg>

      {/* Interactive Sparkle Burst */}
      {isSparkling && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center animate-ping">
          <Sparkles className="w-8 h-8 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
        </div>
      )}
    </div>
  );
};

// ─── Hanging Fairy Lights Garland (Curved Wires with Twinkling Bulbs) ─────────
export const HangingFairyLights: React.FC = () => {
  const bulbs = [
    { color: '#f59e0b', shadow: 'rgba(245, 158, 11, 0.8)', anim: 'animate-fairy-1', x: '4%' },
    { color: '#ef4444', shadow: 'rgba(239, 68, 68, 0.8)', anim: 'animate-fairy-2', x: '9%' },
    { color: '#10b981', shadow: 'rgba(16, 185, 129, 0.8)', anim: 'animate-fairy-3', x: '14%' },
    { color: '#f97316', shadow: 'rgba(249, 115, 22, 0.8)', anim: 'animate-fairy-1', x: '19%' },
    { color: '#8b5cf6', shadow: 'rgba(139, 92, 246, 0.8)', anim: 'animate-fairy-2', x: '24%' },
    { color: '#f59e0b', shadow: 'rgba(245, 158, 11, 0.8)', anim: 'animate-fairy-3', x: '29%' },
    { color: '#ec4899', shadow: 'rgba(236, 72, 153, 0.8)', anim: 'animate-fairy-1', x: '34%' },
    { color: '#06b6d4', shadow: 'rgba(6, 182, 212, 0.8)', anim: 'animate-fairy-2', x: '39%' },
    { color: '#f59e0b', shadow: 'rgba(245, 158, 11, 0.8)', anim: 'animate-fairy-3', x: '44%' },
    { color: '#ef4444', shadow: 'rgba(239, 68, 68, 0.8)', anim: 'animate-fairy-1', x: '49%' },
    { color: '#10b981', shadow: 'rgba(16, 185, 129, 0.8)', anim: 'animate-fairy-2', x: '54%' },
    { color: '#f97316', shadow: 'rgba(249, 115, 22, 0.8)', anim: 'animate-fairy-3', x: '59%' },
    { color: '#8b5cf6', shadow: 'rgba(139, 92, 246, 0.8)', anim: 'animate-fairy-1', x: '64%' },
    { color: '#f59e0b', shadow: 'rgba(245, 158, 11, 0.8)', anim: 'animate-fairy-2', x: '69%' },
    { color: '#ec4899', shadow: 'rgba(236, 72, 153, 0.8)', anim: 'animate-fairy-3', x: '74%' },
    { color: '#06b6d4', shadow: 'rgba(6, 182, 212, 0.8)', anim: 'animate-fairy-1', x: '79%' },
    { color: '#f59e0b', shadow: 'rgba(245, 158, 11, 0.8)', anim: 'animate-fairy-2', x: '84%' },
    { color: '#ef4444', shadow: 'rgba(239, 68, 68, 0.8)', anim: 'animate-fairy-3', x: '89%' },
    { color: '#10b981', shadow: 'rgba(16, 185, 129, 0.8)', anim: 'animate-fairy-1', x: '94%' },
  ];

  return (
    <div className="w-full fixed top-0 left-0 right-0 h-7 pointer-events-none select-none overflow-visible z-[100]">
      {/* Curved Hanging Garland Wire */}
      <svg className="w-full h-4 overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 20">
        <path
          d="M 0 4 Q 50 14 100 4 Q 150 14 200 4 Q 250 14 300 4 Q 350 14 400 4 Q 450 14 500 4 Q 550 14 600 4 Q 650 14 700 4 Q 750 14 800 4 Q 850 14 900 4 Q 950 14 1000 4"
          fill="none"
          stroke="rgba(71, 85, 105, 0.6)"
          strokeWidth="1.3"
        />
      </svg>

      {/* Twinkling Light Bulbs */}
      {bulbs.map((bulb, idx) => (
        <div
          key={idx}
          className="absolute -top-0.5 flex flex-col items-center"
          style={{ left: bulb.x }}
        >
          {/* Small dark bulb socket */}
          <div className="w-1.5 h-1.5 bg-slate-800 rounded-2xs" />
          {/* Luminous Bulb */}
          <div
            className={`w-2.5 h-3.5 rounded-full ${bulb.anim}`}
            style={{
              backgroundColor: bulb.color,
              boxShadow: `0 0 12px ${bulb.shadow}, 0 0 4px ${bulb.color}`,
              filter: `drop-shadow(0 0 4px ${bulb.color})`,
            }}
          />
        </div>
      ))}
    </div>
  );
};

// ─── Traditional Indian Akash Kandil (Hanging Star Lantern) ───────────────────
export const DiwaliLantern: React.FC<{ side: 'left' | 'right' }> = ({ side }) => {
  const isLeft = side === 'left';

  return (
    <div
      className={`fixed top-0 ${isLeft ? 'left-3 sm:left-8' : 'right-3 sm:right-8'} z-[95] pointer-events-none select-none hidden md:block`}
    >
      <div className="animate-lantern-sway origin-top flex flex-col items-center">
        {/* Hanging Thread */}
        <div className="w-[1px] h-10 bg-gradient-to-b from-amber-400 to-amber-600/70" />

        {/* Star Lantern Body */}
        <svg width="44" height="60" viewBox="0 0 44 60" className="overflow-visible drop-shadow-[0_4px_12px_rgba(245,158,11,0.35)]">
          <defs>
            <linearGradient id={`kandilGold-${side}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
            <linearGradient id={`kandilMaroon-${side}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#9f1239" />
            </linearGradient>
            <linearGradient id={`kandilTeal-${side}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#14b8a6" />
              <stop offset="100%" stopColor="#0f766e" />
            </linearGradient>
          </defs>

          {/* Central Faceted Diamond */}
          <polygon points="22,2 40,20 22,38 4,20" fill={`url(#kandilMaroon-${side})`} stroke="#fef08a" strokeWidth="1" />
          <polygon points="22,6 36,20 22,34 8,20" fill={`url(#kandilGold-${side})`} opacity="0.85" />
          <polygon points="22,10 32,20 22,30 12,20" fill={`url(#kandilTeal-${side})`} />

          {/* Inner Glowing Candle / Light */}
          <circle cx="22" cy="20" r="4" fill="#ffffff" filter="drop-shadow(0 0 6px rgba(254, 240, 138, 0.9))" />

          {/* Top Hanging Cap */}
          <polygon points="22,0 26,4 18,4" fill="#f59e0b" />

          {/* Hanging Golden/Pink Tassels */}
          <line x1="12" y1="36" x2="10" y2="58" stroke="#f43f5e" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="17" y1="37" x2="16" y2="62" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="22" y1="38" x2="22" y2="65" stroke="#fef08a" strokeWidth="2" strokeLinecap="round" />
          <line x1="27" y1="37" x2="28" y2="62" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="32" y1="36" x2="34" y2="58" stroke="#14b8a6" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
};

// ─── Floating Akash Kandil (Traditional Hanging Star Lantern for Cards & Sections) ───
export const FloatingKandil: React.FC<{
  size?: number;
  threadLength?: number;
  glow?: boolean;
  className?: string;
}> = ({ size = 36, threadLength = 16, glow = true, className = '' }) => {
  return (
    <div className={`pointer-events-none select-none inline-flex flex-col items-center ${className}`}>
      <div className="animate-lantern-sway origin-top flex flex-col items-center">
        {/* Hanging Thread */}
        {threadLength > 0 && (
          <div
            className="w-[1.2px] bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600/80"
            style={{ height: `${threadLength}px` }}
          />
        )}

        {/* Star Lantern Body */}
        <div
          className="relative flex items-center justify-center transition-transform duration-300 hover:scale-110"
          style={{ width: `${size}px`, height: `${size * 1.36}px` }}
        >
          <svg
            viewBox="0 0 44 60"
            className={`w-full h-full overflow-visible ${
              glow ? 'drop-shadow-[0_4px_14px_rgba(245,158,11,0.45)]' : ''
            }`}
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id="floatingKandilGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
              <linearGradient id="floatingKandilMaroon" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f43f5e" />
                <stop offset="100%" stopColor="#9f1239" />
              </linearGradient>
              <linearGradient id="floatingKandilTeal" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#14b8a6" />
                <stop offset="100%" stopColor="#0f766e" />
              </linearGradient>
            </defs>

            {/* Central Faceted Diamond */}
            <polygon points="22,2 40,20 22,38 4,20" fill="url(#floatingKandilMaroon)" stroke="#fef08a" strokeWidth="1" />
            <polygon points="22,6 36,20 22,34 8,20" fill="url(#floatingKandilGold)" opacity="0.85" />
            <polygon points="22,10 32,20 22,30 12,20" fill="url(#floatingKandilTeal)" />

            {/* Inner Glowing Candle / Light Core */}
            <circle cx="22" cy="20" r="4.2" fill="#ffffff" filter="drop-shadow(0 0 7px rgba(254, 240, 138, 0.95))" />

            {/* Top Hanging Cap */}
            <polygon points="22,0 26,4 18,4" fill="#f59e0b" />

            {/* Hanging Colorful Paper Streamers / Tassels */}
            <line x1="12" y1="36" x2="10" y2="58" stroke="#f43f5e" strokeWidth="1.6" strokeLinecap="round" />
            <line x1="17" y1="37" x2="16" y2="62" stroke="#f59e0b" strokeWidth="1.6" strokeLinecap="round" />
            <line x1="22" y1="38" x2="22" y2="65" stroke="#fef08a" strokeWidth="2.2" strokeLinecap="round" />
            <line x1="27" y1="37" x2="28" y2="62" stroke="#f59e0b" strokeWidth="1.6" strokeLinecap="round" />
            <line x1="32" y1="36" x2="34" y2="58" stroke="#14b8a6" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </div>
  );
};

// ─── Glowing Bottom Diyas (Authentic traditional clay oil lamps resting on the bottom) ──
export const DiwaliBottomDiyas: React.FC = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 pointer-events-none select-none z-30 flex justify-between items-end px-3 sm:px-6 pb-0.5">
      {/* Bottom Left: Cluster of glowing Diyas with warm ground reflection */}
      <div className="flex items-end gap-1.5 relative">
        {/* Soft golden floor aura glow */}
        <div className="absolute -bottom-2 -left-4 w-32 h-10 bg-amber-500/25 rounded-full blur-xl pointer-events-none" />
        <div className="transition-transform duration-300 hover:scale-105 drop-shadow-[0_4px_12px_rgba(245,158,11,0.45)]">
          <DiyaLamp size={42} glow />
        </div>
        <div className="transition-transform duration-300 hover:scale-105 -translate-x-1 translate-y-0.5 drop-shadow-[0_4px_10px_rgba(245,158,11,0.4)]">
          <DiyaLamp size={30} glow />
        </div>
      </div>

      {/* Bottom Center: Subtle center Diya */}
      <div className="relative hidden md:flex items-end justify-center">
        <div className="absolute -bottom-2 w-24 h-8 bg-amber-500/20 rounded-full blur-lg pointer-events-none" />
        <div className="drop-shadow-[0_4px_10px_rgba(245,158,11,0.4)]">
          <DiyaLamp size={34} glow />
        </div>
      </div>

      {/* Bottom Right: Cluster of glowing Diyas with warm ground reflection */}
      <div className="flex items-end gap-1.5 relative">
        {/* Soft golden floor aura glow */}
        <div className="absolute -bottom-2 -right-4 w-32 h-10 bg-amber-500/25 rounded-full blur-xl pointer-events-none" />
        <div className="transition-transform duration-300 hover:scale-105 translate-x-1 translate-y-0.5 drop-shadow-[0_4px_10px_rgba(245,158,11,0.4)]">
          <DiyaLamp size={30} glow />
        </div>
        <div className="transition-transform duration-300 hover:scale-105 drop-shadow-[0_4px_12px_rgba(245,158,11,0.45)]">
          <DiyaLamp size={42} glow />
        </div>
      </div>
    </div>
  );
};

// Backwards compatibility alias
export const DiwaliCornerDiyas = DiwaliBottomDiyas;

// ─── Aerial Skycracker Fireworks (Blasting at random time & random place) ─────
export const DiwaliSkycrackers: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let timeoutId: ReturnType<typeof setTimeout>;
    let isRunning = true;

    // High DPI Canvas resize handling
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle structures
    interface Spark {
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      alpha: number;
      decay: number;
      size: number;
      flicker: boolean;
    }

    interface Rocket {
      x: number;
      y: number;
      targetY: number;
      vy: number;
      color: string;
      burstType: 'golden' | 'colorful';
      trail: { x: number; y: number; alpha: number }[];
    }

    interface FlashRing {
      x: number;
      y: number;
      radius: number;
      maxRadius: number;
      color: string;
      alpha: number;
    }

    let sparks: Spark[] = [];
    let rockets: Rocket[] = [];
    let flashes: FlashRing[] = [];

    // ─── Golden & Colorful Palettes ───────────────────────────────────────────
    // 1. Pure Radiant Golden Willow & Brocade
    const GOLDEN_BURST_COLORS = [
      '#ffd700', // Pure 24K Gold
      '#fbbf24', // Radiant Amber Gold
      '#f59e0b', // Warm Deep Gold
      '#fef08a', // Sparkling Lemon Gold
      '#fde047', // Sunbeam Yellow
      '#fffbeb', // Champagne Shimmer
      '#ea580c', // Fiery Golden Orange
      '#ffffff', // Diamond White Spark
    ];

    // 2. Vibrant Multi-Color Festive Carnival (Ruby, Emerald, Peacock, Magenta, Orange + Gold)
    const COLORFUL_BURST_COLORS = [
      '#ffd700', // Shimmering Gold
      '#fbbf24', // Amber Gold
      '#ef4444', // Ruby Red
      '#f43f5e', // Crimson Coral
      '#10b981', // Emerald Green
      '#059669', // Bright Jade
      '#06b6d4', // Peacock Cyan
      '#3b82f6', // Sapphire Blue
      '#ec4899', // Festive Pink
      '#d946ef', // Neon Magenta
      '#a855f7', // Royal Purple
      '#f97316', // Marigold Orange
      '#ffffff', // Starlight White
    ];

    // Detonate a Skycracker at (x, y)
    const detonateSkycracker = (x: number, y: number, burstType: 'golden' | 'colorful') => {
      const isGolden = burstType === 'golden';
      const flashColor = isGolden ? '#ffd700' : '#fbbf24';

      // 1. Shockwave Flash Ring
      flashes.push({
        x,
        y,
        radius: 4,
        maxRadius: Math.random() * 25 + 32,
        color: flashColor,
        alpha: 0.95,
      });

      // 2. Exploding spark particles (50 to 75 sparks in dense 360-degree burst)
      const particleCount = Math.floor(Math.random() * 25) + 50;
      for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        // Layered velocities for rich depth (inner core + outer radiant spray)
        const speed = Math.random() < 0.25
          ? Math.random() * 2.6 + 1.2  // inner bright sparks
          : Math.random() * 4.9 + 2.2; // outer radiant stars

        // Pick color: Golden willow sparks OR multi-color vibrant rainbow stars
        let color: string;
        if (isGolden) {
          color = GOLDEN_BURST_COLORS[Math.floor(Math.random() * GOLDEN_BURST_COLORS.length)];
        } else {
          color = COLORFUL_BURST_COLORS[Math.floor(Math.random() * COLORFUL_BURST_COLORS.length)];
        }

        sparks.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color,
          alpha: 1,
          decay: Math.random() * 0.014 + 0.010, // lasts ~1.6 - 2.2s for luxurious hang time
          size: Math.random() * 2.6 + 1.6,
          flicker: Math.random() > 0.3,
        });
      }

      // 3. Secondary twinkling crackle sparks (golden glitter & diamond sparkles)
      const glitterCount = Math.floor(Math.random() * 20) + 14;
      for (let i = 0; i < glitterCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2.4 + 0.8;
        const glitterColor = isGolden || Math.random() > 0.4 ? '#ffd700' : '#ffffff';
        sparks.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: glitterColor,
          alpha: 1,
          decay: Math.random() * 0.022 + 0.016,
          size: 1.4,
          flicker: true,
        });
      }
    };

    // Launch a rocket towards random sky position
    const launchSkycracker = (customX?: number, customY?: number) => {
      if (!isRunning) return;
      const w = window.innerWidth;
      const h = window.innerHeight;

      // Random target position in the upper/mid sky
      const targetX = customX ?? (w * 0.12 + Math.random() * (w * 0.76));
      const targetY = customY ?? (h * 0.08 + Math.random() * (h * 0.42));

      // Start from near bottom with slight horizontal variation
      const startX = targetX + (Math.random() * 60 - 30);
      const startY = h + 10;

      // Velocity to reach targetY smoothly
      const dy = targetY - startY;
      const vy = Math.max(-15, Math.min(-9, dy * 0.026));

      // Alternates between Golden explosions and Vibrant Colorful explosions
      const burstType: 'golden' | 'colorful' = Math.random() > 0.5 ? 'golden' : 'colorful';
      const rocketColor = burstType === 'golden' ? '#ffd700' : '#fbbf24';

      rockets.push({
        x: startX,
        y: startY,
        targetY,
        vy,
        color: rocketColor,
        burstType,
        trail: [],
      });
    };

    // Automated loop to trigger skycrackers at random times
    const triggerRandomSkycracker = () => {
      if (!isRunning) return;

      launchSkycracker();

      // 35% chance of a companion burst (double blast) in quick succession
      if (Math.random() < 0.35) {
        setTimeout(() => {
          if (isRunning) launchSkycracker();
        }, Math.random() * 320 + 160);
      }

      // Schedule next random blast (between 1.5s and 3.4s)
      const nextDelay = Math.random() * 1900 + 1500;
      timeoutId = setTimeout(triggerRandomSkycracker, nextDelay);
    };

    // First blast after 600ms
    timeoutId = setTimeout(triggerRandomSkycracker, 600);

    // Animation render loop (60 FPS)
    const render = () => {
      if (!isRunning) return;

      const w = window.innerWidth;
      const h = window.innerHeight;

      ctx.clearRect(0, 0, w, h);

      // ── 1. Update & Render Rockets ──
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.y += r.vy;
        r.trail.push({ x: r.x, y: r.y, alpha: 1 });

        // Draw rocket spark head
        ctx.save();
        ctx.shadowBlur = 12;
        ctx.shadowColor = r.color;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(r.x, r.y, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Draw smoke & glitter trail
        for (let t = 0; t < r.trail.length; t++) {
          const pt = r.trail[t];
          pt.alpha -= 0.08;
          if (pt.alpha > 0) {
            ctx.fillStyle = `rgba(251, 191, 36, ${pt.alpha * 0.75})`;
            ctx.fillRect(pt.x + (Math.random() * 2 - 1), pt.y, 2, 2);
          }
        }
        r.trail = r.trail.filter((pt) => pt.alpha > 0);
        ctx.restore();

        // Detonate when rocket reaches target height
        if (r.y <= r.targetY) {
          detonateSkycracker(r.x, r.y, r.burstType);
          rockets.splice(i, 1);
        }
      }

      // ── 2. Update & Render Shockwave Flash Rings ──
      for (let i = flashes.length - 1; i >= 0; i--) {
        const f = flashes[i];
        f.radius += 2.6;
        f.alpha -= 0.06;

        if (f.alpha > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
          ctx.strokeStyle = f.color;
          ctx.lineWidth = 2.2;
          ctx.globalAlpha = f.alpha * 0.65;
          ctx.shadowBlur = 14;
          ctx.shadowColor = f.color;
          ctx.stroke();
          ctx.stroke();
          ctx.restore();
        } else {
          flashes.splice(i, 1);
        }
      }

      // ── 3. Update & Render Exploding Sparks ──
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vx *= 0.965; // Air drag
        s.vy *= 0.965;
        s.vy += 0.055; // Gentle gravity
        s.alpha -= s.decay;

        if (s.alpha > 0) {
          ctx.save();
          const displayAlpha = s.flicker && Math.random() < 0.25 ? s.alpha * 0.4 : s.alpha;
          ctx.globalAlpha = Math.max(0, displayAlpha);
          ctx.shadowBlur = 8;
          ctx.shadowColor = s.color;
          ctx.fillStyle = s.color;

          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else {
          sparks.splice(i, 1);
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    // Pause on hidden tab to save resources
    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearTimeout(timeoutId);
      } else {
        triggerRandomSkycracker();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isRunning = false;
      cancelAnimationFrame(animId);
      clearTimeout(timeoutId);
      window.removeEventListener('resize', resizeCanvas);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none select-none z-[45]"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};

// ─── Floating Gold Sparkle Particles Backdrop ─────────────────────────────────
export const DiwaliSparkleParticles: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {/* Floating golden spark elements */}
      {[...Array(16)].map((_, i) => {
        const left = `${(i * 6.25 + 3) % 96}%`;
        const top = `${(i * 13.5 + 5) % 90}%`;
        const size = (i % 3) + 2;
        const delay = `${(i * 0.4) % 4}s`;
        const duration = `${(i % 3) + 3}s`;

        return (
          <div
            key={i}
            className="absolute rounded-full bg-amber-300 opacity-60 animate-pulse pointer-events-none"
            style={{
              left,
              top,
              width: `${size}px`,
              height: `${size}px`,
              boxShadow: '0 0 8px rgba(251, 191, 36, 0.9), 0 0 16px rgba(245, 158, 11, 0.6)',
              animationDelay: delay,
              animationDuration: duration,
            }}
          />
        );
      })}
    </div>
  );
};

// ─── Diwali Theme Toggle Button ───────────────────────────────────────────────
export interface DiwaliThemeToggleProps {
  isDiwaliMode: boolean;
  onToggle: () => void;
  className?: string;
}

export const DiwaliThemeToggle: React.FC<DiwaliThemeToggleProps> = ({
  isDiwaliMode,
  onToggle,
  className = '',
}) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={isDiwaliMode ? 'Switch to Normal Mode' : 'Turn on Festive Diwali Mode'}
      className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all shadow-sm active:scale-95 ${
        isDiwaliMode
          ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-[0_0_15px_rgba(245,158,11,0.4)] border border-amber-300/80 hover:brightness-110'
          : 'bg-white hover:bg-amber-50 text-slate-700 border border-slate-200/90 shadow-2xs hover:border-amber-300'
      } ${className}`}
    >
      <DiyaLamp size={18} glow={false} interactive={false} />
      <span className="tracking-wide text-[11px]">
        {isDiwaliMode ? 'Diwali Theme: ON' : 'Diwali Mode'}
      </span>
      {isDiwaliMode && (
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-200 animate-ping" />
      )}
    </button>
  );
};
