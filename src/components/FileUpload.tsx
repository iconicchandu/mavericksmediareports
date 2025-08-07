import React, { useState, useCallback } from 'react';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';
import { ProcessedData, DataRecord } from '../types';

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
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">Upload Campaign Reports</h2>
        <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Upload multiple CSV files containing SUBID and REV columns to generate comprehensive campaign analytics
        </p>
      </div>

      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
          dragActive
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
            : isDarkMode
            ? 'border-gray-600 hover:border-gray-500'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className={`mx-auto h-12 w-12 mb-4 ${
          dragActive ? 'text-blue-500' : isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`} />
        <p className="text-xl font-medium mb-2">
          Drop CSV files here or click to browse
        </p>
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Supports multiple CSV files with SUBID and REV columns
        </p>
        <input
          type="file"
          multiple
          accept=".csv"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>

      {error && (
        <div className={`mt-4 p-4 rounded-lg border ${
          isDarkMode ? 'bg-red-900/20 border-red-800 text-red-300' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-4">Selected Files ({selectedFiles.length})</h3>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-center">
                  <FileText className="h-5 w-5 mr-3 text-blue-500" />
                  <span className="font-medium">{file.name}</span>
                  <span className={`ml-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className={`p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                    isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={processFiles}
            disabled={uploading}
            className={`mt-6 w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              uploading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {uploading ? 'Processing Files...' : `Process ${selectedFiles.length} File${selectedFiles.length > 1 ? 's' : ''}`}
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;