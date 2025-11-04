import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, FileText, TrendingUp, Users, Target, DollarSign, RefreshCw, Building2, Zap, Globe, Wifi, Award, BarChart3, Search, X, Star, Activity, Layers, Eye, Hash, Calendar, AtSign, ChevronUp, ChevronDown } from 'lucide-react';
import { ProcessedData, DataRecord, CreativeStats, CampaignStats, ETStats, AdvertiserStats } from '../types';

interface UploadedFile {
  name: string;
  data: ProcessedData;
}

interface DashboardProps {
  data: ProcessedData;
  uploadedFiles: UploadedFile[];
  isDarkMode: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onReset: () => void;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'];
const TOP_ET_COLOR = "#10B981";
const OTHER_ET_COLOR = "#3B82F6";



const Dashboard: React.FC<DashboardProps> = ({ data, uploadedFiles, isDarkMode, searchQuery, onSearchChange, onReset }) => {
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

    // S11
    "JSG32": { stack: "S11", manager: "Kaif K." },
    "EX32": { stack: "S11", manager: "Kaif K." },
    "JSG20": { stack: "S11", manager: "Harsh G." },
    "JSG44": { stack: "S11", manager: "Harsh G." },

    // S12
    "JSG38": { stack: "S12", manager: "Kaif K." },
    "JSG40": { stack: "S12", manager: "Keshav T." },

    // S13
    "JSG43": { stack: "S13", manager: "Aditya S." },
  };

  // 🔍 Get ET Info (safe helper)
  const getETInfo = (etName: string) => etInfoMap[etName] || null;

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

    // Advertiser stats
    const advertiserStats = new Map<string, AdvertiserStats>();

    // Custom CM Gmail aggregation
    let cmRevenue = 0;
    let cmCampaigns: Set<string> = new Set();

