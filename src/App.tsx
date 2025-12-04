"use client"

import React, { useState } from "react"
import { Heart, TrendingUp, ShieldCheck, Zap, Lock } from "lucide-react"
import FileUpload from "./components/FileUpload"
import Dashboard from "./components/Dashboard"
import CelebrationEffect from "./components/CelebrationEffect"
import type { ProcessedData } from "./types"

interface UploadedFile {
  name: string
  data: ProcessedData
}

// Password stored in code
const PASSWORD = "MMmEdiaak@8767"

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [passwordInput, setPasswordInput] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [combinedData, setCombinedData] = useState<ProcessedData | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showCelebration, setShowCelebration] = useState(false)
  const [hasTriggeredCelebration, setHasTriggeredCelebration] = useState(false)

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordInput === PASSWORD) {
      setIsAuthenticated(true)
    } else {
      alert("Incorrect password")
      setPasswordInput("")
    }
  }

  const handleFilesUploaded = (files: UploadedFile[]) => {
    setUploadedFiles(files)

    // Combine all data
    const combined: ProcessedData = {
      records: [],
      campaigns: new Set(),
      ets: new Set(),
      creatives: new Set(),
      advertisers: new Set(),
    }

    files.forEach((file) => {
      combined.records.push(...file.data.records)
      file.data.campaigns.forEach((c) => combined.campaigns.add(c))
      file.data.ets.forEach((e) => combined.ets.add(e))
      file.data.creatives.forEach((c) => combined.creatives.add(c))
      file.data.advertisers.forEach((a) => combined.advertisers.add(a))
    })

    setCombinedData(combined)
  }

  // Check if celebration should trigger
  React.useEffect(() => {
    if (combinedData && !hasTriggeredCelebration) {
      const totalRevenue = combinedData.records.reduce((sum, record) => sum + record.revenue, 0)
      if (totalRevenue >= 15000) {
        setShowCelebration(true)
        setHasTriggeredCelebration(true)
      }
    }
  }, [combinedData, hasTriggeredCelebration])

  // Password Screen - Show if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-0 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          {/* Grid Pattern Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Glow Effect Behind Card */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl blur-xl opacity-30 animate-pulse"></div>
          
          <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-2xl shadow-2xl p-6 sm:p-8 border border-white/20">
            {/* Decorative Top Accent */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent rounded-full"></div>
            
            {/* Security Icon with Enhanced Design */}
            <div className="flex justify-center mb-5">
              <div className="relative">
                {/* Outer Glow Ring */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full blur-lg opacity-50 animate-pulse"></div>
                {/* Main Icon Container */}
                <div className="relative w-16 h-16 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-xl transform hover:scale-105 transition-transform duration-300">
                  <Lock className="h-8 w-8 text-white" strokeWidth={2.5} />
                  {/* Shine Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl"></div>
                </div>
                {/* Status Indicator */}
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full border-3 border-white/90 flex items-center justify-center shadow-md">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Title Section with Enhanced Typography */}
            <div className="text-center mb-6">
              <div className="inline-block mb-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full">
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Restricted Access</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 tracking-tight">
                You Don't Have Access
              </h2>
              <p className="text-gray-300 text-sm sm:text-base">
                Please enter the password to continue
              </p>
            </div>

            {/* Password Form with Enhanced Styling */}
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-xs font-bold text-gray-200 mb-2 uppercase tracking-wide">
                  Password
                </label>
                <div className="relative group">
                  {/* Input Glow Effect */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-lg opacity-0 group-hover:opacity-20 blur transition-opacity duration-300"></div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
                    </div>
                    <input
                      id="password"
                      type="password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="w-full pl-10 pr-3 py-3 border-2 border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all text-sm bg-white/10 backdrop-blur-sm text-white placeholder-gray-400 hover:bg-white/15 focus:bg-white/20"
                      placeholder="Enter your password"
                      autoFocus
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full relative group overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-500/50 transition-all shadow-xl hover:shadow-blue-500/50 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {/* Button Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <span className="relative flex items-center justify-center gap-2 text-base">
                  <Lock className="h-4 w-4" />
                  Unlock Access
                </span>
              </button>
            </form>

            {/* Footer Note with Enhanced Design */}
            <div className="mt-6 pt-4 border-t border-white/10">
              <div className="flex items-center justify-center gap-2">
                <div className="p-1 bg-green-500/20 rounded">
                  <ShieldCheck className="h-3.5 w-3.5 text-green-400" />
                </div>
                <p className="text-[10px] text-gray-400 font-medium">
                  Secure access required • Your data is protected
                </p>
              </div>
            </div>

            {/* Bottom Decorative Accent */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent rounded-full"></div>
          </div>
        </div>
      </div>
    )
  }

  // Main Content - Show only after authentication
  return (
    <div
      className="min-h-screen transition-colors duration-300"
        style={{
          backgroundImage: "url('https://image.s7.sfmc-content.com/lib/fe2a11717d640474741277/m/1/ccab749f-caa2-4e75-ab01-cd02ac8632e7.gif')",
          backgroundAttachment: "fixed",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
    >
      <header className="relative z-10 backdrop-blur-[5px] border-b transition-colors duration-300 bg-white/0 border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 pl-1 h-10 bg-gradient-to-br from-blue-600 to-red-600 rounded-lg flex items-center justify-center shadow-lg">
                  <img src="https://image.s10.sfmc-content.com/lib/fe2b1171706405797d1375/m/1/2fb6e6f2-244e-41a0-b20a-9049947429c9.png" width={30}></img>
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  MM Media
                </h1>
                <p className="text-sm -mt-1 text-gray-600">
                  Report & Campaign Management
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative">
        {!combinedData && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            <div
              className="absolute -left-28 top-10 h-80 w-80 rounded-full blur-3xl bg-blue-200/40"
            />
            <div
              className="absolute -right-28 top-24 h-80 w-80 rounded-full blur-3xl bg-violet-200/40"
            />
          </div>
        )}

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-0 py-10 sm:py-12">
          {/* When no data yet: hero + upload intro + FileUpload card */}
          {!combinedData ? (
            <div className="space-y-12 sm:space-y-16">
              {/* Hero */}
              <section
                className="p-4 sm:p-8 text-center"
              >
                <h1 className="mt-0 text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-balance">
                  Upload Campaign{" "}
                  <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                    Reports
                  </span>{" "}
                </h1>

                <p
                  className="mt-5 max-w-3xl mx-auto text-base sm:text-lg leading-relaxed text-slate-600"
                >
                  Upload multiple CSV files containing SUBID and REV columns.
                </p>

                {/* Feature points */}
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-6">
                  <div className="flex items-center gap-2 text-sm sm:text-base">
                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                    <span className="text-slate-700">Real‑time Analytics</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm sm:text-base">
                    <ShieldCheck className="h-5 w-5 text-blue-600" />
                    <span className="text-slate-700">Secure Processing</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm sm:text-base">
                    <Zap className="h-5 w-5 text-violet-600" />
                    <span className="text-slate-700">Instant Results</span>
                  </div>
                </div>
              </section>

              {/* Upload card wrapper; inner UI provided by existing FileUpload component (unchanged) */}
              <section>
                <div>
                  <FileUpload onFilesUploaded={handleFilesUploaded} />
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
                setUploadedFiles([])
                setCombinedData(null)
                setSearchQuery("")
                setHasTriggeredCelebration(false)
              }}
            />
          )}
        </div>
      </main>

      <CelebrationEffect isActive={showCelebration} onComplete={() => setShowCelebration(false)} />

      <footer className="mt-16">
        <div className="max-w-[260px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p
            className="text-center text-sm flex items-center justify-center text-slate-600 bg-white/50 backdrop-blur-sm rounded-lg p-1"
          >
            Made with <Heart className="h-4 w-4 mx-1 text-rose-500" fill="currentColor" aria-hidden="true" /> by <b className="ml-1">Chandu</b>
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
