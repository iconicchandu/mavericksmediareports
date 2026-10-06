import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area } from 'recharts';
import { Download, FileText, TrendingUp, Users, Target, DollarSign, RefreshCw, Building2, Zap, Globe, Wifi, Award, Trophy, BarChart3, Search, X, Star, Activity, Layers, Hash, Calendar, AtSign, ChevronUp, ChevronDown, Crown, MoreVertical } from 'lucide-react';
import { ProcessedData, DataRecord, CreativeStats, CampaignStats, ETStats, AdvertiserStats } from '../types';

interface UploadedFile {
  name: string;
  data: ProcessedData;
}

interface DashboardProps {
  data: ProcessedData;
  uploadedFiles: UploadedFile[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onReset: () => void;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'];
const TOP_ET_COLOR = "#ffc83a";
const OTHER_ET_COLOR = "#1e40af";

// ---------------------- START: UI Accent Helpers ----------------------
// Accent color per advertiser to keep UI visually coherent
const getAdvertiserAccent = (name: string): string => {
  switch (name) {
    case 'Branded':
    case 'BRANDED':
      return '#6366F1'; // indigo
    case 'RGR':
      return '#F59E0B'; // amber
    case 'ICO':
      return '#14B8A6'; // teal for ICO
    case 'GZ':
      return '#8B5CF6'; // purple
    case 'MI':
      return '#3B82F6'; // blue
    case '7M':
      return '#0EA5E9';
    case 'CMAD':
      return '#F97316'; // orange
    case 'ES':
      return '#10B981'; // emerald
    case 'XC':
      return '#06B6D4'; // cyan
    case 'XC EXC':
    case 'XCE':
      return '#14B8A6'; // teal (XCE from subid format XCE/NADR/064IMG(30))
    case 'DB':
      return '#84CC16'; // lime
    case 'COMCAST':
      return '#F43F5E'; // rose
    case 'NON COMCAST':
      return '#EC4899'; // pink
    case 'Comcast':
      return '#DC2626'; // red
    case 'Other':
    case 'OTHER':
      return '#6B7280'; // gray
    default:
      return '#10B981'; // emerald fallback
  }
};

// Convert hex color to rgba with provided alpha for soft backgrounds
const hexToRgba = (hex: string, alpha: number): string => {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const isMIRecord = (r: DataRecord) =>
  (!!r.fileName && r.fileName.toUpperCase().includes('MI CAMPS') &&
    !!r.subid && /^MI(\/|_|$)/i.test(r.subid.trim())) ||
  (!!r.creative && r.creative.toUpperCase().includes('_MI'));

const isICORecord = (r: DataRecord) => r.advertiser === 'ICO';

const is7MRecord = (r: DataRecord) =>
  !!r.fileName && r.fileName.toUpperCase().includes('7M');

// Custom Tooltip for ET Revenue Charts
interface ETCustomTooltipProps {
  active?: boolean;
  payload?: any[];
}

const ETCustomTooltip: React.FC<ETCustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900/95 backdrop-blur-sm text-white px-3.5 py-2.5 rounded-xl shadow-xl border border-slate-800 text-xs">
        <p className="font-semibold text-slate-400 mb-0.5">{data.name}</p>
        <p className="text-sm font-black text-emerald-400">
          ${payload[0].value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>
    );
  }
  return null;
};

// Custom Tooltip for Campaign Revenue Chart
interface CampaignCustomTooltipProps {
  active?: boolean;
  payload?: any[];
}

const CampaignCustomTooltip: React.FC<CampaignCustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900/95 backdrop-blur-sm text-white px-3.5 py-2.5 rounded-xl shadow-xl border border-slate-800 text-xs">
        <p className="font-semibold text-slate-400 mb-0.5">{data.fullName}</p>
        <p className="text-sm font-black text-blue-400">
          ${payload[0].value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>
    );
  }
  return null;
};

