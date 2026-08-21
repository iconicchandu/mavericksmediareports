"use client"

import React, { useState, useEffect } from "react"
import {
  Heart, ShieldCheck, Zap,
  BarChart3, RefreshCw
} from "lucide-react"
import FileUpload from "./components/FileUpload"
import Dashboard from "./components/Dashboard"
import CelebrationEffect from "./components/CelebrationEffect"
import type { ProcessedData } from "./types"

interface UploadedFile {
  name: string
  data: ProcessedData
}


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
const CompactClockNavbar: React.FC = () => {
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
    <div className="flex items-center gap-2.5 border rounded-2xl px-3.5 py-1.5 text-xs font-bold shadow-xs bg-white/80 border-slate-200/60 text-slate-600 backdrop-blur-md">
      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      <span>
        <span className="text-slate-700">
          <span className="hidden sm:inline">{dayStr}</span>
          {dateStr}
        </span>
        <span className="mx-2 text-slate-200">|</span>
        <span>{pad(h12)}:{mm}:{ss} <span className="text-[10px] font-bold text-indigo-600">{ampm}</span></span>
      </span>
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
    <div className="w-full max-w-lg mx-auto lg:mx-0 bg-white/50 backdrop-blur-xl rounded-[2rem] border border-white/60 shadow-[0_8px_32px_rgba(15,23,42,0.02)] p-6 relative overflow-hidden transition-all duration-500">
      {/* Decorative Blur Glows inside card */}
      <div className="absolute -top-12 -right-12 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl" />
      <div className="absolute -bottom-12 -left-12 w-24 h-24 bg-violet-500/10 rounded-full blur-2xl" />

      <div className="relative z-10 space-y-4">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none">
              {greeting}, Team
            </span>
          </div>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            Insight Engine
          </span>
        </div>

        {/* Welcome / Action statement */}
        <h3 className="text-xl sm:text-[22px] font-black text-slate-900 tracking-tight leading-tight">
          Ready to refine today's numbers?
        </h3>

        {/* Quote Content */}
        <div className="pt-2 min-h-[90px] flex flex-col justify-between">
          <p className="text-[13px] text-slate-600 font-semibold italic leading-relaxed">
            "{QUOTES[index].text}"
          </p>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100/60">
            <span className="text-[9px] font-black text-slate-800 tracking-widest uppercase">
              — {QUOTES[index].author}
            </span>
            {/* Pagination Indicators */}
            <div className="flex items-center gap-1.5">
              {QUOTES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  className={`w-1 h-1 rounded-full transition-all duration-300 ${i === index ? 'bg-indigo-600 w-3' : 'bg-slate-300'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Premium Static Background Grid ──────────────────────────────────────────
const PremiumBackgroundGrid: React.FC = () => {
  return (
    <div
      className="absolute inset-0 pointer-events-none z-0"
      style={{
        backgroundImage: `
          linear-gradient(to right, rgba(99, 102, 241, 0.04) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(99, 102, 241, 0.04) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }}
    />
  )
}

