"use client"

import React, { useState, useEffect } from "react"
import {
  Heart, TrendingUp, ShieldCheck, Zap, Lock,
  BarChart3, Clock, Sparkles, ArrowRight
} from "lucide-react"
import FileUpload from "./components/FileUpload"
import Dashboard from "./components/Dashboard"
import CelebrationEffect from "./components/CelebrationEffect"
import AnniversaryCelebration from "./components/AnniversaryCelebration"
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
const DateTimeWidget: React.FC = () => {
  const [now, setNow] = useState(new Date())
  const [quoteIdx, setQuoteIdx] = useState(() => Math.floor(Math.random() * QUOTES.length))

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(tick)
  }, [])

  // Rotate quote every 30 s
  useEffect(() => {
    const rotator = setInterval(() => {
      setQuoteIdx(i => (i + 1) % QUOTES.length)
    }, 30_000)
    return () => clearInterval(rotator)
  }, [])

  const pad = (n: number) => String(n).padStart(2, "0")
  const h24 = now.getHours()
  const h12 = h24 % 12 || 12
  const mm = pad(now.getMinutes())
  const ss = pad(now.getSeconds())
  const ampm = h24 < 12 ? "AM" : "PM"

  const dateStr = now.toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  })

  const greeting = h24 < 12 ? "Good Morning" : h24 < 17 ? "Good Afternoon" : "Good Evening"
  const greetEmoji = h24 < 12 ? "🌅" : h24 < 17 ? "☀️" : "🌙"

  const q = QUOTES[quoteIdx]

  return (
    <div className="dt-widget">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Clock section */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="dt-live-dot" />
            <span className="dt-date">{dateStr}</span>
          </div>
          <div className="flex items-end">
            <span className="dt-time">{pad(h12)}:{mm}:{ss}</span>
            <span className="dt-ampm">{ampm}</span>
          </div>
          <div className="dt-day">{greetEmoji} {greeting}, MM Media Team!</div>
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-16 bg-gradient-to-b from-transparent via-indigo-200 to-transparent" />

        {/* Quote section */}
        <div className="flex-[2]" key={quoteIdx}>
          <div className="dt-quote">"{q.text}"</div>
          <div className="dt-quote-author">— {q.author}</div>
        </div>
      </div>
    </div>
  )
}

