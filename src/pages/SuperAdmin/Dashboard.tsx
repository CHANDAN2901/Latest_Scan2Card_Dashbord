import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { adminAPI, type SingleTrendData, type DashboardStats } from '../../api/admin.api';
import { Button } from '@/components/ui/button';

const SuperAdminDashboard = () => {
  // Stats state
  const [stats, setStats] = useState<DashboardStats | null>(null);
  
  // Separate states for each trend
  const [eventsData, setEventsData] = useState<SingleTrendData[]>([]);
  const [leadsData, setLeadsData] = useState<SingleTrendData[]>([]);
  const [keysData, setKeysData] = useState<SingleTrendData[]>([]);
  
  const [eventsPeriod, setEventsPeriod] = useState<number>(7);
  const [leadsPeriod, setLeadsPeriod] = useState<number>(7);
  const [keysPeriod, setKeysPeriod] = useState<number>(7);
  
  const [eventsLoading, setEventsLoading] = useState(true);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [keysLoading, setKeysLoading] = useState(true);
  
  const [error, setError] = useState('');

  const periodOptions = [
    { label: '7 Days', value: 7 },
    { label: '30 Days', value: 30 },
    { label: '90 Days', value: 90 },
    { label: '1 Year', value: 365 },
  ];

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await adminAPI.getDashboardStats();
        setStats(response.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard stats');
      }
    };
    fetchStats();
  }, []);

  // Fetch events trend
  useEffect(() => {
    const fetchEventsTrend = async () => {
      try {
        setEventsLoading(true);
        const response = await adminAPI.getEventsTrend(eventsPeriod);
        setEventsData(response.data.trends);
      } catch (err: any) {
        setError(err.message || 'Failed to load events trend');
      } finally {
        setEventsLoading(false);
      }
    };
    fetchEventsTrend();
  }, [eventsPeriod]);

  // Fetch leads trend
  useEffect(() => {
    const fetchLeadsTrend = async () => {
      try {
        setLeadsLoading(true);
        const response = await adminAPI.getLeadsTrend(leadsPeriod);
        setLeadsData(response.data.trends);
      } catch (err: any) {
        setError(err.message || 'Failed to load leads trend');
      } finally {
        setLeadsLoading(false);
      }
    };
    fetchLeadsTrend();
  }, [leadsPeriod]);

  // Fetch license keys trend
  useEffect(() => {
    const fetchKeysTrend = async () => {
      try {
        setKeysLoading(true);
        const response = await adminAPI.getLicenseKeysTrend(keysPeriod);
        setKeysData(response.data.trends);
      } catch (err: any) {
        setError(err.message || 'Failed to load license keys trend');
      } finally {
        setKeysLoading(false);
      }
    };
    fetchKeysTrend();
  }, [keysPeriod]);

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage exhibitors and monitor system activity</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Exhibitors</CardTitle>
              <div className="bg-[#854AE6]/10 p-2 rounded-lg">
                <svg className="w-4 h-4 text-[#854AE6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalExhibitors || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Active exhibitor accounts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Events</CardTitle>
              <div className="bg-[#854AE6]/10 p-2 rounded-lg">
                <svg className="w-4 h-4 text-[#854AE6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activeEvents || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Currently running events</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <div className="bg-[#854AE6]/10 p-2 rounded-lg">
                <svg className="w-4 h-4 text-[#854AE6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalLeads?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Leads captured</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <div className="bg-[#854AE6]/10 p-2 rounded-lg">
                <svg className="w-4 h-4 text-[#854AE6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activeUsers || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Active system users</p>
            </CardContent>
          </Card>
        </div>

        {/* Trends Charts - One per row with individual filters */}
        <div className="space-y-6">
          {/* Events Trend Chart */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-lg">Events Created</CardTitle>
                <CardDescription>Last {eventsPeriod} days</CardDescription>
              </div>
              <div className="flex gap-1 bg-gray-50 rounded-lg p-1">
                {periodOptions.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEventsPeriod(option.value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      eventsPeriod === option.value
                        ? 'bg-[#854AE6] text-white hover:bg-[#6F33C5]'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              {eventsLoading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <p className="text-gray-500 text-sm">Loading...</p>
                </div>
              ) : eventsData.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center">
                  <p className="text-gray-500 text-sm">No data</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={eventsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }}
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis style={{ fontSize: '12px' }} />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#854AE6" 
                      strokeWidth={2}
                      name="Events"
                      dot={{ fill: '#854AE6', r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Leads Trend Chart */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-lg">Leads Captured</CardTitle>
                <CardDescription>Last {leadsPeriod} days</CardDescription>
              </div>
              <div className="flex gap-1 bg-gray-50 rounded-lg p-1">
                {periodOptions.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setLeadsPeriod(option.value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      leadsPeriod === option.value
                        ? 'bg-[#854AE6] text-white hover:bg-[#6F33C5]'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              {leadsLoading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <p className="text-gray-500 text-sm">Loading...</p>
                </div>
              ) : leadsData.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center">
                  <p className="text-gray-500 text-sm">No data</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={leadsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }}
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis style={{ fontSize: '12px' }} />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      name="Leads"
                      dot={{ fill: '#10B981', r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* License Keys Trend Chart */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-lg">License Keys Created</CardTitle>
                <CardDescription>Last {keysPeriod} days</CardDescription>
              </div>
              <div className="flex gap-1 bg-gray-50 rounded-lg p-1">
                {periodOptions.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setKeysPeriod(option.value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      keysPeriod === option.value
                        ? 'bg-[#854AE6] text-white hover:bg-[#6F33C5]'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              {keysLoading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <p className="text-gray-500 text-sm">Loading...</p>
                </div>
              ) : keysData.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center">
                  <p className="text-gray-500 text-sm">No data</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={keysData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }}
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis style={{ fontSize: '12px' }} />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#F59E0B" 
                      strokeWidth={2}
                      name="License Keys"
                      dot={{ fill: '#F59E0B', r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SuperAdminDashboard;
