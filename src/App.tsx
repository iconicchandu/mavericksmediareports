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
      className={`min-h-screen transition-colors duration-300 ${isDarkMode ? "bg-gray-950 text-white" : "bg-url('https://image.s7.sfmc-content.com/lib/fe2a11717d640474741277/m/1/17568be6-1b27-4f9f-92d8-8248b1c3992c.jpg')"
        }`}
        style={{
          backgroundImage: "url('https://image.s7.sfmc-content.com/lib/fe2a11717d640474741277/m/1/17568be6-1b27-4f9f-92d8-8248b1c3992c.jpg')",
          backgroundSize: "100%",
          backgroundPosition: "top center",
          backgroundRepeat: "repeat",
        }}
    >
      <header className={`relative z-10 backdrop-blur-[5px] border-b transition-colors duration-300 ${isDarkMode
        ? 'bg-gray-900/80 border-gray-800/50'
        : 'bg-white/0 border-gray-200/50'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 pl-1 h-10 bg-gradient-to-br from-blue-600 to-red-600 rounded-lg flex items-center justify-center shadow-lg">
                  <img src="https://image.s10.sfmc-content.com/lib/fe2b1171706405797d1375/m/1/2fb6e6f2-244e-41a0-b20a-9049947429c9.png" width={30}></img>
                </div>
              </div>
              <div>
                <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  MM Media
                </h1>
                <p className={`text-sm -mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Report & Campaign Management
                </p>
              </div>
            </div>

            {/* <nav className="hidden md:flex items-center space-x-8">
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-colors bg-gray-200 ${isDarkMode ? 'bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </nav> */}
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
              <section
                className={` ${isDarkMode ? "" : ""} p-4 sm:p-8 text-center`}
              >
                <h1 className="mt-0 text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-balance">
                  Upload Campaign{" "}
                  <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                    Reports
                  </span>{" "}
                </h1>

                <p
                  className={`mt-5 max-w-3xl mx-auto text-base sm:text-lg leading-relaxed ${isDarkMode ? "text-gray-400" : "text-slate-600"
                    }`}
                >
                  Upload multiple CSV files containing SUBID and REV columns.
                </p>

                {/* Feature points */}
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-6">
                  <div className="flex items-center gap-2 text-sm sm:text-base">
                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                    <span className={isDarkMode ? "text-gray-300" : "text-slate-700"}>Real‑time Analytics</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm sm:text-base">
                    <ShieldCheck className="h-5 w-5 text-blue-600" />
                    <span className={isDarkMode ? "text-gray-300" : "text-slate-700"}>Secure Processing</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm sm:text-base">
                    <Zap className="h-5 w-5 text-violet-600" />
                    <span className={isDarkMode ? "text-gray-300" : "text-slate-700"}>Instant Results</span>
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

      <footer className={`mt-16`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p
            className={`text-center text-sm flex items-center justify-center ${isDarkMode ? "text-gray-400" : "text-slate-600"
              }`}
          >
            Made with <Heart className="h-4 w-4 mx-1 text-rose-500" fill="currentColor" aria-hidden="true" /> by <b className="ml-1">Chandu</b>
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
