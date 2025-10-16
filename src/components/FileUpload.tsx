import React, { useState, useCallback } from 'react';
import { ProcessedData, DataRecord } from '../types';

import {
  Upload,
  FileText,
  X,
  AlertCircle,
  Sparkles,
  Database,
  Zap,
  BarChart3,
  Moon,
  Sun,
  TrendingUp,
  Target,
  Shield,
  Users,
  ArrowRight,
  Play,
  Heart,
  CheckCircle
} from 'lucide-react';


interface UploadedFile {
  name: string;
  data: ProcessedData;
}

interface FileUploadProps {
  onFilesUploaded: (files: UploadedFile[]) => void;
  isDarkMode: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesUploaded, isDarkMode }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files).filter(file =>
      file.type === 'text/csv' || file.name.endsWith('.csv')
    );

    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
    } else {
      setError('Please select only CSV files');
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const determineAdvertiser = (fileName: string, campaign: string): string => {
    const upperFileName = fileName.toUpperCase();

    if (upperFileName.includes('XC CAMPS')) {
      return 'XC';
    } else if (upperFileName.includes('NON COMCAST')) {
      return 'NON COMCAST';
    } else if (upperFileName.includes('COMCAST')) {
      return 'COMCAST';
    } else if (upperFileName.includes('BRANDED')) {
      return 'Branded';
    } else if (upperFileName.includes('GZ')) {
      return 'GZ';
    } else if (upperFileName.includes('ES') || campaign.toUpperCase().includes('ES')) {
      return 'ES';
    } else if (campaign === 'RGR' || campaign === 'RAH') {
      return 'RGR';
    } else {
      return 'Other';
    }
  };

  const parseCSV = async (file: File): Promise<ProcessedData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter(line => line.trim());
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

          const subidIndex = headers.findIndex(h => h.includes('subid'));
          const revIndex = headers.findIndex(h => h.includes('rev'));

          if (subidIndex === -1 || revIndex === -1) {
            reject(new Error(`Invalid CSV format in ${file.name}. Required columns: SUBID, REV`));
            return;
          }

          const records: DataRecord[] = [];
          const campaigns = new Set<string>();
          const ets = new Set<string>();
          const creatives = new Set<string>();
          const advertisers = new Set<string>();

          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            if (values.length < Math.max(subidIndex, revIndex) + 1) continue;

            const subid = values[subidIndex];
            const revenue = parseFloat(values[revIndex]) || 0;

            if (!subid || revenue === 0) continue;

            // Parse SUBID format: Campaign_Creative_ET
            const parts = subid.split('_');
            let campaign = '', creative = '', et = '';

            if (parts.length >= 3) {
              campaign = parts[0];
              et = parts[parts.length - 1];
              creative = parts.slice(0, -1).join('_');
            } else if (parts.length === 2) {
              campaign = parts[0];
              creative = parts[0];
              et = parts[1];
            } else {
              campaign = subid;
              creative = subid;
              et = subid;
            }

            // Handle special cases
            if (campaign === 'RAH') {
              campaign = 'RGR';
            }

            const advertiser = determineAdvertiser(file.name, campaign);

            const record: DataRecord = {
              subid,
              revenue,
              campaign,
              creative,
              et,
              advertiser,
              fileName: file.name
            };

            records.push(record);
            campaigns.add(campaign);
            ets.add(et);
            creatives.add(creative);
            advertisers.add(advertiser);
          }

          resolve({
            records,
            campaigns,
            ets,
            creatives,
            advertisers
          });
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
      reader.readAsText(file);
    });
  };

  const processFiles = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      const processedFiles: UploadedFile[] = [];

      for (const file of selectedFiles) {
        const data = await parseCSV(file);
        processedFiles.push({
          name: file.name,
          data
        });
      }

      onFilesUploaded(processedFiles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process files');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative mb-8">
      <div
        className={`group relative overflow-hidden border-2 border-dashed rounded-3xl p-16 text-center transition-all duration-500 cursor-pointer backdrop-blur-sm ${dragActive
          ? 'border-blue-500 bg-gradient-to-br from-blue-50/90 to-red-50/90 dark:from-blue-900/30 dark:to-red-900/30 scale-[1.02] shadow-2xl'
          : isDarkMode
            ? 'border-gray-600/50 bg-gradient-to-br from-gray-800/80 to-gray-900/80 hover:border-blue-400/50 hover:bg-gray-800/90 hover:shadow-2xl'
            : 'border-gray-300/50 bg-gradient-to-br from-white/90 to-gray-50/90 hover:border-blue-400/50 hover:shadow-2xl hover:scale-[1.01]'
          }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-8 left-8 w-12 h-12 bg-blue-400 rounded-full animate-pulse blur-sm"></div>
          <div className="absolute top-12 right-12 w-8 h-8 bg-red-400 rounded-full animate-pulse delay-1000 blur-sm"></div>
          <div className="absolute bottom-8 left-1/3 w-6 h-6 bg-emerald-400 rounded-full animate-pulse delay-2000 blur-sm"></div>
          <div className="absolute bottom-8 right-1/4 w-10 h-10 bg-orange-400 rounded-full animate-pulse delay-3000 blur-sm"></div>
          <div className="absolute top-1/2 left-1/4 w-4 h-4 bg-purple-400 rounded-full animate-pulse delay-500 blur-sm"></div>
          <div className="absolute top-1/3 right-1/3 w-7 h-7 bg-pink-400 rounded-full animate-pulse delay-1500 blur-sm"></div>
        </div>

        <div className="relative z-10">
          <div className={`w-24 h-24 mx-auto mb-8 rounded-3xl flex items-center justify-center transition-all duration-500 ${dragActive
            ? 'bg-gradient-to-br from-blue-500 to-red-600 scale-110 shadow-2xl'
            : isDarkMode
              ? 'bg-gradient-to-br from-gray-700/80 to-gray-600/80 group-hover:from-blue-600 group-hover:to-red-600 shadow-xl'
              : 'bg-gradient-to-br from-gray-200/80 to-gray-300/80 group-hover:from-blue-500 group-hover:to-red-600 shadow-xl'
            }`}>
            <Upload className={`w-12 h-12 transition-all duration-500 ${dragActive || isDarkMode ? 'text-white' : 'text-gray-600 group-hover:text-white'
              }`} />
          </div>

          <h3 className={`text-3xl font-bold mb-4 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
            Drop your CSV files here
          </h3>

          <p className={`text-xl mb-8 transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
            or <span className="text-blue-600 dark:text-blue-400 font-semibold">click to browse</span> from your device
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <div className={`group flex items-center space-x-3 px-6 py-3 rounded-2xl border backdrop-blur-sm transition-all duration-300 hover:scale-105 ${isDarkMode
              ? 'bg-gray-800/80 border-gray-600/50 text-gray-300 hover:bg-gray-700/80'
              : 'bg-white/80 border-gray-200/50 text-gray-700 hover:bg-gray-50/80'
              }`}>
              <Database className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform duration-300" />
              <span className="text-sm font-semibold">CSV Format</span>
            </div>
            <div className={`group flex items-center space-x-3 px-6 py-3 rounded-2xl border backdrop-blur-sm transition-all duration-300 hover:scale-105 ${isDarkMode
              ? 'bg-gray-800/80 border-gray-600/50 text-gray-300 hover:bg-gray-700/80'
              : 'bg-white/80 border-gray-200/50 text-gray-700 hover:bg-gray-50/80'
              }`}>
              <Zap className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform duration-300" />
              <span className="text-sm font-semibold">Multiple Files</span>
            </div>
            <div className={`group flex items-center space-x-3 px-6 py-3 rounded-2xl border backdrop-blur-sm transition-all duration-300 hover:scale-105 ${isDarkMode
              ? 'bg-gray-800/80 border-gray-600/50 text-gray-300 hover:bg-gray-700/80'
              : 'bg-white/80 border-gray-200/50 text-gray-700 hover:bg-gray-50/80'
              }`}>
              <Sparkles className="w-5 h-5 text-red-500 group-hover:scale-110 transition-transform duration-300" />
              <span className="text-sm font-semibold">Auto-Processing</span>
            </div>
          </div>

          <div className={`text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Required columns: <span className="font-mono font-bold text-blue-600 dark:text-blue-400">SUBID</span> and <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">REV</span>
          </div>
        </div>

        <input
          type="file"
          multiple
          accept=".csv"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
        />
    </div>

      {/* Error Message */ }
  {
    error && (
      <div className={`mb-8 p-6 rounded-2xl border-l-4 border-red-500 transition-all duration-300 ${isDarkMode
        ? 'bg-gradient-to-r from-red-900/20 to-red-800/10 border-red-800 backdrop-blur-sm'
        : 'bg-gradient-to-r from-red-50 to-red-25 border-red-200 shadow-lg'
        }`}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <AlertCircle className="h-6 w-6 text-red-500 mt-0.5" />
          </div>
          <div>
            <h4 className={`font-semibold mb-1 ${isDarkMode ? 'text-red-300' : 'text-red-800'}`}>
              Upload Error
            </h4>
            <p className={`${isDarkMode ? 'text-red-200' : 'text-red-700'}`}>
              {error}
            </p>
          </div>
        </div>
      </div>
    )
  }

  {
    selectedFiles.length > 0 && (
      <div className={`mt-8 rounded-3xl p-10 transition-all duration-500 backdrop-blur-sm ${isDarkMode
        ? 'bg-gradient-to-br from-gray-800/90 to-gray-900/90 border border-gray-700/50 shadow-2xl'
        : 'bg-gradient-to-br from-white/95 to-gray-50/95 border border-gray-200/50 shadow-2xl'
        }`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl">
          <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl opacity-20 ${isDarkMode ? 'bg-blue-500' : 'bg-blue-300'}`}></div>
          <div className={`absolute bottom-0 left-0 w-24 h-24 rounded-full blur-2xl opacity-20 ${isDarkMode ? 'bg-green-500' : 'bg-green-300'}`}></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-red-600 rounded-2xl flex items-center justify-center shadow-xl">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Selected Files
                </h3>
                <p className={`text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} ready for processing
                </p>
              </div>
            </div>

            <div className={`px-4 py-2 rounded-2xl text-sm font-semibold backdrop-blur-sm border ${isDarkMode
              ? 'bg-blue-900/50 text-blue-300 border-blue-700/50'
              : 'bg-blue-100/80 text-blue-800 border-blue-200/50'
              }`}>
              {selectedFiles.length} files
            </div>
          </div>

          <div className="flex justify-center flex-wrap gap-4 mb-10">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className={`group relative overflow-hidden rounded-2xl border backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${isDarkMode
                  ? 'bg-gradient-to-br from-gray-800/80 to-gray-900/80 border-gray-700/50 hover:border-gray-600/50'
                  : 'bg-gradient-to-br from-white/90 to-gray-50/90 border-gray-200/50 hover:border-gray-300/50'
                  }`}
              >
                {/* Background Pattern */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
                  <div className={`absolute top-0 right-0 w-16 h-16 rounded-full blur-xl opacity-20 ${isDarkMode ? 'bg-blue-500' : 'bg-blue-300'}`}></div>
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${isDarkMode
                        ? 'bg-gradient-to-br from-blue-600/30 to-red-600/30 group-hover:from-blue-600/40 group-hover:to-red-600/40'
                        : 'bg-gradient-to-br from-blue-100/80 to-red-100/80 group-hover:from-blue-200/80 group-hover:to-red-200/80'
                        }`}>
                        <FileText className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className={`font-bold text-lg truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {file.name}
                        </h4>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {(file.size / 1024).toFixed(1)} KB
                          </span>
                          <span className={`text-xs px-3 py-1 rounded-xl font-semibold ${isDarkMode
                            ? 'bg-emerald-900/30 text-emerald-300 border border-emerald-700/50'
                            : 'bg-emerald-100/80 text-emerald-700 border border-emerald-200/50'
                            }`}>
                            CSV
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => removeFile(index)}
                      className={`cursor-pointer z-40 p-3 rounded-2xl transition-all duration-300 ${isDarkMode
                        ? 'text-gray-400 hover:text-red-400 hover:bg-red-900/20'
                        : 'text-gray-400 hover:text-red-500 hover:bg-red-50/50'
                        }`}
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Process Button */}
          <div className="text-center">
            <button
              onClick={processFiles}
              disabled={uploading}
              className={`group relative inline-flex items-center px-10 py-5 rounded-3xl font-bold text-xl transition-all duration-300 ${uploading
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : 'bg-gradient-to-r from-blue-600 to-red-600 hover:from-blue-700 hover:to-red-700 text-white shadow-2xl hover:shadow-3xl hover:scale-105 active:scale-95'
                }`}
            >
              {uploading ? (
                <>
                  <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin mr-4"></div>
                  <span className="text-lg">Processing Files...</span>
                </>
              ) : (
                <>
                  <Zap className="w-6 h-6 mr-4 group-hover:rotate-12 transition-transform duration-300" />
                  <span>Process {selectedFiles.length} File{selectedFiles.length > 1 ? 's' : ''}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </>
              )}
            </button>

            <p className={`mt-6 text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Files are processed locally in your browser for maximum security
            </p>
          </div>
        </div>
      </div>
    )
  }
    </div>
  );
};

export default FileUpload;