import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Calendar,
  Layers,
  DollarSign,
  TrendingUp,
  Download,
  Search,
  ArrowUpDown,
  Award,
  Crown,
  RefreshCw,
  Building2,
  ChevronRight,
  Target,
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  Filter,
  CheckCircle2,
  ChevronDown,
  Check,
  X,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { DiyaLamp, FloatingKandil } from './DiwaliDecorations';
import { isDiwaliMode as defaultDiwaliMode } from '../config/themeConfig';
import { ProcessedData, DataRecord } from '../types';
import { detectBatchContextMonth, detectDateFromFileName, DetectedDateInfo } from '../services/dateParser';

interface UploadedFile {
  name: string;
  data: ProcessedData;
}

interface SevenDayReportPanelProps {
  data: ProcessedData;
  uploadedFiles: UploadedFile[];
  onSwitchToStandardView?: () => void;
  onReset: () => void;
  isDiwaliMode?: boolean;
}

interface ETRowData {
  et: string;
  dateRevenues: Record<string, number>; // date key -> revenue
  totalRevenue: number;
  avgRevenue: number; // daily average revenue across detected dates
  percentage: number;
  activeDaysCount: number;
}

interface AdvRowData {
  advertiser: string;
  dateRevenues: Record<string, number>;
  totalRevenue: number;
  avgRevenue: number; // daily average revenue across detected dates
  percentage: number;
}

interface CampaignRowData {
  campaign: string;
  advertiser: string;
  dateRevenues: Record<string, number>;
  totalRevenue: number;
  avgRevenue: number;
  activeDaysCount: number;
}

interface DrillCampaignRow {
  campaignKey: string;
  campaign: string;
  advertiser: string;
  dateRevenues: Record<string, number>;
  totalRevenue: number;
  avgRevenue: number;
  activeDaysCount: number;
  percentageOfET: number;
}

