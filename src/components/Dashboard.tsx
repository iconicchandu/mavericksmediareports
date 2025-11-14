import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, FileText, TrendingUp, Users, Target, DollarSign, RefreshCw, Building2, Zap, Globe, Wifi, Award, BarChart3, Search, X, Star, Activity, Layers, Eye, Hash, Calendar, AtSign, ChevronUp, ChevronDown, Crown } from 'lucide-react';
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
      return '#3B82F6'; // blue
    case 'RGR':
      return '#f1b308'; // yellow
    case 'GZ':
      return '#0EA5E9'; // sky
    case 'CM Gmail':
      return '#F97316'; // orange
    case 'MI':
      return '#2563EB'; // accent for MI (indigo/blue)
    case 'ES':
      return '#22C55E'; // green
    case 'XC':
      return '#06B6D4'; // cyan
    case 'Comcast':
      return '#DC2626'; // red
    case 'Other':
      return '#9CA3AF'; // gray
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
// ----------------------- END: UI Accent Helpers -----------------------



const Dashboard: React.FC<DashboardProps> = ({ data, uploadedFiles, searchQuery, onSearchChange, onReset }) => {
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [selectedET, setSelectedET] = useState('');
  const [campaignPopup, setCampaignPopup] = useState<{
    isOpen: boolean;
    campaign: CampaignStats | null;
  }>({ isOpen: false, campaign: null });

  // Expanded ET state for advertiser breakdown
  const [expandedETs, setExpandedETs] = useState<Set<string>>(new Set());

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
    "JSG21": "$1100",
    "P24": "$1100",
    "JSG41": "$1100",
    "CM41": "JSG41",
    "JSG34": "$1100",
    "JSG36": "$800",
    "C36": "JSG36",
    "JSG26": "$1800",
    "JSG29": "$1800",
    "JSG30PM": "$1800",
    "JSG22": "0",
    "JSG32": "$1100",
    "EX32": "JSG32",
    "JSG20": "$1800",
    "JSG38": "$1100",
    "JSG40": "$1100",
    "JSG43": "$750",
    "JSG44": "$1100",
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

  // ------------------ET Info Stack,Manager-----
  // 👥 ET Information Map (Stack, Manager, and optional Type)
  const etInfoMap: Record<
    string,
    { stack: string; manager: string; type?: string }
  > = {
    // S1
    "JSG21": { stack: "S1", manager: "Aditya G." },
    "24MC": { stack: "S1", manager: "Abhay S.", type: "COM" },
    "P24": { stack: "S1", manager: "Abhay S." },
    "JSG41": { stack: "S1", manager: "Aditya G." },
    "CM41": { stack: "S1", manager: "Aditya G." },
    "JSG45": { stack: "S1", manager: "Aditya G. | Abhay S." },

    // S4
    "JSG34": { stack: "S4", manager: "Satyam S." },

    // S6
    "JSG36": { stack: "S6", manager: "Nikhil T." },
    "C36": { stack: "S6", manager: "Nikhil T." },

    // S7
    "JSG26": { stack: "S7", manager: "Nikhil T." },
    "JSG29": { stack: "S7", manager: "Keshav T." },
    "JSG30PM": { stack: "S7", manager: "Aditya S." },

    // S10
    "C18": { stack: "S10", manager: "Aditya S.", type: "COM" },
    "22MB": { stack: "S10", manager: "Keshav T.", type: "N-C" },
    "22mb": { stack: "S10", manager: "Keshav T.", type: "N-C" },
    "JSG22": { stack: "S10", manager: "Kaif K." },
    "JSG18": { stack: "S10", manager: "Aditya S." },

    // S11
    "JSG32": { stack: "S11", manager: "Kaif K." },
    "EX32": { stack: "S11", manager: "Kaif K." },
    "JSG20": { stack: "S11", manager: "Harsh G." },
    "JSG44": { stack: "S11", manager: "Harsh G." },

    // S12
    "JSG38": { stack: "S12", manager: "Kaif K." },
    "JSG38N": { stack: "S12", manager: "Kaif K." },
    "JSG40": { stack: "S12", manager: "Keshav T." },

    // S13
    "JSG43": { stack: "S13", manager: "Aditya S." },
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

    // Custom CM Gmail aggregation
    let cmRevenue = 0;
    let cmCampaigns: Set<string> = new Set();

    // Precompute MI pattern so we can exclude MI from base advertiser buckets (case-insensitive)
    const miSubidPattern = /(^MI(?:_|$))|(_MI(?:_|$))/i;

    data.records.forEach(record => {
      if (
        record.subid?.toUpperCase().includes("CM") || record.subid?.toUpperCase().includes("JSG36")) {
        cmRevenue += record.revenue;
        cmCampaigns.add(record.campaign);
      }
    });

    if (cmRevenue > 0) {
      advertiserStats.set("CM Gmail", {
        name: "CM Gmail",
        revenue: cmRevenue,
        campaigns: Array.from(cmCampaigns) as string[],
      });
    }

    // Custom MI aggregation (match MI at start/end or surrounded by underscores)
    let miRevenue = 0;
    let miCampaigns: Set<string> = new Set();

    data.records.forEach(record => {
      if (record.subid && miSubidPattern.test(record.subid)) {
        miRevenue += record.revenue;
        miCampaigns.add(record.campaign);
      }
    });

    if (miRevenue > 0) {
      advertiserStats.set("MI", {
        name: "MI",
        revenue: miRevenue,
        campaigns: Array.from(miCampaigns) as string[],
      });
    }

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

      // Advertiser stats (exclude MI-tagged subids from base advertisers)
      const isMI = !!record.subid && miSubidPattern.test(record.subid);
      if (!isMI) {
        if (!advertiserStats.has(record.advertiser)) {
          advertiserStats.set(record.advertiser, {
            name: record.advertiser,
            revenue: 0,
            campaigns: []
          });
        }
        const advertiser = advertiserStats.get(record.advertiser)!;
        advertiser.revenue += record.revenue;
        if (!advertiser.campaigns.includes(record.campaign)) {
          advertiser.campaigns.push(record.campaign);
        }
      }

      // Campaign stats
      if (!campaignStats.has(record.campaign)) {
        campaignStats.set(record.campaign, {
          name: record.campaign,
          revenue: 0,
          creatives: [],
          ets: []
        });
      }
      const campaign = campaignStats.get(record.campaign)!;
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
      if (!et.campaigns.includes(record.campaign)) {
        et.campaigns.push(record.campaign);
      }

      // Track advertiser revenue inside ET (map MI-tagged subids to 'MI')
      const advertiserKey = record.subid && miSubidPattern.test(record.subid)
        ? 'MI'
        : record.advertiser;
      if (!et.advertisers.has(advertiserKey)) {
        et.advertisers.set(advertiserKey, 0);
      }
      et.advertisers.set(advertiserKey, et.advertisers.get(advertiserKey)! + record.revenue);

      // Creatives by campaign
      if (!creativesByCampaign.has(record.campaign)) {
        creativesByCampaign.set(record.campaign, new Map());
      }
      const campaignCreatives = creativesByCampaign.get(record.campaign)!;
      if (!campaignCreatives.has(record.creative)) {
        campaignCreatives.set(record.creative, {
          name: record.creative,
          frequency: 0,
          revenue: 0,
          ets: []
        });
      }
      const campaignCreative = campaignCreatives.get(record.creative)!;
      campaignCreative.frequency += 1;
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
      etCreative.frequency += 1;
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
      group.frequency += 1;
      group.campaigns.add(record.campaign);
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

  const selectedETData = useMemo(() => {
    if (!selectedET) return null;
    return analytics.etStats.find(e => e.name.toUpperCase() === selectedET.toUpperCase());
  }, [selectedET, analytics]);



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
      filteredRecords = filteredRecords.filter(r => r.campaign === selectedCampaign);
    }

    if (selectedET) {
      filteredRecords = filteredRecords.filter(r => r.et.toUpperCase() === selectedET.toUpperCase());
    }

    const headers = ['SUBID', 'Campaign', 'Creative', 'ET', 'Revenue', 'Advertiser', 'Source File'];
    const csvContent = [
      headers.join(','),
      ...filteredRecords.map(record => [
        record.subid,
        record.campaign,
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

    const campaignRecords = data.records.filter(r => r.campaign === selectedCampaign);

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
      creative.frequency += 1;
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

    const etRecords = data.records.filter(r => r.et.toUpperCase() === selectedET.toUpperCase());

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
      creative.frequency += 1;
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
    const miPattern = /(^MI(?:_|$))|(_MI(?:_|$))/i;
    if (advertiserName === 'MI') {
      return data.records.filter(r => r.subid && miPattern.test(r.subid));
    }
    if (advertiserName === 'CM Gmail') {
      return data.records.filter(r => r.subid?.toUpperCase().includes('CM') || r.subid?.toUpperCase().includes('JSG36'));
    }
    return data.records.filter(r => r.advertiser === advertiserName && !(r.subid && miPattern.test(r.subid)));
  };

  const openAdvertiserPopup = (advertiserName: string) => {
    const records = getAdvertiserRecords(advertiserName);
    const map = new Map<string, { name: string; totalRevenue: number; frequency: number; campaigns: Set<string>; ets: Set<string>; }>();
    records.forEach(r => {
      if (!map.has(r.creative)) {
        map.set(r.creative, { name: r.creative, totalRevenue: 0, frequency: 0, campaigns: new Set(), ets: new Set() });
      }
      const item = map.get(r.creative)!;
      item.totalRevenue += r.revenue;
      item.frequency += 1;
      item.campaigns.add(r.campaign);
      item.ets.add(r.et);
    });
    const creatives = Array.from(map.values())
      .map(v => ({ name: v.name, totalRevenue: v.totalRevenue, frequency: v.frequency, campaigns: Array.from(v.campaigns), ets: Array.from(v.ets) }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
    const totalRevenue = creatives.reduce((s, c) => s + c.totalRevenue, 0);
    setAdvertiserPopup({ isOpen: true, name: advertiserName, creatives, totalRevenue });
  };

  const closeAdvertiserPopup = () => setAdvertiserPopup({ isOpen: false, name: null, creatives: [], totalRevenue: 0 });
  // --------------------- END: Advertiser Popup State/logic ---------------------



  return (
    <div className="space-y-8 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center mb-2">
            <h2 className="text-3xl font-bold">Report & Campaign Management</h2>
          </div>
          <p className={`text-sm text-gray-600`}>
            {uploadedFiles.length} file{uploadedFiles.length > 1 ? 's' : ''} processed • {data.records.length} records analyzed
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportFilteredData}
            className="flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </button>
          <button
            onClick={onReset}
            className="flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-gray-200 hover:bg-gray-300"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            New Upload
          </button>
        </div>
      </div>

      {/* End: Header */}

      {/* Search Box */}
      <div className="p-6 rounded-lg border bg-white/50 backdrop-blur-sm border-gray-200">
        <div className="flex items-center mb-4">
          <Search className="h-6 w-6 mr-3 text-blue-500" />
          <h3 className="text-xl font-bold">Search Creatives</h3>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search for creative names..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={`w-full pl-10 pr-10 py-3 rounded-lg border transition-colors bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* End: Search Box */}

      {/* Search Results */}
      {searchResults && (
        <div className="p-6 rounded-lg border bg-white border-gray-200">
          <div className="flex items-center mb-6">
            <Star className="h-6 w-6 mr-3 text-yellow-500" />
            <h3 className="text-md font-bold">
              Search Results for <span className='text-blue-600 text-lg'>{searchQuery}</span> ({searchResults.length} creative{searchResults.length > 1 ? 's' : ''} found •
              Total Revenue: <span className='text-lg text-green-500'>${searchResultsTotalRevenue.toLocaleString()}</span>)
            </h3>
          </div>


          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {searchResults.map((result, index) => (
              <div
                key={result.creative}
                className="p-6 rounded-lg border transition-all duration-200 hover:shadow-lg bg-gray-50 border-gray-200 hover:bg-gray-100"
              >
                <div className="flex items-center mb-4">
                  <Layers className="h-5 w-5 mr-2 text-red-500" />
                  <h4 className="font-bold text-lg">{result.creative}</h4>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-cente">
                    <span className={`text-sm font-medium text-gray-600`}>
                      Total Revenue:
                    </span>
                    <span className="text-xl font-bold text-green-500">
                      ${result.totalRevenue.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-gray-200 px-3 py-1 rounded-lg">
                    <span className={`text-sm font-medium text-gray-600`}>
                      Frequency:
                    </span>
                    <span className="font-semibold text-blue-500">
                      {result.frequency}
                    </span>
                  </div>

                  <div className="pt-3">
                    <div className="mb-2">
                      <span className={`text-sm font-bold text-gray-800`}>
                        Campaign ({result.campaigns.size}):
                      </span><br />
                      <div className={`text-center inline-block mt-3 bg-blue-100 border border-blue-400 px-2 py-1 rounded-lg text-sm font-medium text-gray-700`}>
                        {Array.from(result.campaigns).join(', ')}
                      </div>
                    </div>

                    <div className="mb-2">
                      <span className={`text-sm font-bold text-gray-800`}>
                        ETs ({result.ets.size}):
                      </span><br />
                      <span className={`text-center inline-block mt-3 bg-blue-100 border border-blue-400 px-2 py-1 rounded-lg text-sm font-medium text-gray-700`}>
                        {Array.from(result.ets).join(', ')}
                      </span>

                    </div>

                    <div>
                      <span className={`text-sm font-bold text-gray-800`}>
                        Advertisers ({result.advertisers.size}):
                      </span>
                      <p className={`text-sm mt-1 text-gray-700`}>
                        {Array.from(result.advertisers).join(', ')}
                      </p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="p-6 rounded-lg border bg-green-400/50 backdrop-blur-sm border-green-400">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-800" />
            <div className="ml-4">
              <p className={`text-sm font-medium text-gray-600`}>
                Total Revenue
              </p>
              <p className="text-2xl font-bold">${analytics.totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-lg border bg-blue-600/50 backdrop-blur-sm border-blue-300">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-white">
                Daily Revenue Target
              </p>
              <div className="flex items-center">
                <p className="text-2xl font-bold text-green-400">${displayedTotalTargetRevenue.toLocaleString()}</p>
                {analytics.totalRevenue > 40000}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-lg border bg-blue-400/50 backdrop-blur-sm border-blue-400">
          <div className="flex items-center">
            <Target className="h-8 w-8 text-blue-700" />
            <div className="ml-4">
              <p className={`text-sm font-medium text-gray-600`}>
                Campaigns
              </p>
              <p className="text-2xl font-bold">{analytics.campaignStats.length}</p>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-lg border bg-red-400/50 backdrop-blur-sm border-red-400">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className={`text-sm font-medium text-gray-600`}>
                ETs
              </p>
              <p className="text-2xl font-bold">{analytics.etStats.length}</p>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-lg border bg-[#fedfca]/50 backdrop-blur-sm border-orange-400">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className={`text-sm font-medium text-gray-600`}>
                Creatives
              </p>
              <p className="text-2xl font-bold">{data.creatives.size}</p>
            </div>
          </div>
        </div>
      </div>

      {/* End: Summary Cards */}

      {/* Advertiser Revenue Breakdown (redesigned cards) */}
      <div className={`p-6 rounded-2xl border shadow-sm bg-white/70 backdrop-blur-xl border-white/80`}>
        <div className="flex items-center mb-6 justify-between">
          <div className="flex items-center">
            <Building2 className="h-6 w-6 mr-3 text-red-500" />
            <h3 className="text-xl font-bold">Advertiser-Wise Revenue</h3>
          </div>
          <div className="text-sm px-3 py-1 rounded-full bg-blue-100 text-blue-800">
            Top advertisers by revenue
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6">
          {analytics.advertiserStats.map((advertiser, index) => {
            const accent = getAdvertiserAccent(advertiser.name);
            const iconBg = hexToRgba(accent, 0.08);
            return (
              <div
                key={advertiser.name}
                onClick={() => openAdvertiserPopup(advertiser.name)}
                className={`relative p-3 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-[2px] bg-white border-gray-200 style:border-1 cursor-pointer`}
                style={{ border: `1px solid ${accent}`, backgroundColor: iconBg }}
              >
                {/* colored indicator */}
                <div className="absolute top-3 right-3 w-3 h-3 rounded-full" style={{ backgroundColor: accent }} />

                <div className="flex items-center space-x-4">
                  <div
                    className={`flex items-center justify-center rounded-xl w-14 h-14`}
                    style={{ backgroundColor: iconBg, border: `1px solid ${hexToRgba(accent, 0.35)}` }}
                  >
                    {advertiser.name === 'Branded' && <Award className="h-6 w-6" style={{ color: accent }} />}
                    {advertiser.name === 'GZ' && <Zap className="h-6 w-6" style={{ color: accent }} />}
                    {advertiser.name === 'XC' && <Zap className="h-6 w-6" style={{ color: accent }} />}
                    {advertiser.name === 'ES' && <Globe className="h-6 w-6" style={{ color: accent }} />}
                    {advertiser.name === 'Comcast' && <Wifi className="h-6 w-6" style={{ color: accent }} />}
                    {advertiser.name === 'MI' && <Star className="h-6 w-6" style={{ color: accent }} />}
                    {advertiser.name === 'RGR' && <Target className="h-6 w-6" style={{ color: accent }} />}
                    {advertiser.name === 'CM Gmail' && <AtSign className="h-6 w-6" style={{ color: accent }} />}
                  </div>

                  <div className="flex-1">
                    <h4 className="font-semibold text-base truncate">{advertiser.name}</h4>
                    <p className="text-3xl font-bold mt-1" style={{ color: accent }}>
                      ${advertiser.revenue.toLocaleString()}
                    </p>
                    <p className="text-sm font-medium mt-2 text-gray-600">
                      {advertiser.campaigns.length} campaign{advertiser.campaigns.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* End: Advertiser Revenue Breakdown */}

      {/* Advertiser Details Popup */}
      {advertiserPopup.isOpen && advertiserPopup.name && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-6xl w-full max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl bg-white border border-gray-200">
            <div className={`sticky top-0 p-6 border-b bg-white border-gray-200`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-3 rounded-xl">
                    <Building2 className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="ml-4">
                    <h2 className="text-2xl font-bold">Advertiser: {advertiserPopup.name}</h2>
                    <p className={`text-gray-600`}>Creative performance</p>
                  </div>
                </div>
                <button onClick={closeAdvertiserPopup} className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700">
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-500">${advertiserPopup.totalRevenue.toLocaleString()}</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-gray-800">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left px-4 py-2">Creative</th>
                      <th className="text-right px-4 py-2">Revenue</th>
                      <th className="text-right px-4 py-2">Frequency</th>
                      <th className="text-left px-4 py-2">Campaigns</th>
                      <th className="text-left px-4 py-2">ETs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {advertiserPopup.creatives.map(cr => (
                      <tr key={cr.name} className="border-gray-200 border-b">
                        <td className="px-4 py-2 font-medium">{cr.name}</td>
                        <td className="px-4 py-2 text-right text-green-500 font-semibold">${cr.totalRevenue.toLocaleString()}</td>
                        <td className="px-4 py-2 text-right">{cr.frequency}</td>
                        <td className="px-4 py-2">{cr.campaigns.join(', ')}</td>
                        <td className="px-4 py-2">{cr.ets.join(', ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ET Revenue Charts */}
        <div className="p-6 rounded-lg border bg-white/70 backdrop-blur-xs border-white/80">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-500" />
          ET Revenue Charts
        </h2>

        <div className="W-[100%]">
          {/* Bar Chart */}
          <div className="h-80">
            <ResponsiveContainer>
              <BarChart data={analytics.etChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" className='text-[10px]' />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {analytics.etChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index < 3 ? TOP_ET_COLOR : OTHER_ET_COLOR}
                    />
                  ))}
                </Bar>

              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>


      {/* End: ET Revenue Charts */}

      {/* Top Revenue ETs Section */}
      {analytics.etStats.length > 0 && (
        <div className="p-6 rounded-lg border-2 shadow-2xl bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 border-amber-400">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Award className="h-6 w-6 mr-3 text-amber-500" />
              <h3 className="text-xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">Top Revenue ETs</h3>
            </div>
            <div className="text-sm px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
              Top 3 Performing ETs
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {analytics.etStats.slice(0, 3).map((et, index) => (
              <div
                key={et.name}
                className="pb-4 rounded-xl transition-all duration-300 hover:shadow-2xl cursor-pointer relative overflow-hidden bg-[url('https://img.freepik.com/free-vector/gold-metal-background_78370-154.jpg?semt=ais_hybrid&w=740&q=80')] bg-cover bg-center">
                {/* Crown Icon at Top Right */}

                <div className="w-full flex items-center mb-4">
                  <div className="w-full flex items-center justify-between px-4 py-1 rounded-xl rounded-br-none rounded-bl-none ">
                    <div className="flex justify-start items-center">
                      <Crown className="h-8 w-8 text-amber-200 drop-shadow-lg" fill="#f59e0b" />
                      <h4 className="font-bold text-lg ml-3 text-white">
                        {et.name}
                      </h4>
                      <span className="ml-2 px-2 py-1 bg-amber-300 text-amber-900 text-xs font-bold rounded">
                        #{index + 1}
                      </span>
                    </div>

                    {(() => {
                      const info = getETInfo(et.name);
                      if (!info) return null;

                      return (
                        <div className="flex items-center space-x-0 bg-yellow-400 rounded-xl border-[2px] border-yellow-200">
                          {/* Stack */}
                          <span className="text-[13px] font-bold text-white pl-2 mr-2">
                            {info.stack}
                          </span>

                          {/* Manager */}
                          <span className="text-[13px] font-bold text-white pr-2">
                            {info.manager}
                          </span>

                          {/* Type (optional) */}
                          {info.type && (
                            <span
                              className={`text-[10px] px-1 py-[2px] rounded-xl font-bold ${info.type === "COM"
                                ? "bg-blue-600 text-white"
                                : "bg-purple-600 text-white"
                                }`}
                            >
                              {info.type}
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
                <div className="mb-4 px-4 flex justify-between items-center">
                  <div>
                    <p className="text-xl font-bold mb-1 text-amber-700">
                      ${et.revenue.toLocaleString()}
                    </p>
                    <p className={`text-sm font-medium text-gray-600`}>
                      Today Revenue
                    </p>
                  </div>
                  <div>
                    <div className='bg-yellow-400 py-[3px] rounded-md rounded-br-none rounded-bl-none'>
                      <p className='text-center uppercase text-[10px] font-bold text-white'>{currentDate}</p>
                    </div>
                    <div className="bg-yellow-300 px-2 py-1 rounded-md rounded-tr-none rounded-tl-none">
                      <p className="text-xl font-bold text-yellow-600 mb-1">
                        {displayTargetRevenue(et.name, analytics.totalRevenue)}
                      </p>
                      <p className={`text-[12px] font-medium text-gray-600`}>
                        Daily Target
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between px-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <Layers className="h-4 w-4 mr-1 text-red-500" />
                      <span className={`text-sm font-medium text-gray-600`}>
                        {et.creatives.length}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Target className="h-4 w-4 mr-1 text-blue-500" />
                      <span className={`text-sm font-medium text-gray-600`}>
                        {et.campaigns.length}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Toggle button */}
                <button
                  onClick={() => toggleET(et.name)}
                  className="mt-3 flex items-center gap-1 text-sm font-medium px-4 text-amber-600 hover:underline"
                >
                  {expandedETs.has(et.name) ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Hide Advertiser Revenue
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      View Advertiser Revenue
                    </>
                  )}
                </button>

                {/* Advertiser Breakdown with Transition */}
                <div
                  className={`overflow-hidden transition-all duration-300 rounded-xl text-sm font-medium '}
                  ${expandedETs.has(et.name) ? 'max-h-96 p-0 opacity-100 mt-2' : 'max-h-0 p-0 opacity-0'}`}>
                  <ul className="text-xs flex flex-wrap gap-2 justify-start items-center px-4">
                    {et.advertisersArray?.map(ad => (
                      <li
                        key={ad.name}
                        className="flex justify-center items-center gap-2 rounded-[50px] p-1 px-2 bg-amber-500/50"
                      >
                        <span className="font-medium">{ad.name}</span>
                        <span
                          className="text-xs font-medium text-green-600"
                        >
                          ${ad.revenue.toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ET Revenue Breakdown */}
        <div className="p-6 rounded-lg border bg-white/70 backdrop-blur-xs border-white/80">
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
          {analytics.etStats.slice(3, 100).map((et, index) => (
            <div
              key={et.name}
              className="pb-4 rounded-xl border transition-all duration-300 hover:shadow-xl cursor-pointer bg-gradient-to-br from-blue-50 to-white border-blue-300 group">
              <div className="w-full flex items-center mb-4">
                <div className="w-full flex items-center justify-between bg-blue-800 px-4 py-1 rounded-xl rounded-br-none rounded-bl-none">
                  <div className="flex justify-start items-center">
                    <Users className="h-6 w-6 text-blue-300 bg-blue-600 p-1 rounded-md" />
                    <h4 className="font-bold text-lg ml-3 text-white">
                      {et.name}
                    </h4>
                  </div>

                  {(() => {
                    const info = getETInfo(et.name);
                    if (!info) return null;

                    return (
                      <div className="flex items-center space-x-0 bg-red-500 rounded-xl">
                        {/* Stack */}
                        <span className="text-[13px] font-bold text-white pl-2 mr-2">
                          {info.stack}
                        </span>

                        {/* Manager */}
                        <span className="text-[13px] font-bold text-white pr-2">
                          {info.manager}
                        </span>

                        {/* Type (optional) */}
                        {info.type && (
                          <span
                            className={`text-[10px] px-1 py-[2px] rounded-xl font-bold ${info.type === "COM"
                              ? "bg-blue-600 text-white"
                              : "bg-purple-600 text-white"
                              }`}
                          >
                            {info.type}
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
              <div className="mb-4 px-4 flex justify-between items-center">
                <div>
                  <p className="text-xl font-bold text-blue-500 mb-1">
                    ${et.revenue.toLocaleString()}
                  </p>
                  <p className={`text-sm font-medium text-gray-600`}>
                    Today Revenue
                  </p>
                </div>
                <div>
                  <div className='bg-green-400 py-[3px] rounded-md rounded-br-none rounded-bl-none'>
                    <p className='text-center uppercase text-[10px] font-bold text-white'>{currentDate}</p>
                  </div>
                  <div className="bg-green-100 px-2 py-1 rounded-md rounded-tr-none rounded-tl-none">
                    <p className="text-xl font-bold text-green-500 mb-1">
                      {displayTargetRevenue(et.name, analytics.totalRevenue)}
                    </p>
                    <p className={`text-[12px] font-medium text-gray-600`}>
                      Daily Target
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between px-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <Layers className="h-4 w-4 mr-1 text-red-500" />
                    <span className={`text-sm font-medium text-gray-600`}>
                      {et.creatives.length}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Target className="h-4 w-4 mr-1 text-blue-500" />
                    <span className={`text-sm font-medium text-gray-600`}>
                      {et.campaigns.length}
                    </span>
                  </div>
                </div>
              </div>
              {/* Toggle button */}
              <button
                onClick={() => toggleET(et.name)}
                className="mt-3 flex items-center gap-1 text-sm font-medium px-4 text-blue-600 hover:underline"
              >
                {expandedETs.has(et.name) ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Hide Advertiser Revenue
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    View Advertiser Revenue
                  </>
                )}
              </button>

              {/* Advertiser Breakdown with Transition */}
              <div
                className={`overflow-hidden transition-all duration-300 rounded-xl text-sm font-medium '}
                ${expandedETs.has(et.name) ? 'max-h-96 p-0 opacity-100 mt-2' : 'max-h-0 p-0 opacity-0'}`}>
                <ul className="text-xs flex flex-wrap gap-2 justify-start items-center px-4">
                  {et.advertisersArray?.map(ad => (
                    <li
                      key={ad.name}
                      className="flex justify-center items-center gap-2 bg-blue-500/10 rounded-[50px] p-1 px-2"
                    >
                      <span className="font-medium">{ad.name}</span>
                      <span
                        className="text-xs font-medium text-green-600"
                      >
                        ${ad.revenue.toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* End: ET Revenue Breakdown */}

      {/* Campaign Revenue Breakdown */}
        <div className="p-6 rounded-lg border bg-white/70 backdrop-blur-xs border-white/80">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Target className="h-6 w-6 mr-3 text-blue-500" />
            <h3 className="text-xl font-bold">Campaign-Wise Revenue</h3>
          </div>
          <div className="text-sm px-3 py-1 rounded-full bg-blue-100 text-blue-700">
            Click any campaign for detailed view
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {analytics.campaignStats.slice(0, 12).map((campaign, index) => (
            <div
              key={campaign.name}
              onClick={() => openCampaignPopup(campaign)}
              className="p-6 rounded-xl border transition-all duration-300 hover:shadow-xl cursor-pointer transform hover:scale-105 bg-gradient-to-br from-white to-gray-50 border-gray-200 hover:from-blue-50 hover:to-white hover:border-blue-300 group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-blue-100 group-hover:scale-110 transition-transform duration-200">
                    <Target className="h-5 w-5 text-blue-500" />
                  </div>
                  <h4 className="font-bold text-lg ml-3 group-hover:text-blue-600 transition-colors">
                    {campaign.name}
                  </h4>
                </div>
                <Eye className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
              </div>

              <div className="mb-4">
                <p className="text-2xl font-bold text-green-500 mb-1">
                  ${campaign.revenue.toLocaleString()}
                </p>
                <p className={`text-sm font-medium text-gray-600`}>
                  Total Revenue
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <Layers className="h-4 w-4 mr-1 text-red-500" />
                    <span className={`text-sm font-medium text-gray-600`}>
                      {campaign.creatives.length}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1 text-blue-500" />
                    <span className={`text-sm font-medium text-gray-600`}>
                      {campaign.ets.length}
                    </span>
                  </div>
                </div>
                <div className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-600 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  View Details
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>


      {/* End: Campaign Revenue Breakdown */}

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
        <div className="p-6 rounded-lg border bg-white/70 backdrop-blur-xs border-white/80">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Target className="h-5 w-5 mr-2 text-blue-500" />
              <h3 className="text-xl font-bold">Campaign Analysis</h3>
            </div>
            {selectedCampaign && (
              <button
                onClick={exportCampaignCreatives}
                className="flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Creatives
              </button>
            )}
          </div>

          <div className="p-4 rounded-lg mb-4 bg-blue-50 border border-blue-200">
            <div className="flex items-center mb-2">
              <Search className="h-5 w-5 mr-2 text-blue-500" />
              <label className="block text-sm font-medium text-blue-600">Select Campaign for Detailed Analysis</label>
            </div>
            <p className="text-xs text-blue-600">
              Choose a campaign to view ET-wise performance and export creative data
            </p>
          </div>

          <select
            value={selectedCampaign}
            onChange={(e) => setSelectedCampaign(e.target.value)}
            className="w-full p-4 rounded-lg border text-lg font-medium bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
          >
            <option value="">All Campaigns</option>
            {analytics.campaignStats.map(campaign => (
              <option key={campaign.name} value={campaign.name}>
                {campaign.name} - ${campaign.revenue.toLocaleString()} ({campaign.creatives.length} creatives)
              </option>
            ))}
          </select>
        </div>
        {/* Campaign Analysis */}
        {selectedCampaignData && (
        <div className="p-6 rounded-lg border bg-white/70 backdrop-blur-xs border-white/80">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Campaign: {selectedCampaignData.name}</h3>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-500">
                  ${selectedCampaignData.revenue.toLocaleString()}
                </p>
                <p className={`text-sm text-gray-600`}>
                  Total Revenue
                </p>
              </div>
            </div>

            {/* Top Performing Creative */}
            {selectedCampaignData.creatives.length > 0 && (
              <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex items-center mb-2">
                  <Award className="h-5 w-5 mr-2 text-yellow-500" />
                  <h4 className="font-semibold text-blue-600">Top Performing Creative</h4>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{selectedCampaignData.creatives[0].name}</p>
                    <p className={`text-sm text-gray-600`}>
                      ETs: {selectedCampaignData.creatives[0].ets.join(', ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${selectedCampaignData.creatives[0].revenue.toLocaleString()}</p>
                    <p className={`text-sm text-gray-600`}>
                      {selectedCampaignData.creatives[0].frequency} occurrences
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ET Revenue for Selected Campaign */}
            <div className="mt-6">
              <div className="flex items-center mb-6">
                <Users className="h-6 w-6 mr-3 text-blue-500" />
                <h4 className="text-xl font-bold">ET-Wise Revenue Breakdown</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {selectedCampaignData.ets
                  .map(etName => {
                    const etRevenue = data.records
                      .filter(r => r.campaign === selectedCampaignData.name && r.et.toUpperCase() === etName.toUpperCase())
                      .reduce((sum, r) => sum + r.revenue, 0);
                    const creatives = data.records
                      .filter(r => r.campaign === selectedCampaignData.name && r.et.toUpperCase() === etName.toUpperCase())
                      .reduce((acc, r) => {
                        if (!acc.find(c => c.name === r.creative)) {
                          acc.push({
                            name: r.creative,
                            frequency: 1,
                            revenue: r.revenue
                          });
                        } else {
                          const existing = acc.find(c => c.name === r.creative)!;
                          existing.frequency += 1;
                          existing.revenue += r.revenue;
                        }
                        return acc;
                      }, [] as { name: string; frequency: number; revenue: number }[]);
                    return { etName, etRevenue, creatives };
                  })
                  .sort((a, b) => b.etRevenue - a.etRevenue)
                  .map((etData) => {
                    return (
                      <div
                        key={etData.etName}
                        className="p-6 rounded-xl border transition-all duration-300 hover:shadow-lg bg-white border-gray-200 hover:border-gray-300"
                      >
                        <div className="space-y-4">
                          {/* ET Header */}
                          <div className="flex items-center space-x-2">
                            <Target className="h-5 w-5 text-blue-600" />
                            <h4 className="text-xl font-bold">{etData.etName}</h4>
                          </div>

                          {/* Revenue and Frequency Row */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-green-600 font-medium">$</span>
                                <span className={`text-sm font-medium text-gray-600`}>
                                  Revenue
                                </span>
                              </div>
                              <div className="text-2xl font-bold text-green-600">
                                ${etData.etRevenue.toFixed(1)}
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-blue-600 font-medium">#</span>
                                <span className={`text-sm font-medium text-gray-600`}>
                                  Frequency
                                </span>
                              </div>
                              <div className="text-2xl font-bold text-blue-600">
                                {etData.creatives.reduce((sum, c) => sum + c.frequency, 0)}
                              </div>
                            </div>
                          </div>

                          {/* Active Creatives */}
                          <div>
                            <div className="flex items-center space-x-2 mb-3">
                              <Users className="h-4 w-4 text-blue-600" />
                              <span className={`text-sm font-medium text-gray-600`}>
                                Active Creatives ({etData.creatives.length}):
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {etData.creatives.slice(0, 6).map((creative, idx) => (
                                <span
                                  key={idx}
                                  className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                                >
                                  {creative.name}
                                </span>
                              ))}
                              {etData.creatives.length > 6 && (
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                  +{etData.creatives.length - 6} more
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* All Creatives */}
            <h4 className="font-semibold mb-4 mt-4">All Creatives of {selectedCampaignData.name}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedCampaignData.creatives.map((creative, index) => (
                <div
                  key={creative.name}
                  className="p-4 rounded-lg border transition-all duration-200 hover:shadow-lg bg-gray-50 border-gray-200 hover:bg-gray-100"
                >
                  <div className="flex items-center mb-2">
                    <FileText className="h-4 w-4 mr-2 text-gray-500" />
                    <h5 className="font-semibold">{creative.name}</h5>
                  </div>
                  <p className="text-lg font-bold text-green-500">
                    ${creative.revenue.toLocaleString()}
                  </p>
                  <p className={`text-sm text-gray-600`}>
                    Frequency: {creative.frequency}
                  </p>
                  <p className="text-xs mt-1 text-gray-500">
                    ETs: {creative.ets.join(', ')}
                  </p>
                </div>
              ))}
            </div>

          </div>
        )}
      </div>

      {/* End: Campaign Filters & Analysis */}

      {/* Filters 2 */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
        <div className="p-6 rounded-lg border bg-white/70 backdrop-blur-xs border-white/80">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-500" />
              <h3 className="text-xl font-bold">ET Analysis</h3>
            </div>
            {selectedET && (
              <button
                onClick={exportETCreatives}
                className="flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Creatives
              </button>
            )}
          </div>

          <div className="p-4 rounded-lg mb-4 bg-blue-50 border border-blue-200">
            <div className="flex items-center mb-2">
              <Search className="h-5 w-5 mr-2 text-blue-500" />
              <label className="block text-sm font-medium text-blue-600">Select ET for Detailed Analysis</label>
            </div>
            <p className="text-xs text-blue-600">
              Choose an ET to view campaign-wise performance and export creative data
            </p>
          </div>

          <select
            value={selectedET}
            onChange={(e) => setSelectedET(e.target.value)}
            className="w-full p-4 rounded-lg border text-lg font-medium bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
          >
            <option value="">All ETs</option>
            {analytics.etStats.map(et => (
              <option key={et.name} value={et.name}>
                {et.name} - ${et.revenue.toLocaleString()} ({et.creatives.length} creatives)
              </option>
            ))}
          </select>
        </div>
        {/* ET Analysis */}

        {selectedETData && (
        <div className="p-6 rounded-lg border bg-white border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">ET: {selectedETData.name}</h3>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-500">
                  ${selectedETData.revenue.toLocaleString()}
                </p>
                <p className={`text-sm text-gray-600`}>
                  Total Revenue
                </p>
              </div>
            </div>

            {/* Top Performing Creative for ET */}
            {selectedETData.creatives.length > 0 && (
              <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200">
                <div className="flex items-center mb-2">
                  <Award className="h-5 w-5 mr-2 text-yellow-500" />
                  <h4 className="font-semibold text-red-600">Top Performing Creative</h4>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{selectedETData.creatives[0].name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${selectedETData.creatives[0].revenue.toLocaleString()}</p>
                    <p className={`text-sm text-gray-600`}>
                      {selectedETData.creatives[0].frequency} occurrences
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Campaign Revenue for Selected ET */}
            <div>
              <div className="flex items-center mb-6">
                <Target className="h-6 w-6 mr-3 text-blue-500" />
                <h4 className="text-xl font-bold">Campaign-Wise Revenue Breakdown</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {selectedETData.campaigns
                  .map(campaignName => {
                    const campaignRevenue = data.records
                      .filter(r => r.et.toUpperCase() === selectedETData.name.toUpperCase() && r.campaign === campaignName)
                      .reduce((sum, r) => sum + r.revenue, 0);
                    const creatives = data.records
                      .filter(r => r.et.toUpperCase() === selectedETData.name.toUpperCase() && r.campaign === campaignName)
                      .reduce((acc, r) => {
                        if (!acc.find(c => c.name === r.creative)) {
                          acc.push({
                            name: r.creative,
                            frequency: 1,
                            revenue: r.revenue
                          });
                        } else {
                          const existing = acc.find(c => c.name === r.creative)!;
                          existing.frequency += 1;
                          existing.revenue += r.revenue;
                        }
                        return acc;
                      }, [] as { name: string; frequency: number; revenue: number }[]);
                    return { campaignName, campaignRevenue, creatives };
                  })
                  .sort((a, b) => b.campaignRevenue - a.campaignRevenue)
                  .map((campaignData) => {
                    return (
                      <div
                        key={campaignData.campaignName}
                        className="p-6 rounded-xl border transition-all duration-300 hover:shadow-lg bg-white border-gray-200 hover:border-gray-300"
                      >
                        <div className="space-y-4">
                          {/* Campaign Header */}
                          <div className="flex items-center space-x-2">
                            <Target className="h-5 w-5 text-blue-600" />
                            <h4 className="text-xl font-bold">{campaignData.campaignName}</h4>
                          </div>

                          {/* Revenue and Frequency Row */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-green-600 font-medium">$</span>
                                <span className={`text-sm font-medium text-gray-600`}>
                                  Revenue
                                </span>
                              </div>
                              <div className="text-2xl font-bold text-green-600">
                                ${campaignData.campaignRevenue.toFixed(1)}
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-blue-600 font-medium">#</span>
                                <span className={`text-sm font-medium text-gray-600`}>
                                  Frequency
                                </span>
                              </div>
                              <div className="text-2xl font-bold text-blue-600">
                                {campaignData.creatives.reduce((sum, c) => sum + c.frequency, 0)}
                              </div>
                            </div>
                          </div>

                          {/* Active Creatives */}
                          <div>
                            <div className="flex items-center space-x-2 mb-3">
                              <Users className="h-4 w-4 text-blue-600" />
                              <span className={`text-sm font-medium text-gray-600`}>
                                Active Creatives ({campaignData.creatives.length}):
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {campaignData.creatives.slice(0, 6).map((creative, idx) => (
                                <span
                                  key={idx}
                                  className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                                >
                                  {creative.name}
                                </span>
                              ))}
                              {campaignData.creatives.length > 6 && (
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                  +{campaignData.creatives.length - 6} more
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* All Creatives for ET */}
            <h4 className="font-semibold mb-4 mt-4">All Creatives of {selectedETData.name}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {selectedETData.creatives.map((creative) => (
                <div
                  key={creative.name}
                  className="p-4 rounded-lg border transition-all duration-200 hover:shadow-lg bg-gray-50 border-gray-200 hover:bg-gray-100"
                >
                  <div className="flex items-center mb-2">
                    <FileText className="h-4 w-4 mr-2 text-gray-500" />
                    <h5 className="font-semibold">{creative.name}</h5>
                  </div>
                  <p className="text-lg font-bold text-blue-500">
                    ${creative.revenue.toLocaleString()}
                  </p>
                  <p className={`text-sm text-gray-600`}>
                    Frequency: {creative.frequency}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>


      {/* End: ET Filters & Analysis */}

      {/* Campaign Details Popup */}
      {campaignPopup.isOpen && campaignPopup.campaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-6xl w-full max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl bg-white border border-gray-200">
            {/* Popup Header */}
            <div className="sticky top-0 p-6 border-b bg-white border-gray-200 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-3 rounded-xl bg-blue-100">
                    <Target className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="ml-4">
                    <h2 className="text-3xl font-bold">{campaignPopup.campaign.name}</h2>
                    <p className={`text-lg text-gray-600`}>
                      Campaign Details & Performance
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeCampaignPopup}
                  className="p-2 rounded-full transition-colors hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Popup Content */}
            <div className="p-6">
              {/* Campaign Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="p-6 rounded-xl border bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                  <div className="flex items-center mb-3">
                    <DollarSign className="h-6 w-6 text-green-500 mr-2" />
                    <h3 className="font-semibold text-green-600">Total Revenue</h3>
                  </div>
                  <p className="text-3xl font-bold text-green-500">
                    ${campaignPopup.campaign.revenue.toLocaleString()}
                  </p>
                </div>

                <div className="p-6 rounded-xl border bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                  <div className="flex items-center mb-3">
                    <Layers className="h-6 w-6 text-red-500 mr-2" />
                    <h3 className="font-semibold text-red-600">Total Creatives</h3>
                  </div>
                  <p className="text-3xl font-bold text-red-500">
                    {campaignPopup.campaign.creatives.length}
                  </p>
                </div>

                <div className="p-6 rounded-xl border bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <div className="flex items-center mb-3">
                    <Users className="h-6 w-6 text-blue-500 mr-2" />
                    <h3 className="font-semibold text-blue-600">Total ETs</h3>
                  </div>
                  <p className="text-3xl font-bold text-blue-500">
                    {campaignPopup.campaign.ets.length}
                  </p>
                </div>
              </div>

              {/* Top Performer */}
              {campaignPopup.campaign.creatives.length > 0 && (
                <div className="mb-8 p-6 rounded-xl border bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200">
                  <div className="flex items-center mb-4">
                    <Award className="h-6 w-6 text-yellow-500 mr-3" />
                    <h3 className="text-xl font-bold text-yellow-600">🏆 Top Performing Creative</h3>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-2xl font-bold mb-2">{campaignPopup.campaign.creatives[0].name}</p>
                      <div className="flex items-center space-x-6">
                        <div className="flex items-center">
                          <DollarSign className="h-5 w-5 text-green-500 mr-1" />
                          <span className="text-xl font-bold text-green-500">
                            ${campaignPopup.campaign.creatives[0].revenue.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Hash className="h-5 w-5 text-blue-500 mr-1" />
                          <span className="font-semibold text-blue-500">
                            {campaignPopup.campaign.creatives[0].frequency} occurrences
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 md:mt-0">
                      <p className={`text-sm font-medium mb-1 text-gray-600`}>
                        Active in ETs:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {campaignPopup.campaign.creatives[0].ets.map(et => (
                          <span key={et} className="px-3 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                            {et}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* All Creatives */}
              <div>
                <div className="flex items-center mb-6">
                  <Layers className="h-6 w-6 text-blue-500 mr-3" />
                  <h3 className="text-2xl font-bold">All Creatives Performance</h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {campaignPopup.campaign.creatives.map((creative, index) => (
                    <div
                      key={creative.name}
                      className="p-6 rounded-xl border transition-all duration-200 hover:shadow-lg bg-gray-50 border-gray-200 hover:bg-white"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${index === 0 ? 'bg-yellow-500 text-white' :
                              index === 1 ? 'bg-gray-400 text-white' :
                                index === 2 ? 'bg-amber-600 text-white' :
                                  'bg-gray-300 text-gray-700'
                              }`}>
                              {index + 1}
                            </div>
                            <h4 className="font-bold text-lg">{creative.name}</h4>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="p-3 rounded-lg bg-white">
                          <div className="flex items-center mb-1">
                            <DollarSign className="h-4 w-4 text-green-500 mr-1" />
                            <span className={`text-sm font-medium text-gray-600`}>
                              Revenue
                            </span>
                          </div>
                          <p className="text-xl font-bold text-green-500">
                            ${creative.revenue.toLocaleString()}
                          </p>
                        </div>

                        <div className="p-3 rounded-lg bg-white">
                          <div className="flex items-center mb-1">
                            <Hash className="h-4 w-4 text-blue-500 mr-1" />
                            <span className={`text-sm font-medium text-gray-600`}>
                              Frequency
                            </span>
                          </div>
                          <p className="text-xl font-bold text-blue-500">
                            {creative.frequency}
                          </p>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center mb-2">
                          <Users className="h-4 w-4 text-blue-500 mr-2" />
                          <span className={`text-sm font-medium text-gray-600`}>
                            Active in ETs ({creative.ets.length}):
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {creative.ets.map(et => (
                            <span key={et} className="px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
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
          </div>
        </div>
      )}
      {/* End: Campaign Details Popup */}
    </div>
  );
};

export default Dashboard;
