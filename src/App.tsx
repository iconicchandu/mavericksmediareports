"use client"

import React, { useState, useEffect } from "react"
import {
  Heart, TrendingUp, ShieldCheck, Zap, Lock,
  BarChart3, Clock, Sparkles, ArrowRight, Eye, EyeOff, RefreshCw,
  Database, FileSpreadsheet
} from "lucide-react"
import FileUpload from "./components/FileUpload"
import Dashboard from "./components/Dashboard"
import CelebrationEffect from "./components/CelebrationEffect"
import type { ProcessedData } from "./types"

interface UploadedFile {
  name: string
  data: ProcessedData
}

const PASSWORD = "MMmEdiaak@8767"

// ─── Motivational quotes pool ───────────────────────────────────────────────
const QUOTES = [
  { text: "Success is not final; failure is not fatal. Keep going.", author: "Winston Churchill" },
  { text: "Data is the new oil — refine it and you'll find gold.", author: "Clive Humby" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Every campaign tells a story. Make yours worth reading.", author: "MM Media" },
  { text: "Work hard in silence. Let your revenue make the noise.", author: "MM Media" },
  { text: "Small daily improvements lead to staggering long-term results.", author: "Robin Sharma" },
  { text: "Your reports don't just show numbers — they show impact.", author: "MM Media" },
  { text: "Excellence is not a destination; it is a continuous journey.", author: "Brian Tracy" },
]

// ─── DateTime widget ─────────────────────────────────────────────────────────
const CompactClockNavbar: React.FC<{ isLanding?: boolean }> = ({ isLanding }) => {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(tick)
  }, [])

  const pad = (n: number) => String(n).padStart(2, "0")
  const h24 = now.getHours()
  const h12 = h24 % 12 || 12
  const mm = pad(now.getMinutes())
  const ss = pad(now.getSeconds())
  const ampm = h24 < 12 ? "AM" : "PM"

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const dayName = days[now.getDay()]
  const monthName = months[now.getMonth()]
  const dateNum = now.getDate()
  const year = now.getFullYear()

  const dayStr = `${dayName}, `
  const dateStr = `${monthName} ${dateNum}, ${year}`

  return (
    <div className={`flex items-center gap-2.5 border rounded-2xl px-3.5 py-1.5 text-xs font-bold shadow-sm ${isLanding ? 'bg-white/10 border-white/20 text-white' : 'bg-slate-50 border-slate-200/60 text-slate-600'}`}>
      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
      <span>
        <span className={isLanding ? 'text-white/90' : 'text-slate-700'}>
          <span className="hidden sm:inline">{dayStr}</span>
          {dateStr}
        </span>
        <span className={`mx-2 ${isLanding ? 'text-white/30' : 'text-slate-300'}`}>|</span>
        <span>{pad(h12)}:{mm}:{ss} <span className={`text-[10px] font-bold ${isLanding ? 'text-yellow-300' : 'text-indigo-500'}`}>{ampm}</span></span>
      </span>
    </div>
  )
}

// ─── Animated background (made static) ───────────────────────────────────────
const AnimatedBg: React.FC = () => {
  return (
    <div className="app-bg-layer">
      <div className="bg-blob bg-blob-1" />
      <div className="bg-blob bg-blob-2" />
      <div className="bg-blob bg-blob-3" />
      <div className="bg-blob bg-blob-4" />
      <div className="bg-grid" />
    </div>
  )
}

// ─── Landing Page Grid ────────────────────────────────────────────────────────
const LandingBgGrid: React.FC = () => {
  return (
    <div
      className="absolute inset-0 pointer-events-none opacity-[0.06] z-0"
      style={{
        backgroundImage: `
          linear-gradient(to right, rgba(255, 255, 255, 0.4) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255, 255, 255, 0.4) 1px, transparent 1px)
        `,
        backgroundSize: '45px 45px',
        maskImage: 'radial-gradient(ellipse at center, black 60%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse at center, black 60%, transparent 100%)'
      }}
    />
  )
}

