import React, { useState, useCallback, useMemo } from 'react';
import { ProcessedData, DataRecord } from '../types';
import {
  FileText,
  X,
  AlertCircle,
  ArrowUpRight,
  ShieldCheck,
  Database,
  Zap,
  UploadCloud,
  FileSpreadsheet,
  Plus,
  Calendar,
} from 'lucide-react';
import { detectBatchContextMonth, detectDateFromFileName } from '../services/dateParser';

interface UploadedFile {
  name: string;
  data: ProcessedData;
}

interface FileUploadProps {
  onFilesUploaded: (files: UploadedFile[]) => void;
  onQueueChange?: (hasFiles: boolean) => void;
  isSevenDayMode: boolean;
  onToggleSevenDayMode: (val: boolean) => void;
}

// ─── Main Component ─────────────────────────────────────────────────────────────
const FileUpload: React.FC<FileUploadProps> = ({ 
  onFilesUploaded, 
  onQueueChange,
  isSevenDayMode,
  onToggleSevenDayMode,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    onQueueChange?.(selectedFiles.length > 0);
  }, [selectedFiles, onQueueChange]);

  // Date detection for queued files
  const fileNames = useMemo(() => selectedFiles.map(f => f.name), [selectedFiles]);
  const contextMonth = useMemo(() => detectBatchContextMonth(fileNames), [fileNames]);

  const fileDateInfoList = useMemo(() => {
    return selectedFiles.map(file => ({
      file,
      dateInfo: detectDateFromFileName(file.name, contextMonth),
    }));
  }, [selectedFiles, contextMonth]);

  // ALWAYS sort unique dates in chronological sequence (e.g. Oct 3, Oct 4, Oct 5, Oct 6, Oct 7, Oct 8, Oct 9)
  const uniqueDetectedDates = useMemo(() => {
    const datesMap = new Map<string, { label: string; sortKey: number }>();
    fileDateInfoList.forEach(item => {
      if (!datesMap.has(item.dateInfo.key)) {
        datesMap.set(item.dateInfo.key, {
          label: item.dateInfo.label,
          sortKey: item.dateInfo.sortKey,
        });
      }
    });
    return Array.from(datesMap.values())
      .sort((a, b) => a.sortKey - b.sortKey)
      .map(d => d.label);
  }, [fileDateInfoList]);

  // ALWAYS sort the queued files list in chronological sequence by date, then by file name
  const sortedFileDateInfoList = useMemo(() => {
    return [...fileDateInfoList].sort((a, b) => {
      if (a.dateInfo.sortKey !== b.dateInfo.sortKey) {
        return a.dateInfo.sortKey - b.dateInfo.sortKey;
      }
      return a.file.name.localeCompare(b.file.name);
    });
  }, [fileDateInfoList]);

  // Auto-enable 7-day mode if user drops files from multiple dates
  React.useEffect(() => {
    if (uniqueDetectedDates.length > 1 && !isSevenDayMode) {
      onToggleSevenDayMode(true);
    }
  }, [uniqueDetectedDates, isSevenDayMode, onToggleSevenDayMode]);

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
    // Unlimited file drop
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
      setError('Please drop valid CSV campaign report files.');
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Unlimited file selection
    const files = Array.from(e.target.files || []).filter(
      f => f.type === 'text/csv' || f.name.endsWith('.csv')
    );
    if (files.length === 0 && e.target.files && e.target.files.length > 0) {
      setError('Only CSV format files are supported.');
      return;
    }
    setError(null);
    setSelectedFiles(prev => {
      const names = new Set(prev.map(f => f.name));
      return [...prev, ...files.filter(f => !names.has(f.name))];
    });
    e.target.value = '';
  };

  const removeFile = (index: number) =>
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));

  const removeFileByName = (fileName: string) =>
    setSelectedFiles(prev => prev.filter(f => f.name !== fileName));

  // ── CSV parsing logic ──
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
          if (lines.length === 0) return reject(new Error(`${file.name} is empty`));
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
      }, 400);
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
    <div className="w-full sm:w-[475px] lg:w-[485px] xl:w-[500px] report-panel rounded-2xl p-4 sm:p-5 space-y-3.5 text-slate-800 transition-all duration-300">
      
      {/* ── Console Header ── */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100/80 border border-indigo-200/60 flex items-center justify-center text-indigo-600 shadow-2xs">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 leading-none">
              Report Data Ingestion
            </h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Unlimited Batch Pipeline
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/70 text-emerald-700 text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Sandbox Active
          </span>
          <span className="bg-slate-100 text-slate-500 text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border border-slate-200/60">
            No Limit
          </span>
        </div>
      </div>

      {/* ── 7-Day Multi-Date Toggle Switch ── */}
      <div className={`p-2.5 rounded-xl border transition-all duration-300 flex items-center justify-between ${
        isSevenDayMode 
          ? 'bg-gradient-to-r from-indigo-50/90 via-violet-50/70 to-indigo-50/90 border-indigo-200/80 shadow-2xs' 
          : 'bg-slate-50/80 border-slate-200/60'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
            isSevenDayMode 
              ? 'bg-indigo-600 text-white shadow-2xs' 
              : 'bg-slate-200/80 text-slate-500'
          }`}>
            <Calendar className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-black text-slate-800 leading-tight">
                7-Day Multi-Date Report Mode
              </span>
              {isSevenDayMode && (
                <span className="px-1.5 py-0.2 rounded-md bg-indigo-600 text-white text-[8px] font-black uppercase tracking-wider animate-pulse">
                  ON
                </span>
              )}
            </div>
            <span className="text-[9px] text-slate-500 font-semibold block mt-0.5">
              Detects dates from file names & generates ET date matrix
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onToggleSevenDayMode(!isSevenDayMode)}
          aria-label="Toggle 7 Days Report Mode"
          className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            isSevenDayMode ? 'bg-indigo-600' : 'bg-slate-300'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
              isSevenDayMode ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="p-2.5 bg-red-50/95 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2 animate-blur-in">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-[11px] leading-tight">
            <span className="font-bold">Error:</span> {error}
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 p-0.5">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Upload Zone OR File List + Action ── */}
      {selectedFiles.length === 0 ? (
        <div className="space-y-3">
          {/* Dropzone container */}
          <div
            className={`report-dropzone h-[180px] sm:h-[195px] flex flex-col items-center justify-center text-center p-4 transition-all duration-300 relative group ${
              dragActive ? 'report-dropzone--active' : ''
            }`}
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
              title="Click or drag CSV files to import"
            />
            
            {/* Visual Icon Badge */}
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 group-hover:shadow-indigo-500/35 transition-all duration-300 mb-2">
              <UploadCloud className="w-5 h-5" />
            </div>

            <div className="text-base sm:text-[17px] font-black text-slate-800 tracking-tight leading-snug">
              Drag & Drop Campaign CSVs
            </div>

            <div className="text-[11px] text-slate-500 font-semibold mt-0.5">
              or <span className="text-indigo-600 font-bold group-hover:underline">browse from device</span>
              <span className="text-slate-400 font-normal ml-1">(unlimited files)</span>
            </div>

            <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[9px] font-bold bg-white/90 text-slate-500 border border-slate-200/80 uppercase tracking-wider shadow-2xs">
              <span className="text-slate-400">Auto-Detects:</span>
              <span className="font-extrabold text-slate-700">Dates (e.g. 4 OCT, 3RD) • SUBID • REV</span>
            </div>
          </div>

          {/* Feature Specs */}
          <div className="grid grid-cols-3 gap-1.5 py-1">
            <div className="flex items-center justify-center gap-2 px-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <div className="text-left">
                <span className="text-[10px] font-extrabold text-slate-800 leading-none block">100% Local</span>
                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 block">Sandbox</span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 px-1 border-l border-slate-100">
              <Database className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
              <div className="text-left">
                <span className="text-[10px] font-extrabold text-slate-800 leading-none block">No File Limit</span>
                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 block">Batch Queue</span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 px-1 border-l border-slate-100">
              <Zap className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              <div className="text-left">
                <span className="text-[10px] font-extrabold text-slate-800 leading-none block">Auto Date Map</span>
                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 block">ET Matrix</span>
              </div>
            </div>
          </div>

          {/* Usage tip note */}
          <p className="text-[9px] text-slate-400 font-medium text-center leading-normal bg-slate-50/80 rounded-xl py-1.5 px-3 border border-slate-100/70">
            🔒 In-memory processing. Drop files for multiple dates (e.g. 3RD, 4 OCT, 9 OCT) to view the 7-day ET matrix.
          </p>
        </div>
      ) : (
        /* Selected Files List and Actions */
        <div className="space-y-3">
          {/* Header of list */}
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <div className="flex items-center gap-1.5 text-slate-700 font-black">
              <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
              <span>Queued ({selectedFiles.length} files)</span>
              {uniqueDetectedDates.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/60 text-[9px] font-extrabold normal-case">
                  {uniqueDetectedDates.length} {uniqueDetectedDates.length === 1 ? 'date' : 'dates'}
                </span>
              )}
            </div>
            {!uploading && (
              <div className="flex items-center gap-3">
                <label className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer flex items-center gap-1 transition-colors">
                  <Plus className="w-3 h-3" />
                  Add More
                  <input
                    type="file"
                    multiple
                    accept=".csv"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                </label>
                <button 
                  onClick={() => setSelectedFiles([])}
                  className="text-[10px] font-bold text-slate-400 hover:text-red-500 transition-colors"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>

          {/* Detected Dates Pill Strip */}
          {uniqueDetectedDates.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 p-2 bg-indigo-50/50 rounded-xl border border-indigo-100/80">
              <span className="text-[9px] font-black text-indigo-800 uppercase tracking-wider mr-1">
                Detected Dates:
              </span>
              {uniqueDetectedDates.map(dLabel => (
                <span
                  key={dLabel}
                  className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-white text-indigo-700 border border-indigo-200/70 shadow-2xs"
                >
                  {dLabel}
                </span>
              ))}
            </div>
          )}

          {/* Files List — Constrained height with internal scrollbar for unlimited files */}
          <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
            {sortedFileDateInfoList.map((item, idx) => (
              <div 
                key={`${item.file.name}-${idx}`} 
                className="flex items-center justify-between p-2 bg-slate-50/90 hover:bg-slate-100/80 border border-slate-100 rounded-xl transition-all duration-200"
              >
                <div className="flex items-center gap-2 truncate flex-1 min-w-0 mr-2">
                  <div className="w-6 h-6 rounded-md bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[11px] font-bold text-slate-800 truncate leading-tight">
                        {item.file.name}
                      </p>
                      <span className="px-1.5 py-0.2 rounded-md text-[8px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200/50 flex-shrink-0">
                        {item.dateInfo.label}
                      </span>
                    </div>
                    <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                      {formatSize(item.file.size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFileByName(item.file.name)}
                  className="text-slate-400 hover:text-red-500 p-1 transition-colors rounded-md"
                  disabled={uploading}
                  title="Remove file"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Progress Bar (Visible while uploading/processing) */}
          {uploading && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] font-bold text-indigo-700">
                <span>Compiling metrics across dates...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-1.5 bg-slate-100 w-full rounded-full overflow-hidden relative">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={processFiles}
            disabled={uploading}
            className="w-full bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 hover:from-indigo-600 hover:to-violet-600 active:scale-[0.99] text-white text-xs font-black py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-md hover:shadow-indigo-500/25"
          >
            {uploading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processing {selectedFiles.length} Campaign Files...</span>
              </>
            ) : (
              <>
                <span>
                  {isSevenDayMode || uniqueDetectedDates.length > 1
                    ? 'Generate 7-Day ET Revenue Matrix'
                    : 'Compile & Open Report Viewer'}
                </span>
                <ArrowUpRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}

    </div>
  );
};

export default FileUpload;
