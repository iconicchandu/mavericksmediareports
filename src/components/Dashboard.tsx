import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, FileText, Users, Target, DollarSign, RefreshCw, Building2, Zap, Globe, Wifi, Award, BarChart3, Search, X, Star, Activity, Layers, Eye, Hash, AtSign, ChevronUp, ChevronDown } from 'lucide-react';
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


const Dashboard: React.FC<DashboardProps> = ({ data, uploadedFiles, isDarkMode, searchQuery, onSearchChange, onReset }) => {
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [selectedET, setSelectedET] = useState('');
  const [campaignPopup, setCampaignPopup] = useState<{
    isOpen: boolean;
    campaign: CampaignStats | null;
  }>({ isOpen: false, campaign: null });

  // Expanded ET state for advertiser breakdown
  const [expandedETs, setExpandedETs] = useState<Set<string>>(new Set());

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

    // 

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
    <div className="space-y-10 relative">
      {/* Header */}
      <div className="relative">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={`absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl opacity-10 ${isDarkMode ? 'bg-blue-500' : 'bg-blue-300'}`}></div>
          <div className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl opacity-10 ${isDarkMode ? 'bg-purple-500' : 'bg-purple-300'}`}></div>
          </div>

        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-gradient-to-br from-blue-900/30 to-purple-900/30' : 'bg-gradient-to-br from-blue-100 to-purple-100'}`}>
                <BarChart3 className="h-8 w-8 text-blue-500" />
              </div>
              <div>
                <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Campaign Analytics
                </h2>
                <p className={`text-lg font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Advanced Performance Dashboard
          </p>
        </div>
            </div>
            <div className={`flex items-center space-x-4 px-4 py-2 rounded-xl backdrop-blur-sm border ${isDarkMode
              ? 'bg-gray-800/50 border-gray-700/50 text-gray-300'
              : 'bg-white/80 border-gray-200/50 text-gray-600'
              }`}>
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">
                  {uploadedFiles.length} file{uploadedFiles.length > 1 ? 's' : ''} processed
                </span>
              </div>
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">
                  {data.records.length} records analyzed
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
          <button
            onClick={exportFilteredData}
              className={`group relative flex items-center px-6 py-3 rounded-2xl font-semibold transition-all duration-300 overflow-hidden ${isDarkMode
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-lg shadow-blue-900/30'
                : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-lg shadow-blue-900/20'
                }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <Download className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform duration-300" />
            Export Data
          </button>
          <button
            onClick={onReset}
              className={`group flex items-center px-6 py-3 rounded-2xl font-semibold transition-all duration-300 ${isDarkMode
                ? 'bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white border border-gray-700/50 hover:border-gray-600/50'
                : 'bg-white/80 hover:bg-gray-50/80 text-gray-700 hover:text-gray-900 border border-gray-200/50 hover:border-gray-300/50'
                } backdrop-blur-sm`}
            >
              <RefreshCw className="h-5 w-5 mr-3 group-hover:rotate-180 transition-transform duration-500" />
            New Upload
          </button>
          </div>
        </div>
      </div>

      {/* Search Box */}
      <div className={`relative p-8 rounded-3xl border backdrop-blur-sm transition-all duration-300 ${isDarkMode
        ? 'bg-gradient-to-br from-gray-800/80 to-gray-900/80 border-gray-700/50 shadow-2xl shadow-gray-900/20'
        : 'bg-gradient-to-br from-white/90 to-gray-50/90 border-gray-200/50 shadow-2xl shadow-gray-900/10'
        }`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl">
          <div className={`absolute top-0 left-0 w-32 h-32 rounded-full blur-2xl opacity-20 ${isDarkMode ? 'bg-blue-500' : 'bg-blue-300'}`}></div>
          <div className={`absolute bottom-0 right-0 w-40 h-40 rounded-full blur-2xl opacity-20 ${isDarkMode ? 'bg-purple-500' : 'bg-purple-300'}`}></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center mb-6">
            <div className={`p-3 rounded-2xl mr-4 ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
              <Search className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Search Creatives</h3>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Find specific creatives and analyze their performance
              </p>
            </div>
        </div>
        <div className="relative">
            <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`} />
          <input
            type="text"
            placeholder="Search for creative names..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
              className={`w-full pl-12 pr-12 py-4 rounded-2xl border-2 transition-all duration-300 text-lg ${isDarkMode
                ? 'bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400 focus:border-blue-500 focus:bg-gray-700/70'
                : 'bg-white/80 border-gray-300/50 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:bg-white/90'
                } focus:outline-none focus:ring-4 focus:ring-blue-500/20 backdrop-blur-sm`}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
                className={`absolute right-4 top-1/2 transform -translate-y-1/2 p-2 rounded-xl transition-all duration-300 ${isDarkMode
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-600/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
                }`}
            >
                <X className="h-5 w-5" />
            </button>
          )}
          </div>
        </div>
      </div>

      {/* Search Results */}
      {searchResults && (
        <div className={`relative p-8 rounded-3xl border backdrop-blur-sm transition-all duration-300 ${isDarkMode
          ? 'bg-gradient-to-br from-gray-800/80 to-gray-900/80 border-gray-700/50 shadow-2xl shadow-gray-900/20'
          : 'bg-gradient-to-br from-white/90 to-gray-50/90 border-gray-200/50 shadow-2xl shadow-gray-900/10'
          }`}>
          {/* Background Pattern */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl">
            <div className={`absolute top-0 right-0 w-40 h-40 rounded-full blur-2xl opacity-20 ${isDarkMode ? 'bg-yellow-500' : 'bg-yellow-300'}`}></div>
            <div className={`absolute bottom-0 left-0 w-32 h-32 rounded-full blur-2xl opacity-20 ${isDarkMode ? 'bg-green-500' : 'bg-green-300'}`}></div>
          </div>

          <div className="relative z-10">
            <div className="flex items-center mb-8">
              <div className={`p-3 rounded-2xl mr-4 ${isDarkMode ? 'bg-yellow-900/30' : 'bg-yellow-100'}`}>
                <Star className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">
                  Search Results for <span className='bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>{searchQuery}</span>
            </h3>
                <div className={`flex items-center space-x-4 px-4 py-2 rounded-xl backdrop-blur-sm border ${isDarkMode
                  ? 'bg-gray-800/50 border-gray-700/50 text-gray-300'
                  : 'bg-white/80 border-gray-200/50 text-gray-600'
                  }`}>
                  <div className="flex items-center space-x-2">
                    <Layers className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">
                      {searchResults.length} creative{searchResults.length > 1 ? 's' : ''} found
                    </span>
                  </div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">
                      Total Revenue: <span className='text-green-500 font-bold'>${searchResultsTotalRevenue.toLocaleString()}</span>
                    </span>
                  </div>
                </div>
              </div>
          </div>


          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {searchResults.map((result, index) => (
              <div
                key={result.creative}
                  className={`group relative p-6 rounded-2xl border backdrop-blur-sm transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-1 ${isDarkMode
                    ? 'bg-gradient-to-br from-gray-700/80 to-gray-800/80 border-gray-600/50 hover:border-gray-500/50'
                    : 'bg-gradient-to-br from-white/90 to-gray-50/90 border-gray-200/50 hover:border-gray-300/50'
                    }`}
                >
                  {/* Background Pattern */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
                    <div className={`absolute top-0 right-0 w-20 h-20 rounded-full blur-xl opacity-20 ${isDarkMode ? 'bg-blue-500' : 'bg-blue-300'}`}></div>
                </div>

                  <div className="relative z-10">
                    <div className="flex items-center mb-6">
                      <div className={`p-2 rounded-xl mr-3 ${isDarkMode ? 'bg-red-900/30' : 'bg-red-100'}`}>
                        <Layers className="h-5 w-5 text-red-500" />
                      </div>
                      <h4 className="font-bold text-xl group-hover:text-blue-600 transition-colors duration-300">{result.creative}</h4>
                    </div>

                    <div className="space-y-4">
                      <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-100/50'}`}>
                        <div className="flex justify-between items-center">
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Total Revenue:
                    </span>
                          <span className="text-2xl font-bold text-green-500">
                      ${result.totalRevenue.toLocaleString()}
                    </span>
                        </div>
                  </div>

                      <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-blue-900/20' : 'bg-blue-100/50'}`}>
                        <div className="flex justify-between items-center">
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Frequency:
                    </span>
                          <span className="text-xl font-bold text-blue-500">
                      {result.frequency}
                    </span>
                        </div>
                  </div>

                      <div className="space-y-3">
                        <div>
                          <span className={`text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Campaign ({result.campaigns.size}):
                          </span>
                          <div className={`mt-2 p-3 rounded-xl ${isDarkMode ? 'bg-blue-900/20 border border-blue-800/50' : 'bg-blue-100/50 border border-blue-200/50'}`}>
                            <span className={`text-sm font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                        {Array.from(result.campaigns).join(', ')}
                            </span>
                      </div>
                    </div>

                        <div>
                          <span className={`text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        ETs ({result.ets.size}):
                          </span>
                          <div className={`mt-2 p-3 rounded-xl ${isDarkMode ? 'bg-orange-900/20 border border-orange-800/50' : 'bg-orange-100/50 border border-orange-200/50'}`}>
                            <span className={`text-sm font-medium ${isDarkMode ? 'text-orange-300' : 'text-orange-700'}`}>
                        {Array.from(result.ets).join(', ')}
                      </span>
                          </div>
                    </div>

                    <div>
                          <span className={`text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Advertisers ({result.advertisers.size}):
                      </span>
                          <div className={`mt-2 p-3 rounded-xl ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-100/50'}`}>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {Array.from(result.advertisers).join(', ')}
                      </p>
                          </div>
                        </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={`group relative p-8 rounded-3xl border backdrop-blur-sm transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-1 ${isDarkMode
          ? 'bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-700/50 hover:border-green-600/50'
          : 'bg-gradient-to-br from-green-50/90 to-emerald-50/90 border-green-200/50 hover:border-green-300/50'
          }`}>
          {/* Background Pattern */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl">
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-30 ${isDarkMode ? 'bg-green-500' : 'bg-green-300'}`}></div>
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-green-900/30' : 'bg-green-100'}`}>
            <DollarSign className="h-8 w-8 text-green-500" />
              </div>
              <div className={`text-xs px-3 py-1 rounded-full font-medium ${isDarkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700'}`}>
                Revenue
              </div>
            </div>
            <div>
              <p className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Total Revenue
              </p>
              <p className="text-3xl font-bold text-green-500">${analytics.totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className={`group relative p-8 rounded-3xl border backdrop-blur-sm transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-1 ${isDarkMode
          ? 'bg-gradient-to-br from-blue-900/30 to-indigo-900/30 border-blue-700/50 hover:border-blue-600/50'
          : 'bg-gradient-to-br from-blue-50/90 to-indigo-50/90 border-blue-200/50 hover:border-blue-300/50'
          }`}>
          {/* Background Pattern */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl">
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-30 ${isDarkMode ? 'bg-blue-500' : 'bg-blue-300'}`}></div>
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
            <Target className="h-8 w-8 text-blue-500" />
              </div>
              <div className={`text-xs px-3 py-1 rounded-full font-medium ${isDarkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                Campaigns
              </div>
            </div>
            <div>
              <p className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Active Campaigns
              </p>
              <p className="text-3xl font-bold text-blue-500">{analytics.campaignStats.length}</p>
            </div>
          </div>
        </div>

        <div className={`group relative p-8 rounded-3xl border backdrop-blur-sm transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-1 ${isDarkMode
          ? 'bg-gradient-to-br from-red-900/30 to-rose-900/30 border-red-700/50 hover:border-red-600/50'
          : 'bg-gradient-to-br from-red-50/90 to-rose-50/90 border-red-200/50 hover:border-red-300/50'
          }`}>
          {/* Background Pattern */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl">
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-30 ${isDarkMode ? 'bg-red-500' : 'bg-red-300'}`}></div>
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-red-900/30' : 'bg-red-100'}`}>
            <Users className="h-8 w-8 text-red-500" />
              </div>
              <div className={`text-xs px-3 py-1 rounded-full font-medium ${isDarkMode ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-700'}`}>
                ETs
              </div>
            </div>
            <div>
              <p className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Email Teams
              </p>
              <p className="text-3xl font-bold text-red-500">{analytics.etStats.length}</p>
            </div>
          </div>
        </div>

        <div className={`group relative p-8 rounded-3xl border backdrop-blur-sm transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-1 ${isDarkMode
          ? 'bg-gradient-to-br from-orange-900/30 to-amber-900/30 border-orange-700/50 hover:border-orange-600/50'
          : 'bg-gradient-to-br from-orange-50/90 to-amber-50/90 border-orange-200/50 hover:border-orange-300/50'
          }`}>
          {/* Background Pattern */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl">
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-30 ${isDarkMode ? 'bg-orange-500' : 'bg-orange-300'}`}></div>
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-orange-900/30' : 'bg-orange-100'}`}>
            <Activity className="h-8 w-8 text-orange-500" />
              </div>
              <div className={`text-xs px-3 py-1 rounded-full font-medium ${isDarkMode ? 'bg-orange-900/50 text-orange-300' : 'bg-orange-100 text-orange-700'}`}>
                Creatives
              </div>
            </div>
            <div>
              <p className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Total Creatives
              </p>
              <p className="text-3xl font-bold text-orange-500">{data.creatives.size}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Advertiser Revenue Breakdown */}
      <div className={`relative p-8 rounded-3xl border backdrop-blur-sm transition-all duration-300 ${isDarkMode
        ? 'bg-gradient-to-br from-gray-800/80 to-gray-900/80 border-gray-700/50 shadow-2xl shadow-gray-900/20'
        : 'bg-gradient-to-br from-white/90 to-gray-50/90 border-gray-200/50 shadow-2xl shadow-gray-900/10'
        }`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl">
          <div className={`absolute top-0 left-0 w-40 h-40 rounded-full blur-2xl opacity-20 ${isDarkMode ? 'bg-red-500' : 'bg-red-300'}`}></div>
          <div className={`absolute bottom-0 right-0 w-32 h-32 rounded-full blur-2xl opacity-20 ${isDarkMode ? 'bg-purple-500' : 'bg-purple-300'}`}></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center mb-8">
            <div className={`p-3 rounded-2xl mr-4 ${isDarkMode ? 'bg-red-900/30' : 'bg-red-100'}`}>
              <Building2 className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Advertiser-Wise Revenue</h3>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Revenue breakdown by advertiser performance
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {analytics.advertiserStats.map((advertiser, index) => (
            <div
              key={advertiser.name}
                className={`group relative p-6 rounded-2xl border backdrop-blur-sm transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-1 ${isDarkMode
                  ? 'bg-gradient-to-br from-gray-700/80 to-gray-800/80 border-gray-600/50 hover:border-gray-500/50'
                  : 'bg-gradient-to-br from-white/90 to-gray-50/90 border-gray-200/50 hover:border-gray-300/50'
                  }`}
              >
                {/* Background Pattern */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
                  <div
                    className="absolute top-0 right-0 w-16 h-16 rounded-full blur-xl opacity-30"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                </div>

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      {advertiser.name === 'Branded' && <Award className="h-5 w-5 mr-2 text-yellow-500" />}
                      {advertiser.name === 'GZ' && <Zap className="h-5 w-5 mr-2 text-blue-500" />}
                      {advertiser.name === 'XC' && <Zap className="h-5 w-5 mr-2 text-blue-500" />}
                      {advertiser.name === 'ES' && <Globe className="h-5 w-5 mr-2 text-green-500" />}
                      {advertiser.name === 'Comcast' && <Wifi className="h-5 w-5 mr-2 text-red-500" />}
                      {advertiser.name === 'RGR' && <Target className="h-5 w-5 mr-2 text-red-500" />}
                      {advertiser.name === 'CM Gmail' && <AtSign className="h-5 w-5 mr-2 text-red-500" />}
                      <h4 className="font-bold text-lg group-hover:text-blue-600 transition-colors duration-300">{advertiser.name}</h4>
                    </div>
                    <div
                      className="w-4 h-4 rounded-full shadow-lg"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
              </div>
                  <div className="space-y-2">
                    <p className="text-3xl font-bold text-green-500">
                ${advertiser.revenue.toLocaleString()}
              </p>
                    <div className={`flex items-center space-x-2 px-3 py-1 rounded-xl ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-100/50'}`}>
                      <Target className="h-4 w-4 text-blue-500" />
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {advertiser.campaigns.length} campaigns
              </p>
                    </div>
                  </div>
                </div>
            </div>
          ))}
          </div>
        </div>
      </div>

      {/* ET Revenue Charts */}
      <div className={`relative p-8 rounded-3xl border backdrop-blur-sm transition-all duration-300 ${isDarkMode
        ? 'bg-gradient-to-br from-gray-800/80 to-gray-900/80 border-gray-700/50 shadow-2xl shadow-gray-900/20'
        : 'bg-gradient-to-br from-white/90 to-gray-50/90 border-gray-200/50 shadow-2xl shadow-gray-900/10'
        }`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl">
          <div className={`absolute top-0 right-0 w-40 h-40 rounded-full blur-2xl opacity-20 ${isDarkMode ? 'bg-blue-500' : 'bg-blue-300'}`}></div>
          <div className={`absolute bottom-0 left-0 w-32 h-32 rounded-full blur-2xl opacity-20 ${isDarkMode ? 'bg-green-500' : 'bg-green-300'}`}></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <div className={`p-3 rounded-2xl mr-4 ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                <BarChart3 className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">ET Revenue Charts</h2>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Visual representation of email team performance
                </p>
              </div>
            </div>
            <div className={`text-sm px-4 py-2 rounded-xl backdrop-blur-sm border ${isDarkMode
              ? 'bg-blue-900/20 text-blue-300 border-blue-700/50'
              : 'bg-blue-100/80 text-blue-700 border-blue-200/50'
              }`}>
              Top 3 ETs highlighted
            </div>
          </div>

          <div className="w-full">
          {/* Bar Chart */}
            <div className="h-96 rounded-2xl overflow-hidden">
            <ResponsiveContainer>
                <BarChart data={analytics.etChartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#374151" : "#e5e7eb"} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: isDarkMode ? "#9ca3af" : "#6b7280" }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: isDarkMode ? "#9ca3af" : "#6b7280" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
                      border: isDarkMode ? "1px solid #374151" : "1px solid #e5e7eb",
                      borderRadius: "12px",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                    }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} fill={TOP_ET_COLOR} />
              </BarChart>
            </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>


      {/* ET Revenue Breakdown */}
      <div className={`relative p-8 rounded-3xl border backdrop-blur-sm transition-all duration-300 ${isDarkMode
        ? 'bg-gradient-to-br from-gray-800/80 to-gray-900/80 border-gray-700/50 shadow-2xl shadow-gray-900/20'
        : 'bg-gradient-to-br from-white/90 to-gray-50/90 border-gray-200/50 shadow-2xl shadow-gray-900/10'
        }`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl">
          <div className={`absolute top-0 left-0 w-40 h-40 rounded-full blur-2xl opacity-20 ${isDarkMode ? 'bg-orange-500' : 'bg-orange-300'}`}></div>
          <div className={`absolute bottom-0 right-0 w-32 h-32 rounded-full blur-2xl opacity-20 ${isDarkMode ? 'bg-red-500' : 'bg-red-300'}`}></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
              <div className={`p-3 rounded-2xl mr-4 ${isDarkMode ? 'bg-orange-900/30' : 'bg-orange-100'}`}>
                <Users className="h-6 w-6 text-orange-500" />
          </div>
              <div>
                <h3 className="text-2xl font-bold">ET-Wise Revenue</h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Email team performance breakdown with detailed insights
                </p>
              </div>
            </div>
            <div className={`text-sm px-4 py-2 rounded-xl backdrop-blur-sm border ${isDarkMode
              ? 'bg-orange-900/20 text-orange-300 border-orange-700/50'
              : 'bg-orange-100/80 text-orange-700 border-orange-200/50'
            }`}>
            Top performing ETs by revenue
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {analytics.etStats.slice(0, 50).map((et, index) => (
            <div
              key={et.name}
                className={`group relative p-5 rounded-2xl border backdrop-blur-sm transition-all duration-300 hover:shadow-2xl cursor-pointer transform hover:-translate-y-1 ${isDarkMode
                  ? 'bg-gradient-to-br from-gray-700/80 to-gray-800/80 border-gray-600/50 hover:border-orange-500/50'
                  : 'bg-gradient-to-br from-white/90 to-gray-50/90 border-gray-200/50 hover:border-orange-300/50'
                  }`}>
                {/* Background Pattern */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
                  <div className={`absolute top-0 right-0 w-20 h-20 rounded-full blur-xl opacity-20 ${isDarkMode ? 'bg-orange-500' : 'bg-orange-300'}`}></div>
                  </div>

                <div className="relative z-10">
                  {/* Header Section */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-orange-900/30' : 'bg-orange-100'
                        } group-hover:scale-110 transition-transform duration-300`}>
                        <Users className="h-4 w-4 text-orange-500" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg group-hover:text-orange-600 transition-colors duration-300">
                    {et.name}
                  </h4>
                        {/* Team Member Info */}
                        {(et.name === 'JSG29' || et.name === 'CM29' || et.name === '29MC' || et.name === '24MC' || et.name === 'JSG24' || et.name === 'P24' || et.name === 'JSG26' || et.name === 'CM26' || et.name === 'JSG30PM' || et.name === 'CM30' || et.name === 'JSG20' || et.name === 'CM20' || et.name === 'JSG32' || et.name === 'JSG38' || et.name === 'JSG36' || et.name === 'CM32' || et.name === 'C18' || et.name === 'JSG34' || et.name === '34MC' || et.name === 'JSG36' || et.name === '22MB' || et.name === '22mb' || et.name === 'JSG22' || et.name === 'JSG18' || et.name === 'C22' || et.name === 'JSG21' || et.name === '21MC' || et.name === '21NC' || et.name === 'G22C' || et.name === 'C36' || et.name === 'JSG40' || et.name === 'JSG41') && (
                          <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {et.name === '21MC' && 'S1 ADITYA G.'}
                          {et.name === '22MB' && 'S10 KESHAV T.'}
                          {et.name === '22mb' && 'S10 KESHAV T.'}
                          {et.name === '24MC' && 'S1 ABHAY S.'}
                          {et.name === 'C18' && 'S10 ADITYA S.'}
                          {et.name === 'C22' && 'S10 KAIF'}
                          {et.name === 'G22C' && 'S10 KAIF K.'}
                          {et.name === 'JSG18' && 'S10 ADITYA S.'}
                          {et.name === 'JSG20' && 'S11 HARSH G.'}
                          {et.name === 'CM20' && 'S11 HARSH G.'}
                          {et.name === 'JSG21' && 'S1 ADITYA G.'}
                          {et.name === '21NC' && 'S1 ADITYA G.'}
                          {et.name === 'JSG22' && 'S10 KAIF K.'}
                          {et.name === 'JSG24' && 'S1 ABHAY S.'}
                          {et.name === 'P24' && 'S1 ABHAY S.'}
                          {et.name === 'JSG26' && 'S7 NIKHIL T.'}
                          {et.name === 'CM26' && 'S7 NIKHIL T.'}
                          {et.name === 'JSG29' && 'S7 KESHAV T.'}
                          {et.name === 'CM29' && 'S7 KESHAV T.'}
                          {et.name === '29MC' && 'S7 KESHAV T.'}
                          {et.name === 'JSG30PM' && 'S7 ADITYA S.'}
                          {et.name === 'JSG36' && 'S6 NIKHIL T.'}
                          {et.name === 'JSG38' && 'S12 KAIF K.'}
                          {et.name === 'CM30' && 'S7 ADITYA S.'}
                          {et.name === 'JSG32' && 'S11 KAIF K.'}
                          {et.name === 'C36' && 'S6 NIKHIL T.'}
                          {et.name === '34MC' && 'S4 SATYAM S.'}
                          {et.name === 'CM32' && 'S11 KAIF K.'}
                          {et.name === 'JSG34' && 'S4 SATYAM S.'}
                          {et.name === 'JSG40' && 'S12 KESHAV T.'}
                          {et.name === 'JSG41' && 'S1 ADITYA G.'}
                          </p>
                        )}
                        </div>
                      </div>
                    {/* Status Badge */}
                    {(et.name === '24MC' || et.name === 'C18' || et.name === '22MB' || et.name === '22mb' || et.name === 'C22' || et.name === '21MC' || et.name === 'G22C' || et.name === '21NC' || et.name === '34MC') && (
                      <div className={`px-2 py-1 rounded-lg text-xs font-semibold ${isDarkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700'}`}>
                          {et.name === '24MC' && 'COM'}
                          {et.name === 'C18' && 'COM'}
                          {et.name === '22MB' && 'N-C'}
                          {et.name === '22mb' && 'N-C'}
                          {et.name === 'C22' && 'COM'}
                          {et.name === '21MC' && 'COM'}
                          {et.name === 'G22C' && 'COM'}
                          {et.name === '34MC' && 'COM'}
                          {et.name === '21NC' && 'N-C'}
                      </div>
                    )}
              </div>

                  {/* Revenue Section */}
                  <div className="mb-6">
                    <div className="flex items-baseline space-x-2 mb-2">
                      <p className="text-2xl font-bold text-orange-500">
                        ${et.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Total Revenue
                </p>
              </div>

                  {/* Metrics Section */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`flex items-center px-2 py-1 rounded-lg ${isDarkMode ? 'bg-red-900/20' : 'bg-red-100/50'}`}>
                        <Layers className="h-3 w-3 mr-1 text-red-500" />
                        <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {et.creatives.length}
                    </span>
                  </div>
                      <div className={`flex items-center px-2 py-1 rounded-lg ${isDarkMode ? 'bg-blue-900/20' : 'bg-blue-100/50'}`}>
                        <Target className="h-3 w-3 mr-1 text-blue-500" />
                        <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {et.campaigns.length}
                    </span>
                  </div>
                </div>
              </div>
                  {/* Toggle Button */}
              <button
                onClick={() => toggleET(et.name)}
                    className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-300 ${isDarkMode
                      ? 'bg-orange-900/20 text-orange-300 hover:bg-orange-900/30 border border-orange-700/50'
                      : 'bg-orange-100/50 text-orange-700 hover:bg-orange-200/50 border border-orange-200/50'
                      }`}
              >
                {expandedETs.has(et.name) ? (
                  <>
                        <ChevronUp className="w-3 h-3" />
                        Hide Details
                  </>
                ) : (
                  <>
                        <ChevronDown className="w-3 h-3" />
                        View Details
                  </>
                )}
              </button>

              {/* Advertiser Breakdown with Transition */}
              <div
                className={`overflow-hidden transition-all duration-300 rounded-xl text-sm font-medium 
                  ${isDarkMode ? 'bg-gray-800/50 text-gray-300' : 'bg-orange-50/50 text-gray-600'}
                  ${expandedETs.has(et.name) ? 'max-h-96 p-4 opacity-100 mt-4' : 'max-h-0 p-0 opacity-0'}`}>
                    <ul className="space-y-2">
                  {et.advertisersArray?.map(ad => (
                    <li
                      key={ad.name}
                          className="flex justify-between items-center p-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-600"
                    >
                      <span className="font-medium">{ad.name}</span>
                      <span
                            className={`text-sm font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'
                          }`}
                      >
                        ${ad.revenue.toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
                  </div>
              </div>
            </div>
          ))}
          </div>
        </div>
      </div>

      {/* Campaign Revenue Breakdown */}
        <div className={`relative p-8 rounded-3xl border backdrop-blur-sm transition-all duration-300 ${isDarkMode
          ? 'bg-gradient-to-br from-gray-800/80 to-gray-900/80 border-gray-700/50 shadow-2xl shadow-gray-900/20'
          : 'bg-gradient-to-br from-white/90 to-gray-50/90 border-gray-200/50 shadow-2xl shadow-gray-900/10'
          }`}>
          {/* Background Pattern */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl">
            <div className={`absolute top-0 left-0 w-40 h-40 rounded-full blur-2xl opacity-20 ${isDarkMode ? 'bg-blue-500' : 'bg-blue-300'}`}></div>
            <div className={`absolute bottom-0 right-0 w-32 h-32 rounded-full blur-2xl opacity-20 ${isDarkMode ? 'bg-green-500' : 'bg-green-300'}`}></div>
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
                <div className={`p-3 rounded-2xl mr-4 ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                  <Target className="h-6 w-6 text-blue-500" />
          </div>
                <div>
                  <h3 className="text-2xl font-bold">Campaign-Wise Revenue</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Click any campaign for detailed performance analysis
                  </p>
                </div>
              </div>
              <div className={`text-sm px-4 py-2 rounded-xl backdrop-blur-sm border ${isDarkMode
                ? 'bg-blue-900/20 text-blue-300 border-blue-700/50'
                : 'bg-blue-100/80 text-blue-700 border-blue-200/50'
            }`}>
            Click any campaign for detailed view
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {analytics.campaignStats.slice(0, 12).map((campaign, index) => (
            <div
              key={campaign.name}
              onClick={() => openCampaignPopup(campaign)}
                  className={`group relative p-6 rounded-2xl border backdrop-blur-sm transition-all duration-300 hover:shadow-2xl cursor-pointer transform hover:-translate-y-1 ${isDarkMode
                    ? 'bg-gradient-to-br from-gray-700/80 to-gray-800/80 border-gray-600/50 hover:border-blue-500/50'
                    : 'bg-gradient-to-br from-white/90 to-gray-50/90 border-gray-200/50 hover:border-blue-300/50'
                    }`}
                >
                  {/* Background Pattern */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
                    <div className={`absolute top-0 right-0 w-20 h-20 rounded-full blur-xl opacity-20 ${isDarkMode ? 'bg-blue-500' : 'bg-blue-300'}`}></div>
                  </div>

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                        <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'
                          } group-hover:scale-110 transition-transform duration-300`}>
                    <Target className="h-5 w-5 text-blue-500" />
                  </div>
                        <h4 className="font-bold text-xl ml-3 group-hover:text-blue-600 transition-colors duration-300">
                    {campaign.name}
                  </h4>
                </div>
                      <Eye className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-300" />
              </div>

                    <div className="mb-6">
                      <p className="text-3xl font-bold text-green-500 mb-2">
                  ${campaign.revenue.toLocaleString()}
                </p>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Total Revenue
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                        <div className={`flex items-center px-3 py-1 rounded-xl ${isDarkMode ? 'bg-red-900/20' : 'bg-red-100/50'}`}>
                    <Layers className="h-4 w-4 mr-1 text-red-500" />
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {campaign.creatives.length}
                    </span>
                  </div>
                        <div className={`flex items-center px-3 py-1 rounded-xl ${isDarkMode ? 'bg-orange-900/20' : 'bg-orange-100/50'}`}>
                    <Users className="h-4 w-4 mr-1 text-orange-500" />
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {campaign.ets.length}
                    </span>
                  </div>
                </div>
                      <div className={`text-xs px-3 py-2 rounded-xl font-semibold transition-all duration-300 ${isDarkMode
                        ? 'bg-gray-600/50 text-gray-300 group-hover:bg-blue-500 group-hover:text-white'
                        : 'bg-gray-200/50 text-gray-600 group-hover:bg-blue-500 group-hover:text-white'
                        }`}>
                  View Details
                      </div>
                </div>
              </div>
            </div>
          ))}
            </div>
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
                <Users className="h-6 w-6 mr-3 text-orange-500" />
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
                            <Target className="h-5 w-5 text-orange-600" />
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
                              <Users className="h-4 w-4 text-orange-600" />
                              <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Active Creatives ({etData.creatives.length}):
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {etData.creatives.slice(0, 6).map((creative, idx) => (
                                <span
                                  key={idx}
                                  className={`px-3 py-1 rounded-full text-xs font-medium ${isDarkMode
                                    ? 'bg-orange-900/30 text-orange-300 border border-orange-800'
                                    : 'bg-orange-100 text-orange-800 border border-orange-200'
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
              <Users className="h-5 w-5 mr-2 text-orange-500" />
              <h3 className="text-xl font-bold">ET Analysis</h3>
            </div>
            {selectedET && (
              <button
                onClick={exportETCreatives}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${isDarkMode ? 'bg-orange-600 hover:bg-orange-700' : 'bg-orange-600 hover:bg-orange-700'
                  } text-white`}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Creatives
              </button>
            )}
          </div>

          <div className={`p-4 rounded-lg mb-4 ${isDarkMode ? 'bg-orange-900/20 border border-orange-800' : 'bg-orange-50 border border-orange-200'
            }`}>
            <div className="flex items-center mb-2">
              <Search className="h-5 w-5 mr-2 text-orange-500" />
              <label className="block text-sm font-medium text-orange-600">Select ET for Detailed Analysis</label>
            </div>
            <p className={`text-xs ${isDarkMode ? 'text-orange-300' : 'text-orange-600'}`}>
              Choose an ET to view campaign-wise performance and export creative data
            </p>
          </div>

          <select
            value={selectedET}
            onChange={(e) => setSelectedET(e.target.value)}
            className={`w-full p-4 rounded-lg border text-lg font-medium ${isDarkMode
              ? 'bg-gray-700 border-gray-600 text-white focus:border-orange-500'
              : 'bg-white border-gray-300 text-gray-900 focus:border-orange-500'
              } focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-colors`}
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className={`max-w-6xl w-full max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl ${isDarkMode
              ? 'bg-gradient-to-br from-gray-800/95 to-gray-900/95 border border-gray-700/50'
              : 'bg-gradient-to-br from-white/95 to-gray-50/95 border border-gray-200/50'
              } backdrop-blur-xl`}>
            {/* Popup Header */}
              <div className={`sticky top-0 p-8 border-b backdrop-blur-xl ${isDarkMode
                ? 'bg-gradient-to-r from-gray-800/95 to-gray-900/95 border-gray-700/50'
                : 'bg-gradient-to-r from-white/95 to-gray-50/95 border-gray-200/50'
              } z-10`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <div className={`p-4 rounded-2xl mr-4 ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'
                    }`}>
                      <Target className="h-10 w-10 text-blue-500" />
                  </div>
                    <div>
                      <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {campaignPopup.campaign.name}
                      </h2>
                      <p className={`text-lg font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Campaign Details & Performance Analytics
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeCampaignPopup}
                    className={`p-3 rounded-2xl transition-all duration-300 ${isDarkMode
                      ? 'hover:bg-gray-700/50 text-gray-400 hover:text-white hover:shadow-lg'
                      : 'hover:bg-gray-100/50 text-gray-500 hover:text-gray-700 hover:shadow-lg'
                    }`}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Popup Content */}
              <div className="p-8">
              {/* Campaign Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                  <div className={`group relative p-8 rounded-3xl border backdrop-blur-sm transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-1 ${isDarkMode
                    ? 'bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-700/50'
                    : 'bg-gradient-to-br from-green-50/90 to-emerald-50/90 border-green-200/50'
                    }`}>
                    {/* Background Pattern */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl">
                      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-30 ${isDarkMode ? 'bg-green-500' : 'bg-green-300'}`}></div>
                  </div>
                    <div className="relative z-10">
                      <div className="flex items-center mb-4">
                        <div className={`p-3 rounded-2xl mr-3 ${isDarkMode ? 'bg-green-900/30' : 'bg-green-100'}`}>
                          <DollarSign className="h-8 w-8 text-green-500" />
                        </div>
                        <h3 className="text-xl font-bold text-green-600">Total Revenue</h3>
                      </div>
                      <p className="text-4xl font-bold text-green-500">
                    ${campaignPopup.campaign.revenue.toLocaleString()}
                  </p>
                    </div>
                </div>

                  <div className={`group relative p-8 rounded-3xl border backdrop-blur-sm transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-1 ${isDarkMode
                    ? 'bg-gradient-to-br from-red-900/30 to-rose-900/30 border-red-700/50'
                    : 'bg-gradient-to-br from-red-50/90 to-rose-50/90 border-red-200/50'
                    }`}>
                    {/* Background Pattern */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl">
                      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-30 ${isDarkMode ? 'bg-red-500' : 'bg-red-300'}`}></div>
                  </div>
                    <div className="relative z-10">
                      <div className="flex items-center mb-4">
                        <div className={`p-3 rounded-2xl mr-3 ${isDarkMode ? 'bg-red-900/30' : 'bg-red-100'}`}>
                          <Layers className="h-8 w-8 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-red-600">Total Creatives</h3>
                      </div>
                      <p className="text-4xl font-bold text-red-500">
                    {campaignPopup.campaign.creatives.length}
                  </p>
                    </div>
                </div>

                  <div className={`group relative p-8 rounded-3xl border backdrop-blur-sm transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-1 ${isDarkMode
                    ? 'bg-gradient-to-br from-orange-900/30 to-amber-900/30 border-orange-700/50'
                    : 'bg-gradient-to-br from-orange-50/90 to-amber-50/90 border-orange-200/50'
                    }`}>
                    {/* Background Pattern */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl">
                      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-30 ${isDarkMode ? 'bg-orange-500' : 'bg-orange-300'}`}></div>
                  </div>
                    <div className="relative z-10">
                      <div className="flex items-center mb-4">
                        <div className={`p-3 rounded-2xl mr-3 ${isDarkMode ? 'bg-orange-900/30' : 'bg-orange-100'}`}>
                          <Users className="h-8 w-8 text-orange-500" />
                        </div>
                        <h3 className="text-xl font-bold text-orange-600">Total ETs</h3>
                      </div>
                      <p className="text-4xl font-bold text-orange-500">
                    {campaignPopup.campaign.ets.length}
                  </p>
                    </div>
                </div>
              </div>

              {/* Top Performer */}
              {campaignPopup.campaign.creatives.length > 0 && (
                  <div className={`mb-10 p-8 rounded-3xl border backdrop-blur-sm ${isDarkMode
                    ? 'bg-gradient-to-r from-yellow-900/30 to-amber-900/30 border-yellow-700/50'
                    : 'bg-gradient-to-r from-yellow-50/90 to-amber-50/90 border-yellow-200/50'
                    }`}>
                    {/* Background Pattern */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl">
                      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl opacity-30 ${isDarkMode ? 'bg-yellow-500' : 'bg-yellow-300'}`}></div>
                  </div>

                    <div className="relative z-10">
                      <div className="flex items-center mb-6">
                        <div className={`p-3 rounded-2xl mr-4 ${isDarkMode ? 'bg-yellow-900/30' : 'bg-yellow-100'}`}>
                          <Award className="h-8 w-8 text-yellow-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-yellow-600">🏆 Top Performing Creative</h3>
                      </div>
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                        <div className="mb-6 lg:mb-0">
                          <p className="text-3xl font-bold mb-4">{campaignPopup.campaign.creatives[0].name}</p>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-8 space-y-4 sm:space-y-0">
                            <div className={`flex items-center px-4 py-2 rounded-xl ${isDarkMode ? 'bg-green-900/20' : 'bg-green-100/50'}`}>
                              <DollarSign className="h-6 w-6 text-green-500 mr-2" />
                              <span className="text-2xl font-bold text-green-500">
                            ${campaignPopup.campaign.creatives[0].revenue.toLocaleString()}
                          </span>
                        </div>
                            <div className={`flex items-center px-4 py-2 rounded-xl ${isDarkMode ? 'bg-blue-900/20' : 'bg-blue-100/50'}`}>
                              <Hash className="h-6 w-6 text-blue-500 mr-2" />
                              <span className="text-xl font-semibold text-blue-500">
                            {campaignPopup.campaign.creatives[0].frequency} occurrences
                          </span>
                        </div>
                      </div>
                    </div>
                        <div>
                          <p className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Active in ETs:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {campaignPopup.campaign.creatives[0].ets.map(et => (
                              <span key={et} className={`px-3 py-2 rounded-xl text-sm font-medium ${isDarkMode
                                ? 'bg-gray-700/50 text-gray-300 border border-gray-600/50'
                                : 'bg-gray-200/50 text-gray-700 border border-gray-300/50'
                            }`}>
                            {et}
                          </span>
                        ))}
                          </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* All Creatives */}
              <div>
                  <div className="flex items-center mb-8">
                    <div className={`p-3 rounded-2xl mr-4 ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                      <Layers className="h-6 w-6 text-blue-500" />
                    </div>
                  <h3 className="text-2xl font-bold">All Creatives Performance</h3>
                </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {campaignPopup.campaign.creatives.map((creative, index) => (
                    <div
                      key={creative.name}
                        className={`group relative p-6 rounded-2xl border backdrop-blur-sm transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-1 ${isDarkMode
                          ? 'bg-gradient-to-br from-gray-700/80 to-gray-800/80 border-gray-600/50'
                          : 'bg-gradient-to-br from-white/90 to-gray-50/90 border-gray-200/50'
                          }`}
                      >
                        {/* Background Pattern */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
                          <div className={`absolute top-0 right-0 w-16 h-16 rounded-full blur-xl opacity-20 ${isDarkMode ? 'bg-blue-500' : 'bg-blue-300'}`}></div>
                        </div>

                        <div className="relative z-10">
                          <div className="flex items-start justify-between mb-6">
                        <div className="flex-1">
                              <div className="flex items-center mb-3">
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold mr-4 ${index === 0 ? 'bg-yellow-500 text-white' :
                              index === 1 ? 'bg-gray-400 text-white' :
                                index === 2 ? 'bg-amber-600 text-white' :
                                  isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-300 text-gray-700'
                              }`}>
                              {index + 1}
                            </div>
                                <h4 className="font-bold text-xl">{creative.name}</h4>
                          </div>
                        </div>
                      </div>

                          <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'
                          }`}>
                              <div className="flex items-center mb-2">
                                <DollarSign className="h-5 w-5 text-green-500 mr-2" />
                            <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              Revenue
                            </span>
                          </div>
                              <p className="text-2xl font-bold text-green-500">
                            ${creative.revenue.toLocaleString()}
                          </p>
                        </div>

                            <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'
                          }`}>
                              <div className="flex items-center mb-2">
                                <Hash className="h-5 w-5 text-blue-500 mr-2" />
                            <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              Frequency
                            </span>
                          </div>
                              <p className="text-2xl font-bold text-blue-500">
                            {creative.frequency}
                          </p>
                        </div>
                      </div>

                      <div>
                            <div className="flex items-center mb-3">
                              <Users className="h-5 w-5 text-orange-500 mr-2" />
                          <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            Active in ETs ({creative.ets.length}):
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {creative.ets.map(et => (
                                <span key={et} className={`px-3 py-2 rounded-xl text-sm font-medium ${isDarkMode
                                  ? 'bg-orange-900/30 text-orange-300 border border-orange-800/50'
                                  : 'bg-orange-100/50 text-orange-700 border border-orange-200/50'
                              }`}>
                              {et}
                            </span>
                          ))}
                            </div>
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
