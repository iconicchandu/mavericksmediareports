import React, { useState } from 'react';
import { Upload, Moon, Sun, BarChart3, PieChart, Download, FileText, Search, Heart } from 'lucide-react';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import CelebrationEffect from './components/CelebrationEffect';
import { ProcessedData } from './types';

interface UploadedFile {
  name: string;
  data: ProcessedData;
}

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [combinedData, setCombinedData] = useState<ProcessedData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);
  const [hasTriggeredCelebration, setHasTriggeredCelebration] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleFilesUploaded = (files: UploadedFile[]) => {
    setUploadedFiles(files);
    
    // Combine all data
    const combined: ProcessedData = {
      records: [],
      campaigns: new Set(),
      ets: new Set(),
      creatives: new Set(),
      advertisers: new Set()
    };

    files.forEach(file => {
      combined.records.push(...file.data.records);
      file.data.campaigns.forEach(c => combined.campaigns.add(c));
      file.data.ets.forEach(e => combined.ets.add(e));
      file.data.creatives.forEach(c => combined.creatives.add(c));
      file.data.advertisers.forEach(a => combined.advertisers.add(a));
    });

    setCombinedData(combined);
  };

  // Check if celebration should trigger
  React.useEffect(() => {
    if (combinedData && !hasTriggeredCelebration) {
      const totalRevenue = combinedData.records.reduce((sum, record) => sum + record.revenue, 0);
      if (totalRevenue >= 12000) {
        setShowCelebration(true);
        setHasTriggeredCelebration(true);
      }
    }
  }, [combinedData, hasTriggeredCelebration]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      <header className={`border-b transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img src="https://image.s7.sfmc-content.com/lib/fe2a11717d640474741277/m/1/cba326f4-9d7e-47fd-ae9f-18cde97694e3.png" width="30px"></img>
              <h1 className="text-2xl font-bold">MM Media</h1>
              <span className={`text-sm px-2 py-1 rounded-full ${
                isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
              }`}>
                Report & Campaign Management
              </span>
            </div>
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors duration-200 ${
                isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!combinedData ? (
          <FileUpload onFilesUploaded={handleFilesUploaded} isDarkMode={isDarkMode} />
        ) : (
          <Dashboard 
            data={combinedData} 
            uploadedFiles={uploadedFiles}
            isDarkMode={isDarkMode}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onReset={() => {
              setUploadedFiles([]);
              setCombinedData(null);
              setSearchQuery('');
              setHasTriggeredCelebration(false);
            }}
          />
        )}
      </main>

      <CelebrationEffect 
        isActive={showCelebration} 
        onComplete={() => setShowCelebration(false)} 
      />

      <footer className={`mt-16 border-t transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-end justify-center">
            <p className={`flex items-center text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Made with <Heart className="h-4 w-4 mx-1 text-red-500" fill="currentColor" /> by Chandu
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;