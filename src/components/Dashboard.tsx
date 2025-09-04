import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, FileText, TrendingUp, Users, Target, DollarSign, RefreshCw, Building2, Zap, Globe, Wifi, Award, BarChart3, Search, X, Star, Activity, Layers, Eye, Hash, Calendar } from 'lucide-react';
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

const Dashboard: React.FC<DashboardProps> = ({ data, uploadedFiles, isDarkMode, searchQuery, onSearchChange, onReset }) => {
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [selectedET, setSelectedET] = useState('');
  const [campaignPopup, setCampaignPopup] = useState<{
    isOpen: boolean;
    campaign: CampaignStats | null;
  }>({ isOpen: false, campaign: null });

  const analytics = useMemo(() => {
    const totalRevenue = data.records.reduce((sum, record) => sum + record.revenue, 0);

    // Advertiser stats
    const advertiserStats = new Map<string, AdvertiserStats>();

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
          campaigns: []
        });
      }
      const et = etStats.get(record.et)!;
      et.revenue += record.revenue;
      if (!et.campaigns.includes(record.campaign)) {
        et.campaigns.push(record.campaign);
      }

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
    });

    return {
      totalRevenue,
      advertiserStats: Array.from(advertiserStats.values()).sort((a, b) => b.revenue - a.revenue),
      campaignStats: Array.from(campaignStats.values()).sort((a, b) => b.revenue - a.revenue),
      etStats: Array.from(etStats.values()).sort((a, b) => b.revenue - a.revenue)
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
            <h3 className="text-xl font-bold">
              Search Results for "{searchQuery}" ({searchResults.length} creative{searchResults.length > 1 ? 's' : ''} found)
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

                  <div className="flex justify-between items-center">
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Frequency:
                    </span>
                    <span className="font-semibold text-blue-500">
                      {result.frequency}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
                    <div className="mb-2">
                      <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Campaigns ({result.campaigns.size}):
                      </span>
                      <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {Array.from(result.campaigns).join(', ')}
                      </p>
                    </div>

                    <div className="mb-2">
                      <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        ETs ({result.ets.size}):
                      </span>
                      <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {Array.from(result.ets).join(', ')}
                      </p>
                    </div>

                    <div>
                      <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            <Activity className="h-8 w-8 text-orange-500" />
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
                  {advertiser.name === 'ES' && <Globe className="h-4 w-4 mr-2 text-green-500" />}
                  {advertiser.name === 'Comcast' && <Wifi className="h-4 w-4 mr-2 text-red-500" />}
                  {advertiser.name === 'RGR' && <Target className="h-4 w-4 mr-2 text-red-500" />}
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
                    <Users className="h-4 w-4 mr-1 text-orange-500" />
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
      {/* ET Revenue Breakdown */}
      <div className={`p-6 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Users className="h-6 w-6 mr-3 text-orange-500" />
            <h3 className="text-xl font-bold">ET-Wise Revenue</h3>
          </div>
          <div className={`text-sm px-3 py-1 rounded-full ${isDarkMode ? 'bg-orange-900/30 text-orange-300' : 'bg-orange-100 text-orange-700'
            }`}>
            Top performing ETs by revenue
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {analytics.etStats.slice(0, 50).map((et, index) => (
            <div
              key={et.name}
              className={`p-4 rounded-xl border transition-all duration-300 hover:shadow-xl cursor-pointer transform hover:scale-105 ${isDarkMode
                ? 'bg-gradient-to-br from-gray-700 to-gray-800 border-gray-600 hover:from-gray-600 hover:to-gray-700 hover:border-orange-500'
                : 'bg-gradient-to-br from-white to-gray-50 border-gray-200 hover:from-orange-50 hover:to-white hover:border-orange-300'
                } group`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-orange-900/30' : 'bg-orange-100'
                    } group-hover:scale-110 transition-transform duration-200`}>
                    <Users className="h-5 w-5 text-orange-500" />
                  </div>
                  <h4 className="font-bold text-lg ml-3 group-hover:text-orange-600 transition-colors">
                    {et.name}
                  </h4>
                  {/* Stack and Team Member Info */}
                  {(et.name === 'JSG29'
                    || et.name === 'CM29'
                    || et.name === '24MC'
                    || et.name === 'JSG24'
                    || et.name === 'JSG26'
                    || et.name === 'CM26'
                    || et.name === 'JSG30PM'
                    || et.name === 'CM30'
                    || et.name === 'JSG20'
                    || et.name === 'CM20'
                    || et.name === 'JSG32'
                    || et.name === 'CM32'
                    || et.name === 'C18'
                    || et.name === 'JSG34'
                    || et.name === '22MB'
                    || et.name === '22mb'
                    || et.name === 'JSG22'
                    || et.name === 'JSG18'
                    || et.name === 'C22'
                    || et.name === 'JSG21'
                    || et.name === '21MC'
                    || et.name === 'G22C'
                  )
                    &&
                    (
                      <div className={`mx-3 text-[12px] text-orange-500 p-1 rounded-lg ${isDarkMode ? 'bg-orange-900/30' : 'bg-orange-100'
                        }`}>
                        <div className="font-bold">
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
                          {et.name === 'JSG22' && 'S10 KAIF K.'}
                          {et.name === 'JSG24' && 'S1 ABHAY S.'}
                          {et.name === 'JSG26' && 'S7 NIKHIL T.'}
                          {et.name === 'CM26' && 'S7 NIKHIL T.'}
                          {et.name === 'JSG29' && 'S7 KESHAV T.'}
                          {et.name === 'CM29' && 'S7 KESHAV T.'}
                          {et.name === 'JSG30PM' && 'S7 ADITYA S.'}
                          {et.name === 'CM30' && 'S7 ADITYA S.'}
                          {et.name === 'JSG32' && 'S11 KAIF K.'}
                          {et.name === 'CM32' && 'S11 KAIF K.'}
                          {et.name === 'JSG34' && 'S4 SATYAM S.'}
                        </div>
                      </div>
                    )}
                  {/* Stack and Team Member Info */}
                  {(
                    et.name === '24MC'
                    || et.name === 'C18'
                    || et.name === '22MB'
                    || et.name === '22mb'
                    || et.name === 'C22'
                    || et.name === '21MC'
                    || et.name === 'G22C'
                  )
                    &&
                    (
                      <div className={`mx-0 text-[10px] text-gray-600 p-1 rounded-lg ${isDarkMode ? 'bg-green-900/30 text-gray-100' : 'bg-green-300'
                        }`}>
                        <div className="font-bold">
                          {et.name === '24MC' && 'COM'}
                          {et.name === 'C18' && 'COM'}
                          {et.name === '22MB' && 'N-C'}
                          {et.name === '22mb' && 'N-C'}
                          {et.name === 'C22' && 'COM'}
                          {et.name === '21MC' && 'COM'}
                          {et.name === 'G22C' && 'COM'}

                        </div>
                      </div>
                    )}
                </div>
              </div>

              {/* Stack and Team Member Info
              {(et.name === 'JSG29' || et.name === 'JSG26' || et.name === 'JSG30PM') && (
                <div className={`mb-3 p-2 rounded-md text-xs ${isDarkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700'
                  }`}>
                  <div className="font-medium">
                    {et.name === 'JSG29' && 'S7 KESHAV'}
                    {et.name === 'JSG26' && 'S7 NIKHIL'}
                    {et.name === 'JSG30PM' && 'S7 ADITYA S.'}
                  </div>
                </div>
              )} */}

              <div className="mb-4">
                <p className="text-2xl font-bold text-orange-500 mb-1">
                  ${et.revenue.toLocaleString()}
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

      {/* Revenue Chart */}
      {!selectedCampaign && !selectedET && (
        <div className={`p-6 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
          <div className="flex items-center mb-6">
            <BarChart3 className="h-6 w-6 mr-3 text-blue-500" />
            <h3 className="text-xl font-bold">Revenue by Campaign</h3>
          </div>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.campaignStats.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#E5E7EB'} />
                <XAxis
                  dataKey="name"
                  stroke={isDarkMode ? '#9CA3AF' : '#6B7280'}
                  fontSize={12}
                />
                <YAxis
                  stroke={isDarkMode ? '#9CA3AF' : '#6B7280'}
                  fontSize={12}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
                    border: `1px solid ${isDarkMode ? '#374151' : '#E5E7EB'}`,
                    borderRadius: '8px',
                    color: isDarkMode ? '#FFFFFF' : '#000000'
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

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

                <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gradient-to-br from-orange-900/20 to-orange-800/10 border-orange-800' : 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200'
                  }`}>
                  <div className="flex items-center mb-3">
                    <Users className="h-6 w-6 text-orange-500 mr-2" />
                    <h3 className="font-semibold text-orange-600">Total ETs</h3>
                  </div>
                  <p className="text-3xl font-bold text-orange-500">
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
                          <Users className="h-4 w-4 text-orange-500 mr-2" />
                          <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            Active in ETs ({creative.ets.length}):
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {creative.ets.map(et => (
                            <span key={et} className={`px-2 py-1 rounded-md text-xs font-medium ${isDarkMode ? 'bg-orange-900/30 text-orange-300 border border-orange-800' : 'bg-orange-100 text-orange-700 border border-orange-200'
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