// ─── Floating Background Icons ───────────────────────────────────────────────
const FloatingIcons: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Icon 1: Database */}
      <Database
        className="absolute w-12 h-12 text-white/10"
        style={{
          top: '15%',
          left: '8%',
          animation: 'float-slow 7s ease-in-out infinite'
        }}
      />
      {/* Icon 2: TrendingUp */}
      <TrendingUp
        className="absolute w-14 h-14 text-white/10"
        style={{
          top: '45%',
          left: '5%',
          animation: 'float-medium 9s ease-in-out infinite'
        }}
      />
      {/* Icon 3: FileSpreadsheet */}
      <FileSpreadsheet
        className="absolute w-10 h-10 text-white/10"
        style={{
          top: '75%',
          left: '12%',
          animation: 'float-fast 6s ease-in-out infinite'
        }}
      />
      {/* Icon 4: ShieldCheck */}
      <ShieldCheck
        className="absolute w-12 h-12 text-white/10"
        style={{
          top: '20%',
          right: '35%',
          animation: 'float-medium 8s ease-in-out infinite'
        }}
      />
      {/* Icon 5: BarChart3 */}
      <BarChart3
        className="absolute w-16 h-16 text-white/10"
        style={{
          top: '12%',
          right: '8%',
          animation: 'float-slow 10s ease-in-out infinite'
        }}
      />
      {/* Icon 6: Zap */}
      <Zap
        className="absolute w-8 h-8 text-white/15"
        style={{
          top: '55%',
          right: '4%',
          animation: 'float-fast 5s ease-in-out infinite'
        }}
      />
      {/* Icon 7: Lock */}
      <Lock
        className="absolute w-10 h-10 text-white/10"
        style={{
          top: '80%',
          right: '32%',
          animation: 'float-slow 8s ease-in-out infinite'
        }}
      />

      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(6deg); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(-8deg); }
        }
        @keyframes float-fast {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(12deg); }
        }
      `}</style>
    </div>
  )
}

// ─── Greeting and Quote Rotation Card ─────────────────────────────────────────
const QuoteRotatorCard: React.FC = () => {
  const [index, setIndex] = useState(0)
  const [greeting, setGreeting] = useState("")

  useEffect(() => {
    const hours = new Date().getHours()
    if (hours < 12) setGreeting("Good Morning")
    else if (hours < 17) setGreeting("Good Afternoon")
    else setGreeting("Good Evening")

    const timer = setInterval(() => {
      setIndex(prev => (prev + 1) % QUOTES.length)
    }, 6000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="w-full max-w-lg mx-auto lg:mx-0 bg-white/10 backdrop-blur-md rounded-[2rem] border border-white/20 shadow-2xl p-6 relative overflow-hidden transition-all duration-500">
      {/* Decorative Quotation Mark */}
      <span className="absolute -top-8 -left-4 text-[10rem] text-white/5 font-serif select-none pointer-events-none">“</span>

      <div className="relative z-10 space-y-4">
        {/* Top: Dynamic Greeting with Icon */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-extrabold text-white/60 uppercase tracking-widest">
            {greeting}, Team
          </span>
        </div>

        {/* Welcome Text */}
        <h3 className="text-xl font-extrabold text-white tracking-tight leading-tight">
          Ready to refine today's numbers?
        </h3>

        {/* Quote Content */}
        <div className="pt-2 min-h-[85px] flex flex-col justify-between">
          <p className="text-sm text-white/95 font-medium italic leading-relaxed transition-opacity duration-300">
            "{QUOTES[index].text}"
          </p>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
            <span className="text-[10px] font-black text-yellow-300 tracking-wider uppercase">
              — {QUOTES[index].author}
            </span>
            {/* Pagination Indicators */}
            <div className="flex items-center gap-1.5">
              {QUOTES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === index ? 'bg-white scale-125' : 'bg-white/30'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Password screen ─────────────────────────────────────────────────────────
const PasswordScreen: React.FC<{ onAuth: () => void }> = ({ onAuth }) => {
  const [input, setInput] = useState("")
  const [shaking, setShaking] = useState(false)
  const [showPw, setShowPw] = useState(false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input === PASSWORD) {
      onAuth()
    } else {
      setShaking(true)
      setInput("")
      setTimeout(() => setShaking(false), 600)
    }
  }

  return (
    <div className="app-bg app-dark-mesh-bg min-h-screen flex items-center justify-center p-4">
      <AnimatedBg />

      <div className="pw-card-container">
        {/* Glow behind card */}
        <div className="pw-card-glow" />

        <div className="pw-card">
          {/* Lock icon */}
          <div className="pw-lock-wrap">
            <div className="relative">
              <div className="pw-lock-glow animate-pulse" />
              <div className="pw-lock-core">
                <Lock className="w-8 h-8 text-white" strokeWidth={2.5} />
              </div>
              <div className="pw-lock-indicator">
                <div className="pw-lock-dot" />
              </div>
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-6">
            <div className="pw-badge">
              <Lock className="w-3 h-3 inline-block mr-1.5 -mt-0.5" /> Restricted Access
            </div>
            <h2 className="pw-title">MM Media Portal</h2>
            <p className="pw-subtitle">Enter your password to continue</p>
          </div>

          {/* Form */}
          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Password</label>
              <div
                className={`pw-input-wrapper transition-all duration-300 ${shaking ? "animate-[shake_0.4s_ease]" : ""}`}
                style={{ animation: shaking ? "shake 0.4s ease" : undefined }}
              >
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type={showPw ? "text" : "password"}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  autoFocus
                  placeholder="Enter password"
                  className="pw-input"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
                  onClick={() => setShowPw(v => !v)}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="pw-button"
            >
              <span className="relative flex items-center justify-center gap-2">
                <Lock className="w-4 h-4" /> Unlock Access
                <ArrowRight className="w-4 h-4" />
              </span>
              {/* Shimmer */}
              <div className="fu-btn-shimmer" />
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-4" style={{ borderTop: "1px solid rgba(99, 102, 241, 0.15)" }}>
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Secure access · Your data is protected
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%,100% { transform:translateX(0); }
          20%,60%  { transform:translateX(-6px); }
          40%,80%  { transform:translateX(6px); }
        }
      `}</style>
    </div>
  )
}