export const getAdvertiserBadgeStyle = (name: string): { bg: string; text: string; border: string } => {
  const u = (name || '').toUpperCase();
  if (u.includes('BRANDED')) return { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200/80' };
  if (u.includes('RGR')) return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200/80' };
  if (u.includes('ICO')) return { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200/80' };
  if (u.includes('GZ')) return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200/80' };
  if (u.includes('MI')) return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200/80' };
  if (u.includes('7M')) return { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200/80' };
  if (u.includes('CMAD') || u.includes('CM AD')) return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200/80' };
  if (u.includes('ES')) return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200/80' };
  if (u.includes('XC') || u.includes('XCE')) return { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200/80' };
  if (u.includes('DB')) return { bg: 'bg-lime-50', text: 'text-lime-800', border: 'border-lime-200/80' };
  if (u.includes('COMCAST')) return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200/80' };
  return { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200/80' };
};

interface AdvertiserDropdownProps {
  value: string;
  onChange: (val: string) => void;
  advertisers: string[];
  accentColor?: 'indigo' | 'emerald';
}

const AdvertiserDropdown: React.FC<AdvertiserDropdownProps> = ({
  value,
  onChange,
  advertisers,
  accentColor = 'indigo',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const filteredAdvertisers = useMemo(() => {
    if (!search.trim()) return advertisers;
    const q = search.toLowerCase().trim();
    return advertisers.filter(a => a.toLowerCase().includes(q));
  }, [advertisers, search]);

  const isEmerald = accentColor === 'emerald';
  const ringColor = isEmerald ? 'ring-emerald-400/25 border-emerald-400' : 'ring-indigo-400/25 border-indigo-400';
  const activeBg = isEmerald ? 'bg-emerald-50 text-emerald-950 border-emerald-200/80' : 'bg-indigo-50 text-indigo-950 border-indigo-200/80';
  const checkColor = isEmerald ? 'text-emerald-600' : 'text-indigo-600';

  const selectedBadge = value !== 'ALL' ? getAdvertiserBadgeStyle(value) : null;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 py-1.5 px-3 rounded-xl text-xs font-bold bg-white border transition-all shadow-2xs ${
          isOpen
            ? `${ringColor} ring-2 bg-slate-50/50`
            : value !== 'ALL'
            ? isEmerald
              ? 'border-emerald-300 bg-emerald-50/25 text-emerald-950'
              : 'border-indigo-300 bg-indigo-50/25 text-indigo-950'
            : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/80'
        }`}
      >
        <Building2 className={`w-3.5 h-3.5 ${value !== 'ALL' ? (isEmerald ? 'text-emerald-600' : 'text-indigo-600') : 'text-slate-400'}`} />
        
        {value === 'ALL' ? (
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Adv:</span>
            <span>All Advertisers</span>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded-full">
              {advertisers.length}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Adv:</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${selectedBadge?.bg} ${selectedBadge?.text} ${selectedBadge?.border}`}>
              {value}
            </span>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange('ALL');
              }}
              className="p-0.5 hover:bg-slate-200/80 rounded-full text-slate-400 hover:text-slate-700 transition-colors ml-0.5"
              title="Clear advertiser filter"
            >
              <X className="w-3 h-3" />
            </span>
          </div>
        )}

        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-600' : ''}`} />
      </button>

      {/* Popover */}
      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-64 z-50 bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200 shadow-xl shadow-slate-900/10 p-2 animate-fade-in">
          {/* Search Bar */}
          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search advertiser..."
              className="w-full pl-8 pr-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-400/25 focus:border-indigo-400 outline-none transition-all placeholder:text-slate-400 font-medium"
              autoFocus
            />
          </div>

          <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
            {/* Option: ALL */}
            <div
              onClick={() => {
                onChange('ALL');
                setIsOpen(false);
                setSearch('');
              }}
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs cursor-pointer transition-all ${
                value === 'ALL'
                  ? `${activeBg} font-black border shadow-2xs`
                  : 'hover:bg-slate-50 text-slate-700 font-semibold'
              }`}
            >
              <div className="flex items-center gap-2">
                {value === 'ALL' ? (
                  <Check className={`w-3.5 h-3.5 ${checkColor} flex-shrink-0`} />
                ) : (
                  <span className="w-3.5 h-3.5" />
                )}
                <span>All Advertisers</span>
              </div>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded-full">
                {advertisers.length}
              </span>
            </div>

            <div className="my-1 border-t border-slate-100" />

            {/* Filtered Advertisers */}
            {filteredAdvertisers.length === 0 ? (
              <div className="py-3 text-center text-xs text-slate-400 font-medium">
                No advertisers match "{search}"
              </div>
            ) : (
              filteredAdvertisers.map(adv => {
                const isSelected = value.toUpperCase() === adv.toUpperCase();
                const badge = getAdvertiserBadgeStyle(adv);

                return (
                  <div
                    key={adv}
                    onClick={() => {
                      onChange(adv);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs cursor-pointer transition-all ${
                      isSelected
                        ? `${activeBg} font-black border shadow-2xs`
                        : 'hover:bg-slate-50 text-slate-700 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {isSelected ? (
                        <Check className={`w-3.5 h-3.5 ${checkColor} flex-shrink-0`} />
                      ) : (
                        <span className="w-3.5 h-3.5 flex-shrink-0" />
                      )}
                      <span className="font-bold text-slate-800 truncate">{adv}</span>
                    </div>

                    <span className={`px-2 py-0.2 rounded text-[10px] font-black uppercase border ${badge.bg} ${badge.text} ${badge.border} flex-shrink-0`}>
                      {adv}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export interface SortOptionItem {
  key: string;
  label: string;
  group?: 'metric' | 'alpha' | 'date';
}

interface SortDropdownProps {
  value: string;
  onChange: (key: string) => void;
  options: SortOptionItem[];
  accentColor?: 'indigo' | 'emerald';
}

const SortDropdown: React.FC<SortDropdownProps> = ({
  value,
  onChange,
  options,
  accentColor = 'indigo',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const activeOption = options.find(o => o.key === value) || options[0];
  const isEmerald = accentColor === 'emerald';
  const ringColor = isEmerald ? 'ring-emerald-400/25 border-emerald-400' : 'ring-indigo-400/25 border-indigo-400';
  const activeBg = isEmerald ? 'bg-emerald-50 text-emerald-950 border-emerald-200/80' : 'bg-indigo-50 text-indigo-950 border-indigo-200/80';
  const checkColor = isEmerald ? 'text-emerald-600' : 'text-indigo-600';

  const metricOptions = options.filter(o => o.group === 'metric' || ['total', 'avg'].includes(o.key));
  const alphaOptions = options.filter(o => o.group === 'alpha' || ['name', 'advertiser'].includes(o.key));
  const dateOptions = options.filter(o => o.group === 'date' || (!metricOptions.some(m => m.key === o.key) && !alphaOptions.some(a => a.key === o.key)));

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 py-1.5 px-3 rounded-xl text-xs font-bold bg-white border transition-all shadow-2xs ${
          isOpen
            ? `${ringColor} ring-2 bg-slate-50/50`
            : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/80'
        }`}
      >
        <ArrowUpDown className={`w-3.5 h-3.5 ${isEmerald ? 'text-emerald-600' : 'text-indigo-600'}`} />
        <span className="text-slate-500 font-medium">Sort:</span>
        <span className="font-black text-slate-800">{activeOption?.label || value}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-600' : ''}`} />
      </button>

      {/* Popover */}
      {isOpen && (
        <div className="absolute right-0 sm:left-0 sm:right-auto mt-1.5 w-60 z-50 bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200 shadow-xl shadow-slate-900/10 p-2 animate-fade-in max-h-72 overflow-y-auto">
          {/* Metric Sort Group */}
          {metricOptions.length > 0 && (
            <div className="space-y-1">
              <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                Metrics
              </div>
              {metricOptions.map(opt => {
                const isSelected = value === opt.key;
                return (
                  <div
                    key={opt.key}
                    onClick={() => {
                      onChange(opt.key);
                      setIsOpen(false);
                    }}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs cursor-pointer transition-all ${
                      isSelected
                        ? `${activeBg} font-black border shadow-2xs`
                        : 'hover:bg-slate-50 text-slate-700 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isSelected ? (
                        <Check className={`w-3.5 h-3.5 ${checkColor} flex-shrink-0`} />
                      ) : (
                        <DollarSign className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                      )}
                      <span>{opt.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Alpha Sort Group */}
          {alphaOptions.length > 0 && (
            <div className="mt-2 pt-1 border-t border-slate-100 space-y-1">
              <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                Alphabetical
              </div>
              {alphaOptions.map(opt => {
                const isSelected = value === opt.key;
                return (
                  <div
                    key={opt.key}
                    onClick={() => {
                      onChange(opt.key);
                      setIsOpen(false);
                    }}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs cursor-pointer transition-all ${
                      isSelected
                        ? `${activeBg} font-black border shadow-2xs`
                        : 'hover:bg-slate-50 text-slate-700 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isSelected ? (
                        <Check className={`w-3.5 h-3.5 ${checkColor} flex-shrink-0`} />
                      ) : (
                        <span className="w-3.5 h-3.5 text-center text-slate-300 font-black text-[10px]">A-Z</span>
                      )}
                      <span>{opt.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Date Sort Group */}
          {dateOptions.length > 0 && (
            <div className="mt-2 pt-1 border-t border-slate-100 space-y-1">
              <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                Individual Dates
              </div>
              {dateOptions.map(opt => {
                const isSelected = value === opt.key;
                return (
                  <div
                    key={opt.key}
                    onClick={() => {
                      onChange(opt.key);
                      setIsOpen(false);
                    }}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs cursor-pointer transition-all ${
                      isSelected
                        ? `${activeBg} font-black border shadow-2xs`
                        : 'hover:bg-slate-50 text-slate-700 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isSelected ? (
                        <Check className={`w-3.5 h-3.5 ${checkColor} flex-shrink-0`} />
                      ) : (
                        <Calendar className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                      )}
                      <span>{opt.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const SevenDayReportPanel: React.FC<SevenDayReportPanelProps> = ({
  data,
  uploadedFiles,
  onReset,
  isDiwaliMode = defaultDiwaliMode,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAdvertiser, setSelectedAdvertiser] = useState('ALL');
  const [sortBy, setSortBy] = useState<'total' | 'name' | string>('total');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [showAdvMatrix, setShowAdvMatrix] = useState(false);
  const [showCampaignMatrix, setShowCampaignMatrix] = useState(false);
  const [campaignSearch, setCampaignSearch] = useState('');
  const [campaignAdvFilter, setCampaignAdvFilter] = useState('ALL');
  const [campaignSortBy, setCampaignSortBy] = useState('total');
  const [campaignSortOrder, setCampaignSortOrder] = useState<'desc' | 'asc'>('desc');

  // Connected Dual Filter State (ET & Campaign Deep-Dive Explorer)
  const [drillET, setDrillET] = useState<string>('ALL');
  const [drillCampaign, setDrillCampaign] = useState<string>('ALL');
  const [isETDropdownOpen, setIsETDropdownOpen] = useState(false);
  const [isCampaignDropdownOpen, setIsCampaignDropdownOpen] = useState(false);
  const [drillETSearch, setDrillETSearch] = useState('');
  const [drillCampSearch, setDrillCampSearch] = useState('');

  const etDropdownRef = useRef<HTMLDivElement>(null);
  const campaignDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (etDropdownRef.current && !etDropdownRef.current.contains(event.target as Node)) {
        setIsETDropdownOpen(false);
      }
      if (campaignDropdownRef.current && !campaignDropdownRef.current.contains(event.target as Node)) {
        setIsCampaignDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. Detect all unique dates across uploaded files
  const fileNames = useMemo(() => uploadedFiles.map(f => f.name), [uploadedFiles]);
  const contextMonth = useMemo(() => detectBatchContextMonth(fileNames), [fileNames]);

  // Map each file name to its detected date info
  const fileDateMap = useMemo(() => {
    const map = new Map<string, DetectedDateInfo>();
    fileNames.forEach(fn => {
      map.set(fn, detectDateFromFileName(fn, contextMonth));
    });
    return map;
  }, [fileNames, contextMonth]);

  // Ordered list of unique dates
  const sortedDates = useMemo(() => {
    const datesMap = new Map<string, DetectedDateInfo>();
    fileDateMap.forEach(dInfo => {
      if (!datesMap.has(dInfo.key)) {
        datesMap.set(dInfo.key, dInfo);
      }
    });
    return Array.from(datesMap.values()).sort((a, b) => a.sortKey - b.sortKey);
  }, [fileDateMap]);

  // Sort Options for ET and Campaign dropdowns
  const etSortOptions = useMemo<SortOptionItem[]>(() => [
    { key: 'total', label: 'Total Revenue', group: 'metric' },
    { key: 'avg', label: 'Avg Revenue', group: 'metric' },
    { key: 'name', label: 'ET Name (A-Z)', group: 'alpha' },
    ...sortedDates.map(d => ({ key: d.key, label: d.label, group: 'date' as const })),
  ], [sortedDates]);

  const campaignSortOptions = useMemo<SortOptionItem[]>(() => [
    { key: 'total', label: 'Total Revenue', group: 'metric' },
    { key: 'avg', label: 'Avg Revenue', group: 'metric' },
    { key: 'name', label: 'Campaign (A-Z)', group: 'alpha' },
    { key: 'advertiser', label: 'Advertiser', group: 'alpha' },
    ...sortedDates.map(d => ({ key: d.key, label: d.label, group: 'date' as const })),
  ], [sortedDates]);

  // 2. Filter records by advertiser if selected
  const filteredRecords = useMemo(() => {
    if (selectedAdvertiser === 'ALL') return data.records;
    return data.records.filter(r => r.advertiser.toUpperCase() === selectedAdvertiser.toUpperCase());
  }, [data.records, selectedAdvertiser]);

  // 3. Aggregate revenues for each ET across each date
  const { etRows, dailyTotals, grandTotal, allUniqueETs, allAdvertisers } = useMemo(() => {
    const etMap: Record<string, Record<string, number>> = {};
    const dayTotals: Record<string, number> = {};
    let total = 0;
    const uniqueETs = new Set<string>();
    const advertisers = new Set<string>();

    // Initialize day totals
    sortedDates.forEach(d => {
      dayTotals[d.key] = 0;
    });

    data.records.forEach(r => {
      advertisers.add(r.advertiser);
    });

    filteredRecords.forEach(r => {
      const etName = r.et || 'Unknown';
      uniqueETs.add(etName);

      const dInfo = fileDateMap.get(r.fileName) || detectDateFromFileName(r.fileName, contextMonth);
      const dKey = dInfo.key;

      if (!etMap[etName]) {
        etMap[etName] = {};
        sortedDates.forEach(d => {
          etMap[etName][d.key] = 0;
        });
      }

      etMap[etName][dKey] = (etMap[etName][dKey] || 0) + r.revenue;
      dayTotals[dKey] = (dayTotals[dKey] || 0) + r.revenue;
      total += r.revenue;
    });

    const numDates = sortedDates.length || 1;
    const rows: ETRowData[] = Object.entries(etMap).map(([et, dateRevenues]) => {
      const etTotal = Object.values(dateRevenues).reduce((s, v) => s + v, 0);
      const activeDaysCount = Object.values(dateRevenues).filter(v => v > 0).length;
      return {
        et,
        dateRevenues,
        totalRevenue: etTotal,
        avgRevenue: etTotal / numDates,
        percentage: total > 0 ? (etTotal / total) * 100 : 0,
        activeDaysCount,
      };
    });

    return {
      etRows: rows,
      dailyTotals: dayTotals,
      grandTotal: total,
      allUniqueETs: Array.from(uniqueETs),
      allAdvertisers: Array.from(advertisers).sort(),
    };
  }, [filteredRecords, data.records, sortedDates, fileDateMap, contextMonth]);

  // 4. Aggregate revenues by Advertiser across each date
  const advRows = useMemo<AdvRowData[]>(() => {
    const advMap: Record<string, Record<string, number>> = {};
    let total = 0;

    data.records.forEach(r => {
      const advName = r.advertiser || 'Other';
      const dInfo = fileDateMap.get(r.fileName) || detectDateFromFileName(r.fileName, contextMonth);
      const dKey = dInfo.key;

      if (!advMap[advName]) {
        advMap[advName] = {};
        sortedDates.forEach(d => {
          advMap[advName][d.key] = 0;
        });
      }

      advMap[advName][dKey] = (advMap[advName][dKey] || 0) + r.revenue;
      total += r.revenue;
    });

    const numDates = sortedDates.length || 1;
    return Object.entries(advMap)
      .map(([advertiser, dateRevenues]) => {
        const advTotal = Object.values(dateRevenues).reduce((s, v) => s + v, 0);
        return {
          advertiser,
          dateRevenues,
          totalRevenue: advTotal,
          avgRevenue: advTotal / numDates,
          percentage: total > 0 ? (advTotal / total) * 100 : 0,
        };
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [data.records, sortedDates, fileDateMap, contextMonth]);

  // 5. Filter and sort ET rows
  const displayRows = useMemo(() => {
    let list = etRows;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(r => r.et.toLowerCase().includes(q));
    }

    return list.sort((a, b) => {
      let diff = 0;
      if (sortBy === 'name') {
        diff = a.et.localeCompare(b.et);
      } else if (sortBy === 'total') {
        diff = a.totalRevenue - b.totalRevenue;
      } else if (sortBy === 'avg') {
        diff = a.avgRevenue - b.avgRevenue;
      } else {
        // Sort by specific date key
        const valA = a.dateRevenues[sortBy] || 0;
        const valB = b.dateRevenues[sortBy] || 0;
        diff = valA - valB;
      }
      return sortOrder === 'desc' ? -diff : diff;
    });
  }, [etRows, searchQuery, sortBy, sortOrder]);

  // 6. Aggregate revenues by Campaign (mapped to proper advertiser)
  const campaignRows = useMemo<CampaignRowData[]>(() => {
    const campMap: Record<string, { campaign: string; advertiser: string; dateRevenues: Record<string, number> }> = {};
    const numDates = sortedDates.length || 1;

    data.records.forEach(r => {
      const campName = r.campaign || 'Unknown';
      const advName = r.advertiser || 'Other';
      const dInfo = fileDateMap.get(r.fileName) || detectDateFromFileName(r.fileName, contextMonth);
      const dKey = dInfo.key;

      const key = `${campName}:::${advName}`;
      if (!campMap[key]) {
        campMap[key] = {
          campaign: campName,
          advertiser: advName,
          dateRevenues: {},
        };
        sortedDates.forEach(d => {
          campMap[key].dateRevenues[d.key] = 0;
        });
      }

      campMap[key].dateRevenues[dKey] = (campMap[key].dateRevenues[dKey] || 0) + r.revenue;
    });

    return Object.values(campMap)
      .map(item => {
        const totalRev = Object.values(item.dateRevenues).reduce((s, v) => s + v, 0);
        const activeDays = Object.values(item.dateRevenues).filter(v => v > 0).length;
        return {
          campaign: item.campaign,
          advertiser: item.advertiser,
          dateRevenues: item.dateRevenues,
          totalRevenue: totalRev,
          avgRevenue: totalRev / numDates,
          activeDaysCount: activeDays,
        };
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [data.records, sortedDates, fileDateMap, contextMonth]);

  // Filter & sort Campaign rows
  const displayCampaignRows = useMemo(() => {
    let list = campaignRows;

    if (campaignAdvFilter !== 'ALL') {
      list = list.filter(r => r.advertiser.toUpperCase() === campaignAdvFilter.toUpperCase());
    }

    if (campaignSearch.trim()) {
      const q = campaignSearch.toLowerCase().trim();
      list = list.filter(r => 
        r.campaign.toLowerCase().includes(q) || 
        r.advertiser.toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => {
      let diff = 0;
      if (campaignSortBy === 'name') {
        diff = a.campaign.localeCompare(b.campaign);
      } else if (campaignSortBy === 'advertiser') {
        diff = a.advertiser.localeCompare(b.advertiser);
      } else if (campaignSortBy === 'total') {
        diff = a.totalRevenue - b.totalRevenue;
      } else if (campaignSortBy === 'avg') {
        diff = a.avgRevenue - b.avgRevenue;
      } else {
        const valA = a.dateRevenues[campaignSortBy] || 0;
        const valB = b.dateRevenues[campaignSortBy] || 0;
        diff = valA - valB;
      }
      return campaignSortOrder === 'desc' ? -diff : diff;
    });
  }, [campaignRows, campaignAdvFilter, campaignSearch, campaignSortBy, campaignSortOrder]);

  const campaignDailyTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    sortedDates.forEach(d => {
      totals[d.key] = 0;
    });
    displayCampaignRows.forEach(r => {
      sortedDates.forEach(d => {
        totals[d.key] = (totals[d.key] || 0) + (r.dateRevenues[d.key] || 0);
      });
    });
    return totals;
  }, [displayCampaignRows, sortedDates]);

  const campaignGrandTotal = useMemo(() => {
    return displayCampaignRows.reduce((s, r) => s + r.totalRevenue, 0);
  }, [displayCampaignRows]);

  const handleExportCampaignCSV = () => {
    const headers = ['Campaign', 'Advertiser', ...sortedDates.map(d => d.label), 'Total Revenue', 'Avg Revenue'];
    const csvLines: string[] = [];
    csvLines.push(headers.join(','));

    displayCampaignRows.forEach(r => {
      const row = [
        `"${r.campaign.replace(/"/g, '""')}"`,
        `"${r.advertiser.replace(/"/g, '""')}"`,
        ...sortedDates.map(d => (r.dateRevenues[d.key] || 0).toFixed(2)),
        r.totalRevenue.toFixed(2),
        r.avgRevenue.toFixed(2),
      ];
      csvLines.push(row.join(','));
    });

    const summary = [
      '"TOTAL"',
      '""',
      ...sortedDates.map(d => (campaignDailyTotals[d.key] || 0).toFixed(2)),
      campaignGrandTotal.toFixed(2),
      (sortedDates.length > 0 ? campaignGrandTotal / sortedDates.length : 0).toFixed(2),
    ];
    csvLines.push(summary.join(','));

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Campaign_7Day_Revenue_Matrix_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Chart data for daily trend
  const dailyChartData = useMemo(() => {
    return sortedDates.map(d => ({
      date: d.label,
      revenue: Math.round((dailyTotals[d.key] || 0) * 100) / 100,
    }));
  }, [sortedDates, dailyTotals]);

  // Top ET
  const topET = useMemo(() => {
    if (etRows.length === 0) return null;
    return [...etRows].sort((a, b) => b.totalRevenue - a.totalRevenue)[0];
  }, [etRows]);

  // Top Date
  const topDate = useMemo(() => {
    if (sortedDates.length === 0) return null;
    let bestKey = sortedDates[0].key;
    let bestVal = 0;
    sortedDates.forEach(d => {
      const val = dailyTotals[d.key] || 0;
      if (val > bestVal) {
        bestVal = val;
        bestKey = d.key;
      }
    });
    const info = sortedDates.find(d => d.key === bestKey);
    return { info, revenue: bestVal };
  }, [sortedDates, dailyTotals]);

  // Export CSV Handler
  const handleExportCSV = () => {
    const headers = ['ET Placement', ...sortedDates.map(d => d.label), 'Total Revenue', 'Avg Revenue'];
    const csvLines: string[] = [];
    csvLines.push(headers.join(','));

    displayRows.forEach(r => {
      const row = [
        `"${r.et}"`,
        ...sortedDates.map(d => (r.dateRevenues[d.key] || 0).toFixed(2)),
        r.totalRevenue.toFixed(2),
        r.avgRevenue.toFixed(2),
      ];
      csvLines.push(row.join(','));
    });

    // Summary line
    const summary = [
      '"TOTAL"',
      ...sortedDates.map(d => (dailyTotals[d.key] || 0).toFixed(2)),
      grandTotal.toFixed(2),
      (sortedDates.length > 0 ? grandTotal / sortedDates.length : 0).toFixed(2),
    ];
    csvLines.push(summary.join(','));

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ET_7Day_Revenue_Matrix_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (val: number) =>
    `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // ─────────────────────────────────────────────────────────────────────────
  // CONNECTED DUAL FILTER & DEEP-DIVE CALCULATIONS (Bottom Section)
  // ─────────────────────────────────────────────────────────────────────────

  // 1. All unique ETs sorted by revenue (for Filter 1)
  const drillETList = useMemo(() => {
    const etMap: Record<string, number> = {};
    data.records.forEach(r => {
      const et = r.et || 'Unknown';
      etMap[et] = (etMap[et] || 0) + r.revenue;
    });
    return Object.entries(etMap)
      .map(([et, total]) => ({ et, totalRevenue: total }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [data.records]);

  // 2. Campaigns that generated revenue under the selected ET (for Filter 2 & campaign table)
  // When drillET is 'ALL', includes all campaigns. When drillET is specific, strictly filters to that ET.
  const drillCampaignList = useMemo<DrillCampaignRow[]>(() => {
    const campMap: Record<string, { campaign: string; advertiser: string; dateRevenues: Record<string, number>; totalRevenue: number }> = {};
    const numDates = sortedDates.length || 1;
    let etTotalRevenue = 0;

    data.records.forEach(r => {
      if (drillET !== 'ALL' && r.et !== drillET) return;

      const campName = r.campaign || 'Unknown';
      const advName = r.advertiser || 'Other';
      const key = `${campName}:::${advName}`;

      const dInfo = fileDateMap.get(r.fileName) || detectDateFromFileName(r.fileName, contextMonth);
      const dKey = dInfo.key;

      if (!campMap[key]) {
        campMap[key] = {
          campaign: campName,
          advertiser: advName,
          dateRevenues: {},
          totalRevenue: 0,
        };
        sortedDates.forEach(d => {
          campMap[key].dateRevenues[d.key] = 0;
        });
      }

      campMap[key].dateRevenues[dKey] = (campMap[key].dateRevenues[dKey] || 0) + r.revenue;
      campMap[key].totalRevenue += r.revenue;
      etTotalRevenue += r.revenue;
    });

    return Object.entries(campMap)
      .filter(([_, item]) => item.totalRevenue > 0)
      .map(([key, item]) => {
        const activeDays = Object.values(item.dateRevenues).filter(v => v > 0).length;
        return {
          campaignKey: key,
          campaign: item.campaign,
          advertiser: item.advertiser,
          dateRevenues: item.dateRevenues,
          totalRevenue: item.totalRevenue,
          avgRevenue: item.totalRevenue / numDates,
          activeDaysCount: activeDays,
          percentageOfET: etTotalRevenue > 0 ? (item.totalRevenue / etTotalRevenue) * 100 : 0,
        };
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [data.records, drillET, sortedDates, fileDateMap, contextMonth]);

  // 3. Selected Campaign Metadata (if Filter 2 has an active campaign selection)
  const selectedCampaignMeta = useMemo(() => {
    if (drillCampaign === 'ALL') return null;
    return drillCampaignList.find(c => c.campaignKey === drillCampaign || c.campaign === drillCampaign) || null;
  }, [drillCampaign, drillCampaignList]);

  // 4. Drill Active Stats (Total Revenue, Day-by-Day Revenue for current ET & Campaign)
  const drillActiveStats = useMemo(() => {
    const dailyTotals: Record<string, number> = {};
    sortedDates.forEach(d => {
      dailyTotals[d.key] = 0;
    });

    let grandTotal = 0;

    data.records.forEach(r => {
      if (drillET !== 'ALL' && r.et !== drillET) return;
      if (drillCampaign !== 'ALL') {
        const key = `${r.campaign || 'Unknown'}:::${r.advertiser || 'Other'}`;
        if (key !== drillCampaign && r.campaign !== drillCampaign) return;
      }

      const dInfo = fileDateMap.get(r.fileName) || detectDateFromFileName(r.fileName, contextMonth);
      const dKey = dInfo.key;

      dailyTotals[dKey] = (dailyTotals[dKey] || 0) + r.revenue;
      grandTotal += r.revenue;
    });

    const numDates = sortedDates.length || 1;
    const avgDaily = grandTotal / numDates;
    const activeDays = Object.values(dailyTotals).filter(v => v > 0).length;

    let peakDateKey = '';
    let peakRevenue = 0;
    sortedDates.forEach(d => {
      if (dailyTotals[d.key] > peakRevenue) {
        peakRevenue = dailyTotals[d.key];
        peakDateKey = d.key;
      }
    });

    return {
      dailyTotals,
      grandTotal,
      avgDaily,
      activeDays,
      peakDateKey,
      peakRevenue,
    };
  }, [data.records, drillET, drillCampaign, sortedDates, fileDateMap, contextMonth]);

  // Filtered lists for custom select search
  const filteredDrillETList = useMemo(() => {
    if (!drillETSearch.trim()) return drillETList;
    const q = drillETSearch.toLowerCase().trim();
    return drillETList.filter(et => et.et.toLowerCase().includes(q));
  }, [drillETList, drillETSearch]);

  const filteredDrillCampaignList = useMemo(() => {
    if (!drillCampSearch.trim()) return drillCampaignList;
    const q = drillCampSearch.toLowerCase().trim();
    return drillCampaignList.filter(c =>
      c.campaign.toLowerCase().includes(q) ||
      c.advertiser.toLowerCase().includes(q)
    );
  }, [drillCampaignList, drillCampSearch]);

  // 5. Handlers for ET change and Campaign selection
  const handleDrillETChange = (newET: string) => {
    setDrillET(newET);
    setDrillCampaign('ALL'); // connected: automatically reset campaign filter
    setIsETDropdownOpen(false);
    setDrillETSearch('');
  };

  const handleSelectCampaign = (campKey: string) => {
    setDrillCampaign(campKey);
    setIsCampaignDropdownOpen(false);
    setDrillCampSearch('');
  };

  const handleResetDrillFilters = () => {
    setDrillET('ALL');
    setDrillCampaign('ALL');
    setIsETDropdownOpen(false);
    setIsCampaignDropdownOpen(false);
    setDrillETSearch('');
    setDrillCampSearch('');
  };

  // 6. Export CSV for Drill-Down
  const handleExportDrillCSV = () => {
    const headers = [
      'ET Placement',
      'Campaign',
      'Advertiser',
      ...sortedDates.map(d => d.label),
      'Total Revenue',
      'Avg Revenue',
      '% Share of ET',
    ];
    const csvLines: string[] = [];
    csvLines.push(headers.join(','));

    drillCampaignList.forEach(c => {
      const row = [
        `"${drillET === 'ALL' ? 'All ETs' : drillET}"`,
        `"${c.campaign.replace(/"/g, '""')}"`,
        `"${c.advertiser.replace(/"/g, '""')}"`,
        ...sortedDates.map(d => (c.dateRevenues[d.key] || 0).toFixed(2)),
        c.totalRevenue.toFixed(2),
        c.avgRevenue.toFixed(2),
        `${c.percentageOfET.toFixed(2)}%`,
      ];
      csvLines.push(row.join(','));
    });

    const summary = [
      '"TOTAL"',
      `"${drillCampaign === 'ALL' ? 'ALL CAMPAIGNS' : selectedCampaignMeta?.campaign || 'SELECTED'}"`,
      '""',
      ...sortedDates.map(d => (drillActiveStats.dailyTotals[d.key] || 0).toFixed(2)),
      drillActiveStats.grandTotal.toFixed(2),
      drillActiveStats.avgDaily.toFixed(2),
      '100%',
    ];
    csvLines.push(summary.join(','));

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ET_Campaign_Drilldown_${drillET !== 'ALL' ? drillET : 'All_ETs'}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      
      {/* ── Top Header Navigation Bar ── */}
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl backdrop-blur-xl border transition-all ${
        isDiwaliMode
          ? 'bg-gradient-to-r from-amber-50/70 via-white to-orange-50/50 border-amber-300/80 shadow-[0_4px_25px_rgba(245,158,11,0.12)]'
          : 'bg-white/80 border-slate-200/80 shadow-xs'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${
            isDiwaliMode
              ? 'bg-gradient-to-tr from-amber-500 to-orange-600 text-white shadow-amber-500/30'
              : 'bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-indigo-500/20'
          }`}>
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight flex items-center gap-2">
                <span>7-Day Multi-Date Report Panel</span>
                {isDiwaliMode && <DiyaLamp size={26} glow={false} />}
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/70 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {sortedDates.length} Dates Detected
              </span>
              {isDiwaliMode && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-100 to-orange-100 text-amber-900 border border-amber-300/80 shadow-2xs">
                  ✨ Shubh Deepavali
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium">
              ET Revenue Cross-Tab Matrix • Consolidated across {uploadedFiles.length} campaign files
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 shadow-2xs transition-all hover:border-slate-300 active:scale-95"
            title="Download full ET matrix as CSV"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-slate-900 hover:bg-indigo-600 text-white shadow-xs transition-all active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>New Upload</span>
          </button>
        </div>
      </div>

      {/* ── KPI Metric Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3.5">
        
        {/* Total Revenue */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Revenue</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {formatCurrency(grandTotal)}
            </div>
            <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
              Across all {sortedDates.length} reporting days
            </div>
          </div>
        </div>

        {/* Daily Average Revenue */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Daily Average</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {formatCurrency(sortedDates.length > 0 ? grandTotal / sortedDates.length : 0)}
            </div>
            <div className="text-[10px] text-blue-600 font-bold mt-0.5">
              Average per detected day
            </div>
          </div>
        </div>

        {/* Unique ETs */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Active ETs</span>
            <div className="w-7 h-7 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {allUniqueETs.length} Placements
            </div>
            <div className="text-[10px] text-violet-600 font-bold mt-0.5">
              Tracked across campaigns
            </div>
          </div>
        </div>

        {/* Top ET */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Top ET Placement</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Crown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-base sm:text-lg font-black text-slate-900 truncate">
              {topET?.et || 'N/A'}
            </div>
            <div className="text-[10px] text-amber-600 font-bold mt-0.5">
              {topET ? `${formatCurrency(topET.totalRevenue)} (${topET.percentage.toFixed(1)}%)` : '-'}
            </div>
          </div>
        </div>

        {/* Top Date */}
        <div className="hidden xl:flex p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Peak Revenue Date</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg font-black text-slate-900 truncate">
              {topDate?.info?.label || 'N/A'}
            </div>
            <div className="text-[10px] text-indigo-600 font-bold mt-0.5">
              {topDate ? formatCurrency(topDate.revenue) : '-'}
            </div>
          </div>
        </div>

      </div>

      {/* ── Daily Revenue Bar Chart ── */}
      {dailyChartData.length > 1 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Daily Revenue Trajectory
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                Total combined campaign revenue day-by-day
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {sortedDates.map(d => (
                <span
                  key={d.key}
                  className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200/60"
                >
                  {d.label}
                </span>
              ))}
            </div>
          </div>

          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} 
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                  tickFormatter={(val: number) => `$${(val / 1000).toFixed(0)}k`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(val: number) => [formatCurrency(val), 'Daily Revenue']}
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                />
                <Bar 
                  dataKey="revenue" 
                  fill="#4f46e5" 
                  radius={[6, 6, 0, 0]} 
                  maxBarSize={45}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── CORE TABLE: ET by Date Revenue Matrix ── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        
        {/* Table Controls Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>ET Revenue by Date Matrix</span>
              <span className="text-xs text-slate-400 font-normal">
                ({displayRows.length} ETs)
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Column 1 lists all ETs; subsequent columns show revenue broken down by each detected date
            </p>
          </div>

          {/* Search, Filter & Sorters */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            
            {/* Search Input */}
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search ET name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
              />
            </div>

            {/* Advertiser Filter Custom Dropdown */}
            <AdvertiserDropdown
              value={selectedAdvertiser}
              onChange={setSelectedAdvertiser}
              advertisers={allAdvertisers}
              accentColor="indigo"
            />

            {/* Sort Custom Dropdown */}
            <SortDropdown
              value={sortBy}
              onChange={setSortBy}
              options={etSortOptions}
              accentColor="indigo"
            />

            {/* Sort Direction Toggle */}
            <button
              type="button"
              onClick={() => setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'))}
              className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition-all hover:border-indigo-300 active:scale-95"
              title={`Toggle sort order (currently ${sortOrder === 'desc' ? 'High to Low' : 'Low to High'})`}
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-800">
                {sortOrder === 'desc' ? '↓ High' : '↑ Low'}
              </span>
            </button>
          </div>
        </div>

        {/* ── Table Container with Horizontal Scroll & Sticky First Column ── */}
        <div className="overflow-x-auto rounded-xl border border-slate-200/80 shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            
            {/* Header Row */}
            <thead>
              <tr className="bg-slate-50/90 text-slate-600 border-b border-slate-200">
                {/* Column 1: ET Name (Sticky) */}
                <th className="sticky left-0 bg-slate-50 z-20 py-3 px-4 font-black text-slate-800 uppercase tracking-wider text-[11px] min-w-[160px] shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                  ET Placement
                </th>

                {/* Date Columns */}
                {sortedDates.map(d => (
                  <th
                    key={d.key}
                    className="py-3 px-4 text-right font-black text-slate-700 uppercase tracking-wider text-[11px] min-w-[125px] border-l border-slate-100"
                  >
                    <div>{d.label}</div>
                    <div className="text-[9px] font-extrabold text-indigo-600 mt-0.5 normal-case">
                      {formatCurrency(dailyTotals[d.key] || 0)}
                    </div>
                  </th>
                ))}

                {/* Total Column */}
                <th className="py-3 px-4 text-right font-black text-slate-900 uppercase tracking-wider text-[11px] min-w-[135px] border-l border-slate-200 bg-indigo-50/40">
                  Total Revenue
                </th>

                {/* Avg Revenue Column (Sticky Right - Fixed) */}
                <th className="sticky right-0 bg-slate-50 z-20 py-3 px-4 text-right font-black text-slate-700 uppercase tracking-wider text-[11px] min-w-[130px] w-[130px] border-l border-slate-200 shadow-[-3px_0_6px_rgba(0,0,0,0.03)]">
                  Avg Revenue
                </th>
              </tr>
            </thead>

            {/* Body Rows */}
            <tbody className="divide-y divide-slate-100">
              {displayRows.length === 0 ? (
                <tr>
                  <td colSpan={sortedDates.length + 3} className="py-8 text-center text-slate-400 font-bold">
                    No ET placements found matching "{searchQuery}"
                  </td>
                </tr>
              ) : (
                displayRows.map((row, idx) => {
                  const isTop3 = idx < 3 && sortBy === 'total' && sortOrder === 'desc';
                  return (
                    <tr
                      key={row.et}
                      className="hover:bg-indigo-50/30 transition-colors group"
                    >
                      {/* Column 1: ET (Sticky) */}
                      <td className="sticky left-0 bg-white group-hover:bg-[#f8f9ff] z-10 py-2.5 px-4 font-bold text-slate-800 text-xs shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                        <div className="flex items-center gap-2">
                          {isTop3 ? (
                            <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-800 flex items-center justify-center text-[10px] font-black flex-shrink-0">
                              {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                            </span>
                          ) : (
                            <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-400 flex items-center justify-center text-[9px] font-bold flex-shrink-0">
                              {idx + 1}
                            </span>
                          )}
                          <span className="font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {row.et}
                          </span>
                        </div>
                      </td>

                      {/* Revenue for each Date */}
                      {sortedDates.map(d => {
                        const val = row.dateRevenues[d.key] || 0;
                        const hasRev = val > 0;
                        return (
                          <td
                            key={d.key}
                            className={`py-2.5 px-4 text-right font-medium border-l border-slate-100 ${
                              hasRev ? 'text-slate-800 font-semibold' : 'text-slate-300'
                            }`}
                          >
                            {hasRev ? formatCurrency(val) : '—'}
                          </td>
                        );
                      })}

                      {/* Total Revenue */}
                      <td className="py-2.5 px-4 text-right font-black text-slate-900 border-l border-slate-200 bg-indigo-50/20 group-hover:bg-indigo-50/40">
                        <span className="text-indigo-900 font-black">
                          {formatCurrency(row.totalRevenue)}
                        </span>
                      </td>

                      {/* Avg Revenue (Sticky Right - Fixed) */}
                      <td className="sticky right-0 bg-white group-hover:bg-[#f8f9ff] z-10 py-2.5 px-4 text-right font-bold text-slate-800 border-l border-slate-200 text-xs min-w-[130px] w-[130px] shadow-[-3px_0_6px_rgba(0,0,0,0.03)]">
                        {formatCurrency(row.avgRevenue)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Summary Footer Row */}
            <tfoot>
              <tr className="bg-slate-100/90 font-black border-t-2 border-slate-300">
                <td className="sticky left-0 bg-slate-100 z-10 py-3 px-4 text-slate-900 text-xs uppercase tracking-wider shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                  TOTAL REVENUE
                </td>

                {sortedDates.map(d => (
                  <td key={d.key} className="py-3 px-4 text-right text-indigo-700 text-xs font-black border-l border-slate-200">
                    {formatCurrency(dailyTotals[d.key] || 0)}
                  </td>
                ))}

                <td className="py-3 px-4 text-right text-emerald-700 text-sm font-black border-l border-slate-300 bg-emerald-50/60">
                  {formatCurrency(grandTotal)}
                </td>

                {/* Summary Avg Revenue (Sticky Right - Fixed) */}
                <td className="sticky right-0 bg-slate-100 z-10 py-3 px-4 text-right text-indigo-700 text-xs font-black border-l border-slate-200 min-w-[130px] w-[130px] shadow-[-3px_0_6px_rgba(0,0,0,0.03)]">
                  {formatCurrency(sortedDates.length > 0 ? grandTotal / sortedDates.length : 0)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

      </div>

      {/* ── Collapsible Advertiser Multi-Day Matrix ── */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-indigo-200 hover:shadow-sm transition-all relative">
        {isDiwaliMode && (
          <>
            <div className="absolute -top-6 left-6 z-20 pointer-events-none select-none transition-transform duration-300 hover:scale-110 drop-shadow-[0_8px_20px_rgba(245,158,11,0.5)]">
              <FloatingKandil size={32} threadLength={12} glow />
            </div>
            <div className="absolute -top-6 right-6 z-20 pointer-events-none select-none transition-transform duration-300 hover:scale-110 drop-shadow-[0_8px_20px_rgba(245,158,11,0.5)]">
              <FloatingKandil size={32} threadLength={12} glow />
            </div>
          </>
        )}
        {/* Full Clickable Header Card */}
        <div 
          className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer select-none hover:bg-slate-50/70 transition-colors group"
          onClick={() => setShowAdvMatrix(prev => !prev)}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform flex-shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 group-hover:text-indigo-600 transition-colors">
                  Advertiser Revenue Breakdown by Date
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/70 flex-shrink-0">
                  {advRows.length} Advertisers
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5 truncate">
                Cross-date performance across {advRows.length} advertisers (GZ, RGR, XCE, DB, Branded, CM AD, MI...)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total</span>
              <span className="text-xs font-black text-slate-900">{formatCurrency(grandTotal)}</span>
            </div>
            <div className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black transition-all border ${
              showAdvMatrix 
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' 
                : 'bg-indigo-50/90 text-indigo-700 border-indigo-200/70 group-hover:bg-indigo-100 group-hover:border-indigo-300'
            }`}>
              <span>{showAdvMatrix ? 'Collapse Matrix' : 'Expand Matrix'}</span>
              <ChevronRight className={`w-3.5 h-3.5 transform transition-transform duration-200 ${showAdvMatrix ? 'rotate-90' : ''}`} />
            </div>
          </div>
        </div>

        {showAdvMatrix && (
          <div className="border-t border-slate-100 px-4 sm:px-5 pb-5 pt-3 animate-fade-in">
            <div className="overflow-x-auto rounded-xl border border-slate-200/80 shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                    <th className="sticky left-0 bg-slate-50 z-10 py-2.5 px-4 font-black uppercase text-[10px] shadow-[2px_0_5px_rgba(0,0,0,0.02)]">Advertiser</th>
                    {sortedDates.map(d => (
                      <th key={d.key} className="py-2.5 px-4 text-right font-black uppercase text-[10px] border-l border-slate-100">
                        {d.label}
                      </th>
                    ))}
                    <th className="py-2.5 px-4 text-right font-black uppercase text-[10px] border-l border-slate-200 bg-slate-100">
                      Total
                    </th>
                    <th className="sticky right-0 bg-slate-50 z-10 py-2.5 px-4 text-right font-black uppercase text-[10px] border-l border-slate-200 min-w-[120px] w-[120px] shadow-[-3px_0_6px_rgba(0,0,0,0.03)]">
                      Avg Revenue
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {advRows.map(adv => (
                    <tr key={adv.advertiser} className="hover:bg-slate-50/80 group">
                      <td className="sticky left-0 bg-white group-hover:bg-slate-50 z-10 py-2 px-4 font-extrabold text-slate-800 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">{adv.advertiser}</td>
                      {sortedDates.map(d => {
                        const val = adv.dateRevenues[d.key] || 0;
                        return (
                          <td key={d.key} className="py-2 px-4 text-right font-medium text-slate-700 border-l border-slate-100">
                            {val > 0 ? formatCurrency(val) : '—'}
                          </td>
                        );
                      })}
                      <td className="py-2 px-4 text-right font-black text-indigo-900 border-l border-slate-200 bg-indigo-50/20">
                        {formatCurrency(adv.totalRevenue)}
                      </td>
                      <td className="sticky right-0 bg-white group-hover:bg-slate-50 z-10 py-2 px-4 text-right font-bold text-slate-700 border-l border-slate-200 text-xs min-w-[120px] w-[120px] shadow-[-3px_0_6px_rgba(0,0,0,0.03)]">
                        {formatCurrency(adv.avgRevenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Collapsible Campaign Revenue Matrix ── */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-emerald-200 hover:shadow-sm transition-all overflow-hidden">
        {/* Full Clickable Header Card */}
        <div 
          className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer select-none hover:bg-slate-50/70 transition-colors group"
          onClick={() => setShowCampaignMatrix(prev => !prev)}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform flex-shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 group-hover:text-emerald-700 transition-colors">
                  Campaign Revenue Breakdown by Date
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/70 flex-shrink-0">
                  {displayCampaignRows.length} Campaigns
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5 truncate">
                Each campaign mapped to its proper advertiser across all {sortedDates.length} reporting dates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total</span>
              <span className="text-xs font-black text-slate-900">{formatCurrency(campaignGrandTotal)}</span>
            </div>
            <div className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black transition-all border ${
              showCampaignMatrix 
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' 
                : 'bg-emerald-50/90 text-emerald-700 border-emerald-200/70 group-hover:bg-emerald-100 group-hover:border-emerald-300'
            }`}>
              <span>{showCampaignMatrix ? 'Collapse Matrix' : 'Expand Matrix'}</span>
              <ChevronRight className={`w-3.5 h-3.5 transform transition-transform duration-200 ${showCampaignMatrix ? 'rotate-90' : ''}`} />
            </div>
          </div>
        </div>

        {showCampaignMatrix && (
          <div className="border-t border-slate-100 px-4 sm:px-5 pb-5 pt-4 space-y-4 animate-fade-in">
            {/* Search, Filter, Sort & Export Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {/* Campaign Search Input */}
                <div className="relative flex-1 sm:w-48">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search campaign name..."
                    value={campaignSearch}
                    onChange={e => setCampaignSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                  />
                </div>

                {/* Campaign Advertiser Filter Custom Dropdown */}
                <AdvertiserDropdown
                  value={campaignAdvFilter}
                  onChange={setCampaignAdvFilter}
                  advertisers={allAdvertisers}
                  accentColor="emerald"
                />

                {/* Campaign Sort Custom Dropdown */}
                <SortDropdown
                  value={campaignSortBy}
                  onChange={setCampaignSortBy}
                  options={campaignSortOptions}
                  accentColor="emerald"
                />

                {/* Sort Order Direction Toggle */}
                <button
                  type="button"
                  onClick={() => setCampaignSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'))}
                  className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition-all hover:border-emerald-300 active:scale-95"
                  title={`Toggle sort order (currently ${campaignSortOrder === 'desc' ? 'High to Low' : 'Low to High'})`}
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                    {campaignSortOrder === 'desc' ? '↓ High' : '↑ Low'}
                  </span>
                </button>
              </div>

              {/* Export Campaign CSV */}
              <button
                onClick={handleExportCampaignCSV}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 shadow-2xs transition-all hover:border-slate-300"
                title="Export campaign matrix to CSV"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export CSV</span>
              </button>
            </div>

            {/* Campaign Matrix Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200/80 shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/90 text-slate-600 border-b border-slate-200">
                  {/* Column 1: Campaign (Sticky Left) */}
                  <th className="sticky left-0 bg-slate-50 z-20 py-3 px-4 font-black text-slate-800 uppercase tracking-wider text-[11px] min-w-[180px] shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                    Campaign
                  </th>

                  {/* Column 2: Proper Advertiser */}
                  <th className="py-3 px-3 font-black text-slate-700 uppercase tracking-wider text-[11px] min-w-[110px] border-l border-slate-100">
                    Advertiser
                  </th>

                  {/* Date Columns */}
                  {sortedDates.map(d => (
                    <th
                      key={d.key}
                      className="py-3 px-4 text-right font-black text-slate-700 uppercase tracking-wider text-[11px] min-w-[125px] border-l border-slate-100"
                    >
                      <div>{d.label}</div>
                      <div className="text-[9px] font-extrabold text-emerald-600 mt-0.5 normal-case">
                        {formatCurrency(campaignDailyTotals[d.key] || 0)}
                      </div>
                    </th>
                  ))}

                  {/* Total Revenue */}
                  <th className="py-3 px-4 text-right font-black text-slate-900 uppercase tracking-wider text-[11px] min-w-[135px] border-l border-slate-200 bg-emerald-50/40">
                    Total Revenue
                  </th>

                  {/* Avg Revenue Column (Sticky Right - Fixed) */}
                  <th className="sticky right-0 bg-slate-50 z-20 py-3 px-4 text-right font-black text-slate-700 uppercase tracking-wider text-[11px] min-w-[130px] w-[130px] border-l border-slate-200 shadow-[-3px_0_6px_rgba(0,0,0,0.03)]">
                    Avg Revenue
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {displayCampaignRows.length === 0 ? (
                  <tr>
                    <td colSpan={sortedDates.length + 4} className="py-8 text-center text-slate-400 font-bold">
                      No campaigns found matching criteria
                    </td>
                  </tr>
                ) : (
                  displayCampaignRows.map((row, idx) => {
                    const isTop3 = idx < 3 && campaignSortBy === 'total' && campaignSortOrder === 'desc';
                    const advStyle = getAdvertiserBadgeStyle(row.advertiser);
                    return (
                      <tr
                        key={`${row.campaign}-${row.advertiser}`}
                        className="hover:bg-emerald-50/20 transition-colors group"
                      >
                        {/* Column 1: Campaign Name (Sticky Left) */}
                        <td className="sticky left-0 bg-white group-hover:bg-[#f6faf8] z-10 py-2.5 px-4 font-bold text-slate-800 text-xs shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                          <div className="flex items-center gap-2">
                            {isTop3 ? (
                              <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-800 flex items-center justify-center text-[10px] font-black flex-shrink-0">
                                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                              </span>
                            ) : (
                              <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-400 flex items-center justify-center text-[9px] font-bold flex-shrink-0">
                                {idx + 1}
                              </span>
                            )}
                            <span className="font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors">
                              {row.campaign}
                            </span>
                          </div>
                        </td>

                        {/* Column 2: Proper Advertiser Badge */}
                        <td className="py-2.5 px-3 border-l border-slate-100">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${advStyle.bg} ${advStyle.text} ${advStyle.border}`}>
                            {row.advertiser}
                          </span>
                        </td>

                        {/* Date Columns */}
                        {sortedDates.map(d => {
                          const val = row.dateRevenues[d.key] || 0;
                          const hasRev = val > 0;
                          return (
                            <td
                              key={d.key}
                              className={`py-2.5 px-4 text-right font-medium border-l border-slate-100 ${
                                hasRev ? 'text-slate-800 font-semibold' : 'text-slate-300'
                              }`}
                            >
                              {hasRev ? formatCurrency(val) : '—'}
                            </td>
                          );
                        })}

                        {/* Total Revenue */}
                        <td className="py-2.5 px-4 text-right font-black text-slate-900 border-l border-slate-200 bg-emerald-50/20 group-hover:bg-emerald-50/40">
                          <span className="text-emerald-900 font-black">
                            {formatCurrency(row.totalRevenue)}
                          </span>
                        </td>

                        {/* Avg Revenue (Sticky Right - Fixed) */}
                        <td className="sticky right-0 bg-white group-hover:bg-[#f6faf8] z-10 py-2.5 px-4 text-right font-bold text-slate-800 border-l border-slate-200 text-xs min-w-[130px] w-[130px] shadow-[-3px_0_6px_rgba(0,0,0,0.03)]">
                          {formatCurrency(row.avgRevenue)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Summary Footer Row */}
              <tfoot>
                <tr className="bg-slate-100/90 font-black border-t-2 border-slate-300">
                  <td className="sticky left-0 bg-slate-100 z-10 py-3 px-4 text-slate-900 text-xs uppercase tracking-wider shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                    TOTAL REVENUE
                  </td>

                  <td className="py-3 px-3 text-slate-400 text-[10px] font-bold border-l border-slate-200">
                    {displayCampaignRows.length} camps
                  </td>

                  {sortedDates.map(d => (
                    <td key={d.key} className="py-3 px-4 text-right text-emerald-700 text-xs font-black border-l border-slate-200">
                      {formatCurrency(campaignDailyTotals[d.key] || 0)}
                    </td>
                  ))}

                  <td className="py-3 px-4 text-right text-emerald-800 text-sm font-black border-l border-slate-300 bg-emerald-50/60">
                    {formatCurrency(campaignGrandTotal)}
                  </td>

                  <td className="sticky right-0 bg-slate-100 z-10 py-3 px-4 text-right text-emerald-700 text-xs font-black border-l border-slate-200 min-w-[130px] w-[130px] shadow-[-3px_0_6px_rgba(0,0,0,0.03)]">
                    {formatCurrency(sortedDates.length > 0 ? campaignGrandTotal / sortedDates.length : 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>

    {/* ══════════════════════════════════════════════════════════════════════ */}
    {/* ── BOTTOM CONNECTED DUAL-FILTER ET & CAMPAIGN DEEP-DIVE EXPLORER ── */}
    {/* ══════════════════════════════════════════════════════════════════════ */}
    <div className={`rounded-2xl border overflow-hidden transition-all mt-6 ${
      isDiwaliMode
        ? 'bg-gradient-to-br from-white via-amber-50/20 to-orange-50/20 border-amber-200/80 shadow-[0_4px_25px_rgba(245,158,11,0.06)]'
        : 'bg-gradient-to-br from-white via-indigo-50/20 to-teal-50/20 border-indigo-100/70 shadow-[0_4px_20px_rgba(99,102,241,0.03)]'
    }`}>
      {/* Soft Colorful Header */}
      <div className={`px-5 py-4 border-b flex items-center justify-between gap-4 backdrop-blur-sm ${
        isDiwaliMode ? 'border-amber-100/80 bg-amber-50/25' : 'border-indigo-100/60 bg-white/70'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shadow-2xs flex-shrink-0 ${
            isDiwaliMode
              ? 'bg-gradient-to-tr from-amber-500/20 via-orange-500/20 to-yellow-500/20 text-amber-800 border-amber-300/80'
              : 'bg-gradient-to-tr from-indigo-500/15 via-violet-500/15 to-teal-500/15 text-indigo-700 border border-indigo-200/60'
          }`}>
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                <span>ET & Campaign Explorer</span>
                {isDiwaliMode && <DiyaLamp size={22} glow={false} />}
              </h3>
              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-2xs ${
                isDiwaliMode
                  ? 'text-amber-800 bg-amber-100/80 border border-amber-300'
                  : 'text-indigo-700 bg-indigo-50 border border-indigo-200/60'
              }`}>
                {isDiwaliMode ? '🪔 Connected' : 'Connected'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Daily revenue breakdown by placement and campaign
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {(drillET !== 'ALL' || drillCampaign !== 'ALL') && (
            <button
              type="button"
              onClick={handleResetDrillFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/60 transition-colors shadow-2xs"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          )}

          <button
            type="button"
            onClick={handleExportDrillCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs transition-colors"
          >
            <Download className="w-3 h-3" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* ── Custom Select Panels Container ── */}
        <div className="p-4 rounded-2xl bg-white/80 backdrop-blur-md border border-indigo-100/70 shadow-2xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* ── Custom Select 1: ET Placement ── */}
            <div className="relative" ref={etDropdownRef}>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  <span>ET Placement</span>
                </label>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-full">
                  {drillETList.length} placements
                </span>
              </div>

              {/* Trigger Button */}
              <button
                type="button"
                onClick={() => {
                  setIsETDropdownOpen(prev => !prev);
                  setIsCampaignDropdownOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 bg-white border text-left text-xs sm:text-sm rounded-xl px-3.5 py-2.5 transition-all shadow-2xs ${
                  isETDropdownOpen
                    ? 'border-indigo-400 ring-2 ring-indigo-400/20 bg-indigo-50/10'
                    : 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/5'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Layers className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  <span className="font-extrabold text-slate-800 truncate">
                    {drillET === 'ALL' ? 'All ET Placements' : drillET}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[11px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                    {drillET === 'ALL'
                      ? formatCurrency(grandTotal)
                      : formatCurrency(drillETList.find(e => e.et === drillET)?.totalRevenue || 0)}
                  </span>
                  {drillET !== 'ALL' && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDrillETChange('ALL');
                      }}
                      className="p-1 hover:bg-slate-200/80 rounded-full text-slate-400 hover:text-slate-700 transition-colors"
                      title="Clear placement filter"
                    >
                      <X className="w-3.5 h-3.5" />
                    </span>
                  )}
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isETDropdownOpen ? 'rotate-180 text-indigo-600' : ''}`} />
                </div>
              </button>

              {/* Custom Popover */}
              {isETDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-white/95 backdrop-blur-xl rounded-2xl border border-indigo-100 shadow-xl shadow-indigo-500/10 p-2.5 animate-fade-in">
                  {/* Search inside popover */}
                  <div className="relative mb-2">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={drillETSearch}
                      onChange={(e) => setDrillETSearch(e.target.value)}
                      placeholder="Search placement..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50/80 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-400/25 focus:border-indigo-400 outline-none transition-all placeholder:text-slate-400 font-medium"
                      autoFocus
                    />
                  </div>

                  {/* List of ET Options */}
                  <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                    {/* Option: All Placements */}
                    <div
                      onClick={() => handleDrillETChange('ALL')}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all ${
                        drillET === 'ALL'
                          ? 'bg-indigo-50 text-indigo-950 font-black border border-indigo-200/70 shadow-2xs'
                          : 'hover:bg-slate-50 text-slate-700 font-semibold'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {drillET === 'ALL' ? (
                          <Check className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                        ) : (
                          <span className="w-3.5 h-3.5" />
                        )}
                        <span>All ET Placements</span>
                      </div>
                      <span className="text-[11px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                        {formatCurrency(grandTotal)}
                      </span>
                    </div>

                    {/* Filtered ETs */}
                    {filteredDrillETList.length === 0 ? (
                      <div className="py-4 text-center text-xs text-slate-400 font-medium">
                        No placements match "{drillETSearch}"
                      </div>
                    ) : (
                      filteredDrillETList.map(et => {
                        const isSelected = drillET === et.et;
                        return (
                          <div
                            key={et.et}
                            onClick={() => handleDrillETChange(et.et)}
                            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-indigo-50 text-indigo-950 font-black border border-indigo-200/70 shadow-2xs'
                                : 'hover:bg-indigo-50/40 text-slate-700 font-medium hover:text-indigo-950'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              {isSelected ? (
                                <Check className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                              ) : (
                                <span className="w-3.5 h-3.5 flex-shrink-0" />
                              )}
                              <span className="font-bold text-slate-800 truncate">{et.et}</span>
                            </div>
                            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50/90 px-2 py-0.5 rounded-md border border-emerald-100 flex-shrink-0">
                              {formatCurrency(et.totalRevenue)}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ── Custom Select 2: Campaign (Connected) ── */}
            <div className="relative" ref={campaignDropdownRef}>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                  <span>Campaign (Under ET)</span>
                </label>
                <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200/60 px-2 py-0.5 rounded-full">
                  {drillCampaignList.length} campaigns
                </span>
              </div>

              {/* Trigger Button */}
              <button
                type="button"
                onClick={() => {
                  setIsCampaignDropdownOpen(prev => !prev);
                  setIsETDropdownOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 bg-white border text-left text-xs sm:text-sm rounded-xl px-3.5 py-2.5 transition-all shadow-2xs ${
                  isCampaignDropdownOpen
                    ? 'border-teal-400 ring-2 ring-teal-400/20 bg-teal-50/10'
                    : 'border-slate-200 hover:border-teal-300 hover:bg-teal-50/5'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Target className="w-4 h-4 text-teal-600 flex-shrink-0" />
                  {drillCampaign === 'ALL' ? (
                    <span className="font-extrabold text-slate-800 truncate">
                      All Campaigns ({drillCampaignList.length})
                    </span>
                  ) : selectedCampaignMeta ? (
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-black text-slate-900 truncate">
                        {selectedCampaignMeta.campaign}
                      </span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase border ${getAdvertiserBadgeStyle(selectedCampaignMeta.advertiser).bg} ${getAdvertiserBadgeStyle(selectedCampaignMeta.advertiser).text} ${getAdvertiserBadgeStyle(selectedCampaignMeta.advertiser).border}`}>
                        {selectedCampaignMeta.advertiser}
                      </span>
                    </div>
                  ) : (
                    <span className="font-bold text-slate-800 truncate">{drillCampaign}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {drillCampaign !== 'ALL' && selectedCampaignMeta && (
                    <span className="text-[11px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                      {formatCurrency(selectedCampaignMeta.totalRevenue)}
                    </span>
                  )}
                  {drillCampaign !== 'ALL' && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectCampaign('ALL');
                      }}
                      className="p-1 hover:bg-slate-200/80 rounded-full text-slate-400 hover:text-slate-700 transition-colors"
                      title="Clear campaign filter"
                    >
                      <X className="w-3.5 h-3.5" />
                    </span>
                  )}
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isCampaignDropdownOpen ? 'rotate-180 text-teal-600' : ''}`} />
                </div>
              </button>

              {/* Custom Popover */}
              {isCampaignDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-white/95 backdrop-blur-xl rounded-2xl border border-teal-100 shadow-xl shadow-teal-500/10 p-2.5 animate-fade-in">
                  {/* Search inside popover */}
                  <div className="relative mb-2">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={drillCampSearch}
                      onChange={(e) => setDrillCampSearch(e.target.value)}
                      placeholder="Search campaign or advertiser..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50/80 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-400/25 focus:border-teal-400 outline-none transition-all placeholder:text-slate-400 font-medium"
                      autoFocus
                    />
                  </div>

                  {/* List of Campaign Options */}
                  <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                    {/* Option: All Campaigns */}
                    <div
                      onClick={() => handleSelectCampaign('ALL')}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all ${
                        drillCampaign === 'ALL'
                          ? 'bg-teal-50 text-teal-950 font-black border border-teal-200/70 shadow-2xs'
                          : 'hover:bg-slate-50 text-slate-700 font-semibold'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {drillCampaign === 'ALL' ? (
                          <Check className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                        ) : (
                          <span className="w-3.5 h-3.5" />
                        )}
                        <span>All Campaigns</span>
                      </div>
                      <span className="text-[11px] font-bold text-teal-700 bg-teal-50/90 px-2 py-0.5 rounded-md border border-teal-100">
                        {drillCampaignList.length} total
                      </span>
                    </div>

                    {/* Filtered Campaigns */}
                    {filteredDrillCampaignList.length === 0 ? (
                      <div className="py-4 text-center text-xs text-slate-400 font-medium">
                        No campaigns match "{drillCampSearch}"
                      </div>
                    ) : (
                      filteredDrillCampaignList.map(c => {
                        const isSelected = drillCampaign === c.campaignKey || drillCampaign === c.campaign;
                        const advStyle = getAdvertiserBadgeStyle(c.advertiser);

                        return (
                          <div
                            key={c.campaignKey}
                            onClick={() => handleSelectCampaign(c.campaignKey)}
                            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-teal-50 text-teal-950 font-black border border-teal-200/70 shadow-2xs'
                                : 'hover:bg-teal-50/40 text-slate-700 font-medium hover:text-teal-950'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              {isSelected ? (
                                <Check className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                              ) : (
                                <span className="w-3.5 h-3.5 flex-shrink-0" />
                              )}
                              <span className="font-bold text-slate-800 truncate">{c.campaign}</span>
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase border ${advStyle.bg} ${advStyle.text} ${advStyle.border} flex-shrink-0`}>
                                {c.advertiser}
                              </span>
                            </div>
                            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50/90 px-2 py-0.5 rounded-md border border-emerald-100 flex-shrink-0">
                              {formatCurrency(c.totalRevenue)}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Soft Active Campaign Pill (when drilled down) */}
        {drillCampaign !== 'ALL' && selectedCampaignMeta && (
          <div className="py-2 px-3.5 rounded-xl bg-teal-50/70 border border-teal-200/70 flex items-center justify-between gap-2 text-xs shadow-2xs">
            <div className="flex items-center gap-2 truncate">
              <span className="text-teal-800 font-bold">Active Drill:</span>
              <span className="font-black text-slate-900 truncate">{selectedCampaignMeta.campaign}</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-black uppercase border ${getAdvertiserBadgeStyle(selectedCampaignMeta.advertiser).bg} ${getAdvertiserBadgeStyle(selectedCampaignMeta.advertiser).text} ${getAdvertiserBadgeStyle(selectedCampaignMeta.advertiser).border}`}>
                {selectedCampaignMeta.advertiser}
              </span>
              <span className="text-teal-800 font-black ml-1">
                {formatCurrency(drillActiveStats.grandTotal)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setDrillCampaign('ALL')}
              className="text-xs font-bold text-teal-700 hover:text-teal-900 bg-white px-2 py-0.5 rounded-full border border-teal-200 transition-colors flex-shrink-0 shadow-2xs"
            >
              Clear ×
            </button>
          </div>
        )}

        {/* Soft Colorful KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          
          {/* Card 1: Total Revenue (Soft Mint / Sage) */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/40 border border-emerald-200/60 shadow-2xs">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[11px] font-bold text-emerald-800/80 uppercase tracking-wide">
                Total Revenue
              </span>
              <div className="w-6 h-6 rounded-lg bg-emerald-100/80 text-emerald-700 flex items-center justify-center border border-emerald-200/60 shadow-2xs">
                <DollarSign className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-950 tracking-tight">
              {formatCurrency(drillActiveStats.grandTotal)}
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-emerald-700 font-medium">
              <span>{drillET !== 'ALL' ? `Placement: ${drillET}` : 'All placements'}</span>
              <span className="font-bold bg-emerald-100/80 px-1.5 py-0.2 rounded text-[10px]">
                {grandTotal > 0 ? `${((drillActiveStats.grandTotal / grandTotal) * 100).toFixed(1)}%` : '0%'}
              </span>
            </div>
          </div>

          {/* Card 2: Daily Avg Revenue (Soft Periwinkle / Indigo) */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-white to-violet-50/40 border border-indigo-200/60 shadow-2xs">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[11px] font-bold text-indigo-800/80 uppercase tracking-wide">
                Daily Avg
              </span>
              <div className="w-6 h-6 rounded-lg bg-indigo-100/80 text-indigo-700 flex items-center justify-center border border-indigo-200/60 shadow-2xs">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-indigo-950 tracking-tight">
              {formatCurrency(drillActiveStats.avgDaily)}
            </div>
            <div className="mt-1 text-[11px] text-indigo-700 font-medium">
              Across {sortedDates.length} reporting days
            </div>
          </div>

          {/* Card 3: Active Days (Soft Honey Amber) */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50/80 via-white to-orange-50/40 border border-amber-200/60 shadow-2xs">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[11px] font-bold text-amber-800/80 uppercase tracking-wide">
                Active Days
              </span>
              <div className="w-6 h-6 rounded-lg bg-amber-100/80 text-amber-800 flex items-center justify-center border border-amber-200/60 shadow-2xs">
                <Calendar className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-950 tracking-tight">
              {drillActiveStats.activeDays} <span className="text-xs font-semibold text-amber-600/80">/ {sortedDates.length}</span>
            </div>
            <div className="mt-1 text-[11px] text-amber-700 font-medium">
              {drillActiveStats.activeDays === sortedDates.length ? '100% active on all days' : `${drillActiveStats.activeDays} active days`}
            </div>
          </div>

          {/* Card 4: Campaigns (Soft Teal / Sky) */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-teal-50/80 via-white to-cyan-50/40 border border-teal-200/60 shadow-2xs">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[11px] font-bold text-teal-800/80 uppercase tracking-wide">
                Campaigns
              </span>
              <div className="w-6 h-6 rounded-lg bg-teal-100/80 text-teal-700 flex items-center justify-center border border-teal-200/60 shadow-2xs">
                <Target className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-teal-950 tracking-tight truncate">
              {drillCampaign !== 'ALL' ? (
                <span className="truncate block" title={selectedCampaignMeta?.campaign}>
                  {selectedCampaignMeta?.campaign || '1'}
                </span>
              ) : (
                `${drillCampaignList.length} Campaigns`
              )}
            </div>
            <div className="mt-1 text-[11px] text-teal-700 font-medium truncate">
              {drillCampaign !== 'ALL' ? `Adv: ${selectedCampaignMeta?.advertiser || ''}` : `Under this placement`}
            </div>
          </div>

        </div>

        {/* Soft Colorful Daily Breakdown Grid */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              Daily Revenue Timeline
            </span>
            <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50/80 px-2 py-0.5 rounded-full border border-indigo-200/50">
              {sortedDates.length} days detected
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {sortedDates.map((d) => {
              const dayRev = drillActiveStats.dailyTotals[d.key] || 0;
              const isPeak = d.key === drillActiveStats.peakDateKey && drillActiveStats.peakRevenue > 0;
              const sharePercent = drillActiveStats.grandTotal > 0
                ? ((dayRev / drillActiveStats.grandTotal) * 100).toFixed(1)
                : '0.0';

              return (
                <div
                  key={d.key}
                  className={`p-2.5 rounded-xl border transition-all ${
                    isPeak
                      ? 'bg-gradient-to-b from-amber-50/90 via-amber-50/40 to-white border-amber-300 ring-2 ring-amber-200/60 shadow-xs text-amber-950'
                      : dayRev > 0
                      ? 'bg-gradient-to-b from-white to-slate-50/60 border-slate-200/80 hover:border-indigo-300 hover:shadow-2xs text-slate-800'
                      : 'bg-slate-50/30 border-slate-100 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-bold text-slate-600">
                      {d.label}
                    </span>
                    {isPeak && (
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-100 text-amber-800 border border-amber-200/70 flex items-center gap-0.5">
                        <Crown className="w-2.5 h-2.5 text-amber-600" />
                        Top
                      </span>
                    )}
                  </div>

                  <div className={`text-sm font-black tracking-tight ${isPeak ? 'text-amber-950' : dayRev > 0 ? 'text-slate-900' : 'text-slate-400'}`}>
                    {formatCurrency(dayRev)}
                  </div>

                  <div className="mt-1 flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">Share</span>
                    <span className={`font-bold px-1.5 py-0.2 rounded ${
                      isPeak 
                        ? 'bg-amber-100/70 text-amber-800' 
                        : dayRev > 0 
                        ? 'bg-emerald-50 text-emerald-700' 
                        : 'text-slate-400'
                    }`}>
                      {sharePercent}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>

  </div>
);
};

export default SevenDayReportPanel;
