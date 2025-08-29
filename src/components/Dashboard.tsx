import React, { useState, useMemo } from 'react';
import { BarChart3, PieChart, Download, FileText, Search, TrendingUp, Users, Target, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell } from 'recharts';
import { ProcessedData, DataRecord, CampaignStats, ETStats, CreativeStats, AdvertiserStats } from '../types';

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

// ET Stack and Team Member mapping
const etStackInfo: Record<string, { stack: string; member: string; advertiser?: string }> = {
  'JSG 29': { stack: 'STACK 7', member: 'KESHAV' },
  'JSG 24 MC': { stack: 'STACK 1', member: 'ABHAY', advertiser: 'COMCAST' },
  'JSG 26': { stack: 'STACK 7', member: 'NIKHIL' },
  'JSG 30PM': { stack: 'STACK 7', member: 'ADITYA SRIVASTAVA' },
  'JSG 20': { stack: 'STACK 11', member: 'HARSH' },
  'JSG 32': { stack: 'STACK 11', member: 'KAIF' },
  'C18': { stack: 'STACK 10', member: 'ADITYA SRIVASTAVA', advertiser: 'COMCAST' },
  'JSG 34': { stack: 'STACK 4', member: 'SATYAM' },
  'JSG 22 MB': { stack: 'STACK 10', member: 'KESHAV' },
  'JSG 22': { stack: 'STACK 10', member: 'KAIF' },
  'JSG 18': { stack: 'STACK 10', member: 'ADITYA SRIVASTAVA' },
  'C22': { stack: 'STACK 10', member: 'KAIF', advertiser: 'COMCAST' },
  'JSG 21': { stack: 'STACK 1', member: 'ADITYA GUPTA' },
  'JSG 21 MC': { stack: 'STACK 1', member: 'ADITYA GUPTA', advertiser: 'COMCAST' },
  'G22C': { stack: 'STACK 10', member: 'KAIF KHAN', advertiser: 'COMCAST' }
};