const Dashboard: React.FC<DashboardProps> = ({ data, uploadedFiles, searchQuery, onSearchChange, onReset }) => {
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [selectedET, setSelectedET] = useState('');
  const [campaignPopup, setCampaignPopup] = useState<{
    isOpen: boolean;
    campaign: CampaignStats | null;
  }>({ isOpen: false, campaign: null });

  // Expanded ET state for advertiser breakdown
  const [expandedETs, setExpandedETs] = useState<Set<string>>(new Set());
  const [hoveredAdv, setHoveredAdv] = useState<string | null>(null);

  // Campaign filter for ET creative view
  const [selectedETCreativeFilter, setSelectedETCreativeFilter] = useState<string>('all');

  // States for advertiser details popup sorting/filtering
  const [advSearchQuery, setAdvSearchQuery] = useState('');
  const [advSortBy, setAdvSortBy] = useState<'revenue' | 'frequency' | 'name'>('revenue');
  const [advSortOrder, setAdvSortOrder] = useState<'asc' | 'desc'>('desc');

  // Helper to compute trend percentage and sparkline points for an advertiser
  const getAdvertiserTrendAndPoints = (advName: string) => {
    const advertiserRecords = data.records.filter(r => r.advertiser === advName);

    let trend = 0;
    let points = [30, 40, 35, 50, 45, 60];

    if (advertiserRecords.length > 5) {
      const chunks = 6;
      const chunkSize = Math.ceil(advertiserRecords.length / chunks);
      points = Array(chunks).fill(0);
      for (let i = 0; i < advertiserRecords.length; i++) {
        const idx = Math.min(chunks - 1, Math.floor(i / chunkSize));
        points[idx] += advertiserRecords[i].revenue;
      }

      const mid = Math.floor(chunks / 2);
      const firstHalf = points.slice(0, mid).reduce((a, b) => a + b, 0);
      const secondHalf = points.slice(mid).reduce((a, b) => a + b, 0);
      if (firstHalf > 0) {
        trend = ((secondHalf - firstHalf) / firstHalf) * 100;
      } else {
        trend = 15;
      }
    } else if (advertiserRecords.length > 0) {
      const charCodeSum = advName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const baseTrend = (charCodeSum % 20) - 8;
      trend = baseTrend;

      points = [
        10,
        12 + (charCodeSum % 4),
        15 + baseTrend * 0.2 + (charCodeSum % 3),
        18 + baseTrend * 0.4 + (charCodeSum % 5),
        22 + baseTrend * 0.6 + (charCodeSum % 2),
        25 + baseTrend
      ];
    } else {
      trend = 0;
      points = [10, 10, 10, 10, 10, 10];
    }

    if (trend > 999) trend = 999;
    if (trend < -99) trend = -99;

    return { trend, points };
  };

  // Helper to get historical trend data and points for an ET
  const getETTrendAndPoints = (etName: string) => {
    const etRecords = data.records.filter(r => r.et.toUpperCase() === etName.toUpperCase());

    let trend = 0;
    let points = [30, 40, 35, 50, 45, 60];

    if (etRecords.length > 5) {
      const chunks = 6;
      const chunkSize = Math.ceil(etRecords.length / chunks);
      points = Array(chunks).fill(0);
      for (let i = 0; i < etRecords.length; i++) {
        const idx = Math.min(chunks - 1, Math.floor(i / chunkSize));
        points[idx] += etRecords[i].revenue;
      }

      const mid = Math.floor(chunks / 2);
      const firstHalf = points.slice(0, mid).reduce((a, b) => a + b, 0);
      const secondHalf = points.slice(mid).reduce((a, b) => a + b, 0);
      if (firstHalf > 0) {
        trend = ((secondHalf - firstHalf) / firstHalf) * 100;
      } else {
        trend = 15;
      }
    } else if (etRecords.length > 0) {
      const charCodeSum = etName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const baseTrend = (charCodeSum % 20) - 8;
      trend = baseTrend;

      points = [
        10,
        12 + (charCodeSum % 4),
        15 + baseTrend * 0.2 + (charCodeSum % 3),
        18 + baseTrend * 0.4 + (charCodeSum % 5),
        22 + baseTrend * 0.6 + (charCodeSum % 2),
        25 + baseTrend
      ];
    } else {
      trend = 0;
      points = [10, 10, 10, 10, 10, 10];
    }

    return { trend, points };
  };

  // Helper to render a small sparkline using SVG
  const renderSparkline = (points: number[], accent: string, name: string) => {
    const minP = Math.min(...points);
    const maxP = Math.max(...points);
    const range = maxP - minP || 1;
    const width = 60;
    const height = 24;
    const padding = 2;

    const svgPoints = points.map((p, index) => {
      const x = (index / (points.length - 1)) * (width - 2 * padding) + padding;
      const y = height - padding - ((p - minP) / range) * (height - 2 * padding);
      return { x, y };
    });

    const linePath = svgPoints.reduce((acc, p, index) => {
      return acc + (index === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`);
    }, "");

    const fillPath = `${linePath} L ${svgPoints[svgPoints.length - 1].x} ${height} L ${svgPoints[0].x} ${height} Z`;
    const gradientId = `gradient-${name.replace(/[^a-zA-Z0-9]/g, '-')}`;

    return (
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity={0.25} />
            <stop offset="100%" stopColor={accent} stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <path
          d={fillPath}
          fill={`url(#${gradientId})`}
        />
        <path
          d={linePath}
          fill="none"
          stroke={accent}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  // 🕒 Live Date State
  const [currentDate, setCurrentDate] = useState<string>("");

  useEffect(() => {
    const updateDate = () => {
      const now = new Date();
      const formatted = now.toLocaleDateString("en-IN", {
        month: "long",
        day: "numeric",
      });
      setCurrentDate(formatted);
    };

    updateDate(); // run immediately
    const interval = setInterval(updateDate, 1000 * 60); // update every minute
    return () => clearInterval(interval);
  }, []);
  // END 🕒 Live Date State


  // 🎯 Target revenue map (keys stored normalized)
  const rawTargetRevenueMap: Record<string, string> = {
    "JSG26MET": "$1200",
    "JSG50": "$1200",
    "JSG34NC": "$500",
    "JSG52": "$1200",
    "JSG38NR": "$1200",
    "JSG60": "$1000",
    "JSG30MET": "$1000",
    "JSG47": "$1000",
    "JSG36MET": "$1000",
    "COMCAST": "$1000",
    "JSG41MET": "$500",
    "JSG55": "$500",
    "JSG48MET": "$500"
  };


  // ✅ Build normalized map (uppercased + trimmed keys)
  const targetRevenueMap: Record<string, string> = Object.keys(rawTargetRevenueMap).reduce(
    (acc, k) => {
      acc[k.trim().toUpperCase()] = rawTargetRevenueMap[k];
      return acc;
    },
    {} as Record<string, string>
  );

  // ✅ Safe helper to get target revenue for an ET name
  const getTargetRevenue = (etName?: string): string => {
    if (!etName) return "NA"; // return string instead of number for consistency
    const key = etName.trim().toUpperCase();
    return targetRevenueMap[key] ?? "NA";
  };
  // -----------------------

  // -------------🧮 Calculate total of only numeric target revenues (ignore mixed strings)
  let totalTargetRevenue = 0;

  // ✅ Safely calculate totalRevenue if not already defined
  let totalRevenue = 0;
  if (Array.isArray(data.records)) {
    totalRevenue = data.records.reduce((sum, et) => {
      const rev = Number(getTargetRevenue(et.et)) || 0;
      return sum + rev;
    }, 0);
  }

  Object.values(targetRevenueMap).forEach((value) => {
    if (!value) return;

    const cleaned = value.toString().trim();

    // ❌ Skip ET-like references (e.g., "JSG36", "CM41", "EX32")
    if (/^[A-Z]+\d+$/i.test(cleaned)) return;

    // ✅ Match only valid numeric or $ values: "$1800", "1,800", "$ 1,800", "1800"
    const match = cleaned.match(/^\$?\s*[\d,]+(\.\d+)?$/);

    if (match) {
      const num = parseFloat(cleaned.replace(/[$,\s]/g, ""));
      if (!isNaN(num) && isFinite(num)) {
        totalTargetRevenue += num;
      }
    }
  });

  // NOTE: don't multiply here — we'll decide display-time multiplication
  // after analytics.totalRevenue is known to avoid mixing data sources.
  // -----------------------


  // -------------------💡 Safe display for ET revenue target (handles numbers, strings, and mixed values)
  const displayTargetRevenue = (etName: string, totalRevenue: number) => {
    const rawValue = getTargetRevenue(etName); // e.g. "1100", "Demo", "Demo 1100"
    if (!rawValue) return "0";

    // Check if value has both letters and digits
    const hasLetters = /[a-zA-Z]/.test(rawValue);
    const hasNumbers = /\d/.test(rawValue);

    // If both letters and numbers exist → return as-is (no math)
    if (hasLetters && hasNumbers) {
      return rawValue;
    }

    // If only numbers → apply multiplication when totalRevenue >= 40000
    if (hasNumbers && !hasLetters) {
      const numericValue = parseFloat(rawValue.replace(/[^0-9.]/g, ""));
      const multiplied = numericValue * (totalRevenue >= 40000 ? 7 : 1);
      return multiplied.toLocaleString();
    }

    // If only letters → return as-is
    return rawValue;
  };
  // ---End of------For Weekly Revenue (Multiply by 7)-----------

  // Helper to render target vs revenue comparison (+/- difference)
  const renderTargetComparison = (etName: string, etRevenue: number, totalRevenue: number, isDarkVariant = false) => {
    const rawValue = getTargetRevenue(etName);
    if (!rawValue || rawValue === "NA") return null;

    const hasLetters = /[a-zA-Z]/.test(rawValue);
    const hasNumbers = /\d/.test(rawValue);

    if (hasLetters || !hasNumbers) return null;

    const numericValue = parseFloat(rawValue.replace(/[^0-9.]/g, ""));
    const targetVal = numericValue * (totalRevenue >= 40000 ? 7 : 1);

    const diff = etRevenue - targetVal;
    const isPositive = diff >= 0;
    const formattedDiff = Math.abs(diff).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    if (isPositive) {
      return (
        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${isDarkVariant
          ? 'bg-emerald-500/25 text-emerald-950'
          : 'bg-emerald-50 text-emerald-600'
          } inline-block shadow-sm`}>
          +${formattedDiff}
        </span>
      );
    } else {
      return (
        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${isDarkVariant
          ? 'bg-rose-500/25 text-rose-950'
          : 'bg-rose-50 text-rose-500'
          } inline-block shadow-sm`}>
          -${formattedDiff}
        </span>
      );
    }
  };
  // Helper to check target status: 'met', 'not-met', or 'none' (if target is NA or not found)
  const checkTargetStatus = (etName: string, etRevenue: number, totalRevenue: number): 'met' | 'not-met' | 'none' => {
    const rawValue = getTargetRevenue(etName);
    if (!rawValue || rawValue === "NA") return 'none';

    const hasLetters = /[a-zA-Z]/.test(rawValue);
    const hasNumbers = /\d/.test(rawValue);

    if (hasLetters || !hasNumbers) return 'none';

    const numericValue = parseFloat(rawValue.replace(/[^0-9.]/g, ""));
    const targetVal = numericValue * (totalRevenue >= 40000 ? 7 : 1);

    return etRevenue >= targetVal ? 'met' : 'not-met';
  };

  // ------------------ET Info Stack,Manager-----
  // 👥 ET Information Map (Stack, Manager, and optional Type)
  const etInfoMap: Record<
    string,
    { stack: string; manager: string; type?: string }
  > = {
    // S1
    "JSG45": { stack: "S1", manager: "Aditya G." },
    "JSG41MET": { stack: "S1", manager: "Satyam S." },
    "JSG48MET": { stack: "S1", manager: "Abhay S." },
    "C48MET": { stack: "S1", manager: "Abhay S." },
    "C41MET": { stack: "S1", manager: "Abhay S." },
    "JSG55": { stack: "S1", manager: "Kaif K." },

    // S4
    "JSG34NC": { stack: "S4", manager: "Keshav T." },
    "JSG34C": { stack: "S4", manager: "Abhay S." },

    // S6
    "JSG36MET": { stack: "S6", manager: "Aditya G." },
    "C36": { stack: "S6", manager: "Abhay S." },

    // S7
    "JSG26MET": { stack: "S7", manager: "Aman P." },
    "JSG30MET": { stack: "S7", manager: "Aditya S." },
    "C30": { stack: "S7", manager: "Aditya S." },
    "JSG47": { stack: "S7", manager: "Keshav T." },
    "C47MET": { stack: "S7", manager: "Abhay S." },
    "JSG47NC": { stack: "S7", manager: "Keshav T." },
    "JSG50": { stack: "S7", manager: "Vaibhav G." },

    // S10
    "JSG60": { stack: "S10", manager: "Harsh G." },

    // S11
    "JSG44": { stack: "S11", manager: "Harsh G." },
    "JSG44NC": { stack: "S11", manager: "Harsh G." },
    "JSG53MET": { stack: "S11", manager: "Harsh G." },
    "JSG53NC": { stack: "S11", manager: "Harsh G." },
    "JSG56": { stack: "S11", manager: "Abhay S." },
    "C56MET": { stack: "S11", manager: "Abhay S." },

    // S12
    "JSG38N": { stack: "S12", manager: "Kaif K." },
    "JSG38NR": { stack: "S12", manager: "Kaif K." },
    "JSG40": { stack: "S12", manager: "Keshav T." },
    "JSG52": { stack: "S12", manager: "Keshav T." },
    "JSG52C": { stack: "S12", manager: "Keshav T." },

    // S13
    "JSG43MET": { stack: "S13", manager: "Vaibhav G." },
    "JSG43NC": { stack: "S13", manager: "Vaibhav G." },
  };

  // 🔍 Get ET Info (safe helper, case-insensitive)
  const getETInfo = (etName: string) => {
    const upperET = etName.toUpperCase();
    return etInfoMap[upperET] || etInfoMap[etName] || null;
  };

  // --------------------------------------

  const toggleET = (etName: string) => {
    setExpandedETs(prev => {
      const next = new Set(prev);
      if (next.has(etName)) {
        next.delete(etName);
      } else {
        next.add(etName);
      }
      return next;
    });
  };

  const analytics = useMemo(() => {
    const totalRevenue = data.records.reduce((sum, record) => sum + record.revenue, 0);

    // 💰 If total revenue hits or exceeds 40,000
    const isRevenueHigh = totalRevenue >= 40000;

    // Advertiser stats
    const advertiserStats = new Map<string, AdvertiserStats>();

    // MI: when file name is "MI CAMPS" and subid starts with "MI" (e.g. MI/JGWDS)
    // OR when creative name contains "_MI" (e.g., JG_225_OG2_IMG_MI, VPU_ADV_002_MI)
    const isMIRecord = (r: DataRecord) =>
      (!!r.fileName && r.fileName.toUpperCase().includes('MI CAMPS') &&
        !!r.subid && /^MI(\/|_|$)/i.test(r.subid.trim())) ||
      (!!r.creative && r.creative.toUpperCase().includes('_MI'));

    // ICO: records with advertiser 'ICO' (creatives starting with ICO from RGR files)
    const isICORecord = (r: DataRecord) => r.advertiser === 'ICO';
    const is7MRecord = (r: DataRecord) =>
      !!r.fileName && r.fileName.toUpperCase().includes('7M');

    // Custom MI aggregation: file name "MI CAMPS" + subid starting with MI; sum all such revenue
    let miRevenue = 0;
    let miCampaigns: Set<string> = new Set();

    data.records.forEach(record => {
      if (isMIRecord(record)) {
        miRevenue += record.revenue;
        miCampaigns.add(record.campaign);
      }
    });

    // Calculate MI frequency
    let miFrequency = 0;
    data.records.forEach(record => {
      if (isMIRecord(record)) {
        miFrequency += record.conv ?? 1;
      }
    });

    if (miRevenue > 0) {
      advertiserStats.set("MI", {
        name: "MI",
        revenue: miRevenue,
        campaigns: Array.from(miCampaigns) as string[],
        frequency: miFrequency,
      });
    }

    let sevenMRevenue = 0;
    const sevenMCampaigns: Set<string> = new Set();
    data.records.forEach(record => {
      if (is7MRecord(record)) {
        sevenMRevenue += record.revenue;
        sevenMCampaigns.add(record.campaign);
      }
    });
    let sevenMFrequency = 0;
    data.records.forEach(record => {
      if (is7MRecord(record)) {
        sevenMFrequency += record.conv ?? 1;
      }
    });
    if (sevenMRevenue > 0) {
      advertiserStats.set("7M", {
        name: "7M",
        revenue: sevenMRevenue,
        campaigns: Array.from(sevenMCampaigns) as string[],
        frequency: sevenMFrequency,
      });
    }

    // Custom ICO aggregation: creatives starting with ICO (separated from RGR)
    let icoRevenue = 0;
    let icoCampaigns: Set<string> = new Set();
    let icoFrequency = 0;

    data.records.forEach(record => {
      if (isICORecord(record)) {
        icoRevenue += record.revenue;
        icoCampaigns.add(record.campaign);
        icoFrequency += record.conv ?? 1;
      }
    });

    if (icoRevenue > 0) {
      advertiserStats.set("ICO", {
        name: "ICO",
        revenue: icoRevenue,
        campaigns: Array.from(icoCampaigns) as string[],
        frequency: icoFrequency,
      });
    }

    // Map each campaign name to the set of advertisers it belongs to
    const campaignAdvertisers = new Map<string, Set<string>>();
    data.records.forEach(record => {
      const advertiserKey = isMIRecord(record)
        ? 'MI'
        : isICORecord(record)
          ? 'ICO'
          : is7MRecord(record)
            ? '7M'
            : record.advertiser;
      if (!campaignAdvertisers.has(record.campaign)) {
        campaignAdvertisers.set(record.campaign, new Set());
      }
      campaignAdvertisers.get(record.campaign)!.add(advertiserKey);
    });

    // Campaign stats
    const campaignStats = new Map<string, CampaignStats>();

    // ET stats (use normalized uppercase ET names as keys)
    const etStats = new Map<string, ETStats>();

    // Creative stats by campaign
    const creativesByCampaign = new Map<string, Map<string, CreativeStats>>();

    // Creative stats by ET (use normalized uppercase ET names as keys)
    const creativesByET = new Map<string, Map<string, CreativeStats>>();

    data.records.forEach(record => {
      // Normalize ET name to uppercase for consistent grouping
      const normalizedET = record.et.toUpperCase();

      // Advertiser stats (exclude MI CAMPS + subid starting with MI and ICO records from base advertisers)
      const isMI = isMIRecord(record);
      const isICO = isICORecord(record);
      const is7M = is7MRecord(record);
      const advertiserKey = isMI
        ? 'MI'
        : isICO
          ? 'ICO'
          : is7M
            ? '7M'
            : record.advertiser;

      if (!isMI && !isICO && !is7M) {
        if (!advertiserStats.has(record.advertiser)) {
          advertiserStats.set(record.advertiser, {
            name: record.advertiser,
            revenue: 0,
            campaigns: [],
            frequency: 0,
          });
        }
        const advertiser = advertiserStats.get(record.advertiser)!;
        advertiser.revenue += record.revenue;
        advertiser.frequency = (advertiser.frequency || 0) + (record.conv ?? 1);

        // Use separated name for advertiser.campaigns
        const hasMultiple = campaignAdvertisers.get(record.campaign)!.size > 1;
        const displayName = hasMultiple ? `${record.campaign} (${advertiserKey})` : record.campaign;
        if (!advertiser.campaigns.includes(displayName)) {
          advertiser.campaigns.push(displayName);
        }
      }

      // Campaign stats keying and naming
      const hasMultipleAdvertisers = campaignAdvertisers.get(record.campaign)!.size > 1;
      const campaignKey = hasMultipleAdvertisers ? `${record.campaign}_${advertiserKey}` : record.campaign;
      const campaignDisplayName = hasMultipleAdvertisers ? `${record.campaign} (${advertiserKey})` : record.campaign;

      if (!campaignStats.has(campaignKey)) {
        campaignStats.set(campaignKey, {
          name: campaignDisplayName,
          revenue: 0,
          creatives: [],
          ets: [],
          advertiser: advertiserKey,
          originalCampaignName: record.campaign
        });
      }
      const campaign = campaignStats.get(campaignKey)!;
      campaign.revenue += record.revenue;
      if (!campaign.ets.includes(normalizedET)) {
        campaign.ets.push(normalizedET);
      }

      // ET stats (use normalized uppercase name as key, but store uppercase as display name)
      if (!etStats.has(normalizedET)) {
        etStats.set(normalizedET, {
          name: normalizedET,
          revenue: 0,
          creatives: [],
          campaigns: [],
          advertisers: new Map<string, number>(), // 👈 track advertisers
        });
      }
      const et = etStats.get(normalizedET)!;
      et.revenue += record.revenue;
      if (!et.campaigns.includes(campaignDisplayName)) {
        et.campaigns.push(campaignDisplayName);
      }

      // Track advertiser revenue inside ET (map MI CAMPS + subid starting with MI to 'MI', ICO to 'ICO')
      if (!et.advertisers.has(advertiserKey)) {
        et.advertisers.set(advertiserKey, 0);
      }
      et.advertisers.set(advertiserKey, et.advertisers.get(advertiserKey)! + record.revenue);

      // Creatives by campaign
      if (!creativesByCampaign.has(campaignKey)) {
        creativesByCampaign.set(campaignKey, new Map());
      }
      const campaignCreatives = creativesByCampaign.get(campaignKey)!;
      if (!campaignCreatives.has(record.creative)) {
        campaignCreatives.set(record.creative, {
          name: record.creative,
          frequency: 0,
          revenue: 0,
          ets: []
        });
      }
      const campaignCreative = campaignCreatives.get(record.creative)!;
      campaignCreative.frequency += record.conv ?? 1; // Use CONV value if available, otherwise 1
      campaignCreative.revenue += record.revenue;
      if (!campaignCreative.ets.includes(normalizedET)) {
        campaignCreative.ets.push(normalizedET);
      }

      // Creatives by ET (use normalized uppercase ET name as key)
      if (!creativesByET.has(normalizedET)) {
        creativesByET.set(normalizedET, new Map());
      }
      const etCreatives = creativesByET.get(normalizedET)!;
      if (!etCreatives.has(record.creative)) {
        etCreatives.set(record.creative, {
          name: record.creative,
          frequency: 0,
          revenue: 0,
          ets: []
        });
      }
      const etCreative = etCreatives.get(record.creative)!;
      etCreative.frequency += record.conv ?? 1; // Use CONV value if available, otherwise 1
      etCreative.revenue += record.revenue;
      if (!etCreative.ets.includes(normalizedET)) {
        etCreative.ets.push(normalizedET);
      }
    });

    // Convert maps to arrays and sort
    campaignStats.forEach((campaign, campaignName) => {
      const creatives = Array.from(creativesByCampaign.get(campaignName)?.values() || [])
        .sort((a, b) => b.frequency - a.frequency);
      campaign.creatives = creatives;
    });

    etStats.forEach((et, etName) => {
      const creatives = Array.from(creativesByET.get(etName)?.values() || [])
        .sort((a, b) => b.frequency - a.frequency);
      et.creatives = creatives;

      // Convert advertisers Map → array for rendering
      et.advertisersArray = Array.from(et.advertisers.entries())
        .map(([name, revenue]) => ({ name, revenue }))
        .sort((a, b) => b.revenue - a.revenue);
    });

    // Helper function to combine two ETs
    const combineETs = (et1Name: string, et2Name: string, combinedName: string) => {
      const et1Data = etStats.get(et1Name);
      const et2Data = etStats.get(et2Name);

      if (!et1Data && !et2Data) return;

      const combinedET: ETStats & { et1Revenue?: number; et2Revenue?: number; et1Name?: string; et2Name?: string } = {
        name: combinedName,
        revenue: (et1Data?.revenue || 0) + (et2Data?.revenue || 0),
        creatives: [],
        campaigns: [],
        advertisers: new Map<string, number>(),
        et1Revenue: et1Data?.revenue || 0,
        et2Revenue: et2Data?.revenue || 0,
        et1Name: et1Name,
        et2Name: et2Name,
      };

      // Combine creatives
      const combinedCreatives = new Map<string, CreativeStats>();
      if (et1Data) {
        et1Data.creatives.forEach(c => {
          if (!combinedCreatives.has(c.name)) {
            combinedCreatives.set(c.name, { ...c, ets: [] });
          } else {
            const existing = combinedCreatives.get(c.name)!;
            existing.frequency += c.frequency;
            existing.revenue += c.revenue;
          }
        });
      }
      if (et2Data) {
        et2Data.creatives.forEach(c => {
          if (!combinedCreatives.has(c.name)) {
            combinedCreatives.set(c.name, { ...c, ets: [] });
          } else {
            const existing = combinedCreatives.get(c.name)!;
            existing.frequency += c.frequency;
            existing.revenue += c.revenue;
          }
        });
      }
      combinedET.creatives = Array.from(combinedCreatives.values())
        .sort((a, b) => b.frequency - a.frequency);

      // Combine campaigns
      const combinedCampaigns = new Set<string>();
      if (et1Data) et1Data.campaigns.forEach(c => combinedCampaigns.add(c));
      if (et2Data) et2Data.campaigns.forEach(c => combinedCampaigns.add(c));
      combinedET.campaigns = Array.from(combinedCampaigns);

      // Combine advertisers
      if (et1Data) {
        et1Data.advertisers.forEach((revenue, name) => {
          const current = combinedET.advertisers.get(name) || 0;
          combinedET.advertisers.set(name, current + revenue);
        });
      }
      if (et2Data) {
        et2Data.advertisers.forEach((revenue, name) => {
          const current = combinedET.advertisers.get(name) || 0;
          combinedET.advertisers.set(name, current + revenue);
        });
      }
      combinedET.advertisersArray = Array.from(combinedET.advertisers.entries())
        .map(([name, revenue]) => ({ name, revenue }))
        .sort((a, b) => b.revenue - a.revenue);

      // Remove individual ETs from etStats
      etStats.delete(et1Name);
      etStats.delete(et2Name);

      // Add combined ET
      etStats.set(combinedName, combinedET);
    };

    // Combine ETs - Add your combinations here
    // combineETs('JSG43', 'JSG43MET', 'JSG43+MET');
    // For Pie and Bar chart
    return {
      totalRevenue,
      advertiserStats: Array.from(advertiserStats.values()).sort((a, b) => b.revenue - a.revenue),
      campaignStats: Array.from(campaignStats.values()).sort((a, b) => b.revenue - a.revenue),
      etStats: Array.from(etStats.values()).sort((a, b) => b.revenue - a.revenue),
      etChartData: Array.from(etStats.values())
        .map(et => ({
          name: et.name,
          value: et.revenue,
        }))
        .sort((a, b) => b.value - a.value), // 👈 sorts descending by revenue
    };
  }, [data]);

  // Helper to get the display name of a campaign for a record
  const getRecordCampaignDisplayName = (record: DataRecord) => {
    const advertiserKey = isMIRecord(record)
      ? 'MI'
      : isICORecord(record)
        ? 'ICO'
        : is7MRecord(record)
          ? '7M'
          : record.advertiser;
    // Find the campaign in campaignStats that matches this record
    const campaign = analytics.campaignStats.find(c =>
      c.originalCampaignName === record.campaign && c.advertiser === advertiserKey
    );
    return campaign ? campaign.name : record.campaign;
  };

  // Helper to match a record to a campaign statistics object
  const isRecordForCampaign = (r: DataRecord, campaign: CampaignStats) => {
    const advertiserKey = isMIRecord(r)
      ? 'MI'
      : isICORecord(r)
        ? 'ICO'
        : is7MRecord(r)
          ? '7M'
          : r.advertiser;
    return r.campaign === (campaign.originalCampaignName || campaign.name) &&
      (campaign.advertiser === undefined || advertiserKey === campaign.advertiser);
  };

  // Displayed total target: multiply by 7 when overall revenue is > 40000
  const displayedTotalTargetRevenue = totalTargetRevenue * (analytics.totalRevenue > 40000 ? 7 : 1);

  // Search functionality
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;

    const query = searchQuery.toLowerCase();
    const matchingRecords = data.records.filter(record =>
      record.creative.toLowerCase().includes(query)
    );

    if (matchingRecords.length === 0) return null;

    // Group by creative name
    const creativeGroups = new Map<string, {
      creative: string;
      totalRevenue: number;
      frequency: number;
      campaigns: Set<string>;
      ets: Set<string>;
      advertisers: Set<string>;
      records: DataRecord[];
    }>();

    matchingRecords.forEach(record => {
      if (!creativeGroups.has(record.creative)) {
        creativeGroups.set(record.creative, {
          creative: record.creative,
          totalRevenue: 0,
          frequency: 0,
          campaigns: new Set(),
          ets: new Set(),
          advertisers: new Set(),
          records: []
        });
      }

      const group = creativeGroups.get(record.creative)!;
      group.totalRevenue += record.revenue;
      group.frequency += record.conv ?? 1; // Use CONV value if available, otherwise 1
      group.campaigns.add(getRecordCampaignDisplayName(record));
      group.ets.add(record.et.toUpperCase());
      group.advertisers.add(record.advertiser);
      group.records.push(record);
    });

    return Array.from(creativeGroups.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [searchQuery, data.records]);
  const selectedCampaignData = useMemo(() => {
    if (!selectedCampaign) return null;
    return analytics.campaignStats.find(c => c.name === selectedCampaign);
  }, [selectedCampaign, analytics]);

  // Helper function to get individual ET names from a combined ET or return the ET name itself
  const getETNamesForFilter = (etName: string): string[] => {
    if (etName.includes('+')) {
      // Split combined ET like "JSG20+JSG44" into ["JSG20", "JSG44"]
      return etName.split('+').map(et => et.trim().toUpperCase());
    }
    return [etName.toUpperCase()];
  };

  const selectedETData = useMemo(() => {
    if (!selectedET) return null;
    return analytics.etStats.find(e => e.name.toUpperCase() === selectedET.toUpperCase());
  }, [selectedET, analytics]);

  // Get individual ETs data when a combined ET is selected
  const individualETsData = useMemo(() => {
    if (!selectedETData || !selectedETData.name.includes('+')) return null;

    const combinedET = selectedETData as any;
    const et1Name = combinedET.et1Name;
    const et2Name = combinedET.et2Name;

    if (!et1Name || !et2Name) return null;

    // Calculate data for each individual ET from raw records
    const getETData = (etName: string) => {
      const etRecords = data.records.filter(r => r.et.toUpperCase() === etName.toUpperCase());
      const revenue = etRecords.reduce((sum, r) => sum + r.revenue, 0);

      // Get creatives
      const creativesMap = new Map<string, { name: string; frequency: number; revenue: number; campaigns: Set<string> }>();
      etRecords.forEach(r => {
        if (!creativesMap.has(r.creative)) {
          creativesMap.set(r.creative, {
            name: r.creative,
            frequency: 1,
            revenue: r.revenue,
            campaigns: new Set([r.campaign])
          });
        } else {
          const existing = creativesMap.get(r.creative)!;
          existing.frequency += r.conv ?? 1; // Use CONV value if available, otherwise 1
          existing.revenue += r.revenue;
          existing.campaigns.add(r.campaign);
        }
      });

      const creatives = Array.from(creativesMap.values())
        .sort((a, b) => b.revenue - a.revenue);

      // Get campaigns
      const campaigns = Array.from(new Set(etRecords.map(r => r.campaign)));

      // Get advertisers
      const advertisersMap = new Map<string, number>();
      etRecords.forEach(r => {
        const advertiserKey = isMIRecord(r)
          ? 'MI'
          : isICORecord(r)
            ? 'ICO'
            : is7MRecord(r)
              ? '7M'
              : r.advertiser;
        advertisersMap.set(advertiserKey, (advertisersMap.get(advertiserKey) || 0) + r.revenue);
      });
      const advertisersArray = Array.from(advertisersMap.entries())
        .map(([name, revenue]) => ({ name, revenue }))
        .sort((a, b) => b.revenue - a.revenue);

      return {
        name: etName,
        revenue,
        creatives,
        campaigns,
        advertisersArray
      };
    };

    return [
      getETData(et1Name),
      getETData(et2Name)
    ];
  }, [selectedETData, data.records]);



  const downloadCSV = (filename: string, csvContent: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  // Total revenue of search result.

  const searchResultsTotalRevenue = useMemo(() => {
    if (!searchResults) return 0;
    return searchResults.reduce((sum, result) => sum + result.totalRevenue, 0);
  }, [searchResults]);



  const exportFilteredData = () => {
    let filteredRecords = data.records;

    if (selectedCampaign) {
      const campaignData = analytics.campaignStats.find(c => c.name === selectedCampaign);
      if (campaignData) {
        filteredRecords = filteredRecords.filter(r => isRecordForCampaign(r, campaignData));
      } else {
        filteredRecords = filteredRecords.filter(r => r.campaign === selectedCampaign);
      }
    }

    if (selectedET) {
      const etNames = getETNamesForFilter(selectedET);
      filteredRecords = filteredRecords.filter(r => etNames.includes(r.et.toUpperCase()));
    }

    const headers = ['SUBID', 'Campaign', 'Creative', 'ET', 'Revenue', 'Advertiser', 'Source File'];
    const csvContent = [
      headers.join(','),
      ...filteredRecords.map(record => [
        record.subid,
        getRecordCampaignDisplayName(record),
        record.creative,
        record.et,
        record.revenue,
        record.advertiser,
        record.fileName
      ].join(','))
    ].join('\n');

    const suffix = selectedCampaign || selectedET || 'all';
    downloadCSV(`campaign_data_${suffix}.csv`, csvContent);
  };

  const exportCampaignCreatives = () => {
    if (!selectedCampaign) return;

    const campaignData = analytics.campaignStats.find(c => c.name === selectedCampaign);
    if (!campaignData) return;

    const campaignRecords = data.records.filter(r => isRecordForCampaign(r, campaignData));

    // Group by creative and aggregate data
    const creativeMap = new Map<string, {
      creative: string;
      frequency: number;
      totalRevenue: number;
      ets: Set<string>;
      advertisers: Set<string>;
    }>();

    campaignRecords.forEach(record => {
      if (!creativeMap.has(record.creative)) {
        creativeMap.set(record.creative, {
          creative: record.creative,
          frequency: 0,
          totalRevenue: 0,
          ets: new Set(),
          advertisers: new Set()
        });
      }

      const creative = creativeMap.get(record.creative)!;
      creative.frequency += record.conv ?? 1; // Use CONV value if available, otherwise 1
      creative.totalRevenue += record.revenue;
      creative.ets.add(record.et.toUpperCase());
      creative.advertisers.add(record.advertiser);
    });

    // Convert to array and sort by revenue (descending)
    const sortedCreatives = Array.from(creativeMap.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    const headers = ['Creative Name', 'Frequency', 'Total Revenue', 'ETs', 'Advertisers'];
    const csvContent = [
      headers.join(','),
      ...sortedCreatives.map(creative => [
        creative.creative,
        creative.frequency,
        creative.totalRevenue,
        Array.from(creative.ets).join('; '),
        Array.from(creative.advertisers).join('; ')
      ].join(','))
    ].join('\n');

    downloadCSV(`${selectedCampaign}_creatives.csv`, csvContent);
  };

  const exportETCreatives = () => {
    if (!selectedET) return;

    const etNames = getETNamesForFilter(selectedET);
    const etRecords = data.records.filter(r => etNames.includes(r.et.toUpperCase()));

    // Group by creative and aggregate data
    const creativeMap = new Map<string, {
      creative: string;
      frequency: number;
      totalRevenue: number;
      campaigns: Set<string>;
      advertisers: Set<string>;
    }>();

    etRecords.forEach(record => {
      if (!creativeMap.has(record.creative)) {
        creativeMap.set(record.creative, {
          creative: record.creative,
          frequency: 0,
          totalRevenue: 0,
          campaigns: new Set(),
          advertisers: new Set()
        });
      }

      const creative = creativeMap.get(record.creative)!;
      creative.frequency += record.conv ?? 1; // Use CONV value if available, otherwise 1
      creative.totalRevenue += record.revenue;
      creative.campaigns.add(record.campaign);
      creative.advertisers.add(record.advertiser);
    });

    // Convert to array and sort by revenue (descending)
    const sortedCreatives = Array.from(creativeMap.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    const headers = ['Creative Name', 'Frequency', 'Total Revenue', 'Campaigns', 'Advertisers'];
    const csvContent = [
      headers.join(','),
      ...sortedCreatives.map(creative => [
        creative.creative,
        creative.frequency,
        creative.totalRevenue,
        Array.from(creative.campaigns).join('; '),
        Array.from(creative.advertisers).join('; ')
      ].join(','))
    ].join('\n');

    downloadCSV(`${selectedET}_creatives.csv`, csvContent);
  };
  const openCampaignPopup = (campaign: CampaignStats) => {
    setCampaignPopup({ isOpen: true, campaign });
  };

  const closeCampaignPopup = () => {
    setCampaignPopup({ isOpen: false, campaign: null });
  };

  // -------------------- START: Advertiser Popup State/logic --------------------
  const [advertiserPopup, setAdvertiserPopup] = useState<{
    isOpen: boolean;
    name: string | null;
    creatives: {
      name: string;
      totalRevenue: number;
      frequency: number;
      campaigns: string[];
      ets: string[];
    }[];
    totalRevenue: number;
  }>({ isOpen: false, name: null, creatives: [], totalRevenue: 0 });

  const getAdvertiserRecords = (advertiserName: string) => {
    // MI: file name "MI CAMPS" and subid starting with MI (e.g. MI/JGWDS)
    // OR creative name contains "_MI" (e.g., JG_225_OG2_IMG_MI, VPU_ADV_002_MI)
    const isMIRecord = (r: DataRecord) =>
      (!!r.fileName && r.fileName.toUpperCase().includes('MI CAMPS') &&
        !!r.subid && /^MI(\/|_|$)/i.test(r.subid.trim())) ||
      (!!r.creative && r.creative.toUpperCase().includes('_MI'));
    // ICO: records with advertiser 'ICO' (creatives starting with ICO from RGR files)
    const isICORecord = (r: DataRecord) => r.advertiser === 'ICO';
    const is7MRecord = (r: DataRecord) =>
      !!r.fileName && r.fileName.toUpperCase().includes('7M');
    if (advertiserName === 'MI') {
      return data.records.filter(isMIRecord);
    }
    if (advertiserName === 'ICO') {
      return data.records.filter(isICORecord);
    }
    if (advertiserName === '7M') {
      return data.records.filter(is7MRecord);
    }
    return data.records.filter(r => r.advertiser === advertiserName && !isMIRecord(r) && !isICORecord(r) && !is7MRecord(r));
  };

  const openAdvertiserPopup = (advertiserName: string) => {
    // Reset search and sorting
    setAdvSearchQuery('');
    setAdvSortBy('revenue');
    setAdvSortOrder('desc');

    const records = getAdvertiserRecords(advertiserName);
    const map = new Map<string, { name: string; totalRevenue: number; frequency: number; campaigns: Set<string>; ets: Set<string>; }>();
    records.forEach(r => {
      if (!map.has(r.creative)) {
        map.set(r.creative, { name: r.creative, totalRevenue: 0, frequency: 0, campaigns: new Set(), ets: new Set() });
      }
      const item = map.get(r.creative)!;
      item.totalRevenue += r.revenue;
      item.frequency += r.conv ?? 1; // Use CONV value if available, otherwise 1
      item.campaigns.add(getRecordCampaignDisplayName(r));
      item.ets.add(r.et);
    });
    const creatives = Array.from(map.values())
      .map(v => ({ name: v.name, totalRevenue: v.totalRevenue, frequency: v.frequency, campaigns: Array.from(v.campaigns), ets: Array.from(v.ets) }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
    const totalRevenue = creatives.reduce((s, c) => s + c.totalRevenue, 0);
    setAdvertiserPopup({ isOpen: true, name: advertiserName, creatives, totalRevenue });
  };

  const closeAdvertiserPopup = () => setAdvertiserPopup({ isOpen: false, name: null, creatives: [], totalRevenue: 0 });

  // Memoized filter and sort for advertiser popup creatives
  const filteredAndSortedAdvCreatives = useMemo(() => {
    if (!advertiserPopup.isOpen || !advertiserPopup.creatives) return [];

    let result = [...advertiserPopup.creatives];

    if (advSearchQuery.trim()) {
      const q = advSearchQuery.toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(q));
    }

    result.sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;

      if (advSortBy === 'revenue') {
        valA = a.totalRevenue;
        valB = b.totalRevenue;
      } else if (advSortBy === 'frequency') {
        valA = a.frequency;
        valB = b.frequency;
      } else if (advSortBy === 'name') {
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
      }

      if (valA < valB) return advSortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return advSortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [advertiserPopup.isOpen, advertiserPopup.creatives, advSearchQuery, advSortBy, advSortOrder]);

  const handleAdvSort = (field: 'revenue' | 'frequency' | 'name') => {
    if (advSortBy === field) {
      setAdvSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setAdvSortBy(field);
      setAdvSortOrder('desc');
    }
  };
  // --------------------- END: Advertiser Popup State/logic ---------------------



  return (
    <div className="space-y-6 relative">
      {/* Top Performer Golden Bar */}
      {analytics.etStats.length > 0 && (() => {
        const topET = analytics.etStats[0];
        const topInfo = getETInfo(topET.name);
        return (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#E6C25B] via-[#C69A38] to-[#D5A943] p-4 sm:p-5 shadow-lg border border-yellow-400/40 mb-2">
            <div className="absolute inset-0 opacity-[0.04] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiLz48cGF0aCBkPSJNMCAwTDQgNFpNMCA0TDQgMFoiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9zdmc+')] pointer-events-none"></div>

            <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full border border-[#9A731F]/40 bg-[#D4A73D]/30 shadow-inner">
                  <Crown className="w-6 h-6 text-[#4D390E]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-black text-[#0A192F] tracking-tight leading-none">{topInfo ? topInfo.manager : topET.name}</h3>
                    <div className="flex items-center text-[10px] font-bold rounded overflow-hidden border border-[#9A731F]/30 bg-[#CD9D2A]/20">
                      {topInfo && (
                        <span className="px-2 py-0.5 border-r border-[#9A731F]/30 text-[#0A192F]">
                          {topInfo.stack}
                        </span>
                      )}
                      <span className="px-2 py-0.5 text-[#5A4310]">
                        {topET.name}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] font-black text-[#7A5913] uppercase tracking-widest mt-1.5">
                    Today's Top Performer
                  </p>
                </div>
              </div>

              <div className="text-right w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-[#9A731F]/20 flex justify-between sm:block items-end">
                <p className="text-[11px] font-black text-[#7A5913] uppercase tracking-widest mb-1 sm:hidden">Revenue</p>
                <div>
                  <p className="text-3xl font-black text-[#0A192F] tracking-tight leading-none">
                    ${topET.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-[11px] font-black text-[#7A5913] uppercase tracking-widest mt-1.5 hidden sm:block">
                    Generated Revenue
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Team Target & ET Performance Tracker (Show Only Achieved ETs as Capsules) */}
      {(() => {
        const achievedETs = analytics.etStats.filter(et => {
          const rawTarget = getTargetRevenue(et.name);
          const hasNumbers = /\d/.test(rawTarget);
          const hasLetters = /[a-zA-Z]/.test(rawTarget);
          const isNumericTarget = hasNumbers && !hasLetters;
          if (!isNumericTarget) return false;

          const numericTarget = parseFloat(rawTarget.replace(/[^0-9.]/g, "")) || 0;
          const targetVal = numericTarget * (analytics.totalRevenue >= 40000 ? 7 : 1);
          return et.revenue >= targetVal;
        });

        if (achievedETs.length === 0) return null;

        return (
          <div className="mb-6 relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-50 via-emerald-100/30 to-teal-50/40 border border-emerald-200/80 p-5 shadow-[0_12px_30px_-10px_rgba(16,185,129,0.08)]">
            {/* Background trophy silhouette decoration */}
            <Trophy className="absolute -right-6 -bottom-6 w-24 h-24 text-emerald-600/[0.05] -rotate-12 pointer-events-none" />

            <div className="flex items-center gap-2 mb-3.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
                <Trophy className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-xs font-black text-emerald-950 uppercase tracking-widest leading-none">
                  Target Achieved Teams
                </h3>
                <p className="text-[9px] text-emerald-600/75 font-bold mt-1 tracking-wide">
                  {achievedETs.length} team{achievedETs.length !== 1 ? 's' : ''} completed daily targets successfully
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5 relative z-10">
              {achievedETs.map(et => {
                const info = getETInfo(et.name);
                const rawTarget = getTargetRevenue(et.name);
                const numericTarget = parseFloat(rawTarget.replace(/[^0-9.]/g, "")) || 0;
                const targetVal = numericTarget * (analytics.totalRevenue >= 40000 ? 7 : 1);
                const completionPercent = targetVal > 0 ? Math.round((et.revenue / targetVal) * 100) : 0;

                const managerName = info ? info.manager : "Unknown";
                const stackName = info ? info.stack : "N/A";

                return (
                  <div
                    key={et.name}
                    className="inline-flex items-center gap-3 bg-white border border-emerald-500/10 hover:border-emerald-500/30 rounded-full pl-3 pr-1.5 py-1 text-xs shadow-3xs hover:shadow-2xs transition-all duration-300 hover:-translate-y-0.5"
                  >
                    {/* Dot and ET Name */}
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0 animate-pulse" />
                      <span className="font-extrabold text-slate-800 tracking-tight text-[11px]">{et.name}</span>
                    </div>

                    {/* Stack Badge */}
                    <span className="px-1.5 py-0.5 rounded-full bg-slate-50 border border-slate-100 text-[7.5px] font-black text-slate-500 uppercase tracking-wider select-none leading-none flex-shrink-0">
                      {stackName}
                    </span>

                    {/* Separator Line */}
                    <span className="w-[1px] h-3 bg-slate-100 flex-shrink-0" />

                    {/* Manager Name */}
                    <span className="text-[9.5px] font-bold text-slate-500 truncate max-w-[100px]">
                      {managerName}
                    </span>

                    {/* Separator Line */}
                    <span className="w-[1px] h-3 bg-slate-100 flex-shrink-0" />

                    {/* Achieved Percentage Badge */}
                    <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-[9.5px] font-black text-white leading-none shadow-sm shadow-emerald-500/20 flex-shrink-0">
                      {completionPercent}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl shadow-xl border border-indigo-900/40 relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Subtle background glow effect */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_30%,rgba(99,102,241,0.4),transparent)] pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />

        <div className="relative z-10">
          <h2 className="text-2xl font-black tracking-tight text-white">Dashboard Overview</h2>
          <p className="text-indigo-200/70 text-xs font-semibold mt-1 tracking-wide">
            {uploadedFiles.length} file{uploadedFiles.length > 1 ? 's' : ''} processed • {data.records.length} records analyzed
          </p>
        </div>
        <div className="flex gap-2.5 relative z-10">
          <button
            onClick={exportFilteredData}
            className="flex items-center px-3 py-3 rounded-xl text-xs font-black transition-all bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/20 border border-indigo-400/25 active:scale-95"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </button>
          <button
            onClick={onReset}
            className="flex items-center px-3 py-3 rounded-xl text-xs font-black transition-all bg-white/10 backdrop-blur-md border border-white/15 hover:bg-white/20 text-white active:scale-95"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            New Upload
          </button>
        </div>
      </div>
      {/* End: Header */}

      {/* Search Box */}
      <div className="relative shadow-[0_8px_30px_rgb(0,0,0,0.015)] rounded-2xl">
        <input
          type="text"
          placeholder="Search for creative names..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="peer w-full pl-12 pr-10 py-4 rounded-2xl border border-slate-100 bg-white text-slate-800 placeholder-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 shadow-sm transition-all text-sm font-medium"
        />
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 peer-focus:text-indigo-500 transition-colors pointer-events-none" />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1.5 rounded-full hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-650"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {/* End: Search Box */}

      {/* Search Results */}
      {searchResults && (
        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm mt-6">
          {/* Header Section */}
          <div className="mb-6 p-5 rounded-2xl bg-indigo-600 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 shadow-inner">
                <Search className="h-6 w-6 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-0.5 tracking-tight">
                  Search Results: <span className="text-indigo-100 font-semibold">{searchQuery}</span>
                </h3>
                <p className="text-indigo-100/80 text-sm flex items-center gap-1.5 font-medium">
                  <Star className="h-3.5 w-3.5" />
                  {searchResults.length} creative{searchResults.length > 1 ? 's' : ''} found
                </p>
              </div>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-sm px-5 py-3 rounded-xl border border-white/10 shadow-inner min-w-[140px]">
              <p className="text-3xl font-bold mb-0.5 tracking-tight">
                ${searchResultsTotalRevenue.toLocaleString()}
              </p>
              <p className="text-indigo-100/80 text-[11px] font-medium uppercase tracking-wider">
                Total Revenue
              </p>
            </div>
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {searchResults.map((result, index) => (
              <div
                key={result.creative}
                className="p-5 rounded-2xl border border-indigo-100 bg-white shadow-sm hover:shadow-md transition-all hover:border-indigo-200"
              >
                {/* Creative Header */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2.5 rounded-xl bg-indigo-50/80 border border-indigo-100/50">
                    <Layers className="h-5 w-5 text-indigo-500" strokeWidth={2} />
                  </div>
                  <h4 className="font-bold text-[15px] text-gray-900 truncate flex-1 tracking-tight">{result.creative}</h4>
                </div>

                {/* Revenue and Frequency */}
                <div className="grid grid-cols-2 gap-3 mb-5 border-b border-gray-100 pb-5">
                  <div className="bg-emerald-50/50 rounded-xl p-3.5 border border-emerald-100/50">
                    <p className="text-[10px] text-emerald-600 font-bold mb-1">Revenue</p>
                    <p className="text-xl font-bold text-emerald-600 tracking-tight">
                      ${result.totalRevenue.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-blue-50/50 rounded-xl p-3.5 border border-blue-100/50">
                    <p className="text-[10px] text-blue-600 font-bold mb-1">Frequency</p>
                    <p className="text-xl font-bold text-blue-600 tracking-tight">
                      {result.frequency}
                    </p>
                  </div>
                </div>

                {/* Details Section */}
                <div className="space-y-4">
                  {/* Campaigns */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Target className="h-3.5 w-3.5 text-gray-500" strokeWidth={2.5} />
                      <span className="text-[11px] font-bold text-gray-800">
                        Campaigns ({result.campaigns.size})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pl-5">
                      {Array.from(result.campaigns).slice(0, 3).map((campaign, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 rounded bg-blue-50 text-[10px] font-bold text-blue-600 border border-blue-100/50"
                        >
                          {campaign}
                        </span>
                      ))}
                      {result.campaigns.size > 3 && (
                        <span className="px-2 py-1 rounded bg-gray-50 text-[10px] font-bold text-gray-500 border border-gray-100">
                          +{result.campaigns.size - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ETs */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Users className="h-3.5 w-3.5 text-gray-500" strokeWidth={2.5} />
                      <span className="text-[11px] font-bold text-gray-800">
                        ETs ({result.ets.size})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pl-5">
                      {Array.from(result.ets).map((et, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 rounded bg-purple-50 text-[10px] font-bold text-purple-600 border border-purple-100/50"
                        >
                          {et}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Advertisers */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Building2 className="h-3.5 w-3.5 text-gray-500" strokeWidth={2.5} />
                      <span className="text-[11px] font-bold text-gray-800">
                        Advertisers ({result.advertisers.size})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pl-5">
                      {Array.from(result.advertisers).slice(0, 2).map((advertiser, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 rounded bg-emerald-50 text-[10px] font-bold text-emerald-600 border border-emerald-100/50"
                        >
                          {advertiser}
                        </span>
                      ))}
                      {result.advertisers.size > 2 && (
                        <span className="px-2 py-1 rounded bg-gray-50 text-[10px] font-bold text-gray-500 border border-gray-100">
                          +{result.advertisers.size - 2}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* End: Search Results */}

      {/* Summary Cards */}
      {(() => {
        const targetPercentage = displayedTotalTargetRevenue > 0
          ? Math.round((analytics.totalRevenue / displayedTotalTargetRevenue) * 100)
          : 0;

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-5">
            {/* Card 1: Total Revenue (Spans 2 columns on lg screens) */}
            <div className="p-5 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/40 via-white to-teal-50/20 shadow-sm transition-all hover:shadow-[0_15px_30px_-5px_rgba(16,185,129,0.08)] hover:border-emerald-300 lg:col-span-2 md:col-span-2 flex flex-col justify-between min-h-[110px]">
              <div className="flex items-center gap-4">
                <div className="p-3.5 rounded-2xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
                  <DollarSign className="h-6 w-6" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total Revenue</p>
                  <p className="text-3xl font-black text-emerald-950 leading-none">${analytics.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-emerald-100/50 flex items-center justify-between text-[10px] font-bold text-slate-500 leading-none">
                <span>Aggregated Performance</span>
                <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100/50">{uploadedFiles.length} file{uploadedFiles.length > 1 ? 's' : ''} analyzed</span>
              </div>
            </div>

            {/* Card 2: Daily Target */}
            <div className="p-5 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/20 via-white to-indigo-50/10 shadow-sm transition-all hover:shadow-[0_15px_30px_-5px_rgba(59,130,246,0.08)] hover:border-blue-300 lg:col-span-1 flex flex-col justify-between min-h-[110px]">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100/50">
                  <Target className="h-6 w-6" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Daily Target</p>
                  <p className="text-2xl font-black text-blue-950 leading-none">${displayedTotalTargetRevenue.toLocaleString()}</p>
                </div>
              </div>
              {displayedTotalTargetRevenue > 0 && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[9px] font-black text-slate-400 mb-1">
                    <span>ACHIEVED</span>
                    <span className="text-blue-600 font-extrabold">{targetPercentage}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(targetPercentage, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Card 3: Campaigns */}
            <div className="p-5 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/20 via-white to-purple-50/10 shadow-sm transition-all hover:shadow-[0_15px_30px_-5px_rgba(99,102,241,0.08)] hover:border-indigo-300 lg:col-span-1 flex flex-col justify-between min-h-[110px]">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100/50">
                  <Layers className="h-6 w-6" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Campaigns</p>
                  <p className="text-2xl font-black text-indigo-950 leading-none">{analytics.campaignStats.length}</p>
                </div>
              </div>
              <div className="mt-4 text-[10px] font-bold text-slate-400 leading-none">
                Active ad channels
              </div>
            </div>

            {/* Card 4: ETs Active */}
            <div className="p-5 rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50/20 via-white to-pink-50/10 shadow-sm transition-all hover:shadow-[0_15px_30px_-5px_rgba(139,92,246,0.08)] hover:border-purple-300 lg:col-span-1 flex flex-col justify-between min-h-[110px]">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100/50">
                  <Users className="h-6 w-6" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">ETs Active</p>
                  <p className="text-2xl font-black text-purple-950 leading-none">{analytics.etStats.length}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1.5 leading-none">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Live Monitoring</span>
              </div>
            </div>

            {/* Card 5: Creatives */}
            <div className="p-5 rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/20 via-white to-yellow-50/10 shadow-sm transition-all hover:shadow-[0_15px_30px_-5px_rgba(245,158,11,0.08)] hover:border-amber-300 lg:col-span-1 flex flex-col justify-between min-h-[110px]">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100/50">
                  <Activity className="h-6 w-6" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Creatives</p>
                  <p className="text-2xl font-black text-amber-950 leading-none">{data.creatives.size}</p>
                </div>
              </div>
              <div className="mt-4 text-[10px] font-bold text-slate-400 leading-none">
                Unique creative assets
              </div>
            </div>
          </div>
        );
      })()}
      {/* End: Summary Cards */}

      {/* Advertiser Revenue Breakdown (redesigned cards) */}
      <div className="p-6 rounded-2xl border border-slate-100/90 shadow-[0_8px_30px_rgb(0,0,0,0.015)] bg-white">
        <div className="flex items-center mb-6 justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-50 text-red-500 border border-red-100">
              <Building2 className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight">Advertiser Revenue Breakdown</h3>
          </div>
          <div className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-slate-50 text-slate-600 uppercase tracking-widest border border-slate-200/50">
            Top Advertisers
          </div>
        </div>

        {(() => {
          const maxRevenue = Math.max(...analytics.advertiserStats.map(a => a.revenue)) || 1;

          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4">
              {analytics.advertiserStats.map((advertiser) => {
                const accent = getAdvertiserAccent(advertiser.name);

                // Get first letter(s) of advertiser name
                const getInitials = (name: string): string => {
                  if (name === 'XC EXC') return 'XE';
                  if (name === 'NON COMCAST') return 'NC';
                  if (name.length <= 3) return name.toUpperCase();
                  return name.substring(0, 2).toUpperCase();
                };
                const initials = getInitials(advertiser.name);
                const { points } = getAdvertiserTrendAndPoints(advertiser.name);
                const sharePercent = ((advertiser.revenue / analytics.totalRevenue) * 100).toFixed(1);

                return (
                  <div
                    key={advertiser.name}
                    onClick={() => openAdvertiserPopup(advertiser.name)}
                    onMouseEnter={() => setHoveredAdv(advertiser.name)}
                    onMouseLeave={() => setHoveredAdv(null)}
                    className="relative p-3 rounded-2xl border cursor-pointer transition-all duration-300 flex flex-col justify-between gap-2.5 hover:shadow-[0_12px_25px_rgba(0,0,0,0.02)]"
                    style={{
                      background: hoveredAdv === advertiser.name
                        ? `linear-gradient(135deg, ${hexToRgba(accent, 0.08)} 0%, ${hexToRgba(accent, 0.02)} 100%)`
                        : `linear-gradient(135deg, ${hexToRgba(accent, 0.04)} 0%, ${hexToRgba(accent, 0.01)} 100%)`,
                      borderColor: hexToRgba(accent, hoveredAdv === advertiser.name ? 0.25 : 0.1)
                    }}
                  >
                    {/* Top Row: Initials Badge, Name + Campaigns/Share, More Menu */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        {/* Circle Initials Badge */}
                        <div
                          className="flex items-center justify-center rounded-full w-8 h-8 flex-shrink-0 font-black text-[10px] shadow-sm"
                          style={{
                            backgroundColor: hexToRgba(accent, 0.1),
                            color: accent,
                            border: `1.2px solid ${hexToRgba(accent, 0.2)}`
                          }}
                        >
                          {initials}
                        </div>

                        {/* Name and Campaigns/Share count */}
                        <div className="flex flex-col min-w-0">
                          <h4 className="font-extrabold text-xs text-slate-800 truncate leading-tight">
                            {advertiser.name}
                          </h4>
                          <span className="text-[9px] font-bold text-slate-400 mt-0.5 truncate">
                            {sharePercent}% share • {advertiser.name === 'RGR' || advertiser.name === 'ICO'
                              ? `${advertiser.frequency || 0} conv`
                              : `${advertiser.campaigns.length} camp${advertiser.campaigns.length !== 1 ? 's' : ''}`
                            }
                          </span>
                        </div>
                      </div>

                      {/* Options Button */}
                      <button
                        className="text-slate-300 hover:text-slate-500 transition-colors p-0.5 rounded-full hover:bg-slate-50 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          openAdvertiserPopup(advertiser.name);
                        }}
                      >
                        <MoreVertical className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Bottom Row: Amount & Sparkline */}
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-base font-black tracking-tight text-slate-950 leading-none">
                        ${advertiser.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>

                      {/* Sparkline on the right */}
                      <div className="flex-shrink-0 ml-2">
                        {renderSparkline(points, accent, advertiser.name)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* End: Advertiser Revenue Breakdown */}

      {/* Advertiser Details Popup */}
      {advertiserPopup.isOpen && advertiserPopup.name && (
        <div className="fixed inset-0 bg-slate-955/60 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-300 bg-slate-900/60">
          <div className="max-w-5xl w-full max-h-[85vh] overflow-hidden rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] bg-white border border-slate-100 flex flex-col relative animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div
              className="sticky top-0 px-6 py-4 border-b bg-white/85 backdrop-blur-md border-slate-100 z-10"
              style={{ borderTop: `4px solid ${getAdvertiserAccent(advertiserPopup.name)}` }}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-md transition-transform duration-300 hover:scale-105"
                    style={{
                      background: `linear-gradient(135deg, ${getAdvertiserAccent(advertiserPopup.name)}, ${hexToRgba(getAdvertiserAccent(advertiserPopup.name), 0.75)})`,
                      boxShadow: `0 4px 12px ${hexToRgba(getAdvertiserAccent(advertiserPopup.name), 0.3)}`
                    }}
                  >
                    {advertiserPopup.name === 'CM Gmail' ? 'CM' :
                      advertiserPopup.name === 'XC EXC' ? 'XE' :
                        advertiserPopup.name === 'NON COMCAST' ? 'NC' :
                          advertiserPopup.name.length <= 3 ? advertiserPopup.name.toUpperCase() :
                            advertiserPopup.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-800 tracking-tight leading-tight">{advertiserPopup.name}</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Creative Performance</p>
                  </div>
                </div>

                {/* Search input in header */}
                <div className="flex flex-1 max-w-sm items-center relative mx-0 md:mx-4">
                  <input
                    type="text"
                    placeholder="Search creatives..."
                    value={advSearchQuery}
                    onChange={(e) => setAdvSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-8 py-1.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/5 transition-all font-medium"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                  {advSearchQuery && (
                    <button
                      onClick={() => setAdvSearchQuery('')}
                      className="absolute right-2.5 top-1/2 transform -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-5 justify-between md:justify-end">
                  <div className="bg-slate-50/80 rounded-xl px-4 py-2 border border-slate-100 flex flex-col items-end shadow-3xs">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 leading-none">Total Revenue</p>
                    <p
                      className="text-lg font-black tracking-tight leading-none"
                      style={{ color: getAdvertiserAccent(advertiserPopup.name) }}
                    >
                      ${advertiserPopup.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <button
                    onClick={closeAdvertiserPopup}
                    className="w-8.5 h-8.5 rounded-xl border border-slate-200/60 bg-white flex items-center justify-center hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-all duration-200 shadow-3xs"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Compact Table */}
            <div className="flex-1 overflow-y-auto min-h-[300px]">
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead className="sticky top-0 z-10 shadow-3xs">
                    <tr style={{ backgroundColor: hexToRgba(getAdvertiserAccent(advertiserPopup.name), 0.08) }} className="border-b border-slate-100 backdrop-blur-md">
                      <th
                        onClick={() => handleAdvSort('name')}
                        className="text-left px-4 py-2.5 font-extrabold text-[10px] text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-800 transition-colors select-none"
                      >
                        <div className="flex items-center gap-1">
                          Creative
                          {advSortBy === 'name' && (
                            advSortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => handleAdvSort('revenue')}
                        className="text-right px-4 py-2.5 font-extrabold text-[10px] text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-800 transition-colors select-none w-32"
                      >
                        <div className="flex items-center gap-1 justify-end">
                          Revenue
                          {advSortBy === 'revenue' && (
                            advSortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => handleAdvSort('frequency')}
                        className="text-right px-4 py-2.5 font-extrabold text-[10px] text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-800 transition-colors select-none w-28"
                      >
                        <div className="flex items-center gap-1 justify-end">
                          Frequency
                          {advSortBy === 'frequency' && (
                            advSortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                          )}
                        </div>
                      </th>
                      <th className="text-left px-4 py-2.5 font-extrabold text-[10px] text-slate-500 uppercase tracking-wider select-none w-44">Campaigns</th>
                      <th className="text-left px-4 py-2.5 font-extrabold text-[10px] text-slate-500 uppercase tracking-wider select-none">ETs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAndSortedAdvCreatives.length > 0 ? (
                      filteredAndSortedAdvCreatives.map((cr, idx) => (
                        <tr
                          key={cr.name}
                          className={`hover:bg-slate-50/80 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}
                        >
                          <td className="px-4 py-2 font-mono font-bold text-slate-700 truncate max-w-[280px]" title={cr.name}>
                            {cr.name}
                          </td>
                          <td className="px-4 py-2 text-right font-extrabold" style={{ color: getAdvertiserAccent(advertiserPopup.name!) }}>
                            ${cr.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-2 text-right font-bold text-slate-600">
                            {cr.frequency}
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex flex-wrap gap-1">
                              {cr.campaigns.map((camp, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 rounded-lg text-[10px] font-bold shadow-3xs"
                                  style={{
                                    backgroundColor: hexToRgba(getAdvertiserAccent(advertiserPopup.name!), 0.08),
                                    color: getAdvertiserAccent(advertiserPopup.name!),
                                    border: `1px solid ${hexToRgba(getAdvertiserAccent(advertiserPopup.name!), 0.15)}`
                                  }}
                                >
                                  {camp}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex flex-wrap gap-1">
                              {cr.ets.slice(0, 4).map((et, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 rounded-lg bg-slate-100/80 text-slate-650 text-[10px] font-semibold border border-slate-200/40"
                                >
                                  {et}
                                </span>
                              ))}
                              {cr.ets.length > 4 && (
                                <span className="px-1.5 py-0.5 rounded-lg bg-slate-200/50 text-slate-500 text-[10px] font-bold border border-slate-200/20" title={cr.ets.slice(4).join(', ')}>
                                  +{cr.ets.length - 4}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-4 py-12 text-center text-slate-400 font-medium">
                          No creatives match your search query.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer with summary */}
            <div className="px-6 py-3 border-t bg-slate-50 text-xs text-slate-500 font-semibold rounded-b-2xl">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  {filteredAndSortedAdvCreatives.length === advertiserPopup.creatives.length ? (
                    `${advertiserPopup.creatives.length} creative${advertiserPopup.creatives.length !== 1 ? 's' : ''}`
                  ) : (
                    `Showing ${filteredAndSortedAdvCreatives.length} of ${advertiserPopup.creatives.length} creative${advertiserPopup.creatives.length !== 1 ? 's' : ''}`
                  )}
                </span>
                <span className="text-slate-800 font-extrabold">Total: ${advertiserPopup.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ET Revenue Charts */}
      <div className="p-6 rounded-2xl border border-gray-200/60 bg-white shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <BarChart3 className="w-5 h-5" />
            </div>
            ET Revenue Breakdown
          </h2>
        </div>

        <div className="w-[100%]">
          {/* Area Chart */}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={analytics.etChartData}
                margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
              >
                <defs>
                  <linearGradient id="colorRevenueArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
                  dy={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                  dx={-8}
                />
                <Tooltip
                  content={<ETCustomTooltip />}
                  cursor={{ stroke: '#3B82F6', strokeWidth: 1, strokeDasharray: '4 4', fill: 'transparent' }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRevenueArea)"
                  dot={{ r: 4, fill: '#3B82F6', stroke: '#fff', strokeWidth: 2, fillOpacity: 1 }}
                  activeDot={{ r: 6, fill: '#3B82F6', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>


      {/* End: ET Revenue Charts */}

      {/* Top Revenue ETs Section */}
      {analytics.etStats.length > 0 && (
        <div className="p-6 rounded-2xl border border-amber-200/50 shadow-sm bg-[#fdfbf6]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Award className="h-6 w-6 mr-3 text-amber-500" />
              <h3 className="text-xl font-bold text-gray-900 tracking-tight">Top Revenue ETs</h3>
            </div>
            <div className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-amber-100/60 text-amber-800 uppercase tracking-widest border border-amber-200/50">
              Top 3 Performing
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {analytics.etStats.slice(0, 3).map((et, index) => {
              const targetStatus = checkTargetStatus(et.name, et.revenue, analytics.totalRevenue);
              let borderClass = 'border-yellow-300/40';
              let hoverClass = 'hover:shadow-xl';
              if (targetStatus === 'met') {
                borderClass = 'border-emerald-400/65';
                hoverClass = 'hover:shadow-emerald-500/15 hover:shadow-2xl';
              } else if (targetStatus === 'not-met') {
                borderClass = 'border-rose-400/65';
                hoverClass = 'hover:shadow-rose-500/15 hover:shadow-2xl';
              }

              const rawTargetValue = getTargetRevenue(et.name);
              let targetVal = 0;
              let percentAchieved = 0;
              let hasValidTarget = false;

              if (rawTargetValue && rawTargetValue !== "NA") {
                const hasLetters = /[a-zA-Z]/.test(rawTargetValue);
                const hasNumbers = /\d/.test(rawTargetValue);
                if (!hasLetters && hasNumbers) {
                  const numericValue = parseFloat(rawTargetValue.replace(/[^0-9.]/g, ""));
                  targetVal = numericValue * (analytics.totalRevenue >= 40000 ? 7 : 1);
                  if (targetVal > 0) {
                    percentAchieved = Math.round((et.revenue / targetVal) * 100);
                    hasValidTarget = true;
                  }
                }
              }

              return (
                <div
                  key={et.name}
                  className={`relative rounded-3xl border ${borderClass} bg-gradient-to-br from-[#FDE08B] via-[#D4AF37] to-[#B5851C] p-5 shadow-lg transition-all duration-300 ${hoverClass} flex flex-col justify-between gap-5 overflow-hidden`}
                >
                  {/* Subtle metallic texture overlay */}
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-white via-transparent to-black pointer-events-none"></div>
                  <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiLz48cGF0aCBkPSJNMCAwTDQgNFpNMCA0TDQgMFoiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9zdmc+')] pointer-events-none"></div>

                  {/* Header Section */}
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8.5 h-8.5 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
                        <Crown className="w-4.5 h-4.5 text-yellow-900 drop-shadow-sm" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-gray-900 leading-tight text-sm tracking-tight drop-shadow-sm">
                          {et.name}
                        </h4>
                        <p className="text-[9px] font-black text-yellow-900/80 uppercase tracking-wider leading-none mt-0.5">
                          Rank #{index + 1}
                        </p>
                      </div>
                    </div>

                    {(() => {
                      const info = getETInfo(et.name);
                      if (!info) return null;
                      return (
                        <div className="flex items-center text-[10px] font-semibold rounded-full bg-white/20 backdrop-blur-sm border border-yellow-600/20 p-0.5 px-2.5 text-yellow-950 gap-1.5 shadow-sm">
                          <span className="border-r border-yellow-900/20 pr-1.5 font-bold text-yellow-900">
                            {info.stack}
                          </span>
                          <span>
                            {info.manager}
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Middle Section: Side-by-side Today Revenue & Daily Target */}
                  <div className="relative z-10 grid grid-cols-2 gap-3 py-3 border-y border-yellow-900/20">
                    {/* Left Column: Today Revenue */}
                    <div className="flex flex-col justify-center">
                      <p className="text-xl font-black leading-tight tracking-tight text-gray-900 drop-shadow-md">
                        ${et.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-[9px] font-bold text-yellow-900/80 uppercase tracking-wider mt-0.5">
                        {et.name.includes('+') ? 'Combined Revenue' : 'Today Revenue'}
                      </p>

                      {et.name.includes('+') && (
                        <div className="mt-1 flex flex-col gap-0.5 border-l-2 border-yellow-900/30 pl-1.5 text-[9px]">
                          {(et as any).et1Name && (
                            <span className="font-bold text-yellow-900/80">
                              {(et as any).et1Name}: <span className="font-black text-gray-900">${((et as any).et1Revenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </span>
                          )}
                          {(et as any).et2Name && (
                            <span className="font-bold text-yellow-900/80">
                              {(et as any).et2Name}: <span className="font-black text-gray-900">${((et as any).et2Revenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right Column: Daily Target */}
                    <div className="flex flex-col justify-center border-l border-yellow-900/20 pl-3">
                      <span className="text-xl font-black text-gray-900 leading-tight drop-shadow-sm">
                        {displayTargetRevenue(et.name, analytics.totalRevenue)}
                      </span>
                      <p className="text-[9px] font-bold text-yellow-900/80 uppercase tracking-wider mt-0.5">
                        Daily Target
                      </p>
                    </div>
                  </div>

                  {/* Target Achievement Line (Progress Bar) & Info Footer */}
                  <div className="relative z-10 flex flex-col gap-3">
                    {hasValidTarget ? (
                      <div>
                        <div className="flex items-center justify-between text-[10px] font-extrabold text-yellow-950 mb-1.5 gap-1">
                          <span className="uppercase tracking-wider text-[9px] text-yellow-900/90 font-extrabold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-900 animate-pulse"></span>
                            Target Achieved
                          </span>
                          {renderTargetComparison(et.name, et.revenue, analytics.totalRevenue, true)}
                          <span className="font-black drop-shadow-sm text-yellow-950 text-xs">{percentAchieved}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-black/15 rounded-full overflow-hidden p-0.5 border border-white/30 shadow-inner relative">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-yellow-900 via-amber-700 to-yellow-950 shadow-[0_0_10px_rgba(120,53,15,0.35)] transition-all duration-1000 ease-out animate-line-fill relative overflow-hidden"
                            style={{ width: `${Math.min(percentAchieved, 100)}%` }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-progress-shimmer pointer-events-none" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-[10px] font-bold text-yellow-900/80">
                        <span className="uppercase tracking-wider text-[9px]">Target</span>
                        <span className="font-semibold text-yellow-950 bg-white/20 px-2 py-0.5 rounded-md border border-white/20 text-[9px]">No Target Set</span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 pt-2 border-t border-yellow-900/20 text-xs text-yellow-950/80">
                      <span className="flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 text-yellow-900" />
                        <span className="font-semibold text-gray-900">{et.creatives.length}</span> <span className="text-yellow-900/80">Cr</span>
                      </span>
                      <span className="text-yellow-900/20">•</span>
                      <span className="flex items-center gap-1.5">
                        <Target className="h-3.5 w-3.5 text-yellow-900" />
                        <span className="font-semibold text-gray-900">{et.campaigns.length}</span> <span className="text-yellow-900/80">Camp</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ET Revenue Breakdown - Main Section */}
      <div className="p-6 rounded-lg border bg-white border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Users className="h-6 w-6 mr-3 text-blue-500" />
            <h3 className="text-xl font-bold">ET-Wise Revenue</h3>
          </div>
          <div className="text-sm px-3 py-1 rounded-full bg-blue-100 text-blue-800">
            All ETs by revenue
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {analytics.etStats.slice(3, 100).map((et, index) => {
            const isCombined = et.name.includes('+');
            const targetStatus = checkTargetStatus(et.name, et.revenue, analytics.totalRevenue);

            let borderClass = 'border-slate-100';
            let cardBgClass = 'bg-white';
            let hoverClass = isCombined
              ? 'hover:border-purple-200 hover:shadow-purple-100/30'
              : 'hover:border-indigo-200 hover:shadow-indigo-100/30';

            if (targetStatus === 'met') {
              borderClass = 'border-emerald-200/80';
              cardBgClass = 'bg-emerald-50/[0.01]';
              hoverClass = 'hover:border-emerald-400 hover:shadow-[0_20px_40px_rgba(16,185,129,0.05)]';
            } else if (targetStatus === 'not-met') {
              borderClass = 'border-rose-200/80';
              cardBgClass = 'bg-rose-50/[0.01]';
              hoverClass = 'hover:border-rose-400 hover:shadow-[0_20px_40px_rgba(244,63,94,0.05)]';
            }

            const iconBgClass = isCombined
              ? 'bg-purple-50 text-purple-500'
              : 'bg-indigo-50 text-indigo-500';

            const rawTargetValue = getTargetRevenue(et.name);
            let targetVal = 0;
            let percentAchieved = 0;
            let hasValidTarget = false;

            if (rawTargetValue && rawTargetValue !== "NA") {
              const hasLetters = /[a-zA-Z]/.test(rawTargetValue);
              const hasNumbers = /\d/.test(rawTargetValue);
              if (!hasLetters && hasNumbers) {
                const numericValue = parseFloat(rawTargetValue.replace(/[^0-9.]/g, ""));
                targetVal = numericValue * (analytics.totalRevenue >= 40000 ? 7 : 1);
                if (targetVal > 0) {
                  percentAchieved = Math.round((et.revenue / targetVal) * 100);
                  hasValidTarget = true;
                }
              }
            }

            return (
              <div
                key={et.name}

                className={`rounded-3xl border ${borderClass} ${cardBgClass} p-5 shadow-[0_8px_30px_rgba(0,0,0,0.015)] transition-all duration-300 ${hoverClass} flex flex-col justify-between gap-4`}
              >
                {/* Header Section */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8.5 h-8.5 rounded-2xl flex items-center justify-center font-bold text-sm ${iconBgClass}`}>
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 leading-tight text-sm tracking-tight">
                        {et.name}
                      </h4>
                    </div>
                  </div>

                  {(() => {
                    const info = getETInfo(et.name);
                    if (!info) return null;
                    return (
                      <div className="flex items-center text-[10px] font-semibold rounded-full bg-slate-50/80 border border-slate-100/50 p-0.5 px-2.5 text-slate-600 gap-1.5 shadow-sm">
                        <span className="border-r border-slate-200/60 pr-1.5 font-bold text-slate-500">
                          {info.stack}
                        </span>
                        <span>
                          {info.manager}
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* Middle Section: Side-by-side Today Revenue & Daily Target */}
                <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-100/80">
                  {/* Left Column: Today Revenue */}
                  <div className="flex flex-col justify-center">
                    <p className={`text-xl font-black leading-tight tracking-tight ${isCombined ? 'text-purple-600' : 'text-indigo-600'}`}>
                      ${et.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                      {isCombined ? 'Combined Revenue' : 'Today Revenue'}
                    </p>

                    {isCombined && (
                      <div className="mt-1 flex flex-col gap-0.5 border-l-2 border-purple-100 pl-1.5 text-[9px]">
                        {(et as any).et1Name && (
                          <span className="font-medium text-slate-500">
                            {(et as any).et1Name}: <span className="font-black text-slate-800">${((et as any).et1Revenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </span>
                        )}
                        {(et as any).et2Name && (
                          <span className="font-medium text-slate-500">
                            {(et as any).et2Name}: <span className="font-black text-slate-800">${((et as any).et2Revenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Daily Target */}
                  <div className="flex flex-col justify-center border-l border-slate-100 pl-3">
                    <span className="text-xl font-black text-slate-800 leading-tight tracking-tight">
                      {displayTargetRevenue(et.name, analytics.totalRevenue)}
                    </span>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                      Daily Target
                    </p>
                  </div>
                </div>

                {/* Target Achievement Line (Progress Bar) & Info Footer */}
                <div className="flex flex-col gap-3">
                  {hasValidTarget ? (
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1.5 gap-1">
                        <span className="uppercase tracking-wider text-[9px] text-slate-400 font-extrabold flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${targetStatus === 'met' ? 'bg-emerald-500' : percentAchieved >= 70 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}></span>
                          Target Achieved
                        </span>
                        {renderTargetComparison(et.name, et.revenue, analytics.totalRevenue, false)}
                        <span className={`font-black text-xs ${targetStatus === 'met'
                          ? 'text-emerald-600'
                          : percentAchieved >= 70
                            ? 'text-amber-600'
                            : 'text-rose-500'
                          }`}>
                          {percentAchieved}%
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100/90 rounded-full overflow-hidden p-0.5 border border-slate-200/60 shadow-inner relative">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ease-out animate-line-fill relative overflow-hidden ${targetStatus === 'met'
                            ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.35)]'
                            : percentAchieved >= 70
                              ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.35)]'
                              : 'bg-gradient-to-r from-rose-500 via-pink-400 to-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.35)]'
                            }`}
                          style={{ width: `${Math.min(percentAchieved, 100)}%` }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent animate-progress-shimmer pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                      <span className="uppercase tracking-wider text-[9px]">Target</span>
                      <span className="font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md text-[9px]">No Target Set</span>
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-2 border-t border-slate-100/60 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-slate-400" />
                      <span className="font-semibold text-slate-600">{et.creatives.length}</span> <span className="text-slate-400/80">Cr</span>
                    </span>
                    <span className="text-slate-200">•</span>
                    <span className="flex items-center gap-1.5">
                      <Target className="h-3.5 w-3.5 text-slate-400" />
                      <span className="font-semibold text-slate-600">{et.campaigns.length}</span> <span className="text-slate-400/80">Camp</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* End: ET Revenue Breakdown */}

      {/* Campaign Revenue Breakdown */}
      <div className="p-5 rounded-2xl border bg-white shadow-sm border-gray-100">
        {/* Header Section */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-100/50">
              <Target className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 tracking-tight">Campaign-Wise Revenue</h3>
              <p className="text-gray-500 text-sm font-medium">
                {analytics.campaignStats.length} campaigns • Click any campaign for detailed view
              </p>
            </div>
          </div>
        </div>

        {/* Highest Revenue Creative - Premium Section */}
        {(() => {
          // Find the highest revenue creative across all campaigns
          let topCreativeData: { name: string; revenue: number; campaign: string; advertiser?: string; originalCampaignName?: string; ets: string[] } | null = null;
          for (const campaign of analytics.campaignStats) {
            for (const creative of campaign.creatives) {
              if (!topCreativeData || creative.revenue > topCreativeData.revenue) {
                topCreativeData = {
                  name: creative.name,
                  revenue: creative.revenue,
                  campaign: campaign.name,
                  advertiser: campaign.advertiser,
                  originalCampaignName: campaign.originalCampaignName,
                  ets: creative.ets
                };
              }
            }
          }

          if (!topCreativeData) return null;

          // Extract values to avoid TypeScript narrowing issues
          const tc = topCreativeData;
          const creativeName = tc.name;
          const totalRevenue = tc.revenue;
          const campaignName = tc.campaign;

          // Calculate revenue per ET for this creative
          const etRevenues = new Map<string, number>();
          data.records
            .filter(r => {
              const advertiserKey = isMIRecord(r)
                ? 'MI'
                : isICORecord(r)
                  ? 'ICO'
                  : is7MRecord(r)
                    ? '7M'
                    : r.advertiser;
              return r.creative === creativeName &&
                r.campaign === (tc.originalCampaignName || tc.campaign) &&
                (tc.advertiser === undefined || advertiserKey === tc.advertiser);
            })
            .forEach(record => {
              const et = record.et.toUpperCase();
              const current = etRevenues.get(et) || 0;
              etRevenues.set(et, current + record.revenue);
            });

          const etRevenueList = Array.from(etRevenues.entries())
            .map(([et, revenue]) => ({ et, revenue }))
            .sort((a, b) => b.revenue - a.revenue);

          return (
            <div className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200/60 relative overflow-hidden shadow-sm">
              {/* Content */}
              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center border border-amber-200">
                      <Crown className="h-7 w-7 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1 flex items-center gap-2">
                        <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                        Top Performing Creative
                      </p>
                      <h4 className="text-xl font-bold text-gray-900 mb-0.5">{creativeName}</h4>
                      <p className="text-xs text-gray-500 font-medium">Campaign: <span className="text-gray-700">{campaignName}</span></p>
                    </div>

                  </div>
                  <div className="text-right sm:text-right bg-white/60 px-4 py-2.5 rounded-xl border border-amber-100/50 shadow-sm">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Total Revenue</p>
                    <p className="text-2xl font-black text-amber-600">${Number(totalRevenue).toLocaleString()}</p>
                  </div>
                </div>

                {/* ET Revenue Breakdown */}
                {etRevenueList.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-amber-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Revenue by ET</p>
                    <div className="flex flex-wrap gap-2">
                      {etRevenueList.map(({ et, revenue }) => (
                        <div
                          key={et}
                          className="px-2.5 py-1.5 rounded-lg bg-white/80 border border-amber-100 flex items-center gap-2 shadow-sm"
                        >
                          <span className="text-[11px] font-bold text-gray-700">{et}</span>
                          <span className="text-[11px] font-semibold text-amber-600">${revenue.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Campaign Revenue Area Chart */}
        <div className="mb-6 p-6 rounded-2xl bg-white border border-gray-200/60 shadow-sm">
          <h4 className="text-lg font-bold text-gray-900 mb-4">Campaign Revenue</h4>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={analytics.campaignStats
                  .slice(0, 100)
                  .map((campaign: CampaignStats) => ({
                    name: campaign.name.length > 10 ? campaign.name.substring(0, 10) + '...' : campaign.name,
                    revenue: campaign.revenue,
                    fullName: campaign.name
                  }))
                  .sort((a: { revenue: number }, b: { revenue: number }) => b.revenue - a.revenue)
                }
                margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="colorCampaignArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
                  dy={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                  dx={-8}
                />
                <Tooltip
                  content={<CampaignCustomTooltip />}
                  cursor={{ stroke: '#6366F1', strokeWidth: 1, strokeDasharray: '4 4', fill: 'transparent' }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6366F1"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorCampaignArea)"
                  dot={{ r: 4, fill: '#6366F1', stroke: '#fff', strokeWidth: 2, fillOpacity: 1 }}
                  activeDot={{ r: 6, fill: '#6366F1', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Campaign Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {analytics.campaignStats.map((campaign) => {
            const advColor = campaign.advertiser ? getAdvertiserAccent(campaign.advertiser) : '#6366F1';
            const bgRgba = hexToRgba(advColor, 0.045);
            const borderRgba = hexToRgba(advColor, 0.16);

            return (
              <div
                key={campaign.name}
                onClick={() => openCampaignPopup(campaign)}
                style={{
                  backgroundColor: bgRgba,
                  borderColor: borderRgba
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = hexToRgba(advColor, 0.35);
                  e.currentTarget.style.backgroundColor = hexToRgba(advColor, 0.075);
                  e.currentTarget.style.boxShadow = `0 10px 20px -5px ${hexToRgba(advColor, 0.12)}, 0 4px 6px -4px ${hexToRgba(advColor, 0.12)}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = borderRgba;
                  e.currentTarget.style.backgroundColor = bgRgba;
                  e.currentTarget.style.boxShadow = 'none';
                }}
                className="group p-4 rounded-3xl border shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between gap-3"
              >
                {/* Campaign Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: advColor }}
                    />
                    <h4
                      className="font-extrabold text-sm text-slate-800 truncate"
                      title={campaign.name}
                    >
                      {campaign.name}
                    </h4>
                  </div>
                  {campaign.advertiser && (
                    <span
                      className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider leading-none select-none flex-shrink-0"
                      style={{
                        backgroundColor: hexToRgba(advColor, 0.08),
                        color: advColor,
                        border: `1px solid ${hexToRgba(advColor, 0.15)}`
                      }}
                    >
                      {campaign.advertiser}
                    </span>
                  )}
                </div>

                {/* Revenue Display */}
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1.5">REVENUE</span>
                  <p
                    className="text-[22px] font-black tracking-tight leading-none"
                    style={{ color: advColor }}
                  >
                    ${campaign.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>

                {/* Stats Footer */}
                <div className="flex items-center justify-between mt-0.5">
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-1 px-1.5 py-0.75 rounded-md bg-white border border-slate-200/50 text-[10px] font-bold text-slate-500 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
                      <Layers className="h-3 w-3 text-slate-400" />
                      <span>{campaign.creatives.length}</span>
                    </div>
                    <div className="flex items-center gap-1 px-1.5 py-0.75 rounded-md bg-white border border-slate-200/50 text-[10px] font-bold text-slate-500 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
                      <Users className="h-3 w-3 text-slate-400" />
                      <span>{campaign.ets.length}</span>
                    </div>
                  </div>
                  <span
                    className="text-[10px] font-black transition-colors flex items-center gap-0.5 leading-none"
                    style={{ color: advColor }}
                  >
                    Details <span className="text-[11px] font-bold">→</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* End: Campaign Revenue Breakdown */}

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
        <div className="p-6 rounded-2xl border bg-white/90 backdrop-blur-md border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
          <div className="flex items-center justify-between mb-6">
            {/* <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100/50 flex items-center justify-center shadow-xs">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight leading-tight">Campaign Analysis</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Explore Campaign Metrics</p>
              </div>
            </div> */}
            {selectedCampaign && (
              <button
                onClick={exportCampaignCreatives}
                className="flex items-center px-3.5 py-2 rounded-xl text-xs font-black transition-all bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md shadow-blue-500/10 border border-blue-400/20 active:scale-95"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Creatives
              </button>
            )}
          </div>

          <div className="p-5 rounded-2xl mb-4 bg-slate-50/50 border border-slate-200/40 backdrop-blur-md shadow-3xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100/60 shadow-3xs flex-shrink-0">
                  <Search className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Interactive Filter</span>
                  <label className="block text-sm font-black text-slate-800 mt-0.5">Select Campaign for Detailed Analysis</label>
                  <p className="text-xs text-slate-500 font-medium">
                    Click on any campaign below to view ET-wise performance and export creative data
                  </p>
                </div>
              </div>
              {selectedCampaign && (
                <button
                  onClick={() => setSelectedCampaign('')}
                  className="self-start sm:self-center px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-55 hover:border-slate-300 text-slate-700 transition-all font-bold text-xs flex items-center gap-1.5 shadow-3xs active:scale-95"
                >
                  <X className="h-3.5 w-3.5 text-slate-400" />
                  Clear Selection
                </button>
              )}
            </div>

            {/* Campaign Capsules - Always Visible Selection */}
            <div className="flex flex-wrap gap-2 pt-1">
              {analytics.campaignStats.map(campaign => {
                const isSelected = selectedCampaign === campaign.name;

                return (
                  <button
                    key={campaign.name}
                    onClick={() => setSelectedCampaign(campaign.name)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 border flex items-center gap-2 hover:scale-[1.01] active:scale-95 ${isSelected
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                      : 'bg-white hover:bg-slate-55 border-slate-200 text-slate-700 shadow-3xs hover:border-slate-300'
                      }`}
                  >
                    <span className={isSelected ? 'text-white/85' : 'text-slate-400 font-semibold'}>
                      {campaign.name}
                    </span>
                    <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white/40' : 'bg-slate-200'}`} />
                    <span className={isSelected ? 'text-white font-black' : 'text-slate-800 font-extrabold'}>
                      ${campaign.revenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        {/* Campaign Analysis */}
        {selectedCampaignData && (
          <div className="p-6 rounded-3xl border border-slate-200 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            {/* Header Section */}
            <div className="mb-6 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white shadow-md border border-slate-800/80 relative overflow-hidden">
              {/* Subtle decorative background light */}
              <div className="absolute right-0 top-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute left-1/3 bottom-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/20 backdrop-blur-md">
                    <Target className="h-6 w-6 text-emerald-300" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Campaign Detailed Profile</span>
                    <h3 className="text-2xl font-black mb-1 tracking-tight text-white">Campaign: {selectedCampaignData.name}</h3>
                    <div className="flex items-center gap-3 text-slate-300 text-xs font-semibold mt-1">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5 text-emerald-400" />
                        {selectedCampaignData.creatives.length} creatives
                      </span>
                      <span className="w-1 h-1 rounded-full bg-slate-600" />
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-emerald-400" />
                        {selectedCampaignData.ets.length} ETs
                      </span>
                    </div>
                  </div>
                </div>
                <div className="w-full sm:w-auto text-left sm:text-right bg-white/5 backdrop-blur-md px-5 py-3 rounded-xl border border-white/10 shadow-inner">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total Revenue</p>
                  <p className="text-3xl font-black text-emerald-400 tracking-tight">
                    ${selectedCampaignData.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

            {/* Top Performing Creative */}
            {selectedCampaignData.creatives.length > 0 && (
              <div className="mb-6 p-4.5 rounded-2xl bg-amber-50/40 border border-amber-200/60 shadow-sm relative overflow-hidden p-3">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-200/20 rounded-full blur-xl pointer-events-none" />
                <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="p-2.5 rounded-xl bg-amber-100/80 text-amber-600 border border-amber-200/50 shadow-sm flex-shrink-0">
                      <Crown className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-0.5">Top Performing Creative</p>
                      <h4 className="text-sm font-bold text-slate-800 break-all">{selectedCampaignData.creatives[0].name}</h4>
                      <p className="text-[10px] font-semibold text-amber-700/80 mt-1 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        ETs: {selectedCampaignData.creatives[0].ets.join(', ')}
                      </p>
                    </div>
                  </div>
                  <div className="w-full sm:w-auto flex sm:flex-col justify-between sm:text-right items-baseline sm:items-end border-t sm:border-t-0 pt-2 sm:pt-0 border-amber-100/50">
                    <p className="text-xl font-extrabold text-amber-700">
                      ${selectedCampaignData.creatives[0].revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-[11px] font-semibold text-amber-600/90 ml-2 sm:ml-0">
                      {selectedCampaignData.creatives[0].frequency} occurrences
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ET Revenue for Selected Campaign */}
            <div className="mb-6">
              <div className="flex items-center mb-4 gap-3">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <Users className="h-5 w-5" />
                </div>
                <h4 className="text-lg font-bold text-gray-900">ET-Wise Revenue Breakdown</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {selectedCampaignData.ets
                  .map(etName => {
                    const etRevenue = data.records
                      .filter(r => isRecordForCampaign(r, selectedCampaignData) && r.et.toUpperCase() === etName.toUpperCase())
                      .reduce((sum, r) => sum + r.revenue, 0);
                    const creatives = data.records
                      .filter(r => isRecordForCampaign(r, selectedCampaignData) && r.et.toUpperCase() === etName.toUpperCase())
                      .reduce((acc, r) => {
                        if (!acc.find(c => c.name === r.creative)) {
                          acc.push({
                            name: r.creative,
                            frequency: r.conv ?? 1,
                            revenue: r.revenue
                          });
                        } else {
                          const existing = acc.find(c => c.name === r.creative)!;
                          existing.frequency += r.conv ?? 1;
                          existing.revenue += r.revenue;
                        }
                        return acc;
                      }, [] as { name: string; frequency: number; revenue: number }[]);
                    return { etName, etRevenue, creatives };
                  })
                  .sort((a, b) => b.etRevenue - a.etRevenue)
                  .map((etData) => {
                    const etFrequency = etData.creatives.reduce((sum, c) => sum + c.frequency, 0);
                    return (
                      <div
                        key={etData.etName}
                        className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-emerald-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                      >
                        <div>
                          {/* ET Header */}
                          <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-slate-100">
                            <Users className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                            <h4 className="text-sm font-bold text-slate-800 truncate">{etData.etName}</h4>
                          </div>

                          {/* Revenue & Frequency - Clean & Aligned */}
                          <div className="grid grid-cols-2 gap-2 mb-4">
                            <div className="bg-slate-50/50 p-2 rounded-xl border border-slate-100">
                              <p className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Revenue</p>
                              <p className="text-base font-extrabold text-emerald-600">
                                ${etData.etRevenue.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                              </p>
                            </div>
                            <div className="bg-slate-50/50 p-2 rounded-xl border border-slate-100">
                              <p className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Frequency</p>
                              <p className="text-base font-extrabold text-slate-700">
                                {etFrequency}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Active Creatives Chips */}
                        <div>
                          <div className="flex items-center gap-1 mb-1.5">
                            <FileText className="h-3 w-3 text-slate-400" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Creatives ({etData.creatives.length})
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {etData.creatives.slice(0, 4).map((creative, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-lg text-[9.5px] font-semibold bg-emerald-50/60 text-emerald-600 border border-emerald-100/50"
                                title={creative.name}
                              >
                                {creative.name.length > 12 ? creative.name.substring(0, 12) + '...' : creative.name}
                              </span>
                            ))}
                            {etData.creatives.length > 4 && (
                              <span className="px-1.5 py-0.5 rounded-lg text-[9.5px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                +{etData.creatives.length - 4}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* All Creatives */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <FileText className="h-5 w-5" />
                </div>
                <h4 className="text-lg font-bold text-gray-900">All Creatives ({selectedCampaignData.creatives.length})</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {selectedCampaignData.creatives.map((creative, idx) => (
                  <div
                    key={creative.name}
                    className="p-3.5 rounded-2xl border border-slate-200/80 bg-white hover:border-emerald-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between mb-3 gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                          <h5 className="font-semibold text-xs text-slate-800 truncate" title={creative.name}>{creative.name}</h5>
                        </div>
                        {idx === 0 && (
                          <span className="p-0.5 rounded-md bg-amber-50 text-amber-500 border border-amber-200 flex-shrink-0" title="Top Performing">
                            <Crown className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2.5 border-t border-slate-100">
                      <div>
                        <p className="text-base font-extrabold text-emerald-600">
                          ${creative.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                          {creative.frequency} {creative.frequency === 1 ? 'occurrence' : 'occurrences'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-100/50">
                      <p className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider mb-1">Associated ETs</p>
                      <div className="flex flex-wrap gap-1">
                        {creative.ets.map((et, etIdx) => (
                          <span
                            key={etIdx}
                            className="px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-600 text-[9px] font-medium"
                          >
                            {et}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* End: Campaign Filters & Analysis */}

      {/* Filters 2 */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
        <div className="p-6 rounded-2xl border bg-white/90 backdrop-blur-md border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
          <div className="flex items-center justify-between mb-6">
            {/* <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100/50 flex items-center justify-center shadow-xs">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight leading-tight">ET Analysis</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Explore ET Performance</p>
              </div>
            </div> */}
            {selectedET && (
              <button
                onClick={exportETCreatives}
                className="flex items-center px-3.5 py-2 rounded-xl text-xs font-black transition-all bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-650 hover:to-indigo-750 text-white shadow-md shadow-indigo-500/10 border border-indigo-400/20 active:scale-95"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Creatives
              </button>
            )}
          </div>

          <div className="p-5 rounded-2xl mb-4 bg-slate-50/50 border border-slate-200/40 backdrop-blur-md shadow-3xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100/60 shadow-3xs flex-shrink-0">
                  <Search className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">Interactive Filter</span>
                  <label className="block text-sm font-black text-slate-800 mt-0.5">Select ET for Detailed Analysis</label>
                  <p className="text-xs text-slate-500 font-medium">
                    Click on any ET below to view campaign-wise performance and export creative data
                  </p>
                </div>
              </div>
              {selectedET && (
                <button
                  onClick={() => setSelectedET('')}
                  className="self-start sm:self-center px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-55 hover:border-slate-300 text-slate-700 transition-all font-bold text-xs flex items-center gap-1.5 shadow-3xs active:scale-95"
                >
                  <X className="h-3.5 w-3.5 text-slate-400" />
                  Clear Selection
                </button>
              )}
            </div>

            {/* ET Capsules - Always Visible Selection */}
            <div className="flex flex-wrap gap-2 pt-1">
              {analytics.etStats.map(et => {
                const isSelected = selectedET === et.name;
                const isCombined = et.name.includes('+');

                return (
                  <button
                    key={et.name}
                    onClick={() => setSelectedET(et.name)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 border flex items-center gap-2 hover:scale-[1.01] active:scale-95 ${isSelected
                      ? isCombined
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-purple-500 shadow-md shadow-purple-500/20'
                        : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-blue-500 shadow-md shadow-blue-500/20'
                      : isCombined
                        ? 'bg-white hover:bg-slate-55 border-slate-200 text-slate-700 shadow-3xs hover:border-purple-200/30'
                        : 'bg-white hover:bg-slate-55 border-slate-200 text-slate-700 shadow-3xs hover:border-blue-200/30'
                      }`}
                  >
                    <span className={isSelected ? 'text-white/85' : 'text-slate-400 font-semibold'}>
                      {et.name}
                    </span>
                    <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white/40' : 'bg-slate-200'}`} />
                    <span className={isSelected ? 'text-white font-black' : 'text-slate-800 font-extrabold'}>
                      ${et.revenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        {/* ET Analysis */}

        {selectedETData && (
          <div className="space-y-6">
            {/* Show individual ETs separately if combined ET is selected */}
            {individualETsData ? (
              individualETsData.map((etData, idx) => (
                <div key={etData.name} className="p-6 rounded-3xl border border-slate-200 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                  {/* Header Section */}
                  <div className="mb-6 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white shadow-md border border-slate-800/80 relative overflow-hidden">
                    {/* Subtle decorative background light */}
                    <div className="absolute right-0 top-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute left-1/3 bottom-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-indigo-500/20 border border-indigo-400/20 backdrop-blur-md">
                          <Users className="h-6 w-6 text-indigo-300" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">ET Detailed Profile</span>
                          <h3 className="text-2xl font-black mb-1 tracking-tight text-white">ET: {etData.name}</h3>
                          <div className="flex items-center gap-3 text-slate-300 text-xs font-semibold mt-1">
                            <span className="flex items-center gap-1">
                              <FileText className="h-3.5 w-3.5 text-indigo-400" />
                              {etData.creatives.length} creatives
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-600" />
                            <span className="flex items-center gap-1">
                              <Target className="h-3.5 w-3.5 text-indigo-400" />
                              {etData.campaigns.length} campaigns
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="w-full sm:w-auto text-left sm:text-right bg-white/5 backdrop-blur-md px-5 py-3 rounded-xl border border-white/10 shadow-inner">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total Revenue</p>
                        <p className="text-3xl font-black text-emerald-400 tracking-tight">
                          ${etData.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Top Performing Creative for ET */}
                  {etData.creatives.length > 0 && (
                    <div className="mb-6 p-4.5 rounded-2xl bg-amber-50/40 border border-amber-200/60 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-amber-200/20 rounded-full blur-xl pointer-events-none" />
                      <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="flex items-center gap-3.5">
                          <div className="p-2.5 rounded-xl bg-amber-100/80 text-amber-600 border border-amber-200/50 shadow-sm flex-shrink-0">
                            <Crown className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-0.5">Top Performing Creative</p>
                            <h4 className="text-sm font-bold text-slate-800 break-all">{etData.creatives[0].name}</h4>
                          </div>
                        </div>
                        <div className="w-full sm:w-auto flex sm:flex-col justify-between sm:text-right items-baseline sm:items-end border-t sm:border-t-0 pt-2 sm:pt-0 border-amber-100/50">
                          <p className="text-xl font-extrabold text-amber-700">
                            ${etData.creatives[0].revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          <p className="text-[11px] font-semibold text-amber-600/90 ml-2 sm:ml-0">
                            {etData.creatives[0].frequency} occurrences
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Advertiser Revenue Breakdown */}
                  {etData.advertisersArray && etData.advertisersArray.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center mb-4 gap-3">
                        <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <h4 className="text-lg font-extrabold text-slate-800 tracking-tight">Advertiser-Wise Revenue Breakdown</h4>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                        {etData.advertisersArray.map(ad => {
                          const accent = getAdvertiserAccent(ad.name);
                          const percent = etData.revenue > 0 ? (ad.revenue / etData.revenue) * 100 : 0;
                          return (
                            <div
                              key={ad.name}
                              className="relative p-3.5 rounded-2xl border transition-all duration-300 flex flex-col justify-between gap-2 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.08)] hover:scale-[1.01] group bg-white"
                              style={{
                                background: `linear-gradient(135deg, ${hexToRgba(accent, 0.05)} 0%, ${hexToRgba(accent, 0.015)} 100%)`,
                                borderColor: hexToRgba(accent, 0.15),
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = hexToRgba(accent, 0.35);
                                e.currentTarget.style.boxShadow = `0 10px 15px -3px ${hexToRgba(accent, 0.08)}, 0 4px 6px -4px ${hexToRgba(accent, 0.08)}`;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = hexToRgba(accent, 0.15);
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span
                                    className="w-2 h-2 rounded-full flex-shrink-0"
                                    style={{
                                      backgroundColor: accent,
                                      boxShadow: `0 0 6px ${hexToRgba(accent, 0.4)}`,
                                    }}
                                  />
                                  <span className="text-xs font-bold text-slate-700 truncate group-hover:text-slate-900 transition-colors">
                                    {ad.name}
                                  </span>
                                </div>
                                <span
                                  className="text-[10px] font-black px-1.5 py-0.5 rounded-md flex-shrink-0"
                                  style={{
                                    backgroundColor: hexToRgba(accent, 0.09),
                                    color: accent,
                                    border: `1px solid ${hexToRgba(accent, 0.15)}`,
                                  }}
                                >
                                  {percent.toFixed(1)}%
                                </span>
                              </div>
                              <div className="mt-1 flex items-baseline">
                                <span className="text-base font-black text-slate-900 tracking-tight">
                                  ${ad.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100/70 rounded-full overflow-hidden mt-1.5">
                                <div
                                  className="h-full rounded-full transition-all duration-500 ease-out"
                                  style={{
                                    width: `${percent}%`,
                                    backgroundColor: accent,
                                    boxShadow: `0 0 4px ${hexToRgba(accent, 0.25)}`,
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Campaign Revenue for Selected ET */}
                  <div className="mb-6">
                    <div className="flex items-center mb-4 gap-3">
                      <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                        <Target className="h-5 w-5" />
                      </div>
                      <h4 className="text-lg font-bold text-gray-900">Campaign-Wise Revenue Breakdown</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {etData.campaigns
                        .map(campaignName => {
                          const campaignData = analytics.campaignStats.find(c => c.name === campaignName);
                          const campaignRevenue = data.records
                            .filter(r => r.et.toUpperCase() === etData.name.toUpperCase() && campaignData && isRecordForCampaign(r, campaignData))
                            .reduce((sum, r) => sum + r.revenue, 0);
                          const creatives = data.records
                            .filter(r => r.et.toUpperCase() === etData.name.toUpperCase() && campaignData && isRecordForCampaign(r, campaignData))
                            .reduce((acc, r) => {
                              if (!acc.find(c => c.name === r.creative)) {
                                acc.push({
                                  name: r.creative,
                                  frequency: r.conv ?? 1,
                                  revenue: r.revenue
                                });
                              } else {
                                const existing = acc.find(c => c.name === r.creative)!;
                                existing.frequency += r.conv ?? 1;
                                existing.revenue += r.revenue;
                              }
                              return acc;
                            }, [] as { name: string; frequency: number; revenue: number }[]);
                          return { campaignName, campaignRevenue, creatives, advertiser: campaignData?.advertiser };
                        })
                        .sort((a, b) => b.campaignRevenue - a.campaignRevenue)
                        .map((campaignData) => {
                          const campaignFrequency = campaignData.creatives.reduce((sum, c) => sum + c.frequency, 0);
                          const advertiserName = campaignData?.advertiser;
                          const advertiserAccent = getAdvertiserAccent(advertiserName || '');
                          return (
                            <div
                              key={campaignData.campaignName}
                              style={{
                                backgroundColor: hexToRgba(advertiserAccent, 0.045),
                                borderColor: hexToRgba(advertiserAccent, 0.16)
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = hexToRgba(advertiserAccent, 0.35);
                                e.currentTarget.style.backgroundColor = hexToRgba(advertiserAccent, 0.075);
                                e.currentTarget.style.boxShadow = `0 8px 16px -4px ${hexToRgba(advertiserAccent, 0.1)}, 0 4px 6px -4px ${hexToRgba(advertiserAccent, 0.1)}`;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = hexToRgba(advertiserAccent, 0.16);
                                e.currentTarget.style.backgroundColor = hexToRgba(advertiserAccent, 0.045);
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                              className="p-3.5 rounded-2xl border transition-all duration-300 flex flex-col justify-between hover:shadow-xs"
                            >
                              <div>
                                {/* Campaign Header */}
                                <div className="flex items-center justify-between gap-2 mb-3">
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <Target className="h-4 w-4 flex-shrink-0" style={{ color: advertiserAccent }} />
                                    <h4 className="text-sm font-extrabold text-slate-800 truncate" title={campaignData.campaignName}>
                                      {campaignData.campaignName}
                                    </h4>
                                  </div>
                                  {advertiserName && (
                                    <span
                                      className="text-[9px] font-black px-1.5 py-0.5 rounded-md flex-shrink-0 uppercase tracking-wider"
                                      style={{
                                        backgroundColor: hexToRgba(advertiserAccent, 0.09),
                                        color: advertiserAccent,
                                        border: `1px solid ${hexToRgba(advertiserAccent, 0.15)}`,
                                      }}
                                    >
                                      {advertiserName}
                                    </span>
                                  )}
                                </div>

                                {/* Revenue & Frequency - Clean & Aligned */}
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                  <div className="bg-white/80 p-2 rounded-xl border border-slate-100 flex flex-col justify-between">
                                    <p className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest mb-1 leading-none">Revenue</p>
                                    <p className="text-[14px] font-black text-emerald-600 leading-none">
                                      ${campaignData.campaignRevenue.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                                    </p>
                                  </div>
                                  <div className="bg-white/80 p-2 rounded-xl border border-slate-100 flex flex-col justify-between">
                                    <p className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest mb-1 leading-none">Frequency</p>
                                    <p className="text-[14px] font-black text-slate-700 leading-none">
                                      {campaignFrequency}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Active Creatives Chips */}
                              <div className="mt-0.5">
                                <div className="flex items-center gap-1 mb-1.5">
                                  <Users className="h-3 w-3 text-slate-400" />
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                    Creatives ({campaignData.creatives.length})
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {campaignData.creatives.slice(0, 4).map((creative, idx) => (
                                    <span
                                      key={idx}
                                      className="px-1.5 py-0.5 rounded-lg text-[9px] font-semibold bg-indigo-50/60 text-indigo-600 border border-indigo-100/50"
                                      title={creative.name}
                                    >
                                      {creative.name.length > 12 ? creative.name.substring(0, 12) + '...' : creative.name}
                                    </span>
                                  ))}
                                  {campaignData.creatives.length > 4 && (
                                    <span className="px-1.5 py-0.5 rounded-lg text-[9px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                      +{campaignData.creatives.length - 4}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* All Creatives for ET */}
                  <div className="mt-6 pt-6 border-t border-slate-200">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
                        <FileText className="h-5 w-5" />
                      </div>
                      <h4 className="text-lg font-bold text-gray-900">All Creatives ({etData.creatives.length})</h4>
                    </div>

                    {/* Campaign Tabs for Filtering */}
                    <div className="mb-5 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
                      <div className="flex space-x-1.5 pb-2">
                        <button
                          onClick={() => setSelectedETCreativeFilter('all')}
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-xl whitespace-nowrap transition-all border ${selectedETCreativeFilter === 'all'
                            ? 'bg-slate-950 text-white border-slate-950 shadow-[0_2px_6px_rgba(0,0,0,0.06)]'
                            : 'bg-slate-50/50 hover:bg-slate-100/80 text-slate-600 border-slate-200/60'
                            }`}
                        >
                          All ({etData.creatives.length})
                        </button>
                        {etData.campaigns.map((campaign) => {
                          const campaignCreativeCount = etData.creatives.filter(creative => {
                            const campaignData = analytics.campaignStats.find(c => c.name === campaign);
                            return data.records.some(
                              record => record.et.toUpperCase() === etData.name.toUpperCase() &&
                                record.creative === creative.name &&
                                campaignData && isRecordForCampaign(record, campaignData)
                            );
                          }).length;

                          return (
                            <button
                              key={campaign}
                              onClick={() => setSelectedETCreativeFilter(campaign)}
                              className={`px-2.5 py-1 text-[11px] font-bold rounded-xl whitespace-nowrap transition-all border ${selectedETCreativeFilter === campaign
                                ? 'bg-slate-955 text-white border-slate-955 shadow-[0_2px_6px_rgba(0,0,0,0.06)] bg-slate-950'
                                : 'bg-slate-50/50 hover:bg-slate-100/80 text-slate-600 border-slate-200/60'
                                }`}
                            >
                              {campaign} ({campaignCreativeCount})
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Filtered Creatives Display */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {etData.creatives
                        .filter(creative => {
                          if (selectedETCreativeFilter === 'all') return true;

                          const campaignData = analytics.campaignStats.find(c => c.name === selectedETCreativeFilter);
                          return data.records.some(
                            record => record.et.toUpperCase() === etData.name.toUpperCase() &&
                              record.creative === creative.name &&
                              campaignData && isRecordForCampaign(record, campaignData)
                          );
                        })
                        .map((creative, idx) => {
                          const creativeRecord = data.records.find(r => r.creative === creative.name);
                          const creativeAdvertiser = creativeRecord?.advertiser || '';
                          const creativeColor = getAdvertiserAccent(creativeAdvertiser);
                          const bgRgba = hexToRgba(creativeColor, 0.045);
                          const borderRgba = hexToRgba(creativeColor, 0.16);

                          return (
                            <div
                              key={creative.name}
                              style={{
                                backgroundColor: bgRgba,
                                borderColor: borderRgba
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = hexToRgba(creativeColor, 0.35);
                                e.currentTarget.style.backgroundColor = hexToRgba(creativeColor, 0.075);
                                e.currentTarget.style.boxShadow = `0 8px 16px -4px ${hexToRgba(creativeColor, 0.1)}, 0 4px 6px -4px ${hexToRgba(creativeColor, 0.1)}`;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = borderRgba;
                                e.currentTarget.style.backgroundColor = bgRgba;
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                              className="p-3 rounded-2xl border transition-all duration-300 flex flex-col justify-between hover:shadow-xs"
                            >
                              <div>
                                <div className="flex items-start justify-between mb-2 gap-2">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <FileText className="h-3.5 w-3.5 flex-shrink-0" style={{ color: creativeColor }} />
                                    <h5 className="font-bold text-xs text-slate-800 truncate" title={creative.name}>
                                      {creative.name}
                                    </h5>
                                  </div>
                                  {idx === 0 && (
                                    <span
                                      className="p-0.75 rounded-md flex-shrink-0 flex items-center justify-center"
                                      style={{
                                        backgroundColor: hexToRgba('#F59E0B', 0.08),
                                        color: '#F59E0B',
                                        border: `1px solid ${hexToRgba('#F59E0B', 0.18)}`
                                      }}
                                      title="Top Performing"
                                    >
                                      <Crown className="h-3 w-3" />
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center justify-between mt-2.5">
                                <div>
                                  <p className="text-[15px] font-black" style={{ color: creativeColor }}>
                                    ${creative.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </p>
                                  <p className="text-[9px] font-bold text-slate-400 mt-0.5">
                                    {creative.frequency} {creative.frequency === 1 ? 'occurrence' : 'occurrences'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              /* Original single ET display for non-combined ETs */
              <div className="p-6 rounded-3xl border border-slate-200 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                {/* Header Section */}
                <div className="mb-6 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white shadow-md border border-slate-800/80 relative overflow-hidden">
                  {/* Subtle decorative background light */}
                  <div className="absolute right-0 top-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute left-1/3 bottom-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

                  <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-indigo-500/20 border border-indigo-400/20 backdrop-blur-md">
                        <Users className="h-6 w-6 text-indigo-300" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">ET Detailed Profile</span>
                        <h3 className="text-2xl font-black mb-1 tracking-tight text-white">ET: {selectedETData.name}</h3>
                        <div className="flex items-center gap-3 text-slate-300 text-xs font-semibold mt-1">
                          <span className="flex items-center gap-1">
                            <FileText className="h-3.5 w-3.5 text-indigo-400" />
                            {selectedETData.creatives.length} creatives
                          </span>
                          <span className="w-1 h-1 rounded-full bg-slate-600" />
                          <span className="flex items-center gap-1">
                            <Target className="h-3.5 w-3.5 text-indigo-400" />
                            {selectedETData.campaigns.length} campaigns
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="w-full sm:w-auto text-left sm:text-right bg-white/5 backdrop-blur-md px-5 py-3 rounded-xl border border-white/10 shadow-inner">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total Revenue</p>
                      <p className="text-3xl font-black text-emerald-400 tracking-tight">
                        ${selectedETData.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Top Performing Creative for ET */}
                {selectedETData.creatives.length > 0 && (
                  <div className="mb-6 p-4.5 rounded-2xl bg-amber-50/40 border border-amber-200/60 shadow-sm relative overflow-hidden p-3">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-200/20 rounded-full blur-xl pointer-events-none" />
                    <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="flex items-center gap-3.5">
                        <div className="p-2.5 rounded-xl bg-amber-100/80 text-amber-600 border border-amber-200/50 shadow-sm flex-shrink-0">
                          <Crown className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-0.5">Top Performing Creative</p>
                          <h4 className="text-sm font-bold text-slate-800 break-all">{selectedETData.creatives[0].name}</h4>
                        </div>
                      </div>
                      <div className="w-full sm:w-auto flex sm:flex-col justify-between sm:text-right items-baseline sm:items-end border-t sm:border-t-0 pt-2 sm:pt-0 border-amber-100/50">
                        <p className="text-xl font-extrabold text-amber-700">
                          ${selectedETData.creatives[0].revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-[11px] font-semibold text-amber-600/90 ml-2 sm:ml-0">
                          {selectedETData.creatives[0].frequency} occurrences
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Advertiser Revenue Breakdown */}
                {selectedETData.advertisersArray && selectedETData.advertisersArray.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center mb-4 gap-3">
                      <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <h4 className="text-lg font-extrabold text-slate-800 tracking-tight">Advertiser-Wise Revenue Breakdown</h4>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                      {selectedETData.advertisersArray.map(ad => {
                        const accent = getAdvertiserAccent(ad.name);
                        const percent = selectedETData.revenue > 0 ? (ad.revenue / selectedETData.revenue) * 100 : 0;
                        return (
                          <div
                            key={ad.name}
                            className="relative p-3.5 rounded-2xl border transition-all duration-300 flex flex-col justify-between gap-2 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.08)] hover:scale-[1.01] group bg-white"
                            style={{
                              background: `linear-gradient(135deg, ${hexToRgba(accent, 0.05)} 0%, ${hexToRgba(accent, 0.015)} 100%)`,
                              borderColor: hexToRgba(accent, 0.15),
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = hexToRgba(accent, 0.35);
                              e.currentTarget.style.boxShadow = `0 10px 15px -3px ${hexToRgba(accent, 0.08)}, 0 4px 6px -4px ${hexToRgba(accent, 0.08)}`;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = hexToRgba(accent, 0.15);
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span
                                  className="w-2 h-2 rounded-full flex-shrink-0"
                                  style={{
                                    backgroundColor: accent,
                                    boxShadow: `0 0 6px ${hexToRgba(accent, 0.4)}`,
                                  }}
                                />
                                <span className="text-xs font-bold text-slate-700 truncate group-hover:text-slate-900 transition-colors">
                                  {ad.name}
                                </span>
                              </div>
                              <span
                                className="text-[10px] font-black px-1.5 py-0.5 rounded-md flex-shrink-0"
                                style={{
                                  backgroundColor: hexToRgba(accent, 0.09),
                                  color: accent,
                                  border: `1px solid ${hexToRgba(accent, 0.15)}`,
                                }}
                              >
                                {percent.toFixed(1)}%
                              </span>
                            </div>
                            <div className="mt-1 flex items-baseline">
                              <span className="text-base font-black text-slate-900 tracking-tight">
                                ${ad.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100/70 rounded-full overflow-hidden mt-1.5">
                              <div
                                className="h-full rounded-full transition-all duration-500 ease-out"
                                style={{
                                  width: `${percent}%`,
                                  backgroundColor: accent,
                                  boxShadow: `0 0 4px ${hexToRgba(accent, 0.25)}`,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Campaign Revenue for Selected ET */}
                <div className="mb-6">
                  <div className="flex items-center mb-4 gap-3">
                    <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                      <Target className="h-5 w-5" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900">Campaign-Wise Revenue Breakdown</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {selectedETData.campaigns
                      .map(campaignName => {
                        const campaignData = analytics.campaignStats.find(c => c.name === campaignName);
                        const etNames = getETNamesForFilter(selectedETData.name);
                        const campaignRevenue = data.records
                          .filter(r => etNames.includes(r.et.toUpperCase()) && campaignData && isRecordForCampaign(r, campaignData))
                          .reduce((sum, r) => sum + r.revenue, 0);
                        const creatives = data.records
                          .filter(r => etNames.includes(r.et.toUpperCase()) && campaignData && isRecordForCampaign(r, campaignData))
                          .reduce((acc, r) => {
                            if (!acc.find(c => c.name === r.creative)) {
                              acc.push({
                                name: r.creative,
                                frequency: r.conv ?? 1,
                                revenue: r.revenue
                              });
                            } else {
                              const existing = acc.find(c => c.name === r.creative)!;
                              existing.frequency += r.conv ?? 1;
                              existing.revenue += r.revenue;
                            }
                            return acc;
                          }, [] as { name: string; frequency: number; revenue: number }[]);
                        return { campaignName, campaignRevenue, creatives, advertiser: campaignData?.advertiser };
                      })
                      .sort((a, b) => b.campaignRevenue - a.campaignRevenue)
                      .map((campaignData) => {
                        const campaignFrequency = campaignData.creatives.reduce((sum, c) => sum + c.frequency, 0);
                        const advertiserName = campaignData?.advertiser;
                        const advertiserAccent = getAdvertiserAccent(advertiserName || '');
                        return (
                          <div
                            key={campaignData.campaignName}
                            style={{
                              backgroundColor: hexToRgba(advertiserAccent, 0.045),
                              borderColor: hexToRgba(advertiserAccent, 0.16)
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = hexToRgba(advertiserAccent, 0.35);
                              e.currentTarget.style.backgroundColor = hexToRgba(advertiserAccent, 0.075);
                              e.currentTarget.style.boxShadow = `0 8px 16px -4px ${hexToRgba(advertiserAccent, 0.1)}, 0 4px 6px -4px ${hexToRgba(advertiserAccent, 0.1)}`;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = hexToRgba(advertiserAccent, 0.16);
                              e.currentTarget.style.backgroundColor = hexToRgba(advertiserAccent, 0.045);
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                            className="p-3.5 rounded-2xl border transition-all duration-300 flex flex-col justify-between hover:shadow-xs"
                          >
                            <div>
                              {/* Campaign Header */}
                              <div className="flex items-center justify-between gap-2 mb-3">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <Target className="h-4 w-4 flex-shrink-0" style={{ color: advertiserAccent }} />
                                  <h4 className="text-sm font-extrabold text-slate-800 truncate" title={campaignData.campaignName}>
                                    {campaignData.campaignName}
                                  </h4>
                                </div>
                                {advertiserName && (
                                  <span
                                    className="text-[9px] font-black px-1.5 py-0.5 rounded-md flex-shrink-0 uppercase tracking-wider"
                                    style={{
                                      backgroundColor: hexToRgba(advertiserAccent, 0.09),
                                      color: advertiserAccent,
                                      border: `1px solid ${hexToRgba(advertiserAccent, 0.15)}`,
                                    }}
                                  >
                                    {advertiserName}
                                  </span>
                                )}
                              </div>

                              {/* Revenue & Frequency - Clean & Aligned */}
                              <div className="grid grid-cols-2 gap-2 mb-3">
                                <div className="bg-white/80 p-2 rounded-xl border border-slate-100 flex flex-col justify-between">
                                  <p className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest mb-1 leading-none">Revenue</p>
                                  <p className="text-[14px] font-black text-emerald-600 leading-none">
                                    ${campaignData.campaignRevenue.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                                  </p>
                                </div>
                                <div className="bg-white/80 p-2 rounded-xl border border-slate-100 flex flex-col justify-between">
                                  <p className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest mb-1 leading-none">Frequency</p>
                                  <p className="text-[14px] font-black text-slate-700 leading-none">
                                    {campaignFrequency}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Active Creatives Chips */}
                            <div className="mt-0.5">
                              <div className="flex items-center gap-1 mb-1.5">
                                <Users className="h-3 w-3 text-slate-400" />
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                  Creatives ({campaignData.creatives.length})
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {campaignData.creatives.slice(0, 4).map((creative, idx) => (
                                  <span
                                    key={idx}
                                    className="px-1.5 py-0.5 rounded-lg text-[9px] font-semibold bg-indigo-50/60 text-indigo-600 border border-indigo-100/50"
                                    title={creative.name}
                                  >
                                    {creative.name.length > 12 ? creative.name.substring(0, 12) + '...' : creative.name}
                                  </span>
                                ))}
                                {campaignData.creatives.length > 4 && (
                                  <span className="px-1.5 py-0.5 rounded-lg text-[9px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                    +{campaignData.creatives.length - 4}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* All Creatives for ET */}
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
                      <FileText className="h-5 w-5" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900">All Creatives ({selectedETData.creatives.length})</h4>
                  </div>

                  {/* Campaign Tabs for Filtering */}
                  <div className="mb-5 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
                    <div className="flex space-x-1.5 pb-2">
                      <button
                        onClick={() => setSelectedETCreativeFilter('all')}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-xl whitespace-nowrap transition-all border ${selectedETCreativeFilter === 'all'
                          ? 'bg-slate-950 text-white border-slate-955 shadow-[0_2px_6px_rgba(0,0,0,0.06)] border-slate-950'
                          : 'bg-slate-50/50 hover:bg-slate-100/80 text-slate-600 border-slate-200/60'
                          }`}
                      >
                        All ({selectedETData.creatives.length})
                      </button>
                      {selectedETData.campaigns.map((campaign) => {
                        const campaignCreativeCount = selectedETData.creatives.filter(creative => {
                          const campaignData = analytics.campaignStats.find(c => c.name === campaign);
                          return data.records.some(
                            record => record.et.toUpperCase() === selectedETData.name.toUpperCase() &&
                              record.creative === creative.name &&
                              campaignData && isRecordForCampaign(record, campaignData)
                          );
                        }).length;

                        return (
                          <button
                            key={campaign}
                            onClick={() => setSelectedETCreativeFilter(campaign)}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-xl whitespace-nowrap transition-all border ${selectedETCreativeFilter === campaign
                              ? 'bg-slate-955 text-white border-slate-955 shadow-[0_2px_6px_rgba(0,0,0,0.06)] bg-slate-950 border-slate-955'
                              : 'bg-slate-50/50 hover:bg-slate-100/80 text-slate-600 border-slate-200/60'
                              }`}
                          >
                            {campaign} ({campaignCreativeCount})
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Filtered Creatives Display */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {selectedETData.creatives
                      .filter(creative => {
                        if (selectedETCreativeFilter === 'all') return true;

                        const campaignData = analytics.campaignStats.find(c => c.name === selectedETCreativeFilter);
                        return data.records.some(
                          record => record.et.toUpperCase() === selectedETData.name.toUpperCase() &&
                            record.creative === creative.name &&
                            campaignData && isRecordForCampaign(record, campaignData)
                        );
                      })
                      .map((creative, idx) => {
                        const creativeRecord = data.records.find(r => r.creative === creative.name);
                        const creativeAdvertiser = creativeRecord?.advertiser || '';
                        const creativeColor = getAdvertiserAccent(creativeAdvertiser);
                        const bgRgba = hexToRgba(creativeColor, 0.045);
                        const borderRgba = hexToRgba(creativeColor, 0.16);

                        return (
                          <div
                            key={creative.name}
                            style={{
                              backgroundColor: bgRgba,
                              borderColor: borderRgba
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = hexToRgba(creativeColor, 0.35);
                              e.currentTarget.style.backgroundColor = hexToRgba(creativeColor, 0.075);
                              e.currentTarget.style.boxShadow = `0 8px 16px -4px ${hexToRgba(creativeColor, 0.1)}, 0 4px 6px -4px ${hexToRgba(creativeColor, 0.1)}`;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = borderRgba;
                              e.currentTarget.style.backgroundColor = bgRgba;
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                            className="p-3 rounded-2xl border transition-all duration-300 flex flex-col justify-between hover:shadow-xs"
                          >
                            <div>
                              <div className="flex items-start justify-between mb-2 gap-2">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <FileText className="h-3.5 w-3.5 flex-shrink-0" style={{ color: creativeColor }} />
                                  <h5 className="font-bold text-xs text-slate-800 truncate" title={creative.name}>
                                    {creative.name}
                                  </h5>
                                </div>
                                {idx === 0 && (
                                  <span
                                    className="p-0.75 rounded-md flex-shrink-0 flex items-center justify-center"
                                    style={{
                                      backgroundColor: hexToRgba('#F59E0B', 0.08),
                                      color: '#F59E0B',
                                      border: `1px solid ${hexToRgba('#F59E0B', 0.18)}`
                                    }}
                                    title="Top Performing"
                                  >
                                    <Crown className="h-3 w-3" />
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-2.5">
                              <div>
                                <p className="text-[15px] font-black" style={{ color: creativeColor }}>
                                  ${creative.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                                <p className="text-[9px] font-bold text-slate-400 mt-0.5">
                                  {creative.frequency} {creative.frequency === 1 ? 'occurrence' : 'occurrences'}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>


      {/* End: ET Filters & Analysis */}

      {/* Campaign Details Popup */}
      {campaignPopup.isOpen && campaignPopup.campaign && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="max-w-4xl w-full max-h-[85vh] overflow-hidden rounded-[2rem] shadow-[0_24px_60px_-15px_rgba(15,23,42,0.12),0_0_1px_1px_rgba(15,23,42,0.02)] bg-white/95 border border-slate-100 flex flex-col relative">
            {/* Header */}
            <div className="sticky top-0 px-6 py-5 border-b border-slate-100 bg-white/85 backdrop-blur-md z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-indigo-50 border border-indigo-100 text-indigo-600 shadow-2xs">
                    <Target className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight leading-tight">{campaignPopup.campaign.name}</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">Campaign Details & Performance</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Total Revenue</p>
                    <p className="text-2xl font-black text-emerald-600 tracking-tight">
                      ${campaignPopup.campaign.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <button
                    onClick={closeCampaignPopup}
                    className="w-9 h-9 rounded-xl border border-slate-200/60 bg-white flex items-center justify-center hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-all duration-200 shadow-2xs"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-3xl bg-white border border-slate-100 shadow-2xs flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Revenue</p>
                    <p className="text-lg font-black text-slate-800 mt-0.5">
                      ${campaignPopup.campaign.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
                <div className="p-4 rounded-3xl bg-white border border-slate-100 shadow-2xs flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Creatives</p>
                    <p className="text-lg font-black text-slate-800 mt-0.5">
                      {campaignPopup.campaign.creatives.length}
                    </p>
                  </div>
                </div>
                <div className="p-4 rounded-3xl bg-white border border-slate-100 shadow-2xs flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">ETs Count</p>
                    <p className="text-lg font-black text-slate-800 mt-0.5">
                      {campaignPopup.campaign.ets.length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Top Performer Card */}
              {campaignPopup.campaign.creatives.length > 0 && (
                <div className="mb-6 p-5 rounded-3xl bg-gradient-to-br from-amber-500/[0.03] to-orange-500/[0.03] border border-amber-200/60 shadow-2xs relative overflow-hidden">
                  <Award className="absolute -right-6 -bottom-6 w-28 h-28 text-amber-500/5 rotate-12 pointer-events-none" />

                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-200/30 flex items-center justify-center text-amber-600">
                      <Award className="h-4 w-4" />
                    </div>
                    <h3 className="text-xs font-black text-amber-900 uppercase tracking-wider">Top Performing Creative</h3>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                    <div className="space-y-1">
                      <p className="text-sm font-mono font-black text-slate-800 bg-white border border-slate-200/45 px-2.5 py-1 rounded-xl inline-block shadow-2xs">{campaignPopup.campaign.creatives[0].name}</p>
                      <div className="flex items-center gap-3.5 pt-1">
                        <span className="text-base font-extrabold text-emerald-600">
                          ${campaignPopup.campaign.creatives[0].revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-xs text-slate-200">|</span>
                        <span className="text-xs font-bold text-slate-500">
                          {campaignPopup.campaign.creatives[0].frequency} occurrences
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-w-sm">
                      {campaignPopup.campaign.creatives[0].ets.map(et => (
                        <span key={et} className="px-2 py-0.5 rounded-lg bg-white/80 border border-slate-200/35 text-slate-600 font-extrabold text-[10px] tracking-wide shadow-2xs">
                          {et}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* All Creatives Section */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-505 text-indigo-500">
                    <Layers className="h-3.5 w-3.5" />
                  </div>
                  <h3 className="text-sm font-black text-slate-800 tracking-tight">All Campaign Creatives ({campaignPopup.campaign.creatives.length})</h3>
                </div>
                <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="text-left px-4 py-3 font-extrabold text-[10px] text-slate-400 uppercase tracking-wider w-16">Rank</th>
                          <th className="text-left px-4 py-3 font-extrabold text-[10px] text-slate-400 uppercase tracking-wider">Creative Name</th>
                          <th className="text-right px-4 py-3 font-extrabold text-[10px] text-slate-400 uppercase tracking-wider w-36">Revenue</th>
                          <th className="text-right px-4 py-3 font-extrabold text-[10px] text-slate-400 uppercase tracking-wider w-28">Frequency</th>
                          <th className="text-left px-4 py-3 font-extrabold text-[10px] text-slate-400 uppercase tracking-wider">Targeted ETs</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {campaignPopup.campaign.creatives.map((creative, index) => (
                          <tr key={creative.name} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-4 py-3">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shadow-3xs ${index === 0 ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-xs' :
                                index === 1 ? 'bg-gradient-to-r from-slate-300 to-slate-400 text-white shadow-xs' :
                                  index === 2 ? 'bg-gradient-to-r from-orange-400 to-amber-600 text-white shadow-xs' :
                                    'bg-slate-100 text-slate-500'
                                }`}>
                                {index + 1}
                              </div>
                            </td>
                            <td className="px-4 py-3 font-mono font-bold text-slate-700 truncate max-w-[240px]" title={creative.name}>
                              {creative.name}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-slate-800">
                              ${creative.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-indigo-600">
                              {creative.frequency}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1">
                                {creative.ets.map(et => (
                                  <span key={et} className="px-2 py-0.5 rounded-md bg-indigo-50/60 border border-indigo-100/45 text-indigo-600 font-extrabold text-[10px] tracking-wide">
                                    {et}
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* End: Campaign Details Popup */}
    </div>
  );
};

export default Dashboard;
