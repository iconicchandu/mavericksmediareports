import React, { useState, useCallback } from 'react';
import { ProcessedData, DataRecord } from '../types';

import {
  FileText,
  X,
  AlertCircle,
  ArrowUpRight,
  ShieldCheck,
  Database,
  Zap,
} from 'lucide-react';


interface UploadedFile {
  name: string;
  data: ProcessedData;
}

interface FileUploadProps {
  onFilesUploaded: (files: UploadedFile[]) => void;
  onQueueChange?: (hasFiles: boolean) => void;
}



// ─── Main Component ─────────────────────────────────────────────────────────────
const FileUpload: React.FC<FileUploadProps> = ({ onFilesUploaded, onQueueChange }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    onQueueChange?.(selectedFiles.length > 0);
  }, [selectedFiles, onQueueChange]);

  // ── Drag handlers ──
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files).filter(
      f => f.type === 'text/csv' || f.name.endsWith('.csv')
    );
    if (files.length > 0) {
      setError(null);
      setSelectedFiles(prev => {
        const names = new Set(prev.map(f => f.name));
        return [...prev, ...files.filter(f => !names.has(f.name))];
      });
    } else {
      setError('Please drop only CSV files.');
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setError(null);
    setSelectedFiles(prev => {
      const names = new Set(prev.map(f => f.name));
      return [...prev, ...files.filter(f => !names.has(f.name))];
    });
  };

  const removeFile = (index: number) =>
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));

  // ── CSV parsing (unchanged logic) ──
  const determineAdvertiser = (fileName: string, campaign: string, creative: string): string => {
    const uF = fileName.toUpperCase();
    const uCa = campaign.toUpperCase();
    const uCr = creative.toUpperCase();
    if (uF.includes('CM AD') || uF.includes('CMAD')) return 'CMAD';
    if (uCr.includes('_MI')) return 'MI';
    if (uF.includes('DB')) return 'DB';
    if (uF.includes('XC EXC') || uF.includes('XCE')) return 'XCE';
    if (uF.includes('XC CAMPS') || uF.includes('XC')) return 'XC';
    if (uF.includes('NON COMCAST')) return 'NON COMCAST';
    if (uF.includes('COMCAST')) return 'COMCAST';
    if (uF.includes('BRANDED')) return 'Branded';
    if (uF.includes('GZ')) return 'GZ';
    if (uF.includes('RGR')) return uCr.startsWith('ICO') ? 'ICO' : 'RGR';
    if (uF.includes('ES') || uCa.includes('ES')) return 'ES';
    if (uCa === 'RGR' || uCa === 'RAH') return uCr.startsWith('ICO') ? 'ICO' : 'RGR';
    return 'Other';
  };

  const parenEtNumberToETName = (num: string | number): string => {
    const s = num.toString();
    if (s === '30') return 'JSG30PM';
    if (s === '24') return 'P24';
    if (/^\d+[A-Z]+$/i.test(s)) return 'JSG' + s.toUpperCase();
    return 'JSG' + s;
  };

  const parseParenEtSubid = (subid: string) => {
    const m = subid.trim().match(/^([^/]+)\/([^/]+)\/(.+?)\(([^)]+)\)\s*$/i);
    if (!m) return null;
    const [, adv, camp, creativeSuffix, numStr] = m;
    return {
      advertiser: adv.trim(),
      campaign: camp.trim(),
      creative: camp.trim() + '/' + creativeSuffix.trim(),
      et: parenEtNumberToETName(numStr),
    };
  };

  const parseCSV = async (file: File): Promise<ProcessedData> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter(l => l.trim());
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
          const subidIndex = headers.findIndex(h => h.includes('subid'));
          const revIndex = headers.findIndex(h => h.includes('rev'));
          const convIndex = headers.findIndex(h => h.includes('conv'));
          if (subidIndex === -1 || revIndex === -1)
            return reject(new Error(`Invalid CSV format in ${file.name}. Required: SUBID, REV`));

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
            let conv: number | undefined;
            if (convIndex !== -1 && values.length > convIndex && values[convIndex].trim() !== '') {
              const p = parseFloat(values[convIndex]);
              conv = isNaN(p) ? undefined : p;
            }
            if (!subid || revenue === 0) continue;

            let campaign = '', creative = '', et = '', advertiser: string;
            const paren = parseParenEtSubid(subid);
            if (paren) {
              ({ advertiser, campaign, creative, et } = paren);
            } else if (subid.includes('/')) {
              const parts = subid.split('/').filter(p => p.trim());
              if (parts.length >= 2) {
                campaign = parts[0].trim();
                et = parts[parts.length - 1].trim();
                creative = parts.slice(0, -1).join('/').trim();
              } else {
                campaign = creative = et = (parts[0] || subid).trim();
              }
              if (campaign === 'RAH') campaign = 'RGR';
              advertiser = determineAdvertiser(file.name, campaign, creative);
            } else {
              const parts = subid.split('_');
              if (parts.length >= 3) { campaign = parts[0]; et = parts[parts.length - 1]; creative = parts.slice(0, -1).join('_'); }
              else if (parts.length === 2) { campaign = creative = parts[0]; et = parts[1]; }
              else { campaign = creative = et = subid; }
              if (campaign === 'RAH') campaign = 'RGR';
              advertiser = determineAdvertiser(file.name, campaign, creative);
            }

            records.push({ subid, revenue, campaign, creative, et, advertiser, fileName: file.name, conv });
            campaigns.add(campaign); ets.add(et); creatives.add(creative); advertisers.add(advertiser);
          }
          resolve({ records, campaigns, ets, creatives, advertisers });
        } catch (err) { reject(err); }
      };
      reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
      reader.readAsText(file);
    });

  const processFiles = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setError(null);
    setUploadProgress(0);
    try {
      const result: UploadedFile[] = [];
      for (let i = 0; i < selectedFiles.length; i++) {
        const data = await parseCSV(selectedFiles[i]);
        result.push({ name: selectedFiles[i].name, data });
        setUploadProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
      }
      setTimeout(() => {
        onFilesUploaded(result);
      }, 600);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process files');
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes: number) =>
    bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(1)} KB`
      : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

  return (
    <div className="w-full sm:w-[480px] bg-white rounded-[1.5rem] border border-slate-200 shadow-[0_8px_30px_rgba(15,23,42,0.03)] p-6 space-y-5 text-slate-800 transition-all duration-300">
      
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Campaign Processor
        </span>
        <span className="inline-flex bg-[#059669] text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
          Local
        </span>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Error:</span> {error}
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Upload Zone OR File List + Action */}
      {selectedFiles.length === 0 ? (
        <div
          className={`minimal-dropzone h-[280px] flex flex-col items-center justify-center text-center ${dragActive ? 'minimal-dropzone--active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            multiple
            accept=".csv"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            Drag & Drop
          </div>
          <div className="text-xs text-slate-400 font-extrabold uppercase tracking-wider mt-2">
            or click to browse
          </div>
        </div>
      ) : (
        /* Selected Files List and Actions */
        <div className="space-y-3">
          {/* Header of list */}
          <div 
            className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider animate-blur-in opacity-0"
            style={{ animationDelay: '0.02s' }}
          >
            <span>Selected Files ({selectedFiles.length})</span>
            {!uploading && (
              <button 
                onClick={() => setSelectedFiles([])}
                className="text-slate-400 hover:text-red-500 font-bold transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Files List */}
          <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
            {selectedFiles.map((file, idx) => (
              <div 
                key={`${file.name}-${idx}`} 
                className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl animate-blur-in opacity-0"
                style={{ animationDelay: `${(idx + 1) * 0.04}s` }}
              >
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  <div className="truncate">
                    <p className="text-[11px] font-bold text-slate-700 truncate leading-tight animate-blur-in opacity-0" style={{ animationDelay: `${(idx + 1) * 0.04 + 0.02}s` }}>{file.name}</p>
                    <p className="text-[9px] text-slate-400 font-semibold mt-0.5 animate-blur-in opacity-0" style={{ animationDelay: `${(idx + 1) * 0.04 + 0.04}s` }}>{formatSize(file.size)}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(idx)}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                  disabled={uploading}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Action Button */}
          <button
            onClick={processFiles}
            disabled={uploading}
            className="w-full bg-slate-950 hover:bg-indigo-600 text-white text-xs font-black py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all duration-300 shadow-xs animate-blur-in opacity-0"
            style={{ animationDelay: `${(selectedFiles.length + 1) * 0.04 + 0.06}s` }}
          >
            {uploading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>Process Files</span>
                <ArrowUpRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}

      {/* Progress Bar (Visible while uploading/processing) */}
      {uploading && (
        <div className="h-1 bg-slate-100 w-full rounded-full overflow-hidden relative">
          <div 
            className="h-full bg-indigo-600 transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {selectedFiles.length === 0 && (
        <>
          {/* Divider */}
          <div className="h-[1px] bg-slate-100 w-full" />

          {/* Stats / Specs Section with Icons */}
          <div className="grid grid-cols-3 gap-2 py-1">
            <div className="flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <div className="text-left">
                <span className="text-[11px] font-extrabold text-slate-800 leading-none block">100% Local</span>
                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 block">Sandbox</span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 border-l border-slate-100">
              <Database className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <div className="text-left">
                <span className="text-[11px] font-extrabold text-slate-800 leading-none block">Multi-File</span>
                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 block">Queue</span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 border-l border-slate-100">
              <Zap className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <div className="text-left">
                <span className="text-[11px] font-extrabold text-slate-800 leading-none block">Instant</span>
                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 block">Parse</span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-[1px] bg-slate-100 w-full" />

          {/* Helpful usage tip */}
          <p className="text-[10px] text-slate-400 font-semibold text-center leading-normal bg-slate-50/80 rounded-xl py-2 px-3 border border-slate-100/50">
            💡 Drag campaign CSV files directly into the box above to automatically parse and combine reports.
          </p>
        </>
      )}

    </div>
  );
};

export default FileUpload;