    data.records.forEach(record => {
      if (
        record.subid?.includes("CM") || record.subid?.includes("JSG36")) {
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

    // Campaign stats
    const campaignStats = new Map<string, CampaignStats>();

    // ET stats
    const etStats = new Map<string, ETStats>();

    // Creative stats by campaign
    const creativesByCampaign = new Map<string, Map<string, CreativeStats>>();

    // Creative stats by ET
    const creativesByET = new Map<string, Map<string, CreativeStats>>();

    data.records.forEach(record => {
      // Advertiser stats
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
      if (!campaign.ets.includes(record.et)) {
        campaign.ets.push(record.et);
      }

      // ET stats
      if (!etStats.has(record.et)) {
        etStats.set(record.et, {
          name: record.et,
          revenue: 0,
          creatives: [],
          campaigns: [],
          advertisers: new Map<string, number>(), // 👈 track advertisers
        });
      }
      const et = etStats.get(record.et)!;
      et.revenue += record.revenue;
      if (!et.campaigns.includes(record.campaign)) {
        et.campaigns.push(record.campaign);
      }

      // Track advertiser revenue inside ET
      if (!et.advertisers.has(record.advertiser)) {
        et.advertisers.set(record.advertiser, 0);
      }
      et.advertisers.set(record.advertiser, et.advertisers.get(record.advertiser)! + record.revenue);

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
      if (!campaignCreative.ets.includes(record.et)) {
        campaignCreative.ets.push(record.et);
      }

      // Creatives by ET
      if (!creativesByET.has(record.et)) {
        creativesByET.set(record.et, new Map());
      }
      const etCreatives = creativesByET.get(record.et)!;
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
      if (!etCreative.ets.includes(record.et)) {
        etCreative.ets.push(record.et);
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
      group.ets.add(record.et);
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
    return analytics.etStats.find(e => e.name === selectedET);
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
      filteredRecords = filteredRecords.filter(r => r.et === selectedET);
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
      creative.ets.add(record.et);
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

    const etRecords = data.records.filter(r => r.et === selectedET);

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



  return (
    <div className="space-y-8 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center mb-2">
            <h2 className="text-3xl font-bold">Report & Campaign Management</h2>
          </div>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {uploadedFiles.length} file{uploadedFiles.length > 1 ? 's' : ''} processed • {data.records.length} records analyzed
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportFilteredData}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </button>
          <button
            onClick={onReset}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
              }`}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            New Upload
          </button>
        </div>
      </div>

      {/* Search Box */}
      <div className={`p-6 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gradient-to-r from-violet-200 to-pink-200 border-gray-200'
        }`}>
        <div className="flex items-center mb-4">
          <Search className="h-6 w-6 mr-3 text-blue-500" />
          <h3 className="text-xl font-bold">Search Creatives</h3>
        </div>
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`} />
          <input
            type="text"
            placeholder="Search for creative names..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={`w-full pl-10 pr-10 py-3 rounded-lg border transition-colors ${isDarkMode
              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Search Results */}
      {searchResults && (
        <div className={`p-6 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
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
                className={`p-6 rounded-lg border transition-all duration-200 hover:shadow-lg ${isDarkMode ? 'bg-gray-700 border-gray-600 hover:bg-gray-650' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
              >
                <div className="flex items-center mb-4">
                  <Layers className="h-5 w-5 mr-2 text-red-500" />
                  <h4 className="font-bold text-lg">{result.creative}</h4>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-cente">
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Total Revenue:
                    </span>
                    <span className="text-xl font-bold text-green-500">
                      ${result.totalRevenue.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-gray-200 px-3 py-1 rounded-lg">
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Frequency:
                    </span>
                    <span className="font-semibold text-blue-500">
                      {result.frequency}
                    </span>
                  </div>

                  <div className="pt-3">
                    <div className="mb-2">
                      <span className={`text-sm font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-800'}`}>
                        Campaign ({result.campaigns.size}):
                      </span><br />
                      <div className={`text-center inline-block mt-3 bg-blue-100 border border-blue-400 px-2 py-1 rounded-lg text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {Array.from(result.campaigns).join(', ')}
                      </div>
                    </div>

                    <div className="mb-2">
                      <span className={`text-sm font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-800'}`}>
                        ETs ({result.ets.size}):
                      </span><br />
                      <span className={`text-center inline-block mt-3 bg-blue-100 border border-blue-400 px-2 py-1 rounded-lg text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {Array.from(result.ets).join(', ')}
                      </span>

                    </div>

                    <div>
                      <span className={`text-sm font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-800'}`}>
                        Advertisers ({result.advertisers.size}):
                      </span>
                      <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className={`p-6 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-[#d2f7e0] border-[#22c55e]'
          }`}>
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Total Revenue
              </p>
              <p className="text-2xl font-bold">${analytics.totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-blue-900 border-blue-500'
          }`}>
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-white">
                Daily Revenue Target
              </p>
              <p className="text-2xl font-bold text-green-500">$18,200</p>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-[#ccdefd] border-[#3c83f6]'
          }`}>
          <div className="flex items-center">
            <Target className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Campaigns
              </p>
              <p className="text-2xl font-bold">{analytics.campaignStats.length}</p>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-[#fbcdcd] border-[#ef4646]'
          }`}>
          <div className="flex items-center">
            <Users className="h-8 w-8 text-red-500" />
            <div className="ml-4">
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                ETs
              </p>
              <p className="text-2xl font-bold">{analytics.etStats.length}</p>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-[#fedfca] border-[#f97316]'
          }`}>
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Creatives
              </p>
              <p className="text-2xl font-bold">{data.creatives.size}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Advertiser Revenue Breakdown */}
      <div className={`p-6 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
        <div className="flex items-center mb-6">
          <Building2 className="h-6 w-6 mr-3 text-red-500" />
          <h3 className="text-xl font-bold">Advertiser-Wise Revenue</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {analytics.advertiserStats.map((advertiser, index) => (
            <div
              key={advertiser.name}
              className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-lg ${isDarkMode ? 'bg-gray-700 border-gray-600 hover:bg-gray-650' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  {advertiser.name === 'Branded' && <Award className="h-4 w-4 mr-2 text-yellow-500" />}
                  {advertiser.name === 'GZ' && <Zap className="h-4 w-4 mr-2 text-blue-500" />}
                  {advertiser.name === 'XC' && <Zap className="h-4 w-4 mr-2 text-blue-500" />}
                  {advertiser.name === 'ES' && <Globe className="h-4 w-4 mr-2 text-green-500" />}
                  {advertiser.name === 'Comcast' && <Wifi className="h-4 w-4 mr-2 text-red-500" />}
                  {advertiser.name === 'RGR' && <Target className="h-4 w-4 mr-2 text-red-500" />}
                  {advertiser.name === 'CM Gmail' && <AtSign className="h-4 w-4 mr-2 text-red-500" />}
                  <h4 className="font-semibold">{advertiser.name}</h4>
                </div>



                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
              </div>
              <p className="text-2xl font-bold text-green-500">
                ${advertiser.revenue.toLocaleString()}
              </p>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {advertiser.campaigns.length} campaigns
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ET Revenue Charts */}
      <div className={`p-6 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
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


      {/* ET Revenue Breakdown */}
      <div className={`p-6 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Users className="h-6 w-6 mr-3 text-blue-500" />
            <h3 className="text-xl font-bold">ET-Wise Revenue</h3>
          </div>
          <div className={`text-sm px-3 py-1 rounded-full ${isDarkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800'
            }`}>
            Top performing ETs by revenue
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {analytics.etStats.slice(0, 50).map((et, index) => (
            <div
              key={et.name}
              className={`pb-4 rounded-xl border transition-all duration-300 hover:shadow-xl cursor-pointer ${isDarkMode
                ? 'bg-gradient-to-br from-gray-700 to-gray-800 border-gray-600 hover:from-gray-600 hover:to-gray-700 hover:border-blue-500'
                : 'bg-gradient-to-br from-blue-50 to-white border-blue-300'
                } group`}>
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
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Today Revenue
                  </p>
                </div>
                <div>
                  <div className='bg-green-400 py-[3px] rounded-md rounded-br-none rounded-bl-none'>
                    <p className='text-center uppercase text-[10px] font-bold text-white'>{currentDate}</p>
                  </div>
                  <div className="bg-green-100 px-2 py-1 rounded-md rounded-tr-none rounded-tl-none">
                    <p className="text-xl font-bold text-green-500 mb-1">
                      {getTargetRevenue(et.name).toLocaleString()}
                    </p>
                    <p className={`text-[12px] font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Daily Target
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between px-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <Layers className="h-4 w-4 mr-1 text-red-500" />
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {et.creatives.length}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Target className="h-4 w-4 mr-1 text-blue-500" />
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {et.campaigns.length}
                    </span>
                  </div>
                </div>
              </div>
              {/* Toggle button */}
              <button
                onClick={() => toggleET(et.name)}
                className={`mt-3 flex items-center gap-1 text-sm font-medium px-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'
                  } hover:underline`}
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
                <ul className="text-xs space-y-1 flex flex-wrap gap-2 justify-center items-center p-0">
                  {et.advertisersArray?.map(ad => (
                    <li
                      key={ad.name}
                      className="flex flex-col justify-center items-center gap-2 bg-blue-500/10 p-1 rounded-[12px] p-2 w-[30%]"
                    >
                      <span className="font-medium">{ad.name}</span>
                      <span
                        className={`text-xs font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'
                          }`}
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

      {/* Campaign Revenue Breakdown */}
      <div className={`p-6 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Target className="h-6 w-6 mr-3 text-blue-500" />
            <h3 className="text-xl font-bold">Campaign-Wise Revenue</h3>
          </div>
          <div className={`text-sm px-3 py-1 rounded-full ${isDarkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'
            }`}>
            Click any campaign for detailed view
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {analytics.campaignStats.slice(0, 12).map((campaign, index) => (
            <div
              key={campaign.name}
              onClick={() => openCampaignPopup(campaign)}
              className={`p-6 rounded-xl border transition-all duration-300 hover:shadow-xl cursor-pointer transform hover:scale-105 ${isDarkMode
                ? 'bg-gradient-to-br from-gray-700 to-gray-800 border-gray-600 hover:from-gray-600 hover:to-gray-700 hover:border-blue-500'
                : 'bg-gradient-to-br from-white to-gray-50 border-gray-200 hover:from-blue-50 hover:to-white hover:border-blue-300'
                } group`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'
                    } group-hover:scale-110 transition-transform duration-200`}>
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
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Total Revenue
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <Layers className="h-4 w-4 mr-1 text-red-500" />
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {campaign.creatives.length}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1 text-blue-500" />
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {campaign.ets.length}
                    </span>
                  </div>
                </div>
                <div className={`text-xs px-2 py-1 rounded-full ${isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'
                  } group-hover:bg-blue-500 group-hover:text-white transition-colors`}>
                  View Details
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>


      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
        <div className={`p-6 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Target className="h-5 w-5 mr-2 text-blue-500" />
              <h3 className="text-xl font-bold">Campaign Analysis</h3>
            </div>
            {selectedCampaign && (
              <button
                onClick={exportCampaignCreatives}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'
                  } text-white`}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Creatives
              </button>
            )}
          </div>

          <div className={`p-4 rounded-lg mb-4 ${isDarkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'
            }`}>
            <div className="flex items-center mb-2">
              <Search className="h-5 w-5 mr-2 text-blue-500" />
              <label className="block text-sm font-medium text-blue-600">Select Campaign for Detailed Analysis</label>
            </div>
            <p className={`text-xs ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>
              Choose a campaign to view ET-wise performance and export creative data
            </p>
          </div>

          <select
            value={selectedCampaign}
            onChange={(e) => setSelectedCampaign(e.target.value)}
            className={`w-full p-4 rounded-lg border text-lg font-medium ${isDarkMode
              ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
              : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors`}
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
          <div className={`p-6 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Campaign: {selectedCampaignData.name}</h3>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-500">
                  ${selectedCampaignData.revenue.toLocaleString()}
                </p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Total Revenue
                </p>
              </div>
            </div>

            {/* Top Performing Creative */}
            {selectedCampaignData.creatives.length > 0 && (
              <div className={`mb-6 p-4 rounded-lg ${isDarkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'
                }`}>
                <div className="flex items-center mb-2">
                  <Award className="h-5 w-5 mr-2 text-yellow-500" />
                  <h4 className="font-semibold text-blue-600">Top Performing Creative</h4>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{selectedCampaignData.creatives[0].name}</p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      ETs: {selectedCampaignData.creatives[0].ets.join(', ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${selectedCampaignData.creatives[0].revenue.toLocaleString()}</p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
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
                      .filter(r => r.campaign === selectedCampaignData.name && r.et === etName)
                      .reduce((sum, r) => sum + r.revenue, 0);
                    const creatives = data.records
                      .filter(r => r.campaign === selectedCampaignData.name && r.et === etName)
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
                        className={`p-6 rounded-xl border transition-all duration-300 hover:shadow-lg ${isDarkMode ? 'bg-gray-800 border-gray-700 hover:border-gray-600' : 'bg-white border-gray-200 hover:border-gray-300'
                          }`}
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
                                <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
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
                                <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
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
                              <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Active Creatives ({etData.creatives.length}):
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {etData.creatives.slice(0, 6).map((creative, idx) => (
                                <span
                                  key={idx}
                                  className={`px-3 py-1 rounded-full text-xs font-medium ${isDarkMode
                                    ? 'bg-blue-900/30 text-blue-300 border border-blue-800'
                                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                                    }`}
                                >
                                  {creative.name}
                                </span>
                              ))}
                              {etData.creatives.length > 6 && (
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                                  }`}>
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
                  className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-lg ${isDarkMode ? 'bg-gray-700 border-gray-600 hover:bg-gray-650' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                >
                  <div className="flex items-center mb-2">
                    <FileText className="h-4 w-4 mr-2 text-gray-500" />
                    <h5 className="font-semibold">{creative.name}</h5>
                  </div>
                  <p className="text-lg font-bold text-green-500">
                    ${creative.revenue.toLocaleString()}
                  </p>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Frequency: {creative.frequency}
                  </p>
                  <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    ETs: {creative.ets.join(', ')}
                  </p>
                </div>
              ))}
            </div>

          </div>
        )}
      </div>

      {/* Filters 2 */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
        <div className={`p-6 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-500" />
              <h3 className="text-xl font-bold">ET Analysis</h3>
            </div>
            {selectedET && (
              <button
                onClick={exportETCreatives}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'
                  } text-white`}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Creatives
              </button>
            )}
          </div>

          <div className={`p-4 rounded-lg mb-4 ${isDarkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'
            }`}>
            <div className="flex items-center mb-2">
              <Search className="h-5 w-5 mr-2 text-blue-500" />
              <label className="block text-sm font-medium text-blue-600">Select ET for Detailed Analysis</label>
            </div>
            <p className={`text-xs ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>
              Choose an ET to view campaign-wise performance and export creative data
            </p>
          </div>

          <select
            value={selectedET}
            onChange={(e) => setSelectedET(e.target.value)}
            className={`w-full p-4 rounded-lg border text-lg font-medium ${isDarkMode
              ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
              : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors`}
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
          <div className={`p-6 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">ET: {selectedETData.name}</h3>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-500">
                  ${selectedETData.revenue.toLocaleString()}
                </p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Total Revenue
                </p>
              </div>
            </div>

            {/* Top Performing Creative for ET */}
            {selectedETData.creatives.length > 0 && (
              <div className={`mb-6 p-4 rounded-lg ${isDarkMode ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'
                }`}>
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
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
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
                      .filter(r => r.et === selectedETData.name && r.campaign === campaignName)
                      .reduce((sum, r) => sum + r.revenue, 0);
                    const creatives = data.records
                      .filter(r => r.et === selectedETData.name && r.campaign === campaignName)
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
                        className={`p-6 rounded-xl border transition-all duration-300 hover:shadow-lg ${isDarkMode ? 'bg-gray-800 border-gray-700 hover:border-gray-600' : 'bg-white border-gray-200 hover:border-gray-300'
                          }`}
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
                                <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
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
                                <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
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
                              <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Active Creatives ({campaignData.creatives.length}):
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {campaignData.creatives.slice(0, 6).map((creative, idx) => (
                                <span
                                  key={idx}
                                  className={`px-3 py-1 rounded-full text-xs font-medium ${isDarkMode
                                    ? 'bg-blue-900/30 text-blue-300 border border-blue-800'
                                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                                    }`}
                                >
                                  {creative.name}
                                </span>
                              ))}
                              {campaignData.creatives.length > 6 && (
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                                  }`}>
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
              {selectedETData.creatives.map((creative, index) => (
                <div
                  key={creative.name}
                  className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-lg ${isDarkMode ? 'bg-gray-700 border-gray-600 hover:bg-gray-650' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                >
                  <div className="flex items-center mb-2">
                    <FileText className="h-4 w-4 mr-2 text-gray-500" />
                    <h5 className="font-semibold">{creative.name}</h5>
                  </div>
                  <p className="text-lg font-bold text-blue-500">
                    ${creative.revenue.toLocaleString()}
                  </p>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Frequency: {creative.frequency}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>


      {/* Campaign Details Popup */}
      {campaignPopup.isOpen && campaignPopup.campaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`max-w-6xl w-full max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
            }`}>
            {/* Popup Header */}
            <div className={`sticky top-0 p-6 border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              } z-10`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'
                    }`}>
                    <Target className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="ml-4">
                    <h2 className="text-3xl font-bold">{campaignPopup.campaign.name}</h2>
                    <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Campaign Details & Performance
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeCampaignPopup}
                  className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                    }`}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Popup Content */}
            <div className="p-6">
              {/* Campaign Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gradient-to-br from-green-900/20 to-green-800/10 border-green-800' : 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'
                  }`}>
                  <div className="flex items-center mb-3">
                    <DollarSign className="h-6 w-6 text-green-500 mr-2" />
                    <h3 className="font-semibold text-green-600">Total Revenue</h3>
                  </div>
                  <p className="text-3xl font-bold text-green-500">
                    ${campaignPopup.campaign.revenue.toLocaleString()}
                  </p>
                </div>

                <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gradient-to-br from-red-900/20 to-red-800/10 border-red-800' : 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'
                  }`}>
                  <div className="flex items-center mb-3">
                    <Layers className="h-6 w-6 text-red-500 mr-2" />
                    <h3 className="font-semibold text-red-600">Total Creatives</h3>
                  </div>
                  <p className="text-3xl font-bold text-red-500">
                    {campaignPopup.campaign.creatives.length}
                  </p>
                </div>

                <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-800' : 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'
                  }`}>
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
                <div className={`mb-8 p-6 rounded-xl border ${isDarkMode ? 'bg-gradient-to-r from-yellow-900/20 to-amber-900/20 border-yellow-800' : 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200'
                  }`}>
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
                      <p className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Active in ETs:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {campaignPopup.campaign.creatives[0].ets.map(et => (
                          <span key={et} className={`px-3 py-1 rounded-full text-xs font-medium ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                            }`}>
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
                      className={`p-6 rounded-xl border transition-all duration-200 hover:shadow-lg ${isDarkMode ? 'bg-gray-700 border-gray-600 hover:bg-gray-650' : 'bg-gray-50 border-gray-200 hover:bg-white'
                        }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${index === 0 ? 'bg-yellow-500 text-white' :
                              index === 1 ? 'bg-gray-400 text-white' :
                                index === 2 ? 'bg-amber-600 text-white' :
                                  isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-300 text-gray-700'
                              }`}>
                              {index + 1}
                            </div>
                            <h4 className="font-bold text-lg">{creative.name}</h4>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'
                          }`}>
                          <div className="flex items-center mb-1">
                            <DollarSign className="h-4 w-4 text-green-500 mr-1" />
                            <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              Revenue
                            </span>
                          </div>
                          <p className="text-xl font-bold text-green-500">
                            ${creative.revenue.toLocaleString()}
                          </p>
                        </div>

                        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'
                          }`}>
                          <div className="flex items-center mb-1">
                            <Hash className="h-4 w-4 text-blue-500 mr-1" />
                            <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
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
                          <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            Active in ETs ({creative.ets.length}):
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {creative.ets.map(et => (
                            <span key={et} className={`px-2 py-1 rounded-md text-xs font-medium ${isDarkMode ? 'bg-blue-900/30 text-blue-300 border border-blue-800' : 'bg-blue-100 text-blue-700 border border-blue-200'
                              }`}>
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
    </div>
  );
};

export default Dashboard;
