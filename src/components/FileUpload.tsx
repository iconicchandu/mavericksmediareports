import React, { useState, useCallback } from 'react';
import { ProcessedData, DataRecord } from '../types';

import {
  FileText,
  X,
  AlertCircle,
  Sparkles,
  Database,
  Zap,
  UploadCloud,
  FilePlus2,
  ShieldCheck,
  Cpu,
} from 'lucide-react';


interface UploadedFile {
  name: string;
  data: ProcessedData;
}

interface FileUploadProps {
  onFilesUploaded: (files: UploadedFile[]) => void;
}



// ─── Main Component ─────────────────────────────────────────────────────────────
const FileUpload: React.FC<FileUploadProps> = ({ onFilesUploaded }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successPulse, setSuccessPulse] = useState(false);

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
      setSuccessPulse(true);
      setTimeout(() => {
        onFilesUploaded(result);
        setSuccessPulse(false);
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
    <div className="fu-root">
      {/* ── Content ── */}
      <div className="fu-content">

        {/* ── Drop Zone ── */}
        <div
          className={`fu-dropzone${dragActive ? ' fu-dropzone--active' : ''}${successPulse ? ' fu-dropzone--success' : ''}`}
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
            className="fu-file-input"
          />

          {/* Corner accents */}
          <span className="fu-corner fu-corner-tl" />
          <span className="fu-corner fu-corner-tr" />
          <span className="fu-corner fu-corner-bl" />
          <span className="fu-corner fu-corner-br" />

          {/* Scanning line animation when drag active */}
          {dragActive && <div className="fu-scan-line" />}

          <div className="fu-dropzone-inner">
            {/* Icon */}
            <div className={`fu-icon-wrap${dragActive ? ' fu-icon-wrap--active' : ''}`}>
              <div className="fu-icon-glow" />
              <div className="fu-icon-ring fu-icon-ring-1" />
              <div className="fu-icon-ring fu-icon-ring-2" />
              <div className="fu-icon-core">
                <UploadCloud className="fu-icon" />
              </div>
            </div>

            {/* Text */}
            <div className="fu-dropzone-text">
              {dragActive ? (
                <>
                  <h3 className="fu-title fu-title--active">Release to Upload</h3>
                  <p className="fu-subtitle fu-subtitle--active">Drop your CSV files here</p>
                </>
              ) : (
                <>
                  <h3 className="fu-title">Drag & Drop CSV Files</h3>
                  <p className="fu-subtitle">
                    or <span className="fu-browse-link">click to browse</span> from your device
                  </p>
                </>
              )}
            </div>

            {/* Feature pills */}
            <div className="fu-pills">
              <div className="fu-pill">
                <Database className="fu-pill-icon fu-pill-icon--blue" />
                <span>CSV Format</span>
              </div>
              <div className="fu-pill">
                <FilePlus2 className="fu-pill-icon fu-pill-icon--violet" />
                <span>Multiple Files</span>
              </div>
              <div className="fu-pill">
                <Cpu className="fu-pill-icon fu-pill-icon--emerald" />
                <span>Auto-Processing</span>
              </div>
              <div className="fu-pill">
                <ShieldCheck className="fu-pill-icon fu-pill-icon--amber" />
                <span>100% Local</span>
              </div>
            </div>

            {/* Required columns hint */}
            <div className="fu-hint">
              Required columns:&nbsp;
              <code className="fu-code fu-code--blue">SUBID</code>
              &nbsp;&amp;&nbsp;
              <code className="fu-code fu-code--emerald">REV</code>
            </div>
          </div>
        </div>

        {/* ── Error Banner ── */}
        {error && (
          <div className="fu-error">
            <AlertCircle className="fu-error-icon" />
            <div>
              <p className="fu-error-title">Upload Error</p>
              <p className="fu-error-msg">{error}</p>
            </div>
            <button className="fu-error-close" onClick={() => setError(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── Selected Files Panel ── */}
        {selectedFiles.length > 0 && (
          <div className="fu-panel">
            {/* Panel header */}
            <div className="fu-panel-header">
              <div className="fu-panel-title-wrap">
                <div className="fu-panel-icon">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="fu-panel-title">Selected Files</h3>
                  <p className="fu-panel-sub">
                    {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} queued for processing
                  </p>
                </div>
              </div>
              <div className="fu-badge">
                <Sparkles className="w-3 h-3 mr-1" />
                {selectedFiles.length} Ready
              </div>
            </div>

            {/* File list */}
            <div className="fu-file-list">
              {selectedFiles.map((file, index) => (
                <div key={index} className="fu-file-item" style={{ animationDelay: `${index * 60}ms` }}>
                  <div className="fu-file-icon-wrap">
                    <FileText className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="fu-file-info">
                    <p className="fu-file-name">{file.name}</p>
                    <div className="fu-file-meta">
                      <span className="fu-file-size">{formatSize(file.size)}</span>
                      <span className="fu-file-tag">CSV</span>
                    </div>
                  </div>
                  <button
                    className="fu-remove-btn"
                    onClick={() => removeFile(index)}
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Progress bar (visible while uploading) */}
            {uploading && (
              <div className="fu-progress-wrap">
                <div className="fu-progress-bar">
                  <div
                    className="fu-progress-fill"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <span className="fu-progress-label">{uploadProgress}%</span>
              </div>
            )}

            {/* Process button */}
            <div className="fu-actions">
              <button
                onClick={processFiles}
                disabled={uploading}
                className={`fu-process-btn${uploading ? ' fu-process-btn--loading' : ''}`}
              >
                {uploading ? (
                  <>
                    <div className="fu-spinner" />
                    <span>Processing files…</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                    <span>Process {selectedFiles.length} File{selectedFiles.length > 1 ? 's' : ''}</span>
                    {/* Shimmer overlay */}
                    <div className="fu-btn-shimmer" />
                  </>
                )}
              </button>
              <p className="fu-security-note">
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                Files are processed locally · never uploaded to any server
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
