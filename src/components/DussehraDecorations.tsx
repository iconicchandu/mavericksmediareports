import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

// ─── Celestial Kodanda Bow & Flaming Arrow (Symbol of Dharma & Victory) ──────
export interface DivineBowArrowProps {
  size?: number;
  className?: string;
  glow?: boolean;
  interactive?: boolean;
  title?: string;
}

export const DivineBowArrow: React.FC<DivineBowArrowProps> = ({
  size = 56,
  className = '',
  glow = true,
  interactive = true,
  title = 'Shubh Vijayadashami - Celestial Kodanda Bow of Victory',
}) => {
  const [isSparkling, setIsSparkling] = useState(false);

  const handleClick = () => {
    if (!interactive) return;
    setIsSparkling(true);
    setTimeout(() => setIsSparkling(false), 1400);
  };

  return (
    <div
      onClick={handleClick}
      title={interactive ? `${title} (Click to trigger victory sparks)` : title}
      className={`relative inline-flex items-center justify-center select-none ${
        interactive ? 'cursor-pointer transform hover:scale-105 active:scale-95 transition-transform duration-200' : ''
      } ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      {/* Radiant Solar Aura Behind Bow */}
      {glow && (
        <div
          className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500/35 via-orange-500/35 to-yellow-400/30 blur-xl pointer-events-none animate-pulse"
          style={{ transform: 'scale(1.25)' }}
        />
      )}

      {/* SVG Celestial Bow & Arrow */}
      <svg
        viewBox="0 0 120 120"
        className="w-full h-full overflow-visible drop-shadow-[0_4px_16px_rgba(234,88,12,0.45)]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Metallic 24K Gold Gradient */}
          <linearGradient id="bowGold3D" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="15%" stopColor="#fef08a" />
            <stop offset="45%" stopColor="#f59e0b" />
            <stop offset="75%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>

          {/* Deep Royal Gold Rim Gradient */}
          <linearGradient id="bowGoldDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="50%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#451a03" />
          </linearGradient>

          {/* Saffron Fire Agni Flame Gradient */}
          <linearGradient id="agniFlame" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#b91c1c" />
            <stop offset="25%" stopColor="#ea580c" />
            <stop offset="60%" stopColor="#f97316" />
            <stop offset="85%" stopColor="#ffd700" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>

          {/* Ruby Gem Radial Gradient */}
          <radialGradient id="rubyGem" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#fecaca" />
            <stop offset="35%" stopColor="#ef4444" />
            <stop offset="75%" stopColor="#b91c1c" />
            <stop offset="100%" stopColor="#450a0a" />
          </radialGradient>

          {/* Solar Aura Mandala Gradient */}
          <radialGradient id="suryaMandala" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(254, 240, 138, 0.45)" />
            <stop offset="50%" stopColor="rgba(245, 158, 11, 0.22)" />
            <stop offset="85%" stopColor="rgba(234, 88, 12, 0.08)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>

          {/* Glow Filter */}
          <filter id="celestialGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── Solar Aura Halo (Surya Mandala of Victory) ── */}
        <circle cx="56" cy="62" r="38" fill="url(#suryaMandala)" />

        {/* Delicate Solar Radiance Rays */}
        <g
          stroke="#f59e0b"
          strokeWidth="1"
          strokeDasharray="3 4"
          opacity="0.45"
          className="animate-spin"
          style={{ animationDuration: '30s', transformOrigin: '56px 62px' }}
        >
          <circle cx="56" cy="62" r="32" fill="none" />
          <circle cx="56" cy="62" r="26" fill="none" strokeDasharray="1 3" />
        </g>

        {/* ── ANGLED BOW & ARROW ASSEMBLY (Rotated 34° upwards for victory) ── */}
        <g transform="rotate(-34 56 62)">

          {/* 1. TAUT BOWSTRING (Pratyancha) */}
          <path
            d="M 38 14 Q 28 62 18 62 Q 28 62 38 110"
            fill="none"
            stroke="#fef08a"
            strokeWidth="1.5"
            strokeLinecap="round"
            filter="drop-shadow(0 0 4px #ffd700)"
          />

          {/* 2. MAJESTIC DOUBLE-RECURVE BOW (Kodanda) */}
          {/* Main Upper Limb */}
          <path
            d="M 32 62 Q 24 44 26 30 Q 28 18 38 14 Q 40 12 37 10 Q 30 16 22 28 Q 18 42 28 62 Z"
            fill="url(#bowGold3D)"
            stroke="url(#bowGoldDark)"
            strokeWidth="0.8"
          />

          {/* Main Lower Limb */}
          <path
            d="M 32 62 Q 24 80 26 94 Q 28 106 38 110 Q 40 112 37 114 Q 30 108 22 96 Q 18 82 28 62 Z"
            fill="url(#bowGold3D)"
            stroke="url(#bowGoldDark)"
            strokeWidth="0.8"
          />

          {/* Outer Filigree Highlight Ridge */}
          <path
            d="M 23 29 Q 19 44 29 62 Q 19 80 23 95"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1"
            opacity="0.8"
          />

          {/* Upper Tip Finial (Carved Golden Horn) */}
          <circle cx="38" cy="13" r="3" fill="#ffd700" stroke="#78350f" strokeWidth="0.8" />
          <circle cx="38" cy="13" r="1.5" fill="#ea580c" />

          {/* Lower Tip Finial */}
          <circle cx="38" cy="111" r="3" fill="#ffd700" stroke="#78350f" strokeWidth="0.8" />
          <circle cx="38" cy="111" r="1.5" fill="#ea580c" />

          {/* Sculpted Ornate Riser / Center Handle Grip */}
          <rect x="27" y="55" width="7" height="14" rx="2" fill="url(#bowGoldDark)" />
          {/* Gold filigree bands around grip */}
          <line x1="27" y1="58" x2="34" y2="58" stroke="#ffd700" strokeWidth="1.2" />
          <line x1="27" y1="66" x2="34" y2="66" stroke="#ffd700" strokeWidth="1.2" />

          {/* Center Medallion with Ruby Gem */}
          <circle cx="30.5" cy="62" r="4" fill="#ffd700" stroke="#92400e" strokeWidth="0.8" />
          <circle cx="30.5" cy="62" r="2.8" fill="url(#rubyGem)" />
          <circle cx="29.5" cy="61" r="0.8" fill="#ffffff" opacity="0.9" />

          {/* 3. THE ARROW OF RIGHTEOUSNESS (Agni Baan) */}
          {/* Arrow Shaft (Golden & Sandalwood) */}
          <line
            x1="18"
            y1="62"
            x2="90"
            y2="62"
            stroke="url(#bowGold3D)"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          {/* Shaft Highlight Line */}
          <line
            x1="22"
            y1="61.2"
            x2="88"
            y2="61.2"
            stroke="#ffffff"
            strokeWidth="0.8"
            opacity="0.8"
          />

          {/* Nock & Fletching Feathers (Golden Wings at Back) */}
          <path
            d="M 22 62 L 14 56 L 20 62 L 14 68 Z"
            fill="url(#bowGold3D)"
            stroke="#92400e"
            strokeWidth="0.6"
          />
          <path
            d="M 26 62 L 18 55 L 24 62 L 18 69 Z"
            fill="url(#bowGoldDark)"
            stroke="#92400e"
            strokeWidth="0.6"
          />

          {/* Arrowhead Collar Ring */}
          <rect x="88" y="59.5" width="3" height="5" rx="1" fill="#fef08a" stroke="#78350f" strokeWidth="0.6" />

          {/* Razor-Sharp Ornate Arrowhead (Mukha) */}
          {/* Upper Facet (Gleaming Light) */}
          <polygon
            points="91,62 108,62 89,54"
            fill="#ffffff"
            stroke="#f59e0b"
            strokeWidth="0.5"
          />
          {/* Lower Facet (Deep Gold Shade) */}
          <polygon
            points="91,62 108,62 89,70"
            fill="#d97706"
            stroke="#78350f"
            strokeWidth="0.5"
          />
          {/* Central Ridge */}
          <polygon
            points="89,54 92,62 89,70 94,62"
            fill="#ea580c"
          />

          {/* 4. FLAMING SACRED FIRE (Agni at Arrowhead Tip) */}
          <g className="animate-arrow-flame" style={{ transformOrigin: '108px 62px' }}>
            {/* Luminous Solar Halo */}
            <circle cx="109" cy="62" r="8" fill="url(#agniFlame)" opacity="0.35" filter="url(#celestialGlow)" />
            {/* Core White Heat */}
            <circle cx="108" cy="62" r="3" fill="#ffffff" filter="drop-shadow(0 0 6px #ffd700)" />
            {/* Piercing Agni Flame Tongues */}
            <path
              d="M 106 60 Q 116 62 122 62 Q 116 64 106 64 Q 112 62 106 60 Z"
              fill="url(#agniFlame)"
            />
            <path
              d="M 107 58 Q 114 59 118 60 Q 112 62 107 62 Z"
              fill="#ffd700"
              opacity="0.85"
            />
          </g>

        </g>
      </svg>

      {/* Sparkle Burst on Click */}
      {isSparkling && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-ping">
          <Sparkles className="w-9 h-9 text-yellow-300 drop-shadow-[0_0_15px_rgba(245,158,11,1)]" />
        </div>
      )}
    </div>
  );
};

// ─── Ruffled 3D Marigold Flower (Genda Phool Blossom) ─────────────────────────
interface MarigoldBlossomProps {
  cx: number;
  cy: number;
  r?: number;
  type: 'orange' | 'yellow';
}

const MarigoldBlossom: React.FC<MarigoldBlossomProps> = ({ cx, cy, r = 6.8, type }) => {
  const isOrange = type === 'orange';
  const cOuter = isOrange ? '#ea580c' : '#ca8a04';
  const cMid = isOrange ? '#f97316' : '#eab308';
  const cLight = isOrange ? '#fed7aa' : '#fef08a';
  const cDark = isOrange ? '#9a3412' : '#854d0e';

  // 12 outer ruffled petals
  const outerPetals = Array.from({ length: 12 }).map((_, i) => {
    const angle = (i * Math.PI) / 6;
    const px = cx + Math.cos(angle) * r;
    const py = cy + Math.sin(angle) * r;
    return (
      <circle
        key={`out-${i}`}
        cx={px}
        cy={py}
        r={r * 0.44}
        fill={cMid}
        stroke={cDark}
        strokeWidth="0.35"
      />
    );
  });

  // 8 middle ruffled petals (offset)
  const midPetals = Array.from({ length: 8 }).map((_, i) => {
    const angle = (i * Math.PI) / 4 + 0.3;
    const px = cx + Math.cos(angle) * (r * 0.55);
    const py = cy + Math.sin(angle) * (r * 0.55);
    return (
      <circle
        key={`mid-${i}`}
        cx={px}
        cy={py}
        r={r * 0.36}
        fill={cLight}
      />
    );
  });

  return (
    <g filter="drop-shadow(0 1.5px 3.5px rgba(180, 83, 9, 0.35))">
      {/* Outer base shadow circle */}
      <circle cx={cx} cy={cy} r={r} fill={cOuter} />
      {outerPetals}
      {midPetals}
      {/* Velvety center core rosette */}
      <circle cx={cx} cy={cy} r={r * 0.36} fill={cDark} />
      <circle cx={cx} cy={cy} r={r * 0.22} fill={cLight} />
      <circle cx={cx} cy={cy} r={r * 0.1} fill="#ffffff" />
    </g>
  );
};

// ─── Cluster of 3 Lush Botanical Mango Leaves (Aam ke Patte) ─────────────────
interface MangoLeavesFanProps {
  cx: number;
  cy: number;
  scale?: number;
}

const MangoLeavesFan: React.FC<MangoLeavesFanProps> = ({ cx, cy, scale = 1 }) => {
  const s = scale;
  return (
    <g filter="drop-shadow(0 2px 4px rgba(20, 83, 45, 0.35))">
      {/* 1. Left Mango Leaf (Angled outwards to the left at ~30°) */}
      <path
        d={`M ${cx - 2 * s} ${cy + 2 * s} Q ${cx - 14 * s} ${cy + 8 * s} ${cx - 12 * s} ${cy + 17 * s} Q ${cx - 5 * s} ${cy + 12 * s} ${cx - 1 * s} ${cy + 4 * s} Z`}
        fill="url(#mangoLeafDeep)"
      />
      {/* Left Leaf Spine / Vein */}
      <path
        d={`M ${cx - 2 * s} ${cy + 2 * s} Q ${cx - 11 * s} ${cy + 9 * s} ${cx - 12 * s} ${cy + 17 * s}`}
        stroke="#86efac"
        strokeWidth={0.5 * s}
        opacity="0.8"
        fill="none"
      />

      {/* 2. Right Mango Leaf (Angled outwards to the right at ~30°) */}
      <path
        d={`M ${cx + 2 * s} ${cy + 2 * s} Q ${cx + 14 * s} ${cy + 8 * s} ${cx + 12 * s} ${cy + 17 * s} Q ${cx + 5 * s} ${cy + 12 * s} ${cx + 1 * s} ${cy + 4 * s} Z`}
        fill="url(#mangoLeafDeep)"
      />
      {/* Right Leaf Spine / Vein */}
      <path
        d={`M ${cx + 2 * s} ${cy + 2 * s} Q ${cx + 11 * s} ${cy + 9 * s} ${cx + 12 * s} ${cy + 17 * s}`}
        stroke="#86efac"
        strokeWidth={0.5 * s}
        opacity="0.8"
        fill="none"
      />

      {/* 3. Center Mango Leaf (Pointing gracefully straight down) */}
      <path
        d={`M ${cx - 2.5 * s} ${cy + 3 * s} Q ${cx - 5 * s} ${cy + 11 * s} ${cx} ${cy + 19 * s} Q ${cx + 5 * s} ${cy + 11 * s} ${cx + 2.5 * s} ${cy + 3 * s} Z`}
        fill="url(#mangoLeafVibrant)"
      />
      {/* Center Leaf Primary & Secondary Veins */}
      <path
        d={`M ${cx} ${cy + 3 * s} L ${cx} ${cy + 18.2 * s}`}
        stroke="#14532d"
        strokeWidth={0.6 * s}
        opacity="0.75"
      />
      <path
        d={`M ${cx} ${cy + 4 * s} L ${cx} ${cy + 17 * s}`}
        stroke="#bbf7d0"
        strokeWidth={0.35 * s}
        opacity="0.8"
      />
    </g>
  );
};

// ─── Traditional Marigold & Mango Leaves Garland (Dussehra Bandhanwar / Toran) 
export const DussehraToran: React.FC = () => {
  // Repeating modular garland units across the viewport width
  // 38 units x 54px each = 2052px coverage without horizontal stretching
  const unitsCount = 38;

  return (
    <div className="w-full fixed top-0 left-0 right-0 h-8 pointer-events-none select-none overflow-hidden z-[100] flex justify-center">
      {/* Shared SVG Definitions for Gradients */}
      <svg className="w-0 h-0 absolute">
        <defs>
          {/* Mango Leaf Deep Green Gradient */}
          <linearGradient id="mangoLeafDeep" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="25%" stopColor="#22c55e" />
            <stop offset="70%" stopColor="#15803d" />
            <stop offset="100%" stopColor="#14532d" />
          </linearGradient>

          {/* Mango Leaf Vibrant Center Gradient */}
          <linearGradient id="mangoLeafVibrant" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#86efac" />
            <stop offset="20%" stopColor="#22c55e" />
            <stop offset="65%" stopColor="#16a34a" />
            <stop offset="100%" stopColor="#14532d" />
          </linearGradient>

          {/* Golden Cord Gradient */}
          <linearGradient id="toranGoldCord" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#d97706" />
            <stop offset="25%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="75%" stopColor="#fde047" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>

          {/* Brass Bell Gradient */}
          <linearGradient id="brassBell" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="45%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#854d0e" />
          </linearGradient>
        </defs>
      </svg>

      {/* Row of Seamless Proportional Garland Units */}
      <div className="flex shrink-0 -mx-4 justify-center items-start">
        {Array.from({ length: unitsCount }).map((_, i) => {
          const isOrange = i % 2 === 0;

          return (
            <div key={i} className="w-[54px] h-[30px] shrink-0 -mr-[1px] relative">
              <svg
                viewBox="0 0 54 30"
                className="w-full h-full overflow-visible"
                preserveAspectRatio="xMidYMid meet"
              >
                {/* 1. Golden Twisted Bandhanwar Cord (Connects seamlessly from 0 to 54) */}
                <path
                  d="M 0 3 Q 27 7.5 54 3"
                  fill="none"
                  stroke="url(#toranGoldCord)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  filter="drop-shadow(0 1px 2px rgba(180, 83, 9, 0.35))"
                />
                {/* Secondary inner braided thread */}
                <path
                  d="M 0 3 Q 27 7.5 54 3"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="0.5"
                  strokeDasharray="2.5 2.5"
                  opacity="0.8"
                />

                {/* 2. Hanging Garland Assembly (Swaying gently in breeze) */}
                <g className="animate-toran-sway origin-top" style={{ transformOrigin: '27px 8.5px' }}>
                  {/* Fan of 3 Lush Botanical Mango Leaves (Clearly visible left, center, right) */}
                  <MangoLeavesFan cx={27} cy={8.5} scale={1} />

                  {/* 3. Lush 3D Ruffled Marigold Blossom (Genda Phool) */}
                  <MarigoldBlossom
                    cx={27}
                    cy={8.5}
                    r={6.2}
                    type={isOrange ? 'orange' : 'yellow'}
                  />

                  {/* Tiny Golden Pearl Accent at Center Leaf Apex */}
                  <circle cx={27} cy={27.5} r={0.9} fill="#ffd700" opacity="0.95" />

                  {/* Golden Brass Stud at Stem Point */}
                  <circle cx={27} cy={3.2} r={1.3} fill="#ffd700" stroke="#78350f" strokeWidth="0.5" />
                  <circle cx={27} cy={3.2} r={0.6} fill="#ffffff" />
                </g>
              </svg>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Golden Shami / Apta Leaves Shower (The Auspicious 'Gold' of Dussehra) ────
export const ShamiGoldLeaves: React.FC = () => {
  // Distinctive two-lobed Shami/Apta leaves floating down
  const leaves = [
    { left: '6%', delay: '0s', duration: '11s', size: 24 },
    { left: '16%', delay: '3.5s', duration: '14s', size: 20 },
    { left: '26%', delay: '1.2s', duration: '12s', size: 26 },
    { left: '38%', delay: '5.8s', duration: '15s', size: 22 },
    { left: '48%', delay: '2.1s', duration: '13s', size: 25 },
    { left: '59%', delay: '7.2s', duration: '16s', size: 19 },
    { left: '71%', delay: '4.0s', duration: '12s', size: 27 },
    { left: '82%', delay: '1.8s', duration: '14s', size: 22 },
    { left: '92%', delay: '6.4s', duration: '13s', size: 24 },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none select-none overflow-hidden z-20">
      {leaves.map((leaf, idx) => (
        <div
          key={idx}
          className="absolute -top-10 animate-shami-leaf"
          style={{
            left: leaf.left,
            animationDelay: leaf.delay,
            animationDuration: leaf.duration,
            width: `${leaf.size}px`,
            height: `${leaf.size}px`,
          }}
        >
          {/* Twin-Lobed Apta Leaf SVG (Golden Sona) */}
          <svg viewBox="0 0 32 32" className="w-full h-full drop-shadow-[0_2px_8px_rgba(245,158,11,0.55)]">
            <defs>
              <linearGradient id={`shamiGold-${idx}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="25%" stopColor="#fef08a" />
                <stop offset="55%" stopColor="#fbbf24" />
                <stop offset="85%" stopColor="#d97706" />
                <stop offset="100%" stopColor="#92400e" />
              </linearGradient>
            </defs>
            {/* Characteristic Two-Lobed Twin Leaf Shape with Notch */}
            <path
              d="M 16 5 C 10 -1 2 4 4 16 C 5 22 10 28 16 30 C 22 28 27 22 28 16 C 30 4 22 -1 16 5 Z"
              fill={`url(#shamiGold-${idx})`}
            />
            {/* Center leaf notch and delicate golden veins */}
            <path d="M 16 5 L 16 12" stroke="#78350f" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
            <path d="M 16 12 L 16 29" stroke="#92400e" strokeWidth="1" opacity="0.65" />
            <path d="M 16 16 Q 10 14 7 18" stroke="#ffffff" strokeWidth="0.8" opacity="0.75" fill="none" />
            <path d="M 16 16 Q 22 14 25 18" stroke="#ffffff" strokeWidth="0.8" opacity="0.75" fill="none" />
          </svg>
        </div>
      ))}
    </div>
  );
};