// ─── Main App ────────────────────────────────────────────────────────────────
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [combinedData, setCombinedData] = useState<ProcessedData | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showCelebration, setShowCelebration] = useState(false)
  const [hasTriggeredCelebration, setHasTriggeredCelebration] = useState(false)
  const [hasQueuedFiles, setHasQueuedFiles] = useState(false)

  const handleFilesUploaded = (files: UploadedFile[]) => {
    setUploadedFiles(files)
    const combined: ProcessedData = {
      records: [],
      campaigns: new Set(),
      ets: new Set(),
      creatives: new Set(),
      advertisers: new Set(),
    }
    files.forEach(f => {
      combined.records.push(...f.data.records)
      f.data.campaigns.forEach(c => combined.campaigns.add(c))
      f.data.ets.forEach(e => combined.ets.add(e))
      f.data.creatives.forEach(c => combined.creatives.add(c))
      f.data.advertisers.forEach(a => combined.advertisers.add(a))
    })
    setCombinedData(combined)
  }

  React.useEffect(() => {
    if (combinedData && !hasTriggeredCelebration) {
      const total = combinedData.records.reduce((s, r) => s + r.revenue, 0)
      if (total >= 15000) {
        setShowCelebration(true)
        setHasTriggeredCelebration(true)
      }
    }
  }, [combinedData, hasTriggeredCelebration])

  if (!isAuthenticated) {
    return (
      <PasswordScreen
        onAuth={() => {
          setIsAuthenticated(true)
        }}
      />
    )
  }

  return (
    <div
      className={`app-bg ${!combinedData ? "app-dark-mesh-bg" : ""}`}
      style={{
        height: combinedData ? "auto" : "100vh",
        minHeight: combinedData ? "100vh" : undefined,
        display: "flex",
        flexDirection: "column",
        overflow: combinedData ? "visible" : "hidden",
        background: combinedData ? "#f8fafc" : undefined,
        transition: "background 0.5s ease"
      }}
    >
      {combinedData ? (
        <AnimatedBg />
      ) : (
        <>
          <LandingBgGrid />
          <FloatingIcons />
        </>
      )}

      {/* ── Header (Navbar) ── */}
      <header
        className="relative z-10"
        style={{
          flexShrink: 0,
          background: combinedData ? "rgba(255, 255, 255, 0.6)" : "transparent",
          backdropFilter: combinedData ? "blur(20px)" : "none",
          borderBottom: combinedData ? "1px solid rgba(226, 232, 240, 0.4)" : "none"
        }}
      >
        <div className="max-w-[1300px] mx-auto px-6">
          <div className="flex items-center justify-between h-14 relative">

            {/* Left: Brand Identity */}
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm overflow-hidden bg-gray-700">
                <img src="/logo.png" width={24} alt="MM Media" />
              </div>
              <div>
                <h1 className={`text-[13px] font-black leading-tight ${combinedData ? "text-slate-900" : "text-white"}`}>MM Media</h1>
                <p className={`text-[9px] font-bold -mt-0.5 tracking-wider uppercase ${combinedData ? "text-slate-400" : "text-white/60"}`}>Report Portal</p>
              </div>
            </div>

            {/* Middle: Date & Time (Centered) */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <CompactClockNavbar isLanding={!combinedData} />
            </div>

            {/* Right: User Actions */}
            <div className="flex items-center gap-2.5">
              <div
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-wider"
                style={{
                  background: combinedData ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.15)",
                  border: combinedData ? "1px solid rgba(16,185,129,0.15)" : "1px solid rgba(255,255,255,0.25)",
                  color: combinedData ? "#059669" : "#fff",
                }}
              >
                <span className={`w-1.5 h-1.5 rounded-full bg-emerald-400 ${combinedData ? "animate-pulse" : ""}`} />
                Live
              </div>

              {combinedData && (
                <button
                  onClick={() => {
                    setUploadedFiles([]); setCombinedData(null)
                    setSearchQuery(""); setHasTriggeredCelebration(false)
                  }}
                  className="px-3 py-1 rounded-lg text-[11px] font-bold transition-all shadow-sm flex items-center gap-1.5"
                  style={{
                    background: "rgba(79,70,229,0.08)",
                    border: "1px solid rgba(79,70,229,0.15)",
                    color: "#4f46e5",
                  }}
                >
                  <RefreshCw className="w-3 h-3" /> New Upload
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="relative z-10 flex-1 flex flex-col min-h-0">

        {!combinedData ? (
          /* ═══ LANDING PAGE — Full-Height Floating Card Layout ═══ */
          <div className="max-w-[1300px] w-full mx-auto px-6 flex-1 flex flex-col lg:flex-row items-center gap-8 xl:gap-12 justify-center py-6 min-h-0">

            {/* ── LEFT: Dashboard Preview / Hero ── */}
            <div className="flex-1 flex flex-col justify-center space-y-6 min-h-0">
              {/* Content */}
              <div className="space-y-4 text-center lg:text-left">
                {/* Badge */}
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] font-bold bg-white/10 border border-white/20 text-white shadow-2xs">
                  <Sparkles className="w-3 h-3 text-yellow-300" />
                  Campaign Report Management Platform
                </div>

                {/* Title */}
                <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-black text-white tracking-tight leading-[1.12]">
                  Process & Analyze<br />
                  <span className="bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-300 bg-clip-text text-transparent">
                    Campaign Reports
                  </span>
                </h2>

                {/* Description */}
                <p className="text-sm text-white/80 font-medium leading-relaxed max-w-md mx-auto lg:mx-0">
                  Parse SUBID metrics, analyze revenue performance, and generate detailed XX breakdowns — all locally, securely, and instantly.
                </p>

                {/* Stats Row */}
                <div className="flex flex-wrap gap-2.5 pt-1 justify-center lg:justify-start">
                  {[
                    { label: "Local Processing", value: "100%", icon: ShieldCheck, color: "#34d399" },
                    { label: "Real-time", value: "Instant", icon: Zap, color: "#fbbf24" },
                    { label: "Multi-file", value: "Queue", icon: BarChart3, color: "#60a5fa" },
                  ].map(s => (
                    <div key={s.label} className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-xl px-3 py-1.5 border border-white/10 shadow-xs">
                      <s.icon className="w-3.5 h-3.5" style={{ color: s.color }} />
                      <div>
                        <div className="text-[11px] font-black text-white">{s.value}</div>
                        <div className="text-[8px] text-white/60 font-semibold">{s.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Greeting and Quote Rotation Card */}
              <QuoteRotatorCard />
            </div>

            {/* ── RIGHT: Floating Upload Panel Card ── */}
            <div
              className="w-full lg:w-[380px] xl:w-[410px] bg-white/10 backdrop-blur-2xl rounded-[2rem] border border-white/15 shadow-[0_25px_80px_rgba(0,0,0,0.45)] flex flex-col relative overflow-hidden"
              style={{ flexShrink: 0, maxHeight: "90%" }}
            >
              <div className="flex-grow flex flex-col p-5 sm:p-6 overflow-y-auto">
                {/* Panel Header */}
                {!hasQueuedFiles && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                      </div>
                      <div>
                        <h3 className="text-xs font-black text-white">Report Processor</h3>
                        <p className="text-[9px] text-white/60 font-semibold">Upload & analyze instantly</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-white/70 leading-relaxed">
                      Upload CSV files containing <span className="font-bold text-indigo-300">SUBID</span> & <span className="font-bold text-indigo-300">REV</span> columns.
                    </p>
                  </div>
                )}

                {/* File Upload Component */}
                <div id="upload-panel" className="flex-1 min-h-0">
                  <FileUpload
                    onFilesUploaded={handleFilesUploaded}
                    onQueueChange={setHasQueuedFiles}
                  />
                </div>

                {/* Info Specs */}
                {!hasQueuedFiles && (
                  <div className="grid grid-cols-3 gap-2.5 mt-4 pt-4 border-t border-white/10">
                    {[
                      { value: "100%", title: "Local", desc: "No server", color: "#34d399", icon: ShieldCheck, glow: "rgba(52, 211, 153, 0.15)" },
                      { value: "\u221E", title: "Queue", desc: "Multi-file", color: "#818cf8", icon: FileSpreadsheet, glow: "rgba(129, 140, 248, 0.15)" },
                      { value: "Instant", title: "Parse", desc: "Real-time", color: "#fbbf24", icon: Zap, glow: "rgba(251, 191, 36, 0.15)" },
                    ].map(s => (
                      <div
                        key={s.title}
                        className="flex flex-col items-center p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/8 transition-all duration-300 group shadow-sm"
                      >
                        {/* Glowing Icon Wrapper */}
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center mb-2 border border-white/5"
                          style={{
                            background: `radial-gradient(circle, ${s.glow} 0%, transparent 100%)`,
                            boxShadow: `inset 0 1px 0 rgba(255, 255, 255, 0.08)`
                          }}
                        >
                          <s.icon className="w-4 h-4" style={{ color: s.color }} />
                        </div>
                        {/* Values & Labels */}
                        <div className="text-[11px] font-black text-white tracking-tight">{s.value}</div>
                        <div className="text-[8px] font-black uppercase mt-0.5 tracking-wider" style={{ color: s.color }}>{s.title}</div>
                        <div className="text-[8px] text-white/50 font-medium mt-0.5 text-center leading-tight">{s.desc}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Security footer */}
                {!hasQueuedFiles && (
                  <div className="mt-3 flex items-center justify-center gap-1 text-[9px] text-slate-400 font-semibold">
                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                    Secure local sandbox
                  </div>
                )}
              </div>
            </div>

          </div>
        ) : (
          /* ═══ DASHBOARD VIEW ═══ */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
            <Dashboard
              data={combinedData}
              uploadedFiles={uploadedFiles}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onReset={() => {
                setUploadedFiles([]); setCombinedData(null)
                setSearchQuery(""); setHasTriggeredCelebration(false)
              }}
            />
          </div>
        )}
      </main>

      <CelebrationEffect isActive={showCelebration} onComplete={() => setShowCelebration(false)} />

      {/* ── Footer ── */}
      {!combinedData && (
        <footer className="relative z-10" style={{ flexShrink: 0 }}>
          <div className="max-w-[1300px] mx-auto px-6 py-3 border-t border-white/10 flex items-center justify-between">
            <p className="text-[10px] text-white/60 font-semibold">
              © 2026 MM Media Reports
            </p>
            <p className="text-[10px] text-white/80 font-semibold flex items-center gap-1">
              Made with <Heart className="w-3 h-3 text-pink-400" fill="currentColor" /> by{" "}
              <a
                href="https://iconicchandu.online/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold hover:underline text-white"
              >
                Iconic Chandu
              </a>
            </p>
          </div>
        </footer>
      )}
    </div>
  )
}

export default App
