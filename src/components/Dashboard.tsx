import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
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
      return '#6366F1'; // indigo
    case 'RGR':
      return '#F59E0B'; // amber
    case 'GZ':
      return '#8B5CF6'; // purple
    case 'CM Gmail':
      return '#EF4444'; // red
    case 'MI':
      return '#3B82F6'; // blue
    case 'ES':
      return '#10B981'; // emerald
    case 'XC':
      return '#06B6D4'; // cyan
    case 'XC EXC':
      return '#14B8A6'; // teal
    case 'DB':
      return '#84CC16'; // lime
    case 'COMCAST':
      return '#F43F5E'; // rose
    case 'NON COMCAST':
      return '#EC4899'; // pink
    case 'Comcast':
      return '#DC2626'; // red
    case 'Other':
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
    "CM41": "$1500",
    "JSG34": "$1100",
    "JSG36": "$800",
    "C36": "JSG36",
    "JSG26": "$1800",
    "JSG29": "$1800",
    "JSG30PM": "$2000",
    "JSG22": "0",
    "JSG32": "$1100",
    "EX32": "JSG32",
    "JSG20": "$1800",
    "JSG38": "$1100",
    "JSG40": "$1100",
    "JSG43": "$1000",
    "JSG44": "$1100",
    "JSG18": "$800",
    "JSG20+JSG44": "$2000",
    "JSG38+JSG38N": "$1800",
    "JSG36+P36": "$800",
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
    "JSG36": { stack: "CM36 | S6", manager: "Nikhil T." },
    "C36": { stack: "S6", manager: "Nikhil T." },
    "P36": { stack: "RGR36 | S6", manager: "Nikhil T." },
    "JSG36+P36": { stack: "S6", manager: "Nikhil T." },

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
    "JSG20+JSG44": { stack: "S11", manager: "Harsh G." },

    // S12
    "JSG38": { stack: "S12", manager: "Kaif K." },
    "JSG38N": { stack: "S12", manager: "Kaif K." },
    "JSG38+JSG38N": { stack: "S12", manager: "Kaif K." },
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
    combineETs('JSG20', 'JSG44', 'JSG20+JSG44');
    combineETs('JSG38', 'JSG38N', 'JSG38+JSG38N');
    combineETs('JSG36', 'P36', 'JSG36+P36');
    // Example: combineETs('JSG29', 'JSG30PM', 'JSG29+JSG30PM');

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
      group.frequency += record.conv ?? 1; // Use CONV value if available, otherwise 1
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

      return {
        name: etName,
        revenue,
        creatives,
        campaigns
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
      filteredRecords = filteredRecords.filter(r => r.campaign === selectedCampaign);
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
      item.frequency += r.conv ?? 1; // Use CONV value if available, otherwise 1
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
        <div className="p-6 rounded-xl border-2 shadow-lg bg-gradient-to-br from-white via-blue-50/20 to-white border-blue-200">
          {/* Header Section */}
          <div className="mb-6 p-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                  <Search className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-1">
                    Search Results: <span className="text-blue-100">{searchQuery}</span>
                  </h3>
                  <p className="text-blue-100 text-sm flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    {searchResults.length} creative{searchResults.length > 1 ? 's' : ''} found
                  </p>
                </div>
              </div>
              <div className="text-right bg-white/10 backdrop-blur-sm px-4 py-3 rounded-lg border border-white/20">
                <p className="text-3xl font-bold mb-1">
                  ${searchResultsTotalRevenue.toLocaleString()}
                </p>
                <p className="text-blue-100 text-sm font-medium">
                  Total Revenue
                </p>
              </div>
            </div>
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {searchResults.map((result, index) => (
              <div
                key={result.creative}
                className="p-5 rounded-xl border-2 bg-gradient-to-br from-white to-blue-50/30 border-blue-200 shadow-md"
              >
                {/* Creative Header */}
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-blue-100">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <Layers className="h-5 w-5 text-blue-600" />
                  </div>
                  <h4 className="font-bold text-lg text-gray-800 truncate flex-1">{result.creative}</h4>
                </div>

                {/* Revenue and Frequency */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <p className="text-xs text-green-700 font-medium mb-1">Revenue</p>
                    <p className="text-xl font-bold text-green-600">
                      ${result.totalRevenue.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <p className="text-xs text-blue-700 font-medium mb-1">Frequency</p>
                    <p className="text-xl font-bold text-blue-600">
                      {result.frequency}
                    </p>
                  </div>
                </div>

                {/* Details Section */}
                <div className="space-y-3">
                  {/* Campaigns */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-3.5 w-3.5 text-gray-500" />
                      <span className="text-xs font-bold text-gray-700">
                        Campaigns ({result.campaigns.size})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from(result.campaigns).slice(0, 3).map((campaign, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200"
                        >
                          {campaign}
                        </span>
                      ))}
                      {result.campaigns.size > 3 && (
                        <span className="px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                          +{result.campaigns.size - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ETs */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-3.5 w-3.5 text-gray-500" />
                      <span className="text-xs font-bold text-gray-700">
                        ETs ({result.ets.size})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from(result.ets).map((et, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200"
                        >
                          {et}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Advertisers */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="h-3.5 w-3.5 text-gray-500" />
                      <span className="text-xs font-bold text-gray-700">
                        Advertisers ({result.advertisers.size})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from(result.advertisers).slice(0, 2).map((advertiser, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 rounded-md text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200"
                        >
                          {advertiser}
                        </span>
                      ))}
                      {result.advertisers.size > 2 && (
                        <span className="px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                          +{result.advertisers.size - 2} more
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
      <div className={`p-4 rounded-xl border shadow-sm bg-white/70 backdrop-blur-xl border-white/80`}>
        <div className="flex items-center mb-4 justify-between">
          <div className="flex items-center">
            <Building2 className="h-5 w-5 mr-2 text-red-500" />
            <h3 className="text-lg font-bold">Advertiser-Wise Revenue</h3>
          </div>
          <div className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
            Top advertisers by revenue
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-3">
          {analytics.advertiserStats.map((advertiser) => {
            const accent = getAdvertiserAccent(advertiser.name);
            const iconBg = hexToRgba(accent, 0.12);
            // Get first letter(s) of advertiser name
            const getInitials = (name: string): string => {
              if (name === 'CM Gmail') return 'CM';
              if (name === 'XC EXC') return 'XE';
              if (name === 'NON COMCAST') return 'NC';
              if (name.length <= 3) return name.toUpperCase(); // For short names like GZ, ES, XC, DB, MI, RGR
              return name.substring(0, 2).toUpperCase();
            };
            const initials = getInitials(advertiser.name);

            return (
              <div
                key={advertiser.name}
                onClick={() => openAdvertiserPopup(advertiser.name)}
                className={`relative p-3 rounded-xl shadow-sm transition-all hover:shadow-md bg-white border cursor-pointer hover:scale-[1.02]`}
                style={{ borderColor: accent, backgroundColor: iconBg }}
              >
                {/* colored indicator */}
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ backgroundColor: accent }} />

                <div className="flex items-center space-x-3">
                  <div
                    className={`flex items-center justify-center rounded-lg w-10 h-10 flex-shrink-0 font-bold text-sm`}
                    style={{ backgroundColor: accent, color: '#FFFFFF' }}
                  >
                    {initials}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate">{advertiser.name}</h4>
                    <p className="text-xl font-bold mt-0.5" style={{ color: accent }}>
                      ${advertiser.revenue.toLocaleString()}
                    </p>
                    <p className="text-xs font-medium mt-1 text-gray-600">
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3">
          <div className="max-w-5xl w-full max-h-[90vh] overflow-hidden rounded-xl shadow-2xl bg-white border border-gray-200 flex flex-col">
            {/* Compact Header */}
            <div
              className="sticky top-0 px-4 py-3 border-b bg-gradient-to-r from-white to-gray-50 border-gray-200 z-10"
              style={{ borderTopColor: getAdvertiserAccent(advertiserPopup.name), borderTopWidth: '3px' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white text-sm"
                    style={{ backgroundColor: getAdvertiserAccent(advertiserPopup.name) }}
                  >
                    {advertiserPopup.name === 'CM Gmail' ? 'CM' :
                      advertiserPopup.name === 'XC EXC' ? 'XE' :
                        advertiserPopup.name === 'NON COMCAST' ? 'NC' :
                          advertiserPopup.name.length <= 3 ? advertiserPopup.name.toUpperCase() :
                            advertiserPopup.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{advertiserPopup.name}</h2>
                    <p className="text-xs text-gray-500">Creative Performance</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Total Revenue</p>
                    <p
                      className="text-xl font-bold"
                      style={{ color: getAdvertiserAccent(advertiserPopup.name) }}
                    >
                      ${advertiserPopup.totalRevenue.toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={closeAdvertiserPopup}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Compact Table */}
            <div className="flex-1 overflow-y-auto">
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead className="sticky top-0 z-10">
                    <tr style={{ backgroundColor: hexToRgba(getAdvertiserAccent(advertiserPopup.name), 0.1) }}>
                      <th className="text-left px-3 py-2 font-semibold text-gray-700">Creative</th>
                      <th className="text-right px-3 py-2 font-semibold text-gray-700">Revenue</th>
                      <th className="text-right px-3 py-2 font-semibold text-gray-700">Frequency</th>
                      <th className="text-left px-3 py-2 font-semibold text-gray-700">Campaigns</th>
                      <th className="text-left px-3 py-2 font-semibold text-gray-700">ETs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {advertiserPopup.creatives.map((cr, idx) => (
                      <tr
                        key={cr.name}
                        className={`hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                      >
                        <td className="px-3 py-2 font-medium text-gray-900 truncate max-w-xs" title={cr.name}>
                          {cr.name}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold" style={{ color: getAdvertiserAccent(advertiserPopup.name!) }}>
                          ${cr.totalRevenue.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-600">
                          {cr.frequency}
                        </td>
                        <td className="px-3 py-2 text-gray-600">
                          <div className="flex flex-wrap gap-1">
                            {cr.campaigns.map((camp, i) => (
                              <span
                                key={i}
                                className="px-1.5 py-0.5 rounded text-xs"
                                style={{
                                  backgroundColor: hexToRgba(getAdvertiserAccent(advertiserPopup.name!), 0.1),
                                  color: getAdvertiserAccent(advertiserPopup.name!)
                                }}
                              >
                                {camp}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-gray-600">
                          <div className="flex flex-wrap gap-1">
                            {cr.ets.slice(0, 5).map((et, i) => (
                              <span
                                key={i}
                                className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 text-xs"
                              >
                                {et}
                              </span>
                            ))}
                            {cr.ets.length > 5 && (
                              <span className="px-1.5 py-0.5 rounded bg-gray-200 text-gray-600 text-xs">
                                +{cr.ets.length - 5}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer with summary */}
            <div className="px-4 py-2 border-t bg-gray-50 text-xs text-gray-600">
              <div className="flex items-center justify-between">
                <span>{advertiserPopup.creatives.length} creative{advertiserPopup.creatives.length !== 1 ? 's' : ''}</span>
                <span>Total: ${advertiserPopup.totalRevenue.toLocaleString()}</span>
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
                className="pb-4 rounded-xl transition-colors cursor-pointer relative overflow-hidden bg-[url('https://img.freepik.com/free-vector/gold-metal-background_78370-154.jpg?semt=ais_hybrid&w=740&q=80')] bg-cover bg-center">
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
                      {et.name.includes('+') ? 'Combined Revenue' : 'Today Revenue'}
                    </p>
                    {et.name.includes('+') && (
                      <div className="mt-1 flex gap-2 font-bold text-[12px] text-gray-600">
                        {(et as any).et1Name ? (
                          <span className="bg-amber-500/50 rounded-xl p-0.5 px-2">{(et as any).et1Name}: ${((et as any).et1Revenue ?? 0).toLocaleString()}</span>
                        ) : null}
                        {(et as any).et1Name && (et as any).et2Name ? <span></span> : null}
                        {(et as any).et2Name ? (
                          <span className="bg-amber-500/50 rounded-xl p-0.5 px-2">{(et as any).et2Name}: ${((et as any).et2Revenue ?? 0).toLocaleString()}</span>
                        ) : null}
                      </div>
                    )}
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
                  className={`overflow-hidden transition-colors rounded-xl text-sm font-medium '}
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
              className={`pb-4 rounded-xl border transition-colors cursor-pointer ${et.name.includes('+') ? 'bg-gradient-to-br from-purple-50 to-white border-purple-300' : 'bg-gradient-to-br from-blue-50 to-white border-blue-300'} group`}>
              <div className="w-full flex items-center mb-4">
                <div className={`w-full flex items-center justify-between px-4 py-1 rounded-xl rounded-br-none rounded-bl-none ${et.name.includes('+') ? 'bg-purple-800' : 'bg-blue-800'}`}>
                  <div className="flex justify-start items-center">
                    <Users className={`h-6 w-6 p-1 rounded-md ${et.name.includes('+') ? 'text-purple-300 bg-purple-600' : 'text-blue-300 bg-blue-600'}`} />
                    <h4 className={`font-bold ml-3 text-white ${et.name.includes('+') ? 'text-base truncate' : 'text-lg'}`}>
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
                  <p className={`text-xl font-bold mb-1 ${et.name.includes('+') ? 'text-purple-500' : 'text-blue-500'}`}>
                    ${et.revenue.toLocaleString()}
                  </p>
                  <p className={`text-xs font-medium text-gray-600`}>
                    {et.name.includes('+') ? 'Combined Revenue' : 'Today Revenue'}
                  </p>
                  {et.name.includes('+') && (
                    <div className="mt-1 flex gap-2 text-[10px] text-gray-500">
                      {(et as any).et1Name ? (
                        <span>{(et as any).et1Name}: ${((et as any).et1Revenue ?? 0).toLocaleString()}</span>
                      ) : null}
                      {(et as any).et1Name && (et as any).et2Name ? <span>|</span> : null}
                      {(et as any).et2Name ? (
                        <span>{(et as any).et2Name}: ${((et as any).et2Revenue ?? 0).toLocaleString()}</span>
                      ) : null}
                    </div>
                  )}
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
                className={`mt-3 flex items-center gap-1 text-sm font-medium px-4 hover:underline ${et.name.includes('+') ? 'text-purple-600' : 'text-blue-600'}`}
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
                className={`overflow-hidden transition-colors rounded-xl text-sm font-medium '}
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
      <div className="p-6 rounded-xl border-2 shadow-lg bg-gradient-to-br from-white via-blue-50/20 to-white border-blue-200">
        {/* Header Section */}
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                <Target className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-1">Campaign-Wise Revenue</h3>
                <p className="text-blue-100 text-sm">
                  {analytics.campaignStats.length} campaigns • Click any campaign for detailed view
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Highest Revenue Creative - Premium Section */}
        {(() => {
          // Find the highest revenue creative across all campaigns
          let topCreativeData: { name: string; revenue: number; campaign: string; ets: string[] } | null = null;
          analytics.campaignStats.forEach(campaign => {
            campaign.creatives.forEach(creative => {
              if (!topCreativeData || creative.revenue > topCreativeData.revenue) {
                topCreativeData = {
                  name: creative.name,
                  revenue: creative.revenue,
                  campaign: campaign.name,
                  ets: creative.ets
                };
              }
            });
          });

          if (!topCreativeData) return null;

          // Extract values to avoid TypeScript narrowing issues
          const tc = topCreativeData as { name: string; revenue: number; campaign: string; ets: string[] };
          const creativeName = tc.name;
          const totalRevenue = tc.revenue;
          const campaignName = tc.campaign;

          // Calculate revenue per ET for this creative
          const etRevenues = new Map<string, number>();
          data.records
            .filter(r => r.creative === creativeName && r.campaign === campaignName)
            .forEach(record => {
              const et = record.et.toUpperCase();
              const current = etRevenues.get(et) || 0;
              etRevenues.set(et, current + record.revenue);
            });

          const etRevenueList = Array.from(etRevenues.entries())
            .map(([et, revenue]) => ({ et, revenue }))
            .sort((a, b) => b.revenue - a.revenue);

          return (
            <div className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 shadow-2xl border-4 border-amber-300/50 relative overflow-hidden">
              {/* Animated background effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
              
              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/25 backdrop-blur-md flex items-center justify-center shadow-lg border-2 border-white/30">
                      <Crown className="h-8 w-8 text-white" fill="white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white/95 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                        Top Performing Creative of the day
                      </p>
                      <h4 className="text-2xl font-bold text-white mb-1 drop-shadow-lg">{creativeName}</h4>
                      <p className="text-sm text-white/90 font-medium">Campaign: {campaignName}</p>
                    </div>

                  </div>
                  <div className="text-right bg-white/20 backdrop-blur-sm px-4 py-3 rounded-xl border-2 border-white/30">
                    <p className="text-xs font-bold text-white/95 uppercase tracking-wider mb-1">Total Revenue</p>
                    <p className="text-3xl font-bold text-white drop-shadow-lg">${Number(totalRevenue).toLocaleString()}</p>
                  </div>
                </div>

                {/* ET Revenue Breakdown */}
                {etRevenueList.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/30">
                    <p className="text-xs font-bold text-white/95 uppercase tracking-wider mb-3">Revenue by ET</p>
                    <div className="flex flex-wrap gap-2">
                      {etRevenueList.map(({ et, revenue }) => (
                        <div
                          key={et}
                          className="px-3 py-2 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 flex items-center gap-2 hover:bg-white/30 transition-all"
                        >
                          <span className="text-sm font-bold text-white">{et}</span>
                          <span className="text-xs font-semibold text-white/90">${revenue.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Campaign Revenue Bar Chart */}
        <div className="mb-6 p-4 rounded-xl bg-white border border-gray-200">
          <h4 className="text-lg font-bold text-gray-800 mb-4">Campaign Revenue</h4>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analytics.campaignStats
                  .slice(0, 100)
                  .map((campaign: CampaignStats) => ({
                    name: campaign.name.length > 10 ? campaign.name.substring(0, 10) + '...' : campaign.name,
                    revenue: campaign.revenue,
                    fullName: campaign.name
                  }))
                  .sort((a: { revenue: number }, b: { revenue: number }) => b.revenue - a.revenue)
                }
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <Tooltip
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                />
                <Bar
                  dataKey="revenue"
                  fill="#3B82F6"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Campaign Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {analytics.campaignStats.slice(0, 12).map((campaign, index) => (
            <div
              key={campaign.name}
              onClick={() => openCampaignPopup(campaign)}
              className="p-5 rounded-xl border-2 cursor-pointer bg-gradient-to-br from-white to-blue-50/30 border-blue-200 hover:border-blue-400 hover:shadow-md"
            >
              {/* Campaign Header */}
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-blue-100">
                <div className="p-2 rounded-lg bg-blue-100 flex-shrink-0">
                  <Target className="h-5 w-5 text-blue-600" />
                </div>
                <h4 className="font-bold text-base text-gray-800 truncate flex-1">
                  {campaign.name}
                </h4>
                <Eye className="h-4 w-4 text-gray-400 flex-shrink-0" />
              </div>

              {/* Revenue Display */}
              <div className="mb-4">
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <p className="text-xs text-green-700 font-medium mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${campaign.revenue.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Stats Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-blue-100">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-semibold text-gray-700">
                      {campaign.creatives.length}
                    </span>
                    <span className="text-xs text-gray-500">creatives</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-semibold text-gray-700">
                      {campaign.ets.length}
                    </span>
                    <span className="text-xs text-gray-500">ETs</span>
                  </div>
                </div>
                <div className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                  View
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

          <div className="p-4 rounded-lg mb-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-green-100 mr-2">
                  <Search className="h-5 w-5 text-green-600" />
                </div>
                <label className="block text-sm font-bold text-green-700">Select Campaign for Detailed Analysis</label>
              </div>
              {selectedCampaign && (
                <button
                  onClick={() => setSelectedCampaign('')}
                  className="px-3 py-1.5 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 border-2 border-gray-300 hover:border-gray-400 transition-colors text-gray-700 font-semibold text-xs flex items-center gap-1.5"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear Selection
                </button>
              )}
            </div>
            <p className="text-xs text-green-600 ml-11 mb-3">
              Click on any campaign below to view ET-wise performance and export creative data
            </p>

            {/* Campaign Capsules - Always Visible Selection */}
            <div className="flex flex-wrap gap-2 p-2 ">
              {analytics.campaignStats.map(campaign => {
                const isSelected = selectedCampaign === campaign.name;

                return (
                  <button
                    key={campaign.name}
                    onClick={() => setSelectedCampaign(campaign.name)}
                    className={`px-4 py-1 rounded-full transition-colors whitespace-nowrap ${isSelected
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md ring-2 ring-green-300'
                      : 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 hover:border-green-400 text-green-700 hover:shadow-md'
                      }`}
                  >
                    <span className={`font-bold text-sm ${isSelected ? 'text-white' : ''}`}>
                      {campaign.name}:
                    </span>
                    <span className={`font-semibold text-sm ml-1 ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                      ${campaign.revenue.toLocaleString()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        {/* Campaign Analysis */}
        {selectedCampaignData && (
          <div className="p-6 rounded-xl border-2 shadow-xl bg-gradient-to-br from-white via-green-50/30 to-white border-green-200">
            {/* Header Section */}
            <div className="mb-6 p-5 rounded-xl bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                    <Target className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-1">Campaign: {selectedCampaignData.name}</h3>
                    <p className="text-green-100 text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {selectedCampaignData.creatives.length} creatives • {selectedCampaignData.ets.length} ETs
                    </p>
                  </div>
                </div>
                <div className="text-right bg-white/10 backdrop-blur-sm px-4 py-3 rounded-lg border border-white/20">
                  <p className="text-3xl font-bold mb-1">
                    ${selectedCampaignData.revenue.toLocaleString()}
                  </p>
                  <p className="text-green-100 text-sm font-medium">
                    Total Revenue
                  </p>
                </div>
              </div>
            </div>

            {/* Top Performing Creative */}
            {selectedCampaignData.creatives.length > 0 && (
              <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-100">
                      <Award className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-amber-900 mb-1">Top Performing Creative</h4>
                      <p className="text-sm font-medium text-amber-700">{selectedCampaignData.creatives[0].name}</p>
                      <p className="text-xs text-amber-600 mt-1">
                        ETs: {selectedCampaignData.creatives[0].ets.join(', ')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-amber-700">
                      ${selectedCampaignData.creatives[0].revenue.toLocaleString()}
                    </p>
                    <p className="text-xs text-amber-600 font-medium">
                      {selectedCampaignData.creatives[0].frequency} occurrences
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ET Revenue for Selected Campaign */}
            <div className="mb-6">
              <div className="flex items-center mb-4 gap-2">
                <div className="p-2 rounded-lg bg-green-100">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <h4 className="text-lg font-bold text-gray-800">ET-Wise Revenue Breakdown</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
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
                            frequency: r.conv ?? 1, // Use CONV value if available, otherwise 1
                            revenue: r.revenue
                          });
                        } else {
                          const existing = acc.find(c => c.name === r.creative)!;
                          existing.frequency += r.conv ?? 1; // Use CONV value if available, otherwise 1
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
                        className="p-4 rounded-xl border-2 transition-colors bg-gradient-to-br from-white to-green-50/50 border-green-200 hover:border-green-300"
                      >
                        {/* ET Header */}
                        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-green-100">
                          <Users className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <h4 className="text-base font-bold text-gray-800 truncate">{etData.etName}</h4>
                        </div>

                        {/* Revenue and Frequency - Compact */}
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div className="bg-green-50 rounded-lg p-2 border border-green-200">
                            <p className="text-xs text-green-700 font-medium mb-1">Revenue</p>
                            <p className="text-lg font-bold text-green-600">
                              ${etData.etRevenue.toFixed(1)}
                            </p>
                          </div>
                          <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
                            <p className="text-xs text-blue-700 font-medium mb-1">Frequency</p>
                            <p className="text-lg font-bold text-blue-600">
                              {etData.creatives.reduce((sum, c) => sum + c.frequency, 0)}
                            </p>
                          </div>
                        </div>

                        {/* Active Creatives - Compact */}
                        <div>
                          <div className="flex items-center gap-1 mb-2">
                            <FileText className="h-3 w-3 text-gray-500" />
                            <span className="text-xs font-medium text-gray-600">
                              Creatives ({etData.creatives.length})
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {etData.creatives.slice(0, 4).map((creative, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-green-100 text-green-700 border border-green-200"
                              >
                                {creative.name.length > 15 ? creative.name.substring(0, 15) + '...' : creative.name}
                              </span>
                            ))}
                            {etData.creatives.length > 4 && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
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
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-emerald-100">
                  <FileText className="h-5 w-5 text-emerald-600" />
                </div>
                <h4 className="text-lg font-bold text-gray-800">All Creatives ({selectedCampaignData.creatives.length})</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {selectedCampaignData.creatives.map((creative, idx) => (
                  <div
                    key={creative.name}
                    className="p-3 rounded-xl border-2 transition-colors bg-gradient-to-br from-white to-emerald-50/30 border-emerald-200 hover:border-emerald-300"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                        <h5 className="font-semibold text-sm text-gray-800 truncate">{creative.name}</h5>
                      </div>
                      {idx === 0 && (
                        <Award className="h-4 w-4 text-amber-500 flex-shrink-0" />
                      )}
                    </div>
                    <div className="mt-2 pt-2 border-t border-emerald-100">
                      <p className="text-lg font-bold text-emerald-600 mb-1">
                        ${creative.revenue.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 font-medium mb-1">
                        {creative.frequency} {creative.frequency === 1 ? 'occurrence' : 'occurrences'}
                      </p>
                      <p className="text-xs text-gray-600 font-medium">
                        ETs: {creative.ets.join(', ')}
                      </p>
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

          <div className="p-4 rounded-lg mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-blue-100 mr-2">
                  <Search className="h-5 w-5 text-blue-600" />
                </div>
                <label className="block text-sm font-bold text-blue-700">Select ET for Detailed Analysis</label>
              </div>
              {selectedET && (
                <button
                  onClick={() => setSelectedET('')}
                  className="px-3 py-1.5 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 border-2 border-gray-300 hover:border-gray-400 transition-colors text-gray-700 font-semibold text-xs flex items-center gap-1.5"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear Selection
                </button>
              )}
            </div>
            <p className="text-xs text-blue-600 ml-11 mb-3">
              Click on any ET below to view campaign-wise performance and export creative data
            </p>

            {/* ET Capsules - Always Visible Selection */}
            <div className="flex flex-wrap gap-2 p-2 ">
              {analytics.etStats.map(et => {
                const isSelected = selectedET === et.name;
                const isCombined = et.name.includes('+');

                return (
                  <button
                    key={et.name}
                    onClick={() => setSelectedET(et.name)}
                    className={`px-4 py-1 rounded-full transition-colors whitespace-nowrap ${isSelected
                      ? isCombined
                        ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md ring-2 ring-purple-300'
                        : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md ring-2 ring-blue-300'
                      : isCombined
                        ? 'bg-gradient-to-r from-purple-50 to-purple-100 border-2 border-purple-300 hover:border-purple-400 text-purple-700 hover:shadow-md'
                        : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 hover:border-blue-400 text-blue-700 hover:shadow-md'
                      }`}
                  >
                    <span className={`font-bold text-sm ${isSelected ? 'text-white' : ''}`}>
                      {et.name}:
                    </span>
                    <span className={`font-semibold text-sm ml-1 ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                      ${et.revenue.toLocaleString()}
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
                <div key={etData.name} className="p-6 rounded-xl border-2 shadow-xl bg-gradient-to-br from-white via-blue-50/30 to-white border-blue-200">
                  {/* Header Section */}
                  <div className="mb-6 p-5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                          <Users className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold mb-1">ET: {etData.name}</h3>
                          <p className="text-blue-100 text-sm flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            {etData.creatives.length} creatives • {etData.campaigns.length} campaigns
                          </p>
                        </div>
                      </div>
                      <div className="text-right bg-white/10 backdrop-blur-sm px-4 py-3 rounded-lg border border-white/20">
                        <p className="text-3xl font-bold mb-1">
                          ${etData.revenue.toLocaleString()}
                        </p>
                        <p className="text-blue-100 text-sm font-medium">
                          Total Revenue
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Top Performing Creative for ET */}
                  {etData.creatives.length > 0 && (
                    <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 shadow-md">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-amber-100">
                            <Award className="h-5 w-5 text-amber-600" />
                          </div>
                          <div>
                            <h4 className="font-bold text-amber-900 mb-1">Top Performing Creative</h4>
                            <p className="text-sm font-medium text-amber-700">{etData.creatives[0].name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-amber-700">
                            ${etData.creatives[0].revenue.toLocaleString()}
                          </p>
                          <p className="text-xs text-amber-600 font-medium">
                            {etData.creatives[0].frequency} occurrences
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Campaign Revenue for Selected ET */}
                  <div className="mb-6">
                    <div className="flex items-center mb-4 gap-2">
                      <div className="p-2 rounded-lg bg-blue-100">
                        <Target className="h-5 w-5 text-blue-600" />
                      </div>
                      <h4 className="text-lg font-bold text-gray-800">Campaign-Wise Revenue Breakdown</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {etData.campaigns
                        .map(campaignName => {
                          const campaignRevenue = data.records
                            .filter(r => r.et.toUpperCase() === etData.name.toUpperCase() && r.campaign === campaignName)
                            .reduce((sum, r) => sum + r.revenue, 0);
                          const creatives = data.records
                            .filter(r => r.et.toUpperCase() === etData.name.toUpperCase() && r.campaign === campaignName)
                            .reduce((acc, r) => {
                              if (!acc.find(c => c.name === r.creative)) {
                                acc.push({
                                  name: r.creative,
                                  frequency: r.conv ?? 1, // Use CONV value if available, otherwise 1
                                  revenue: r.revenue
                                });
                              } else {
                                const existing = acc.find(c => c.name === r.creative)!;
                                existing.frequency += r.conv ?? 1; // Use CONV value if available, otherwise 1
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
                              className="p-4 rounded-xl border-2 transition-colors bg-gradient-to-br from-white to-blue-50/50 border-blue-200 hover:border-blue-300"
                            >
                              {/* Campaign Header */}
                              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-blue-100">
                                <Target className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                <h4 className="text-base font-bold text-gray-800 truncate">{campaignData.campaignName}</h4>
                              </div>

                              {/* Revenue and Frequency - Compact */}
                              <div className="grid grid-cols-2 gap-3 mb-3">
                                <div className="bg-green-50 rounded-lg p-2 border border-green-200">
                                  <p className="text-xs text-green-700 font-medium mb-1">Revenue</p>
                                  <p className="text-lg font-bold text-green-600">
                                    ${campaignData.campaignRevenue.toFixed(1)}
                                  </p>
                                </div>
                                <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
                                  <p className="text-xs text-blue-700 font-medium mb-1">Frequency</p>
                                  <p className="text-lg font-bold text-blue-600">
                                    {campaignData.creatives.reduce((sum, c) => sum + c.frequency, 0)}
                                  </p>
                                </div>
                              </div>

                              {/* Active Creatives - Compact */}
                              <div>
                                <div className="flex items-center gap-1 mb-2">
                                  <Users className="h-3 w-3 text-gray-500" />
                                  <span className="text-xs font-medium text-gray-600">
                                    Creatives ({campaignData.creatives.length})
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {campaignData.creatives.slice(0, 4).map((creative, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-blue-100 text-blue-700 border border-blue-200"
                                    >
                                      {creative.name.length > 15 ? creative.name.substring(0, 15) + '...' : creative.name}
                                    </span>
                                  ))}
                                  {campaignData.creatives.length > 4 && (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
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
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 rounded-lg bg-purple-100">
                        <FileText className="h-5 w-5 text-purple-600" />
                      </div>
                      <h4 className="text-lg font-bold text-gray-800">All Creatives ({etData.creatives.length})</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {etData.creatives.map((creative, idx) => (
                        <div
                          key={creative.name}
                          className="p-3 rounded-xl border-2 transition-colors bg-gradient-to-br from-white to-purple-50/30 border-purple-200 hover:border-purple-300"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <FileText className="h-4 w-4 text-purple-600 flex-shrink-0" />
                              <h5 className="font-semibold text-sm text-gray-800 truncate">{creative.name}</h5>
                            </div>
                            {idx === 0 && (
                              <Award className="h-4 w-4 text-amber-500 flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-purple-100">
                            <div>
                              <p className="text-lg font-bold text-purple-600">
                                ${creative.revenue.toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-500 font-medium">
                                {creative.frequency} {creative.frequency === 1 ? 'occurrence' : 'occurrences'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              /* Original single ET display for non-combined ETs */
              <div className="p-6 rounded-xl border-2 shadow-xl bg-gradient-to-br from-white via-blue-50/30 to-white border-blue-200">
                {/* Header Section */}
                <div className="mb-6 p-5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                        <Users className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold mb-1">ET: {selectedETData.name}</h3>
                        <p className="text-blue-100 text-sm flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          {selectedETData.creatives.length} creatives • {selectedETData.campaigns.length} campaigns
                        </p>
                      </div>
                    </div>
                    <div className="text-right bg-white/10 backdrop-blur-sm px-4 py-3 rounded-lg border border-white/20">
                      <p className="text-3xl font-bold mb-1">
                        ${selectedETData.revenue.toLocaleString()}
                      </p>
                      <p className="text-blue-100 text-sm font-medium">
                        Total Revenue
                      </p>
                    </div>
                  </div>
                </div>

                {/* Top Performing Creative for ET */}
                {selectedETData.creatives.length > 0 && (
                  <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 shadow-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-100">
                          <Award className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-amber-900 mb-1">Top Performing Creative</h4>
                          <p className="text-sm font-medium text-amber-700">{selectedETData.creatives[0].name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-amber-700">
                          ${selectedETData.creatives[0].revenue.toLocaleString()}
                        </p>
                        <p className="text-xs text-amber-600 font-medium">
                          {selectedETData.creatives[0].frequency} occurrences
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Campaign Revenue for Selected ET */}
                <div className="mb-6">
                  <div className="flex items-center mb-4 gap-2">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <Target className="h-5 w-5 text-blue-600" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-800">Campaign-Wise Revenue Breakdown</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {selectedETData.campaigns
                      .map(campaignName => {
                        const etNames = getETNamesForFilter(selectedETData.name);
                        const campaignRevenue = data.records
                          .filter(r => etNames.includes(r.et.toUpperCase()) && r.campaign === campaignName)
                          .reduce((sum, r) => sum + r.revenue, 0);
                        const creatives = data.records
                          .filter(r => etNames.includes(r.et.toUpperCase()) && r.campaign === campaignName)
                          .reduce((acc, r) => {
                            if (!acc.find(c => c.name === r.creative)) {
                              acc.push({
                                name: r.creative,
                                frequency: r.conv ?? 1, // Use CONV value if available, otherwise 1
                                revenue: r.revenue
                              });
                            } else {
                              const existing = acc.find(c => c.name === r.creative)!;
                              existing.frequency += r.conv ?? 1; // Use CONV value if available, otherwise 1
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
                            className="p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-gradient-to-br from-white to-blue-50/50 border-blue-200 hover:border-blue-300"
                          >
                            {/* Campaign Header */}
                            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-blue-100">
                              <Target className="h-4 w-4 text-blue-600 flex-shrink-0" />
                              <h4 className="text-base font-bold text-gray-800 truncate">{campaignData.campaignName}</h4>
                            </div>

                            {/* Revenue and Frequency - Compact */}
                            <div className="grid grid-cols-2 gap-3 mb-3">
                              <div className="bg-green-50 rounded-lg p-2 border border-green-200">
                                <p className="text-xs text-green-700 font-medium mb-1">Revenue</p>
                                <p className="text-lg font-bold text-green-600">
                                  ${campaignData.campaignRevenue.toFixed(1)}
                                </p>
                              </div>
                              <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
                                <p className="text-xs text-blue-700 font-medium mb-1">Frequency</p>
                                <p className="text-lg font-bold text-blue-600">
                                  {campaignData.creatives.reduce((sum, c) => sum + c.frequency, 0)}
                                </p>
                              </div>
                            </div>

                            {/* Active Creatives - Compact */}
                            <div>
                              <div className="flex items-center gap-1 mb-2">
                                <Users className="h-3 w-3 text-gray-500" />
                                <span className="text-xs font-medium text-gray-600">
                                  Creatives ({campaignData.creatives.length})
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {campaignData.creatives.slice(0, 4).map((creative, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-blue-100 text-blue-700 border border-blue-200"
                                  >
                                    {creative.name.length > 15 ? creative.name.substring(0, 15) + '...' : creative.name}
                                  </span>
                                ))}
                                {campaignData.creatives.length > 4 && (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
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
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 rounded-lg bg-purple-100">
                      <FileText className="h-5 w-5 text-purple-600" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-800">All Creatives ({selectedETData.creatives.length})</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {selectedETData.creatives.map((creative, idx) => (
                      <div
                        key={creative.name}
                        className="p-3 rounded-xl border-2 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 bg-gradient-to-br from-white to-purple-50/30 border-purple-200 hover:border-purple-300"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <FileText className="h-4 w-4 text-purple-600 flex-shrink-0" />
                            <h5 className="font-semibold text-sm text-gray-800 truncate">{creative.name}</h5>
                          </div>
                          {idx === 0 && (
                            <Award className="h-4 w-4 text-amber-500 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-purple-100">
                          <div>
                            <p className="text-lg font-bold text-purple-600">
                              ${creative.revenue.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500 font-medium">
                              {creative.frequency} {creative.frequency === 1 ? 'occurrence' : 'occurrences'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3">
          <div className="max-w-5xl w-full max-h-[90vh] overflow-hidden rounded-xl shadow-2xl bg-white border border-gray-200 flex flex-col">
            {/* Compact Header */}
            <div className="sticky top-0 px-4 py-3 border-b bg-gradient-to-r from-white to-gray-50 border-gray-200 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-500">
                    <Target className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{campaignPopup.campaign.name}</h2>
                    <p className="text-xs text-gray-500">Campaign Details & Performance</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Total Revenue</p>
                    <p className="text-xl font-bold text-green-600">
                      ${campaignPopup.campaign.revenue.toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={closeCampaignPopup}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Compact Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Summary Cards - Compact */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <p className="text-xs font-semibold text-green-700">Revenue</p>
                  </div>
                  <p className="text-xl font-bold text-green-600">
                    ${campaignPopup.campaign.revenue.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Layers className="h-4 w-4 text-red-600" />
                    <p className="text-xs font-semibold text-red-700">Creatives</p>
                  </div>
                  <p className="text-xl font-bold text-red-600">
                    {campaignPopup.campaign.creatives.length}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="h-4 w-4 text-blue-600" />
                    <p className="text-xs font-semibold text-blue-700">ETs</p>
                  </div>
                  <p className="text-xl font-bold text-blue-600">
                    {campaignPopup.campaign.ets.length}
                  </p>
                </div>
              </div>

              {/* Top Performer - Compact */}
              {campaignPopup.campaign.creatives.length > 0 && (
                <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="h-4 w-4 text-amber-600" />
                    <h3 className="text-sm font-bold text-amber-900">Top Performing Creative</h3>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-gray-900 mb-1">{campaignPopup.campaign.creatives[0].name}</p>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-semibold text-green-600">
                          ${campaignPopup.campaign.creatives[0].revenue.toLocaleString()}
                        </span>
                        <span className="text-xs text-blue-600">
                          {campaignPopup.campaign.creatives[0].frequency} occurrences
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {campaignPopup.campaign.creatives[0].ets.slice(0, 5).map(et => (
                        <span key={et} className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 text-xs">
                          {et}
                        </span>
                      ))}
                      {campaignPopup.campaign.creatives[0].ets.length > 5 && (
                        <span className="px-1.5 py-0.5 rounded bg-gray-200 text-gray-600 text-xs">
                          +{campaignPopup.campaign.creatives[0].ets.length - 5}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* All Creatives - Compact Table */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Layers className="h-4 w-4 text-blue-500" />
                  <h3 className="text-sm font-bold text-gray-800">All Creatives ({campaignPopup.campaign.creatives.length})</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="text-left px-3 py-2 font-semibold text-gray-700">#</th>
                        <th className="text-left px-3 py-2 font-semibold text-gray-700">Creative</th>
                        <th className="text-right px-3 py-2 font-semibold text-gray-700">Revenue</th>
                        <th className="text-right px-3 py-2 font-semibold text-gray-700">Frequency</th>
                        <th className="text-left px-3 py-2 font-semibold text-gray-700">ETs</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {campaignPopup.campaign.creatives.map((creative, index) => (
                        <tr key={creative.name} className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                          <td className="px-3 py-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-yellow-500 text-white' :
                              index === 1 ? 'bg-gray-400 text-white' :
                                index === 2 ? 'bg-amber-600 text-white' :
                                  'bg-gray-300 text-gray-700'
                              }`}>
                              {index + 1}
                            </div>
                          </td>
                          <td className="px-3 py-2 font-medium text-gray-900 truncate max-w-xs" title={creative.name}>
                            {creative.name}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold text-green-600">
                            ${creative.revenue.toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-right text-blue-600">
                            {creative.frequency}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex flex-wrap gap-1">
                              {creative.ets.slice(0, 3).map(et => (
                                <span key={et} className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-xs">
                                  {et}
                                </span>
                              ))}
                              {creative.ets.length > 3 && (
                                <span className="px-1.5 py-0.5 rounded bg-gray-200 text-gray-600 text-xs">
                                  +{creative.ets.length - 3}
                                </span>
                              )}
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
      )}
      {/* End: Campaign Details Popup */}
    </div>
  );
};

export default Dashboard;