// ─── Single Toran Element (Standalone Marigold Blossom with Mango Leaves) ─────
export const SingleToranElement: React.FC<{
  type?: 'orange' | 'yellow';
  size?: number;
  glow?: boolean;
}> = ({ type = 'orange', size = 44, glow = true }) => {
  const isOrange = type === 'orange';
  return (
    <div
      className={`relative inline-flex items-center justify-center transition-transform duration-300 hover:scale-110 ${
        glow ? 'drop-shadow-[0_4px_14px_rgba(245,158,11,0.45)]' : ''
      }`}
      style={{ width: `${size}px`, height: `${size * 1.08}px` }}
    >
      <svg
        viewBox="0 0 44 48"
        className="w-full h-full overflow-visible"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id={`singleToranGold-${type}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#d97706" />
            <stop offset="25%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="75%" stopColor="#fde047" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          <linearGradient id={`singleBrassBell-${type}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="45%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#854d0e" />
          </linearGradient>
        </defs>

        {/* Soft Golden Aura Glow behind the blossom */}
        {glow && (
          <circle
            cx="22"
            cy="20"
            r="16"
            fill={isOrange ? 'rgba(249, 115, 22, 0.28)' : 'rgba(234, 179, 8, 0.28)'}
            filter="blur(5px)"
          />
        )}

        {/* Hanging Golden Thread loop at top */}
        <path
          d="M 22 2 Q 22 10 22 12"
          stroke={`url(#singleToranGold-${type})`}
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* 3 Botanical Mango Leaves Fan */}
        <MangoLeavesFan cx={22} cy={16} scale={1.2} />

        {/* 3D Ruffled Marigold Blossom (Full bloom) */}
        <MarigoldBlossom
          cx={22}
          cy={18}
          r={10.5}
          type={type}
        />

        {/* Golden Brass Bell / Pearl Terminal hanging at base */}
        <g transform="translate(22, 38)">
          <line x1="0" y1="0" x2="0" y2="4" stroke="#d97706" strokeWidth="1" />
          <polygon points="-3,4 3,4 3.5,8 -3.5,8" fill={`url(#singleBrassBell-${type})`} />
          <circle cx="0" cy="8.5" r="1.2" fill="#ca8a04" />
        </g>

        {/* Golden Brass Stud at stem connection */}
        <circle cx={22} cy={12} r={1.6} fill="#ffd700" stroke="#78350f" strokeWidth="0.5" />
        <circle cx={22} cy={12} r={0.7} fill="#ffffff" />
      </svg>
    </div>
  );
};

// ─── Triumphant Dussehra Bottom Crests (Resting along the bottom edge) ────────
export const DussehraBottomCrests: React.FC = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 pointer-events-none select-none z-30 flex justify-between items-end px-3 sm:px-6 pb-1.5">
      {/* Bottom Left: Sacred Marigold & Mango Leaves Element with Divine Kodanda Bow */}
      <div className="flex items-end gap-2.5 relative">
        <div className="absolute -bottom-2 -left-4 w-36 h-12 bg-orange-500/25 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-end gap-2 transition-transform duration-300 hover:scale-105">
          <SingleToranElement type="orange" size={44} glow />
          <DivineBowArrow size={44} glow />
        </div>
      </div>

      {/* Bottom Right: Divine Kodanda Bow with Sacred Marigold & Mango Leaves Element */}
      <div className="flex items-end gap-2.5 relative">
        <div className="absolute -bottom-2 -right-4 w-36 h-12 bg-orange-500/25 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-end gap-2 transition-transform duration-300 hover:scale-105">
          <DivineBowArrow size={44} glow />
          <SingleToranElement type="yellow" size={44} glow />
        </div>
      </div>
    </div>
  );
};
