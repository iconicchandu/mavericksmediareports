"use client"

import React, { useState, useEffect } from "react"
import {
  Heart, ShieldCheck, Zap,
  RefreshCw, TrendingUp, Calendar
} from "lucide-react"
import FileUpload from "./components/FileUpload"
import Dashboard from "./components/Dashboard"
import SevenDayReportPanel from "./components/SevenDayReportPanel"
import CelebrationEffect from "./components/CelebrationEffect"
import { detectBatchContextMonth, detectDateFromFileName } from "./services/dateParser"
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
    <div className="flex items-center gap-2 border rounded-full px-3.5 py-1 text-xs font-bold shadow-xs bg-white/90 border-slate-200/80 text-slate-600 backdrop-blur-md">
      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      <span>
        <span className="text-slate-700">
          <span className="hidden sm:inline">{dayStr}</span>
          {dateStr}
        </span>
        <span className="mx-2 text-slate-300">|</span>
        <span>{pad(h12)}:{mm}:{ss} <span className="text-[10px] font-black text-indigo-600">{ampm}</span></span>
      </span>
    </div>
  )
}

// ─── Executive Briefing & Quote Rotation Card ───────────────────────────────
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
    <div className="w-full max-w-lg bg-white/75 backdrop-blur-xl rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(15,23,42,0.03)] p-4 relative overflow-hidden transition-all duration-300">
      <div className="relative z-10 space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest leading-none">
              {greeting}, Team
            </span>
          </div>
          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">
            Daily Briefing • Insight Engine
          </span>
        </div>

        {/* Quote Content */}
        <div className="pt-0.5 flex flex-col justify-between">
          <p className="text-[12.5px] text-slate-700 font-semibold italic leading-relaxed">
            "{QUOTES[index].text}"
          </p>
          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100">
            <span className="text-[9px] font-black text-slate-700 tracking-wider uppercase">
              — {QUOTES[index].author}
            </span>
            {/* Pagination Indicators */}
            <div className="flex items-center gap-1">
              {QUOTES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  aria-label={`Go to quote ${i + 1}`}
                  className={`h-1 rounded-full transition-all duration-300 ${i === index ? 'bg-indigo-600 w-3.5' : 'bg-slate-300 w-1 hover:bg-slate-400'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Ambient Canvas Lighting & Micro-Grid ──────────────────────────────────
const PremiumBackgroundGrid: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {/* Blueprint grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(99, 102, 241, 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(99, 102, 241, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: '36px 36px',
        }}
      />
      {/* Soft ambient aura glows */}
      <div className="absolute -top-32 left-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 right-1/4 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />
    </div>
  )
}

// ─── Main App ────────────────────────────────────────────────────────────────
function App() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [combinedData, setCombinedData] = useState<ProcessedData | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showCelebration, setShowCelebration] = useState(false)
  const [hasTriggeredCelebration, setHasTriggeredCelebration] = useState(false)
  const [isSevenDayMode, setIsSevenDayMode] = useState<boolean>(false)
  const [reportView, setReportView] = useState<'standard' | 'seven-day'>('seven-day')

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

    // Check if multiple dates are detected across files
    const fNames = files.map(f => f.name)
    const ctxMonth = detectBatchContextMonth(fNames)
    const uniqueDates = new Set(fNames.map(fn => detectDateFromFileName(fn, ctxMonth).label))
    
    if (isSevenDayMode || uniqueDates.size > 1) {
      setReportView('seven-day')
    } else {
      setReportView('standard')
    }
  }

  const handleReset = () => {
    setUploadedFiles([])
    setCombinedData(null)
    setSearchQuery("")
    setHasTriggeredCelebration(false)
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
      className="app-bg relative w-full"
      style={{
        height: combinedData ? "auto" : "100vh",
        maxHeight: combinedData ? undefined : "100vh",
        minHeight: combinedData ? "100vh" : undefined,
        display: "flex",
        flexDirection: "column",
        overflow: combinedData ? "visible" : "hidden"
      }}
    >
      <PremiumBackgroundGrid />

      {/* ── Header (Navbar) ── */}
      <header
        className="relative z-10 flex-shrink-0 animate-blur-in"
        style={{
          background: combinedData ? "rgba(255, 255, 255, 0.75)" : "transparent",
          backdropFilter: combinedData ? "blur(20px)" : "none",
          borderBottom: combinedData ? "1px solid rgba(226, 232, 240, 0.6)" : "none"
        }}
      >
        <div className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 relative">

            {/* Left: Brand Identity */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-xs overflow-hidden bg-slate-900 border border-slate-800">
                <img src="/logo.png" width={22} alt="MM Media" className="object-contain" />
              </div>
              <div>
                <h1 className="text-[13px] font-black leading-tight text-slate-900 tracking-tight flex items-center gap-1.5">
                  MM Media
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                    Pro
                  </span>
                </h1>
                <p className="text-[9px] font-bold -mt-0.5 tracking-wider uppercase text-slate-400">
                  Report Intelligence Portal
                </p>
              </div>
            </div>

            {/* Middle: Date & Time (Centered) */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <CompactClockNavbar />
            </div>

            {/* Right: User Actions */}
            <div className="flex items-center gap-2">
              {combinedData && reportView === 'seven-day' && (
                <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-indigo-600 text-white shadow-xs">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>7-Day Report</span>
                </div>
              )}

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-50 border border-emerald-200/70 text-emerald-700 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Engine
              </div>

              {combinedData && (
                <button
                  onClick={handleReset}
                  className="px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 bg-slate-900 hover:bg-indigo-600 text-white active:scale-95"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> 
                  <span>New Upload</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="relative z-10 flex-1 flex flex-col min-h-0 justify-center">

        {!combinedData ? (
          /* ═══ LANDING PAGE — 100vh No-Scroll Studio Layout ═══ */
          <div className="max-w-[1340px] w-full mx-auto px-4 sm:px-6 lg:px-8 flex-1 min-h-0 flex items-center justify-center py-2 sm:py-3">
            <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-10 items-center justify-between">

              {/* ── LEFT: Report Intelligence Overview & Telemetry ── */}
              <div className="lg:col-span-7 flex flex-col justify-center space-y-4">
                
                {/* Eyebrow Status Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black bg-indigo-50/90 border border-indigo-200/70 text-indigo-800 tracking-wider uppercase shadow-2xs w-fit animate-blur-in">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Campaign Intelligence Hub</span>
                  <span className="text-slate-300">|</span>
                  <span className="text-indigo-600 font-extrabold">v2.4 Sandbox</span>
                </div>

                {/* Hero Title */}
                <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] xl:text-[3rem] font-black text-slate-900 tracking-tight leading-[1.12]">
                  Process & Analyze<br />
                  <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                    Campaign Reports.
                  </span>
                </h2>

                {/* Hero Subtitle */}
                <p className="text-xs sm:text-[14px] text-slate-500 font-medium leading-relaxed max-w-lg">
                  Parse SUBID metrics, track publisher ET performance across 7-day batches, and generate deep advertiser revenue breakdowns in real-time.
                </p>

                {/* Report Capability Matrix */}
                <div className="grid grid-cols-2 gap-2.5 max-w-lg pt-1">
                  <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/75 border border-slate-200/80 shadow-2xs backdrop-blur-sm hover:border-indigo-200 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-black text-slate-800 leading-tight">100% Local Sandbox</div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 truncate">Zero Server Storage</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/75 border border-slate-200/80 shadow-2xs backdrop-blur-sm hover:border-indigo-200 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-black text-slate-800 leading-tight">7-Day ET Matrix</div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 truncate">Cross-Date Revenue Table</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/75 border border-slate-200/80 shadow-2xs backdrop-blur-sm hover:border-indigo-200 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-black text-slate-800 leading-tight">Instant Compile</div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 truncate">Real-Time In-Memory Engine</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/75 border border-slate-200/80 shadow-2xs backdrop-blur-sm hover:border-indigo-200 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 flex-shrink-0">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-black text-slate-800 leading-tight">Revenue Attribution</div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 truncate">12+ Advertiser Splits</div>
                    </div>
                  </div>
                </div>

                {/* Executive Briefing & Quote Rotation Card */}
                <div className="pt-1">
                  <QuoteRotatorCard />
                </div>
              </div>

              {/* ── RIGHT: Campaign Ingestion Console ── */}
              <div className="lg:col-span-5 flex justify-center lg:justify-end animate-blur-in">
                <FileUpload
                  onFilesUploaded={handleFilesUploaded}
                  isSevenDayMode={isSevenDayMode}
                  onToggleSevenDayMode={setIsSevenDayMode}
                />
              </div>

            </div>
          </div>
        ) : (
          /* ═══ REPORT VIEWER / DASHBOARD VIEW ═══ */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full animate-fade-in opacity-0" style={{ animationDelay: '0.05s' }}>
            {reportView === 'seven-day' ? (
              <SevenDayReportPanel
                data={combinedData}
                uploadedFiles={uploadedFiles}
                onReset={handleReset}
              />
            ) : (
              <Dashboard
                data={combinedData}
                uploadedFiles={uploadedFiles}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onReset={handleReset}
              />
            )}
          </div>
        )}
      </main>

      <CelebrationEffect isActive={showCelebration} onComplete={() => setShowCelebration(false)} />

      {/* ── Footer ── */}
      {!combinedData && (
        <footer className="relative z-10 flex-shrink-0">
          <div className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8 h-9 border-t border-slate-200/70 flex items-center justify-between text-[10px]">
            <p className="text-slate-400 font-semibold flex items-center gap-1.5">
              <span>© 2026 MM Media Reports</span>
              <span className="text-slate-200">|</span>
              <span className="hidden sm:inline text-slate-400">Local Campaign Intelligence Engine</span>
            </p>
            <p className="text-slate-500 font-semibold flex items-center gap-1">
              Made with <Heart className="w-3 h-3 text-pink-400 fill-pink-400" /> by{" "}
              <a
                href="https://iconicchandu.online/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold hover:underline text-slate-700 hover:text-indigo-600 transition-colors"
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
