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
        className={`group relative overflow-hidden border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-500 cursor-pointer ${dragActive
          ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-red-50 dark:from-blue-900/20 dark:to-red-900/20 scale-[1.02] shadow-2xl'
          : isDarkMode
            ? 'border-gray-600 bg-gray-800/50 hover:border-blue-400 hover:bg-gray-800/70 hover:shadow-xl'
            : 'border-gray-300 bg-gradient-to-br from-gray-50 to-white hover:border-blue-400 hover:shadow-xl hover:scale-[1.01]'
          }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-4 left-4 w-8 h-8 bg-blue-400 rounded-full animate-pulse"></div>
          <div className="absolute top-8 right-8 w-6 h-6 bg-red-400 rounded-full animate-pulse delay-1000"></div>
          <div className="absolute bottom-6 left-1/3 w-4 h-4 bg-emerald-400 rounded-full animate-pulse delay-2000"></div>
          <div className="absolute bottom-4 right-1/4 w-5 h-5 bg-orange-400 rounded-full animate-pulse delay-3000"></div>
        </div>

        <div className="relative z-10">
          <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center transition-all duration-500 ${dragActive
            ? 'bg-gradient-to-br from-blue-500 to-red-600 scale-110 shadow-lg'
            : isDarkMode
              ? 'bg-gradient-to-br from-gray-700 to-gray-600 group-hover:from-blue-600 group-hover:to-red-600'
              : 'bg-gradient-to-br from-gray-200 to-gray-300 group-hover:from-blue-500 group-hover:to-red-600'
            }`}>
            <Upload className={`w-10 h-10 transition-all duration-500 ${dragActive || isDarkMode ? 'text-white' : 'text-gray-600 group-hover:text-white'
              }`} />
          </div>

          <h3 className={`text-2xl font-bold mb-3 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
            Drop your CSV files here
          </h3>

          <p className={`text-lg mb-6 transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
            or <span className="text-blue-600 dark:text-blue-400 font-semibold">click to browse</span> from your device
          </p>

          <div className="flex flex-wrap justify-center gap-3 mb-6">
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-full border transition-all duration-300 ${isDarkMode
              ? 'bg-gray-800/80 border-gray-600 text-gray-300'
              : 'bg-white/80 border-gray-200 text-gray-700'
              }`}>
              <Database className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium">CSV Format</span>
            </div>
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-full border transition-all duration-300 ${isDarkMode
              ? 'bg-gray-800/80 border-gray-600 text-gray-300'
              : 'bg-white/80 border-gray-200 text-gray-700'
              }`}>
              <Zap className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium">Multiple Files</span>
            </div>
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-full border transition-all duration-300 ${isDarkMode
              ? 'bg-gray-800/80 border-gray-600 text-gray-300'
              : 'bg-white/80 border-gray-200 text-gray-700'
              }`}>
              <Sparkles className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium">Auto-Processing</span>
            </div>
          </div>

          <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Required columns: <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">SUBID</span> and <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">REV</span>
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
      <div className={`mt-4 rounded-3xl p-8 transition-all duration-500 ${isDarkMode
        ? 'bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-700/50'
        : 'bg-gradient-to-br from-white to-gray-50/80 backdrop-blur-sm border border-gray-200/50 shadow-xl'
        }`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-red-600 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Selected Files
              </h3>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} ready for processing
              </p>
            </div>
          </div>

          <div className={`px-3 py-1 rounded-full text-sm font-medium ${isDarkMode
            ? 'bg-blue-900/50 text-blue-300 border border-blue-700/50'
            : 'bg-blue-100 text-blue-800 border border-blue-200'
            }`}>
            {selectedFiles.length} files
          </div>
        </div>

        <div className="flex justify-center flex-wrap gap-2 mb-8">
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${isDarkMode
                ? 'bg-gray-800/60 border-gray-700/50 hover:border-gray-600'
                : 'bg-white/80 border-gray-200/80 hover:border-gray-300 hover:shadow-xl'
                }`}
            >
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${isDarkMode
                    ? 'bg-gradient-to-br from-blue-600/20 to-red-600/20 group-hover:from-blue-600/30 group-hover:to-red-600/30'
                    : 'bg-gradient-to-br from-blue-100 to-red-100 group-hover:from-blue-200 group-hover:to-red-200'
                    }`}>
                    <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className={`font-semibold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {file.name}
                    </h4>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${isDarkMode
                        ? 'bg-emerald-900/30 text-emerald-300 border border-emerald-700/50'
                        : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}>
                        CSV
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => removeFile(index)}
                  className={`cursor-pointer z-40 p-2 rounded-xl transition-all duration-300 ${isDarkMode
                    ? 'text-gray-400 hover:text-red-400 hover:bg-red-900/20'
                    : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                    }`}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Subtle gradient overlay */}
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${isDarkMode
                ? 'bg-gradient-to-r from-blue-900/10 to-red-900/10'
                : 'bg-gradient-to-r from-blue-50/50 to-red-50/50'
                }`}></div>
            </div>
          ))}
        </div>

        {/* Process Button */}
        <div className="text-center">
          <button
            onClick={processFiles}
            disabled={uploading}
            className={`group relative inline-flex items-center px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 ${uploading
              ? 'bg-gray-400 cursor-not-allowed text-white'
              : 'bg-gradient-to-r from-blue-600 to-red-600 hover:from-blue-700 hover:to-red-700 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95'
              }`}
          >
            {uploading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                Processing Files...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform duration-300" />
                Process {selectedFiles.length} File{selectedFiles.length > 1 ? 's' : ''}
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </>
            )}
          </button>

          <p className={`mt-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Files are processed locally in your browser for maximum security
          </p>
        </div>
      </div>
    )
  }
    </div>
  );
};

export default FileUpload;