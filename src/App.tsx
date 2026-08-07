"use client"

import React, { useState, useEffect } from "react"
import {
  Heart, TrendingUp, ShieldCheck, Zap, Lock,
  BarChart3, Sparkles, RefreshCw,
  Database, FileSpreadsheet,
  LineChart, Percent, Activity, DollarSign, ArrowUpRight
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
      className="absolute inset-0 pointer-events-none opacity-[0.08] z-0"
      style={{
        backgroundImage: `
          linear-gradient(to right, rgba(99, 102, 241, 0.15) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(99, 102, 241, 0.15) 1px, transparent 1px)
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
        className="absolute w-12 h-12 text-indigo-500/10"
        style={{
          top: '15%',
          left: '8%',
          animation: 'float-slow 7s ease-in-out infinite'
        }}
      />
      {/* Icon 2: TrendingUp */}
      <TrendingUp
        className="absolute w-14 h-14 text-indigo-500/10"
        style={{
          top: '45%',
          left: '5%',
          animation: 'float-medium 9s ease-in-out infinite'
        }}
      />
      {/* Icon 3: FileSpreadsheet */}
      <FileSpreadsheet
        className="absolute w-10 h-10 text-indigo-500/10"
        style={{
          top: '75%',
          left: '12%',
          animation: 'float-fast 6s ease-in-out infinite'
        }}
      />
      {/* Icon 4: ShieldCheck */}
      <ShieldCheck
        className="absolute w-12 h-12 text-indigo-500/10"
        style={{
          top: '20%',
          right: '35%',
          animation: 'float-medium 8s ease-in-out infinite'
        }}
      />
      {/* Icon 5: BarChart3 */}
      <BarChart3
        className="absolute w-16 h-16 text-indigo-500/10"
        style={{
          top: '12%',
          right: '8%',
          animation: 'float-slow 10s ease-in-out infinite'
        }}
      />
      {/* Icon 6: Zap */}
      <Zap
        className="absolute w-8 h-8 text-indigo-500/15"
        style={{
          top: '55%',
          right: '4%',
          animation: 'float-fast 5s ease-in-out infinite'
        }}
      />
      {/* Icon 7: Lock */}
      <Lock
        className="absolute w-10 h-10 text-indigo-500/10"
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

// ─── Live Animated Background Chart ──────────────────────────────────────────
const AnimatedBackgroundChart: React.FC = () => {
  const [points, setPoints] = useState<number[]>([20, 28, 25, 38, 35, 48, 42, 58, 52, 68, 62, 78])

  useEffect(() => {
    const interval = setInterval(() => {
      setPoints(prev => {
        const next = [...prev]
        const lastVal = next[next.length - 1]
        
        // General upward trend with light fluctuations
        const isUp = Math.random() > 0.35 // 65% chance of going up
        const change = (isUp ? 1 : -1) * (Math.random() * 8 + 2)
        let newVal = Math.max(15, Math.min(95, lastVal + change))
        
        // Reset or level off if it hits the ceiling to prevent going out of bounds
        if (newVal > 90) {
          newVal = 55 + Math.random() * 15
        }
        
        next.shift()
        next.push(newVal)
        return next
      })
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  const width = 1100
  const height = 280
  const paddingX = 70
  const paddingY = 30

  const getCoordinates = () => {
    const stepX = (width - paddingX * 2) / (points.length - 1)
    return points.map((p, index) => {
      const x = paddingX + index * stepX
      const y = height - paddingY - (p / 100) * (height - paddingY * 2)
      return { x, y }
    })
  }

  const coords = getCoordinates()

  // Generate smooth cubic bezier path
  let pathD = ""
  if (coords.length > 0) {
    pathD = `M ${coords[0].x} ${coords[0].y}`
    const stepX = (width - paddingX * 2) / (points.length - 1)
    for (let i = 0; i < coords.length - 1; i++) {
      const curr = coords[i]
      const next = coords[i + 1]
      const cpX1 = curr.x + stepX / 2
      const cpY1 = curr.y
      const cpX2 = next.x - stepX / 2
      const cpY2 = next.y
      pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${next.x} ${next.y}`
    }
  }

  const areaD = pathD ? `${pathD} L ${coords[coords.length - 1].x} ${height - paddingY} L ${coords[0].x} ${height - paddingY} Z` : ""

  return (
    <div className="absolute inset-x-0 bottom-6 top-1/3 pointer-events-none z-0 overflow-hidden opacity-[0.25] select-none">
      <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="chart-line-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#c084fc" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#818cf8" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity="1.0" />
          </linearGradient>
          <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal Faint Grid lines */}
        <line x1={paddingX} y1={height * 0.25} x2={width - paddingX} y2={height * 0.25} stroke="rgba(99,102,241,0.06)" strokeWidth="1" strokeDasharray="4 4" />
        <line x1={paddingX} y1={height * 0.5} x2={width - paddingX} y2={height * 0.5} stroke="rgba(99,102,241,0.06)" strokeWidth="1" strokeDasharray="4 4" />
        <line x1={paddingX} y1={height * 0.75} x2={width - paddingX} y2={height * 0.75} stroke="rgba(99,102,241,0.06)" strokeWidth="1" strokeDasharray="4 4" />

        {/* Y-Axis Labels */}
        <text x={paddingX - 45} y={height * 0.25 + 3} fill="rgba(99,102,241,0.4)" fontSize="8.5" fontWeight="700" fontFamily="Inter, sans-serif">100k</text>
        <text x={paddingX - 45} y={height * 0.5 + 3} fill="rgba(99,102,241,0.4)" fontSize="8.5" fontWeight="700" fontFamily="Inter, sans-serif">50k</text>
        <text x={paddingX - 45} y={height * 0.75 + 3} fill="rgba(99,102,241,0.4)" fontSize="8.5" fontWeight="700" fontFamily="Inter, sans-serif">25k</text>

        {/* Area under curve */}
        {areaD && <path d={areaD} fill="url(#chart-area-grad)" className="transition-all duration-1000 ease-in-out" />}

        {/* The main line */}
        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke="url(#chart-line-grad)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-1000 ease-in-out"
          />
        )}

        {/* Pulsing nodes on data points */}
        {coords.map((c, i) => {
          const isLast = i === coords.length - 1
          return (
            <g key={i} className="transition-all duration-1000 ease-in-out" style={{ transformOrigin: `${c.x}px ${c.y}px` }}>
              {isLast && (
                <circle
                  cx={c.x}
                  cy={c.y}
                  r="8"
                  fill="#4f46e5"
                  className="animate-ping opacity-35"
                />
              )}
              <circle
                cx={c.x}
                cy={c.y}
                r={isLast ? "4" : "3"}
                fill={isLast ? "#4f46e5" : "#818cf8"}
                stroke="#fff"
                strokeWidth={isLast ? "2" : "1.5"}
                className={isLast ? "" : "opacity-75"}
              />
            </g>
          )
        })}

        {/* X-Axis Labels */}
        <text x={paddingX} y={height - 8} fill="rgba(99,102,241,0.3)" fontSize="8" fontWeight="600" fontFamily="Inter, sans-serif">09:00 AM</text>
        <text x={width * 0.33} y={height - 8} fill="rgba(99,102,241,0.3)" fontSize="8" fontWeight="600" fontFamily="Inter, sans-serif">10:00 AM</text>
        <text x={width * 0.66} y={height - 8} fill="rgba(99,102,241,0.3)" fontSize="8" fontWeight="600" fontFamily="Inter, sans-serif">11:00 AM</text>
        <text x={width - paddingX - 60} y={height - 8} fill="rgba(99,102,241,0.5)" fontSize="8" fontWeight="700" fontFamily="Inter, sans-serif" className="animate-pulse">LIVE TRACKING</text>
      </svg>
    </div>
  )
}

