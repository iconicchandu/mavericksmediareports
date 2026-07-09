import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Award, Star } from 'lucide-react'

interface AnniversaryCelebrationProps {
  isOpen: boolean
  onClose: () => void
}

// Particle shape types
type Shape = 'circle' | 'square' | 'triangle' | 'star'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  rotation: number
  rotationSpeed: number
  color: string
  size: number
  shape: Shape
  alpha: number
  life: number
  maxLife: number
  gravity: number
}

const COLORS = [
  '#FFD700', '#FFA500', '#FF6347', '#FF1493',
  '#00BFFF', '#00FA9A', '#8A2BE2', '#32CD32',
  '#FF4500', '#ADFF2F', '#4169E1', '#FF69B4',
  '#00CED1', '#FF8C00', '#7B68EE', '#20B2AA',
]

const SHAPES: Shape[] = ['circle', 'square', 'triangle', 'star']

function createParticle(side: 'left' | 'right', canvasW: number, canvasH: number): Particle {
  const isLeft = side === 'left'

  // Origin: bottom-left or bottom-right corner
  const x = isLeft ? canvasW * 0.02 : canvasW * 0.98
  const y = canvasH * 0.92

  // Spread fan: left corner shoots right-upward arc, right corner shoots left-upward arc
  const minAngle = isLeft ? 25 : 115  // degrees from horizontal
  const maxAngle = isLeft ? 80 : 155

  const angleRad = ((Math.random() * (maxAngle - minAngle) + minAngle) * Math.PI) / 180
  const speed = Math.random() * 14 + 8  // 8–22 px/frame

  const maxLife = Math.random() * 100 + 120  // frames

  return {
    x,
    y,
    vx: Math.cos(angleRad) * speed,
    vy: -Math.sin(angleRad) * speed,
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 8,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: Math.random() * 7 + 4,  // 4–11 px
    shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    alpha: 1,
    life: 0,
    maxLife,
    gravity: Math.random() * 0.18 + 0.12,  // 0.12–0.30
  }
}

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
  ctx.save()
  ctx.globalAlpha = p.alpha
  ctx.fillStyle = p.color
  ctx.strokeStyle = p.color
  ctx.translate(p.x, p.y)
  ctx.rotate((p.rotation * Math.PI) / 180)

  const s = p.size

  switch (p.shape) {
    case 'circle':
      ctx.beginPath()
      ctx.arc(0, 0, s / 2, 0, Math.PI * 2)
      ctx.fill()
      break

    case 'square':
      ctx.fillRect(-s / 2, -s / 2, s, s)
      break

    case 'triangle':
      ctx.beginPath()
      ctx.moveTo(0, -s / 2)
      ctx.lineTo(s / 2, s / 2)
      ctx.lineTo(-s / 2, s / 2)
      ctx.closePath()
      ctx.fill()
      break

    case 'star':
      ctx.beginPath()
      for (let i = 0; i < 5; i++) {
        const outerAngle = (i * 4 * Math.PI) / 5 - Math.PI / 2
        const innerAngle = outerAngle + (2 * Math.PI) / 10
        if (i === 0) ctx.moveTo(Math.cos(outerAngle) * s / 2, Math.sin(outerAngle) * s / 2)
        else ctx.lineTo(Math.cos(outerAngle) * s / 2, Math.sin(outerAngle) * s / 2)
        ctx.lineTo(Math.cos(innerAngle) * s / 4, Math.sin(innerAngle) * s / 4)
      }
      ctx.closePath()
      ctx.fill()
      break
  }

  ctx.restore()
}