// ─── Animated background ─────────────────────────────────────────────────────
const AnimatedBg: React.FC = () => {
  const shapes = [
    { size: 12, top: "8%", left: "5%", dur: "8s", delay: "0s", color: "#c7d2fe" },
    { size: 8, top: "20%", left: "90%", dur: "11s", delay: "2s", color: "#ddd6fe" },
    { size: 16, top: "70%", left: "8%", dur: "9s", delay: "1s", color: "#a7f3d0" },
    { size: 10, top: "85%", left: "80%", dur: "13s", delay: "3s", color: "#fde68a" },
    { size: 6, top: "45%", left: "50%", dur: "7s", delay: "0.5s", color: "#fbcfe8" },
    { size: 14, top: "15%", left: "40%", dur: "10s", delay: "4s", color: "#bfdbfe" },
    { size: 7, top: "60%", left: "65%", dur: "12s", delay: "1.5s", color: "#c7d2fe" },
  ]

  return (
    <div className="app-bg-layer">
      <div className="bg-blob bg-blob-1" />
      <div className="bg-blob bg-blob-2" />
      <div className="bg-blob bg-blob-3" />
      <div className="bg-blob bg-blob-4" />
      <div className="bg-grid" />
      {shapes.map((s, i) => (
        <div
          key={i}
          className="bg-shape"
          style={{
            width: s.size, height: s.size,
            top: s.top, left: s.left,
            borderRadius: i % 2 === 0 ? "50%" : "4px",
            background: s.color,
            animationDuration: s.dur,
            animationDelay: s.delay,
          }}
        />
      ))}
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
    <div className="app-bg min-h-screen flex items-center justify-center p-4">
      <AnimatedBg />

      <div className="relative z-10 w-full max-w-sm">
        {/* Glow behind card */}
        <div
          className="absolute -inset-2 rounded-3xl opacity-40"
          style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6,#06b6d4)", filter: "blur(24px)" }}
        />

        <div
          className="relative rounded-3xl p-8"
          style={{
            background: "rgba(255,255,255,0.82)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(99,102,241,0.2)",
            boxShadow: "0 24px 80px rgba(99,102,241,0.18), inset 0 1px 0 rgba(255,255,255,1)",
          }}
        >
          {/* Top rainbow bar */}
          <div
            className="absolute top-0 left-8 right-8 h-0.5 rounded-full"
            style={{ background: "linear-gradient(90deg,#6366f1,#8b5cf6,#06b6d4)" }}
          />

          {/* Lock icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div
                className="absolute inset-0 rounded-2xl opacity-30 animate-pulse"
                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", filter: "blur(12px)" }}
              />
              <div
                className="relative w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 10px 30px rgba(99,102,241,0.4)" }}
              >
                <Lock className="w-8 h-8 text-white" strokeWidth={2.5} />
              </div>
              <div
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white"
                style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}
              >
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              </div>
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-6">
            <div
              className="inline-block mb-3 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#dc2626" }}
            >
              🔒 Restricted Access
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-1 tracking-tight">MM Media Portal</h2>
            <p className="text-sm text-slate-500">Enter your password to continue</p>
          </div>

          {/* Form */}
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Password</label>
              <div
                className={`relative transition-all duration-300 ${shaking ? "animate-[shake_0.4s_ease]" : ""}`}
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
                  className="w-full pl-10 pr-10 py-3 rounded-xl text-sm font-medium outline-none transition-all"
                  style={{
                    background: "rgba(248,250,252,0.8)",
                    border: "1.5px solid rgba(99,102,241,0.2)",
                    color: "#1e293b",
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = "#6366f1"
                    e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)"
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = "rgba(99,102,241,0.2)"
                    e.target.style.boxShadow = "none"
                  }}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPw(v => !v)}
                >
                  {showPw ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full relative overflow-hidden py-3 rounded-xl font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                boxShadow: "0 10px 30px rgba(99,102,241,0.4)",
              }}
            >
              <span className="relative flex items-center justify-center gap-2">
                <Lock className="w-4 h-4" /> Unlock Access
                <ArrowRight className="w-4 h-4" />
              </span>
              {/* Shimmer */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)",
                  animation: "fu-btn-shimmer 2s ease infinite",
                }}
              />
            </button>
          </form>

          {/* Footer */}
          <div className="mt-5 pt-4" style={{ borderTop: "1px solid rgba(99,102,241,0.1)" }}>
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
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
  const [showAnniversary, setShowAnniversary] = useState(false)

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
          setShowAnniversary(true)
        }}
      />
    )
  }

  return (
    <div className="app-bg">
      <AnimatedBg />

      {/* ── Header ── */}
      <header className="app-header relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg overflow-hidden"
                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
              >
                <img src="/logo.png" width={28} alt="MM Media" />
              </div>
              <div>
                <h1 className="text-base font-extrabold text-slate-900 leading-tight">MM Media</h1>
                <p className="text-xs text-slate-500 -mt-0.5">Report & Campaign Management</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{
                  background: "rgba(16,185,129,0.1)",
                  border: "1px solid rgba(16,185,129,0.2)",
                  color: "#059669",
                }}
              >
                <span className="dt-live-dot" style={{ width: 6, height: 6 }} />
                Live
              </div>
              {combinedData && (
                <button
                  onClick={() => {
                    setUploadedFiles([]); setCombinedData(null)
                    setSearchQuery(""); setHasTriggeredCelebration(false)
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105"
                  style={{
                    background: "rgba(99,102,241,0.1)",
                    border: "1px solid rgba(99,102,241,0.2)",
                    color: "#6366f1",
                  }}
                >
                  ↩ New Upload
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-2 py-10 sm:py-12">

          {!combinedData ? (
            <div className="space-y-10">

              {/* ── DateTime + Motivation widget ── */}
              <section className="max-w-4xl mx-auto w-full">
                <DateTimeWidget />
              </section>

              {/* ── Hero ── */}
              <section className="text-center px-4">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 mb-5 px-4 py-2 rounded-full text-sm font-semibold"
                  style={{
                    background: "rgba(99,102,241,0.08)",
                    border: "1px solid rgba(99,102,241,0.2)",
                    color: "#6366f1",
                  }}
                >
                  <Sparkles className="w-4 h-4" />
                  Powered by MM Media Intelligence
                </div>

                <h1 className="hero-title mb-4">
                  Upload Campaign{" "}
                  <span className="hero-gradient-text">Reports</span>
                </h1>

                <p className="hero-sub mb-8">
                  Drop your CSV files and instantly get beautiful analytics,
                  campaign insights, and ET performance breakdowns — all in your browser.
                </p>

                {/* Feature pills */}
                <div className="flex flex-wrap justify-center gap-3 mb-10">
                  {[
                    { icon: TrendingUp, color: "#10b981", label: "Real-time Analytics" },
                    { icon: ShieldCheck, color: "#6366f1", label: "Secure Processing" },
                    { icon: Zap, color: "#f59e0b", label: "Instant Results" },
                    { icon: BarChart3, color: "#8b5cf6", label: "Deep Insights" },
                  ].map(({ icon: Icon, color, label }) => (
                    <div key={label} className="feature-pill">
                      <Icon className="w-4 h-4" style={{ color }} />
                      {label}
                    </div>
                  ))}
                </div>
              </section>

              {/* ── Upload card ── */}
              <section className="max-w-4xl mx-auto w-full">
                <FileUpload onFilesUploaded={handleFilesUploaded} />
              </section>

              {/* ── Stats row ── */}
              <section className="max-w-4xl mx-auto w-full">
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { value: "100%", label: "Local Processing", color: "#10b981" },
                    { value: "∞", label: "Files Supported", color: "#6366f1" },
                    { value: "⚡", label: "Instant Reports", color: "#f59e0b" },
                  ].map(s => (
                    <div
                      key={s.label}
                      className="rounded-2xl p-4 text-center"
                      style={{
                        background: "rgba(255,255,255,0.6)",
                        border: "1px solid rgba(99,102,241,0.12)",
                        backdropFilter: "blur(12px)",
                        boxShadow: "0 4px 20px rgba(99,102,241,0.07)",
                      }}
                    >
                      <div className="text-2xl font-black mb-0.5" style={{ color: s.color }}>{s.value}</div>
                      <div className="text-xs font-medium text-slate-500">{s.label}</div>
                    </div>
                  ))}
                </div>
              </section>

            </div>
          ) : (
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
          )}
        </div>
      </main>

      <CelebrationEffect isActive={showCelebration} onComplete={() => setShowCelebration(false)} />
      <AnniversaryCelebration isOpen={showAnniversary} onClose={() => setShowAnniversary(false)} />

      {/* ── Footer ── */}
      {!combinedData && (
        <footer className="relative z-10 pb-8">
          <div className="max-w-xs mx-auto px-4">
            <p
              className="text-center text-sm flex items-center justify-center gap-1 rounded-xl py-2 px-4"
              style={{
                background: "rgba(255,255,255,0.6)",
                border: "1px solid rgba(99,102,241,0.1)",
                color: "#64748b",
                backdropFilter: "blur(12px)",
              }}
            >
              Made with <Heart className="w-3.5 h-3.5 text-rose-500 mx-0.5" fill="currentColor" /> by{" "}
              <a
                href="https://iconicchandu.online/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold ml-0.5"
                style={{ color: "#6366f1" }}
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