// ─── Live Background Dashboard Widgets ───────────────────────────────────────
const BackgroundDashboardWidgets: React.FC = () => {
  const [revenue, setRevenue] = useState(14205.80)
  const [roi, setRoi] = useState(242.4)
  const [activeUsers, setActiveUsers] = useState(84)

  useEffect(() => {
    const timer = setInterval(() => {
      setRevenue(prev => prev + (Math.random() - 0.45) * 6)
      setRoi(prev => Math.max(100, Math.min(500, prev + (Math.random() - 0.5) * 1.2)))
      setActiveUsers(prev => Math.max(50, Math.min(150, prev + (Math.random() > 0.5 ? 1 : -1))))
    }, 1500)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-[0.22] select-none">
      
      {/* Widget 1: Top Right - Live Analytics Card */}
      <div 
        className="absolute w-[220px] p-4 rounded-3xl bg-white/40 border border-indigo-100/40 shadow-xs backdrop-blur-xs"
        style={{
          top: '12%',
          right: '8%',
          animation: 'float-slow 8s ease-in-out infinite'
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-indigo-50 border border-indigo-100 flex items-center justify-center">
              <Activity className="w-3 h-3 text-indigo-500" />
            </div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Live Feed</span>
          </div>
          <span className="flex items-center text-[9px] font-bold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-full">
            <ArrowUpRight className="w-2.5 h-2.5 mr-0.5" /> +12%
          </span>
        </div>
        <div className="text-lg font-black text-slate-700 tracking-tight">
          ${revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="text-[8px] text-slate-400 font-bold mt-0.5">ESTIMATED REVENUE</div>
        
        {/* Micro sparkline */}
        <div className="h-6 mt-3 flex items-end gap-1">
          {[40, 60, 50, 70, 65, 80, 75, 90, 85].map((val, idx) => (
            <div 
              key={idx} 
              className="flex-1 bg-indigo-500/25 rounded-xs transition-all duration-500"
              style={{ height: `${val}%`, backgroundColor: idx === 8 ? '#6366f1' : undefined }}
            />
          ))}
        </div>
      </div>

      {/* Widget 2: Mid Left - Campaign Efficiency Gauge */}
      <div 
        className="absolute w-[190px] p-3.5 rounded-3xl bg-white/40 border border-indigo-100/40 shadow-xs backdrop-blur-xs"
        style={{
          top: '55%',
          left: '4%',
          animation: 'float-medium 9s ease-in-out infinite'
        }}
      >
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-5 h-5 rounded-md bg-purple-50 border border-purple-100/80 flex items-center justify-center">
            <Percent className="w-3 h-3 text-purple-500" />
          </div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Efficiency</span>
        </div>
        <div className="text-base font-black text-slate-700 tracking-tight">
          {roi.toFixed(1)}% <span className="text-[9px] font-bold text-slate-400">ROI</span>
        </div>
        
        {/* Micro progress bar */}
        <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-1000"
            style={{ width: `${(roi / 500) * 100}%` }}
          />
        </div>
        <div className="text-[7.5px] text-slate-400 font-bold mt-1.5 uppercase tracking-wide">Optimization Target</div>
      </div>

      {/* Widget 3: Bottom Right (Partially Behind Uploader) - Server Load / Active Channels */}
      <div 
        className="absolute w-[180px] p-3.5 rounded-3xl bg-white/40 border border-indigo-100/40 shadow-xs backdrop-blur-xs"
        style={{
          bottom: '12%',
          right: '32%',
          animation: 'float-fast 7s ease-in-out infinite'
        }}
      >
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className="w-5 h-5 rounded-md bg-blue-50 border border-blue-100/80 flex items-center justify-center">
            <LineChart className="w-3 h-3 text-blue-500" />
          </div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Channels</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-base font-black text-slate-700">{activeUsers}</span>
          <span className="text-[8px] font-bold text-emerald-500">● LIVE RUNNING</span>
        </div>
        <div className="text-[7.5px] text-slate-400 font-bold mt-1 uppercase tracking-wide">ACTIVE API INSTANCES</div>
      </div>

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
    <div className="w-full max-w-lg mx-auto lg:mx-0 bg-white/80 backdrop-blur-md rounded-[2.25rem] border border-slate-200/80 shadow-md p-6 relative overflow-hidden transition-all duration-500">
      {/* Decorative Quotation Mark */}
      <span className="absolute -top-8 -left-4 text-[10rem] text-slate-200/40 font-serif select-none pointer-events-none">“</span>

      <div className="relative z-10 space-y-4">
        {/* Top: Dynamic Greeting with Icon */}
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-extrabold text-indigo-600/80 uppercase tracking-widest">
            {greeting}, Team
          </span>
        </div>

        {/* Welcome Text */}
        <h3 className="text-xl font-extrabold text-slate-800 tracking-tight leading-tight">
          Ready to refine today's numbers?
        </h3>

        {/* Quote Content */}
        <div className="pt-2 min-h-[85px] flex flex-col justify-between">
          <p className="text-sm text-slate-600 font-medium italic leading-relaxed transition-opacity duration-300">
            "{QUOTES[index].text}"
          </p>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
            <span className="text-[10px] font-black text-indigo-600 tracking-wider uppercase">
              — {QUOTES[index].author}
            </span>
            {/* Pagination Indicators */}
            <div className="flex items-center gap-1.5">
              {QUOTES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === index ? 'bg-indigo-600 scale-125' : 'bg-slate-300'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
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

  return (
    <div
      className={`app-bg ${!combinedData ? "app-light-mesh-bg" : ""}`}
      style={{
        height: combinedData ? "auto" : "100vh",
        minHeight: combinedData ? "100vh" : undefined,
        display: "flex",
        flexDirection: "column",
        overflow: combinedData ? "visible" : "hidden",
        background: "#f8fafc",
        transition: "background 0.5s ease"
      }}
    >
      {combinedData ? (
        <AnimatedBg />
      ) : (
        <>
          <LandingBgGrid />
          <FloatingIcons />
          <AnimatedBackgroundChart />
          <BackgroundDashboardWidgets />
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
              <CompactClockNavbar isLanding={!combinedData} />
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
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-700 shadow-2xs">
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  Campaign Report Management Platform
                </div>

                {/* Title */}
                <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-black text-slate-800 tracking-tight leading-[1.12]">
                  Process & Analyze<br />
                  <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 bg-clip-text text-transparent">
                    Campaign Reports
                  </span>
                </h2>

                {/* Description */}
                <p className="text-sm text-slate-600 font-medium leading-relaxed max-w-md mx-auto lg:mx-0">
                  Parse SUBID metrics, analyze revenue performance, and generate detailed breakdowns — all locally, securely, and instantly.
                </p>

                {/* Stats Row */}
                <div className="flex flex-wrap gap-2.5 pt-1 justify-center lg:justify-start">
                  {[
                    { label: "Local Processing", value: "100%", icon: ShieldCheck, color: "#10b981", bg: "bg-emerald-50", border: "border-emerald-100" },
                    { label: "Real-time", value: "Instant", icon: Zap, color: "#f59e0b", bg: "bg-amber-50", border: "border-amber-100" },
                    { label: "Multi-file", value: "Queue", icon: BarChart3, color: "#3b82f6", bg: "bg-blue-50", border: "border-blue-100" },
                  ].map(s => (
                    <div key={s.label} className={`flex items-center gap-2 ${s.bg} rounded-xl px-3 py-1.5 border ${s.border} shadow-xs`}>
                      <s.icon className="w-3.5 h-3.5" style={{ color: s.color }} />
                      <div>
                        <div className="text-[11px] font-black text-slate-800">{s.value}</div>
                        <div className="text-[8px] text-slate-500 font-semibold">{s.label}</div>
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
              className="w-full lg:w-[380px] xl:w-[410px] bg-white/90 backdrop-blur-2xl rounded-[2.25rem] border border-slate-200/80 shadow-[0_20px_50px_rgba(15,23,42,0.08)] flex flex-col relative overflow-hidden"
              style={{ flexShrink: 0, maxHeight: "90%" }}
            >
              <div className="flex-grow flex flex-col p-5 sm:p-6 overflow-y-auto">
                {/* Panel Header */}
                {!hasQueuedFiles && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100/50 flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="text-xs font-black text-slate-800">Report Processor</h3>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Upload & analyze instantly</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Upload CSV files containing <span className="font-bold text-indigo-600 bg-indigo-50/50 px-1 py-0.5 rounded">SUBID</span> & <span className="font-bold text-indigo-600 bg-indigo-50/50 px-1 py-0.5 rounded">REV</span> columns.
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
                  <div className="grid grid-cols-3 gap-2.5 mt-4 pt-4 border-t border-slate-100">
                    {[
                      { value: "100%", title: "Local", desc: "No server", color: "#059669", icon: ShieldCheck, glow: "rgba(5, 150, 105, 0.08)" },
                      { value: "\u221E", title: "Queue", desc: "Multi-file", color: "#4f46e5", icon: FileSpreadsheet, glow: "rgba(79, 70, 229, 0.08)" },
                      { value: "Instant", title: "Parse", desc: "Real-time", color: "#d97706", icon: Zap, glow: "rgba(217, 119, 6, 0.08)" },
                    ].map(s => (
                      <div
                        key={s.title}
                        className="flex flex-col items-center p-3 rounded-2xl bg-slate-50/50 border border-slate-100 hover:border-indigo-100 hover:bg-white hover:shadow-xs transition-all duration-300 group"
                      >
                        {/* Glowing Icon Wrapper */}
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center mb-2 border border-slate-100"
                          style={{
                            background: s.glow,
                          }}
                        >
                          <s.icon className="w-4 h-4" style={{ color: s.color }} />
                        </div>
                        {/* Values & Labels */}
                        <div className="text-[11px] font-black text-slate-800 tracking-tight">{s.value}</div>
                        <div className="text-[8px] font-black uppercase mt-0.5 tracking-wider" style={{ color: s.color }}>{s.title}</div>
                        <div className="text-[8px] text-slate-400 font-semibold mt-0.5 text-center leading-tight">{s.desc}</div>
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