// Wavy balloon string path
const BalloonString: React.FC<{ color?: string }> = ({ color = '#94a3b8' }) => (
  <svg viewBox="0 0 10 50" className="w-2 h-14 mx-auto" style={{ color }}>
    <path d="M5,0 Q8,12 2,25 T5,50" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

export const AnniversaryCelebration: React.FC<AnniversaryCelebrationProps> = ({ isOpen, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animFrameRef = useRef<number>(0)
  const spawnIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [isBlasting, setIsBlasting] = useState(false)

  // Spawn particles from both corners continuously
  const spawnBurst = useCallback((canvas: HTMLCanvasElement) => {
    const w = canvas.width
    const h = canvas.height
    const count = 6  // particles per tick per side
    for (let i = 0; i < count; i++) {
      particlesRef.current.push(createParticle('left', w, h))
      particlesRef.current.push(createParticle('right', w, h))
    }
  }, [])

  // Physics animation loop
  const animate = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear with very slight fade trail for motion blur effect
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Update and draw particles
    particlesRef.current = particlesRef.current.filter(p => {
      p.life++

      // Physics update
      p.vx *= 0.99        // air resistance
      p.vy += p.gravity   // gravity
      p.x += p.vx
      p.y += p.vy
      p.rotation += p.rotationSpeed

      // Fade out in final 25% of life
      const lifeRatio = p.life / p.maxLife
      p.alpha = lifeRatio > 0.75 ? 1 - ((lifeRatio - 0.75) / 0.25) : 1

      // Draw
      drawParticle(ctx, p)

      // Keep if still alive and on screen
      return p.life < p.maxLife && p.y < canvas.height + 50
    })

    animFrameRef.current = requestAnimationFrame(animate)
  }, [])

  // Resize canvas to full window
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }, [])

  // Manual click-to-blast handler
  const handleManualBlast = useCallback((side: 'left' | 'right') => {
    const canvas = canvasRef.current
    if (!canvas) return
    const w = canvas.width
    const h = canvas.height
    for (let i = 0; i < 40; i++) {
      particlesRef.current.push(createParticle(side, w, h))
    }
  }, [])

  useEffect(() => {
    if (!isOpen) return

    const canvas = canvasRef.current
    if (!canvas) return

    // Initialize canvas size
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Start animation loop
    animFrameRef.current = requestAnimationFrame(animate)

    // Start continuous sprinkler spray
    setIsBlasting(true)
    spawnBurst(canvas)  // instant first burst

    spawnIntervalRef.current = setInterval(() => {
      if (canvas) spawnBurst(canvas)
    }, 60) // ~16 particles/second per side = 32 total

    // After 6 seconds, slow down to gentle trickle
    const slowdownTimer = setTimeout(() => {
      if (spawnIntervalRef.current) {
        clearInterval(spawnIntervalRef.current)
        // Gentle trickle mode
        spawnIntervalRef.current = setInterval(() => {
          if (canvas) {
            const w = canvas.width
            const h = canvas.height
            particlesRef.current.push(createParticle('left', w, h))
            particlesRef.current.push(createParticle('right', w, h))
          }
        }, 200)
      }
      setIsBlasting(false)
    }, 6000)

    return () => {
      cancelAnimationFrame(animFrameRef.current)
      if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current)
      clearTimeout(slowdownTimer)
      window.removeEventListener('resize', resizeCanvas)
      particlesRef.current = []
    }
  }, [isOpen, animate, spawnBurst, resizeCanvas])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden font-outfit">
      {/* Dark Background */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at center, #1a1535 0%, #0a0a12 100%)' }}
      />

      {/* Subtle center glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-amber-500/8 rounded-full blur-[140px] pointer-events-none" />

      {/* ════════════════════════════════ CANVAS SPRINKLER LAYER ════════════════════ */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-10 pointer-events-none"
        style={{ mixBlendMode: 'screen' }}
      />

      {/* ════════════════════════════════ FLOATING BALLOONS ════════════════════════ */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-10">

        {/* Pink/Red Balloon - Left Middle */}
        <div className="absolute left-[10%] sm:left-[14%] top-[34%] sm:top-[37%]"
          style={{ animation: 'balloon-sway 7s ease-in-out infinite' }}>
          <div className="flex flex-col items-center">
            <div className="w-11 h-[52px] rounded-full relative shadow-lg"
              style={{ background: 'radial-gradient(circle at 35% 30%, #fb7185, #f43f5e 60%, #be123c)' }}>
              <div className="absolute top-2 left-2.5 w-2 h-3 bg-white/35 rounded-full rotate-[30deg]" />
              <div className="absolute bottom-0 left-1/2 w-2 h-2 -translate-x-1/2 translate-y-0.5"
                style={{ borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '6px solid #be123c' }} />
            </div>
            <BalloonString color="#f43f5e" />
          </div>
        </div>

        {/* Gold Balloon - Top Left-Center */}
        <div className="absolute left-[25%] sm:left-[28%] top-[6%] sm:top-[4%]"
          style={{ animation: 'balloon-sway 8s ease-in-out infinite 1.1s' }}>
          <div className="flex flex-col items-center">
            <div className="w-11 h-[52px] rounded-full relative shadow-lg"
              style={{ background: 'radial-gradient(circle at 35% 30%, #fde68a, #eab308 60%, #a16207)' }}>
              <div className="absolute top-2 left-2.5 w-2 h-3 bg-white/35 rounded-full rotate-[30deg]" />
              <div className="absolute bottom-0 left-1/2 w-2 h-2 -translate-x-1/2 translate-y-0.5"
                style={{ borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '6px solid #a16207' }} />
            </div>
            <BalloonString color="#eab308" />
          </div>
        </div>

        {/* Gold Balloon - Top Right-Center */}
        <div className="absolute left-[65%] sm:left-[68%] top-[8%] sm:top-[5%]"
          style={{ animation: 'balloon-sway 6.5s ease-in-out infinite 0.4s' }}>
          <div className="flex flex-col items-center">
            <div className="w-11 h-[52px] rounded-full relative shadow-lg"
              style={{ background: 'radial-gradient(circle at 35% 30%, #fde68a, #eab308 60%, #a16207)' }}>
              <div className="absolute top-2 left-2.5 w-2 h-3 bg-white/35 rounded-full rotate-[30deg]" />
              <div className="absolute bottom-0 left-1/2 w-2 h-2 -translate-x-1/2 translate-y-0.5"
                style={{ borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '6px solid #a16207' }} />
            </div>
            <BalloonString color="#eab308" />
          </div>
        </div>

        {/* Green/Teal Balloon - Right Middle */}
        <div className="absolute left-[73%] sm:left-[79%] top-[36%] sm:top-[40%]"
          style={{ animation: 'balloon-sway 9s ease-in-out infinite 1.7s' }}>
          <div className="flex flex-col items-center">
            <div className="w-11 h-[52px] rounded-full relative shadow-lg"
              style={{ background: 'radial-gradient(circle at 35% 30%, #6ee7b7, #10b981 60%, #065f46)' }}>
              <div className="absolute top-2 left-2.5 w-2 h-3 bg-white/35 rounded-full rotate-[30deg]" />
              <div className="absolute bottom-0 left-1/2 w-2 h-2 -translate-x-1/2 translate-y-0.5"
                style={{ borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '6px solid #065f46' }} />
            </div>
            <BalloonString color="#10b981" />
          </div>
        </div>

        {/* Purple Balloon - Far Right */}
        <div className="absolute left-[87%] sm:left-[91%] top-[12%] sm:top-[9%]"
          style={{ animation: 'balloon-sway 7.5s ease-in-out infinite 2.2s' }}>
          <div className="flex flex-col items-center">
            <div className="w-11 h-[52px] rounded-full relative shadow-lg"
              style={{ background: 'radial-gradient(circle at 35% 30%, #c4b5fd, #8b5cf6 60%, #4c1d95)' }}>
              <div className="absolute top-2 left-2.5 w-2 h-3 bg-white/35 rounded-full rotate-[30deg]" />
              <div className="absolute bottom-0 left-1/2 w-2 h-2 -translate-x-1/2 translate-y-0.5"
                style={{ borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '6px solid #4c1d95' }} />
            </div>
            <BalloonString color="#8b5cf6" />
          </div>
        </div>

      </div>

      {/* ════════════════════════════════ MAIN CONTENT ══════════════════════════════ */}
      <div className="relative z-20 w-full max-w-2xl mx-auto px-6 text-center text-white select-none">

        {/* Badge */}
        <div className="flex justify-center mb-5" style={{ animation: 'blur-reveal 0.8s ease-out both', animationDelay: '0.1s' }}>
          <div className="relative w-16 h-16 rounded-2xl border border-amber-400/30 bg-slate-900/70 flex items-center justify-center shadow-xl">
            <Award className="w-8 h-8 text-amber-400" strokeWidth={1.5} />
            <div className="absolute -top-1.5 -right-1.5 text-amber-300 animate-pulse">
              <Star className="w-5 h-5" fill="currentColor" />
            </div>
          </div>
        </div>

        {/* COMPANY MILESTONE Pill */}
        <div
          className="inline-block mb-4 px-4 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-amber-500/10 border border-amber-500/25 text-amber-400"
          style={{ animation: 'blur-reveal 0.8s ease-out both', animationDelay: '0.35s' }}
        >
          Company Milestone
        </div>

        {/* Main Headline */}
        <h1
          className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-5"
          style={{
            fontFamily: "'Cinzel', serif",
            background: 'linear-gradient(135deg, #ffe259 0%, #ffa751 30%, #ffd700 55%, #b38728 80%, #ffe259 100%)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'shine-gold 4s linear infinite, blur-reveal 1s ease-out both',
            animationDelay: '0s, 0.6s',
            filter: 'drop-shadow(0 0 20px rgba(251,191,36,0.35))'
          }}
        >
          Happy 6th <br />
          Anniversary MM <br />
          Team!
        </h1>

        {/* Date Pill */}
        <div
          className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold text-amber-300/90 border border-amber-500/20 bg-amber-500/5 mb-7"
          style={{ animation: 'blur-reveal 0.8s ease-out both', animationDelay: '0.95s' }}
        >
          July 9, 2020 – July 9, 2026
        </div>

        {/* Divider */}
        <div
          className="w-full h-px bg-gradient-to-r from-transparent via-amber-500/25 to-transparent mb-6"
          style={{ animation: 'blur-reveal 0.8s ease-out both', animationDelay: '1.15s' }}
        />

        {/* Description */}
        <p
          className="text-[#a1a1aa] text-xs sm:text-sm leading-relaxed max-w-lg mx-auto px-2"
          style={{ animation: 'blur-reveal 0.9s ease-out both', animationDelay: '1.35s' }}
        >
          Our heartfelt congratulations and deepest gratitude to{' '}
          <span
            className="font-bold"
            style={{
              background: 'linear-gradient(135deg, #ffe259, #ffa751, #ffd700)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textDecoration: 'underline',
              textDecorationColor: '#ffa751'
            }}
          >
            KARTIK AGARWAL
          </span>{' '}
          and{' '}
          <span
            className="font-bold"
            style={{
              background: 'linear-gradient(135deg, #ffe259, #ffa751, #ffd700)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textDecoration: 'underline',
              textDecorationColor: '#ffa751'
            }}
          >
            ASHWIN ARYA
          </span>{' '}
          Sir for their inspiring guidance and vision. It is under their leadership that we scale new heights and create magic everyday. Cheers to another year of growing, achieving, and shining together as one MM family!
        </p>

        {/* CTA Button */}
        <button
          onClick={onClose}
          className="mt-8 px-8 py-3.5 rounded-full font-black text-sm uppercase tracking-wider text-slate-950 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 mx-auto"
          style={{
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            boxShadow: '0 6px 30px rgba(245, 158, 11, 0.5)',
            animation: 'blur-reveal 0.8s ease-out both',
            animationDelay: '1.65s',
          }}
        >
          Celebrate & Continue →
        </button>
      </div>

      {/* ════════════════════════════════ CORNER POPPER BUTTONS ═════════════════════ */}

      {/* Left Popper */}
      <button
        onClick={() => handleManualBlast('left')}
        title="Blast Left!"
        className="fixed bottom-5 left-5 z-40 w-20 h-20 rounded-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-90 outline-none border border-amber-400/30 shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          boxShadow: '0 0 20px rgba(251,191,36,0.15)',
        }}
      >
        {/* Glowing halo when blasting */}
        {isBlasting && (
          <div className="absolute -inset-1 rounded-2xl opacity-50 blur-md bg-amber-500/30 animate-pulse" />
        )}
        <svg viewBox="0 0 80 80" className="w-14 h-14">
          {/* Popper body */}
          <path d="M12 68 L30 30 C32 27,36 27,38 30 L48 44 C50 47,50 51,48 54 L12 68Z"
            fill="url(#pGold)" stroke="#0f172a" strokeWidth="2" />
          <path d="M18 55 L30 44" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M21 62 L35 50" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round"/>
          {/* Nozzle */}
          <ellipse cx="43" cy="38" rx="6" ry="9" fill="#f43f5e" transform="rotate(-40,43,38)" stroke="#0f172a" strokeWidth="1.5"/>
          {/* Sparks */}
          <path d="M52 24 L62 10 M60 30 L74 21 M50 16 L58 5" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="65" cy="8" r="2" fill="#fde68a"/>
          <circle cx="76" cy="22" r="1.5" fill="#fde68a"/>
          <defs>
            <linearGradient id="pGold" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#b45309"/>
              <stop offset="50%" stopColor="#f59e0b"/>
              <stop offset="100%" stopColor="#fef08a"/>
            </linearGradient>
          </defs>
        </svg>
        {/* Pulsing star */}
        <div className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center">
          <div className="absolute inset-0 bg-amber-400/40 rounded-full blur-sm animate-ping" />
          <span className="relative text-amber-300 text-sm leading-none">✦</span>
        </div>
      </button>

      {/* Right Popper (mirrored) */}
      <button
        onClick={() => handleManualBlast('right')}
        title="Blast Right!"
        className="fixed bottom-5 right-5 z-40 w-20 h-20 rounded-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-90 outline-none border border-amber-400/30 shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          boxShadow: '0 0 20px rgba(251,191,36,0.15)',
        }}
      >
        {isBlasting && (
          <div className="absolute -inset-1 rounded-2xl opacity-50 blur-md bg-amber-500/30 animate-pulse" />
        )}
        <svg viewBox="0 0 80 80" className="w-14 h-14" style={{ transform: 'scaleX(-1)' }}>
          <path d="M12 68 L30 30 C32 27,36 27,38 30 L48 44 C50 47,50 51,48 54 L12 68Z"
            fill="url(#pGold)" stroke="#0f172a" strokeWidth="2" />
          <path d="M18 55 L30 44" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M21 62 L35 50" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round"/>
          <ellipse cx="43" cy="38" rx="6" ry="9" fill="#f43f5e" transform="rotate(-40,43,38)" stroke="#0f172a" strokeWidth="1.5"/>
          <path d="M52 24 L62 10 M60 30 L74 21 M50 16 L58 5" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="65" cy="8" r="2" fill="#fde68a"/>
          <circle cx="76" cy="22" r="1.5" fill="#fde68a"/>
        </svg>
        <div className="absolute -top-2 -left-2 w-5 h-5 flex items-center justify-center">
          <div className="absolute inset-0 bg-amber-400/40 rounded-full blur-sm animate-ping" />
          <span className="relative text-amber-300 text-sm leading-none">✦</span>
        </div>
      </button>

      {/* Inline styles for balloon sway animation */}
      <style>{`
        @keyframes balloon-sway {
          0%,100% { transform: translateY(0) rotate(0deg); }
          25%      { transform: translateY(-14px) rotate(3deg); }
          75%      { transform: translateY(-7px) rotate(-3deg); }
        }
        @keyframes blur-reveal {
          0%   { opacity: 0; filter: blur(18px); transform: translateY(6px); }
          60%  { opacity: 1; filter: blur(3px);  transform: translateY(0); }
          100% { opacity: 1; filter: blur(0px);  transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

export default AnniversaryCelebration