const Dashboard: React.FC<DashboardProps> = ({ 
  data, 
  uploadedFiles, 
  isDarkMode, 
  searchQuery, 
  onSearchChange, 
  onReset 
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'ets' | 'creatives' | 'advertisers'>('overview');

  const totalRevenue = useMemo(() => 
    data.records.reduce((sum, record) => sum + record.revenue, 0), 
    [data.records]
  );

  const campaignStats = useMemo(() => {
    const stats = new Map<string, CampaignStats>();
    
    data.records.forEach(record => {
      if (!stats.has(record.campaign)) {
        stats.set(record.campaign, {
          name: record.campaign,
          revenue: 0,
          creatives: [],
          ets: []
        });
      }
      
      const campaign = stats.get(record.campaign)!;
      campaign.revenue += record.revenue;
      
      if (!campaign.ets.includes(record.et)) {
        campaign.ets.push(record.et);
      }
    });

    return Array.from(stats.values()).sort((a, b) => b.revenue - a.revenue);
  }, [data.records]);

  const etStats = useMemo(() => {
    const stats = new Map<string, ETStats>();
    
    data.records.forEach(record => {
      if (!stats.has(record.et)) {
        stats.set(record.et, {
          name: record.et,
          revenue: 0,
          creatives: [],
          campaigns: []
        });
      }
      
      const et = stats.get(record.et)!;
      et.revenue += record.revenue;
      
      if (!et.campaigns.includes(record.campaign)) {
        et.campaigns.push(record.campaign);
      }
    });

    return Array.from(stats.values()).sort((a, b) => b.revenue - a.revenue);
  }, [data.records]);

  const creativeStats = useMemo(() => {
    const stats = new Map<string, CreativeStats>();
    
    data.records.forEach(record => {
      if (!stats.has(record.creative)) {
        stats.set(record.creative, {
          name: record.creative,
          frequency: 0,
          revenue: 0,
          ets: []
        });
      }
      
      const creative = stats.get(record.creative)!;
      creative.frequency += 1;
      creative.revenue += record.revenue;
      
      if (!creative.ets.includes(record.et)) {
        creative.ets.push(record.et);
      }
    });

    return Array.from(stats.values()).sort((a, b) => b.revenue - a.revenue);
  }, [data.records]);

  const advertiserStats = useMemo(() => {
    const stats = new Map<string, AdvertiserStats>();
    
    data.records.forEach(record => {
      if (!stats.has(record.advertiser)) {
        stats.set(record.advertiser, {
          name: record.advertiser,
          revenue: 0,
          campaigns: []
        });
      }
      
      const advertiser = stats.get(record.advertiser)!;
      advertiser.revenue += record.revenue;
      
      if (!advertiser.campaigns.includes(record.campaign)) {
        advertiser.campaigns.push(record.campaign);
      }
    });

    return Array.from(stats.values()).sort((a, b) => b.revenue - a.revenue);
  }, [data.records]);

  const filteredData = useMemo(() => {
    if (!searchQuery) return data.records;
    
    const query = searchQuery.toLowerCase();
    return data.records.filter(record =>
      record.subid.toLowerCase().includes(query) ||
      record.campaign.toLowerCase().includes(query) ||
      record.creative.toLowerCase().includes(query) ||
      record.et.toLowerCase().includes(query) ||
      record.advertiser.toLowerCase().includes(query)
    );
  }, [data.records, searchQuery]);

  const chartData = useMemo(() => {
    return campaignStats.slice(0, 10).map(campaign => ({
      name: campaign.name,
      revenue: campaign.revenue
    }));
  }, [campaignStats]);

  const pieData = useMemo(() => {
    return advertiserStats.map((advertiser, index) => ({
      name: advertiser.name,
      value: advertiser.revenue,
      color: ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'][index % 6]
    }));
  }, [advertiserStats]);

  const exportToCSV = () => {
    const headers = ['SUBID', 'Revenue', 'Campaign', 'Creative', 'ET', 'Advertiser', 'File'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(record => [
        record.subid,
        record.revenue,
        record.campaign,
        record.creative,
        record.et,
        record.advertiser,
        record.fileName
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'campaign_analysis.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const StatCard = ({ title, value, icon: Icon, color }: { 
    title: string; 
    value: string | number; 
    icon: React.ComponentType<any>; 
    color: string;
  }) => (
    <div className={`p-6 rounded-xl border transition-all duration-200 hover:shadow-lg ${
      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {title}
          </p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">Campaign Analytics Dashboard</h2>
          <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Analyzing {data.records.length} records from {uploadedFiles.length} file{uploadedFiles.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={onReset}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              isDarkMode 
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Upload New Files
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`} />
        <input
          type="text"
          placeholder="Search campaigns, creatives, ETs, or advertisers..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-colors ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
          } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
        />
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          color="bg-green-500"
        />
        <StatCard
          title="Campaigns"
          value={data.campaigns.size}
          icon={Target}
          color="bg-blue-500"
        />
        <StatCard
          title="ETs"
          value={data.ets.size}
          icon={BarChart3}
          color="bg-purple-500"
        />
        <StatCard
          title="Advertisers"
          value={data.advertisers.size}
          icon={Users}
          color="bg-orange-500"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'campaigns', label: 'Campaigns', icon: Target },
          { id: 'ets', label: 'ET-Wise Revenue', icon: TrendingUp },
          { id: 'creatives', label: 'Creatives', icon: FileText },
          { id: 'advertisers', label: 'Advertisers', icon: Users }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Revenue by Campaign Chart */}
          <div className={`p-6 rounded-xl border ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <h3 className="text-xl font-semibold mb-4">Top 10 Campaigns by Revenue</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                <XAxis 
                  dataKey="name" 
                  stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
                  fontSize={12}
                />
                <YAxis 
                  stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                    border: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue by Advertiser Pie Chart */}
          <div className={`p-6 rounded-xl border ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <h3 className="text-xl font-semibold mb-4">Revenue Distribution by Advertiser</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                    border: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'campaigns' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaignStats.map((campaign) => (
            <div
              key={campaign.name}
              className={`p-6 rounded-xl border transition-all duration-200 hover:shadow-lg ${
                isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{campaign.name}</h3>
                <Target className="h-5 w-5 text-blue-500" />
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-green-600">
                  ${campaign.revenue.toLocaleString()}
                </p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {campaign.ets.length} ET{campaign.ets.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'ets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {etStats.map((et) => {
            const stackInfo = etStackInfo[et.name];
            return (
              <div
                key={et.name}
                className={`p-6 rounded-xl border transition-all duration-200 hover:shadow-lg ${
                  isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">{et.name}</h3>
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                </div>
                <div className="space-y-3">
                  <p className="text-2xl font-bold text-green-600">
                    ${et.revenue.toLocaleString()}
                  </p>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {et.campaigns.length} Campaign{et.campaigns.length > 1 ? 's' : ''}
                  </p>
                  
                  {/* Stack and Team Member Info */}
                  {stackInfo && (
                    <div className={`mt-4 p-3 rounded-lg border-l-4 border-blue-500 ${
                      isDarkMode ? 'bg-gray-700/50' : 'bg-blue-50'
                    }`}>
                      <div className="space-y-1">
                        <p className={`text-sm font-medium ${
                          isDarkMode ? 'text-blue-400' : 'text-blue-700'
                        }`}>
                          {stackInfo.stack}
                        </p>
                        <p className={`text-sm ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {stackInfo.member}
                        </p>
                        {stackInfo.advertiser && (
                          <p className={`text-xs ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {stackInfo.advertiser}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'creatives' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {creativeStats.map((creative) => (
            <div
              key={creative.name}
              className={`p-6 rounded-xl border transition-all duration-200 hover:shadow-lg ${
                isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold truncate">{creative.name}</h3>
                <FileText className="h-5 w-5 text-orange-500" />
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-green-600">
                  ${creative.revenue.toLocaleString()}
                </p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {creative.frequency} record{creative.frequency > 1 ? 's' : ''} • {creative.ets.length} ET{creative.ets.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'advertisers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {advertiserStats.map((advertiser) => (
            <div
              key={advertiser.name}
              className={`p-6 rounded-xl border transition-all duration-200 hover:shadow-lg ${
                isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{advertiser.name}</h3>
                <Users className="h-5 w-5 text-indigo-500" />
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-green-600">
                  ${advertiser.revenue.toLocaleString()}
                </p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {advertiser.campaigns.length} Campaign{advertiser.campaigns.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* File Summary */}
      <div className={`p-6 rounded-xl border ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <h3 className="text-xl font-semibold mb-4">Uploaded Files Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {uploadedFiles.map((file, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center mb-2">
                <FileText className="h-4 w-4 mr-2 text-blue-500" />
                <span className="font-medium text-sm">{file.name}</span>
              </div>
              <div className="space-y-1 text-xs">
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                  {file.data.records.length} records
                </p>
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                  Revenue: ${file.data.records.reduce((sum, r) => sum + r.revenue, 0).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;