// ─── Main App ────────────────────────────────────────────────────────────────
function App() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [combinedData, setCombinedData] = useState<ProcessedData | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showCelebration, setShowCelebration] = useState(false)
  const [hasTriggeredCelebration, setHasTriggeredCelebration] = useState(false)

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

  return (
    <div
      className="app-bg app-light-mesh-bg"
      style={{
        height: combinedData ? "auto" : "100vh",
        minHeight: combinedData ? "100vh" : undefined,
        display: "flex",
        flexDirection: "column",
        overflow: combinedData ? "visible" : "hidden"
      }}
    >
      <PremiumBackgroundGrid />

      {/* ── Header (Navbar) ── */}
      <header
        className="relative z-10 animate-blur-in opacity-0"
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
                className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm overflow-hidden bg-slate-900">
                <img src="/logo.png" width={24} alt="MM Media" />
              </div>
              <div>
                <h1 className="text-[13px] font-black leading-tight text-slate-800">MM Media</h1>
                <p className="text-[9px] font-bold -mt-0.5 tracking-wider uppercase text-slate-400">Report Portal</p>
              </div>
            </div>

            {/* Middle: Date & Time (Centered) */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <CompactClockNavbar />
            </div>

            {/* Right: User Actions */}
            <div className="flex items-center gap-2.5">
              <div
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-wider"
                style={{
                  background: "rgba(16,185,129,0.08)",
                  border: "1px solid rgba(16,185,129,0.15)",
                  color: "#059669",
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
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
                    background: "#0400f7ff",
                    border: "1px solid #0800fdff",
                    color: "#ffffffff",
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
                <div 
                  className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-900/5 border border-slate-900/10 text-slate-800 backdrop-blur-xs tracking-wider uppercase shadow-2xs animate-blur-in opacity-0"
                  style={{ animationDelay: '0.05s' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                  Campaign Intelligence Hub
                </div>

                {/* Title */}
                <h2 
                  className="text-4xl sm:text-5xl lg:text-[3.25rem] font-black text-slate-900 tracking-tight leading-[1.08] mt-2 animate-blur-in opacity-0"
                  style={{ animationDelay: '0.15s' }}
                >
                  Process & Analyze<br />
                  <span className="bg-gradient-to-r from-[#3b82f6] via-[#6366f1] to-[#8b5cf6] bg-clip-text text-transparent">
                    Campaign Reports.
                  </span>
                </h2>

                {/* Description */}
                <p 
                  className="text-sm sm:text-[14.5px] text-slate-500 font-medium leading-relaxed max-w-md mx-auto lg:mx-0 animate-blur-in opacity-0"
                  style={{ animationDelay: '0.25s' }}
                >
                  Parse SUBID metrics, track campaign revenue performance, and generate detailed local breakdowns instantly with zero server uploads.
                </p>

                {/* Stats Row */}
                <div 
                  className="flex flex-wrap gap-3 pt-2 justify-center lg:justify-start animate-blur-in opacity-0"
                  style={{ animationDelay: '0.35s' }}
                >
                  {[
                    { label: "Local Processing", value: "100%", icon: ShieldCheck, color: "#10b981", bg: "bg-emerald-500/5", border: "border-emerald-500/10" },
                    { label: "Instant compile", value: "Real-time", icon: Zap, color: "#f59e0b", bg: "bg-amber-500/5", border: "border-amber-500/10" },
                    { label: "Multi-file", value: "Queue", icon: BarChart3, color: "#3b82f6", bg: "bg-indigo-500/5", border: "border-indigo-500/10" },
                  ].map(s => (
                    <div key={s.label} className={`flex items-center gap-2.5 ${s.bg} rounded-xl px-4 py-2 border ${s.border} backdrop-blur-md shadow-[0_2px_10px_rgba(0,0,0,0.01)]`}>
                      <s.icon className="w-4 h-4 flex-shrink-0" style={{ color: s.color }} />
                      <div>
                        <div className="text-[11px] font-black text-slate-800 leading-tight">{s.value}</div>
                        <div className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider mt-0.5">{s.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Greeting and Quote Rotation Card */}
              <div className="animate-blur-in opacity-0" style={{ animationDelay: '0.45s' }}>
                <QuoteRotatorCard />
              </div>
            </div>

            {/* ── RIGHT: Minimal Upload Panel Card ── */}
            <div className="animate-blur-in opacity-0 w-full sm:w-[480px] lg:flex-shrink-0" style={{ animationDelay: '0.55s' }}>
              <FileUpload
                onFilesUploaded={handleFilesUploaded}
              />
            </div>

          </div>
        ) : (
          /* ═══ DASHBOARD VIEW ═══ */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full animate-fade-in opacity-0" style={{ animationDelay: '0.05s' }}>
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
          <div className="max-w-[1300px] mx-auto px-6 py-3 border-t border-slate-200/60 flex items-center justify-between">
            <p className="text-[10px] text-slate-400 font-semibold">
              © 2026 MM Media Reports
            </p>
            <p className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
              Made with <Heart className="w-3 h-3 text-pink-400" fill="currentColor" /> by{" "}
              <a
                href="https://iconicchandu.online/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold hover:underline text-slate-600 hover:text-indigo-600"
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
