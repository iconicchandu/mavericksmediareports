"use client"

import React, { useState } from "react"
import { Moon, Sun, BarChart3, Heart, Sparkles, TrendingUp, ShieldCheck, Zap, Image } from "lucide-react"
import FileUpload from "./components/FileUpload"
import Dashboard from "./components/Dashboard"
import CelebrationEffect from "./components/CelebrationEffect"
import type { ProcessedData } from "./types"

interface UploadedFile {
  name: string
  data: ProcessedData
}

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [combinedData, setCombinedData] = useState<ProcessedData | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showCelebration, setShowCelebration] = useState(false)
  const [hasTriggeredCelebration, setHasTriggeredCelebration] = useState(false)

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
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
      if (totalRevenue >= 12000) {
        setShowCelebration(true)
        setHasTriggeredCelebration(true)
      }
    }
  }, [combinedData, hasTriggeredCelebration])

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${isDarkMode ? "bg-gray-950 text-white" : "bg-gradient-to-br from-orange-50 to-fuchsia-100 text-slate-900"
        }`}
    >
      <header className={`relative z-10 backdrop-blur-xl border-b transition-all duration-500 ${isDarkMode
                    ? 'bg-gray-900/90 border-gray-700/50 shadow-2xl shadow-gray-900/20'
                    : 'bg-white/95 border-gray-200/50 shadow-2xl shadow-gray-900/10'
                }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center space-x-4">
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-red-600 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <div className="relative w-14 h-14 bg-gradient-to-br from-blue-600 to-red-600 rounded-2xl flex items-center justify-center shadow-xl transform group-hover:scale-105 transition-transform duration-300">
                                   <img src="https://image.s10.sfmc-content.com/lib/fe2b1171706405797d1375/m/1/2fb6e6f2-244e-41a0-b20a-9049947429c9.png" width={36} className="drop-shadow-lg"></img>
                                </div>
                            </div>
                            <div>
                                <h1 className={`text-2xl font-bold bg-gradient-to-r from-blue-600 to-red-600 bg-clip-text text-transparent ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    MM Media
                                </h1>
                                <p className={`text-sm -mt-1 font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                    Advanced Campaign Analytics Platform
                                </p>
                            </div>
                        </div>

                        <nav className="hidden md:flex items-center space-x-6">
                            <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl ${isDarkMode 
                                ? 'bg-gray-800/50 text-gray-300' 
                                : 'bg-gray-100/50 text-gray-700'
                            }`}>
                                <BarChart3 className="w-4 h-4" />
                                <span className="text-sm font-medium">Analytics</span>
                            </div>
                            <button
                                onClick={toggleTheme}
                                className={`group relative p-3 rounded-xl transition-all duration-300 ${isDarkMode 
                                    ? 'bg-gray-800/50 text-gray-300 hover:text-white hover:bg-gray-700/50 hover:shadow-lg hover:shadow-gray-900/20' 
                                    : 'bg-gray-100/50 text-gray-600 hover:text-gray-900 hover:bg-gray-200/50 hover:shadow-lg hover:shadow-gray-900/10'
                                }`}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <div className="relative">
                                    {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                                </div>
                            </button>
                        </nav>
                    </div>
                </div>
            </header>

      <main className="relative">
        {!combinedData && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            <div
              className={`absolute -left-28 top-10 h-80 w-80 rounded-full blur-3xl ${isDarkMode ? "bg-blue-900/20" : "bg-blue-200/40"
                }`}
            />
            <div
              className={`absolute -right-28 top-24 h-80 w-80 rounded-full blur-3xl ${isDarkMode ? "bg-violet-900/20" : "bg-violet-200/40"
                }`}
            />
          </div>
        )}

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          {/* When no data yet: hero + upload intro + FileUpload card */}
          {!combinedData ? (
            <div className="space-y-12 sm:space-y-16">
              {/* Hero */}
              <section className="relative p-4 sm:p-8 text-center">
                {/* Background Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className={`absolute top-1/4 left-1/4 w-72 h-72 rounded-full blur-3xl opacity-20 ${isDarkMode ? 'bg-blue-500' : 'bg-blue-300'}`}></div>
                  <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-20 ${isDarkMode ? 'bg-purple-500' : 'bg-purple-300'}`}></div>
                </div>

                <div className="relative z-10">
                  <div className={`inline-flex items-center px-6 py-3 rounded-2xl text-sm font-semibold mb-8 backdrop-blur-sm border transition-all duration-300 ${isDarkMode
                    ? 'bg-gradient-to-r from-blue-900/30 to-purple-900/30 text-blue-300 border-blue-700/50 shadow-lg shadow-blue-900/20'
                    : 'bg-gradient-to-r from-blue-100/80 to-purple-100/80 text-blue-800 border-blue-200/50 shadow-lg shadow-blue-900/10'
                    }`}>
                    <Zap className="w-5 h-5 mr-2" />
                    Advanced Campaign Analytics
                  </div>

                  <h1 className="mt-6 text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-balance">
                    Upload Campaign{" "}
                    <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-red-600 bg-clip-text text-transparent animate-pulse">
                      Reports
                    </span>{" "}
                  </h1>

                  <p
                    className={`mt-6 max-w-4xl mx-auto text-lg sm:text-xl leading-relaxed font-medium ${isDarkMode ? "text-gray-300" : "text-slate-600"
                      }`}
                  >
                    Transform your campaign data into actionable insights with our powerful analytics platform. 
                    Upload multiple CSV files and get comprehensive performance metrics in real-time.
                  </p>

                  {/* Feature points */}
                  <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-8">
                    <div className={`group flex items-center gap-3 px-6 py-3 rounded-2xl backdrop-blur-sm border transition-all duration-300 ${isDarkMode 
                      ? 'bg-emerald-900/20 text-emerald-300 border-emerald-700/50 hover:bg-emerald-900/30 hover:shadow-lg hover:shadow-emerald-900/20' 
                      : 'bg-emerald-100/80 text-emerald-700 border-emerald-200/50 hover:bg-emerald-200/80 hover:shadow-lg hover:shadow-emerald-900/10'
                    }`}>
                      <TrendingUp className="h-6 w-6 text-emerald-500 group-hover:scale-110 transition-transform duration-300" />
                      <span className="font-semibold">Real‑time Analytics</span>
                    </div>
                    <div className={`group flex items-center gap-3 px-6 py-3 rounded-2xl backdrop-blur-sm border transition-all duration-300 ${isDarkMode 
                      ? 'bg-blue-900/20 text-blue-300 border-blue-700/50 hover:bg-blue-900/30 hover:shadow-lg hover:shadow-blue-900/20' 
                      : 'bg-blue-100/80 text-blue-700 border-blue-200/50 hover:bg-blue-200/80 hover:shadow-lg hover:shadow-blue-900/10'
                    }`}>
                      <ShieldCheck className="h-6 w-6 text-blue-500 group-hover:scale-110 transition-transform duration-300" />
                      <span className="font-semibold">Secure Processing</span>
                    </div>
                    <div className={`group flex items-center gap-3 px-6 py-3 rounded-2xl backdrop-blur-sm border transition-all duration-300 ${isDarkMode 
                      ? 'bg-purple-900/20 text-purple-300 border-purple-700/50 hover:bg-purple-900/30 hover:shadow-lg hover:shadow-purple-900/20' 
                      : 'bg-purple-100/80 text-purple-700 border-purple-200/50 hover:bg-purple-200/80 hover:shadow-lg hover:shadow-purple-900/10'
                    }`}>
                      <Zap className="h-6 w-6 text-purple-500 group-hover:scale-110 transition-transform duration-300" />
                      <span className="font-semibold">Instant Results</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Upload card wrapper; inner UI provided by existing FileUpload component (unchanged) */}
              <section>
                <div>
                  <FileUpload onFilesUploaded={handleFilesUploaded} isDarkMode={isDarkMode} />
                </div>
              </section>
            </div>
          ) : (
            <Dashboard
              data={combinedData}
              uploadedFiles={uploadedFiles}
              isDarkMode={isDarkMode}
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

      <footer className={`mt-20 relative border-t backdrop-blur-xl ${isDarkMode 
        ? "bg-gray-900/90 border-gray-700/50 shadow-2xl shadow-gray-900/20" 
        : "bg-white/95 border-slate-200/50 shadow-2xl shadow-gray-900/10"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-red-600 rounded-lg flex items-center justify-center">
                <img src="https://image.s10.sfmc-content.com/lib/fe2b1171706405797d1375/m/1/2fb6e6f2-244e-41a0-b20a-9049947429c9.png" width={20} className="drop-shadow-sm"></img>
              </div>
              <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>MM Media</span>
            </div>
            <p
              className={`text-center text-sm flex items-center justify-center ${isDarkMode ? "text-gray-400" : "text-slate-600"
                }`}
            >
              Made with <Heart className="h-4 w-4 mx-1 text-rose-500 animate-pulse" fill="currentColor" aria-hidden="true" /> by <b className="ml-1 bg-gradient-to-r from-blue-600 to-red-600 bg-clip-text text-transparent">Chandu</b>
            </p>
            <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              © 2025 MM Media Analytics Platform. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
