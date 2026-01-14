import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import teamManagerAPI, { type DashboardStats, type LeadsGraphData, type TeamManagerEvent } from '../../api/teamManager.api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { getUser } from '../../utils/auth';

const TeamManagerDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [events, setEvents] = useState<TeamManagerEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [graphData, setGraphData] = useState<LeadsGraphData | null>(null);
  const [period, setPeriod] = useState<'hourly' | 'daily'>('hourly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchGraphData();
    }
  }, [selectedEvent, period]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, eventsData] = await Promise.all([
        teamManagerAPI.getDashboardStats(),
        teamManagerAPI.getMyEvents(),
      ]);
      setStats(statsData);
      setEvents(eventsData || []);
      if (eventsData?.length > 0) {
        setSelectedEvent(eventsData[0]._id);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchGraphData = async () => {
    if (!selectedEvent) return;
    try {
      const data = await teamManagerAPI.getLeadsGraph(selectedEvent, period);
      setGraphData(data);
    } catch (err: any) {
      console.error('Failed to load graph data:', err);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header with Welcome and Avatar */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome, {getUser()?.firstName || 'User'}!</h1>
            <p className="text-gray-600 mt-1">Monitor your team performance and leads</p>
          </div>
          {/* User Avatar */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <p className="text-sm font-medium text-gray-900">{getUser()?.firstName} {getUser()?.lastName}</p>
              <p className="text-xs text-gray-500">{getUser()?.email}</p>
            </div>
            {getUser()?.profileImage ? (
              <img
                src={getUser()?.profileImage}
                alt={`${getUser()?.firstName} ${getUser()?.lastName}`}
                className="w-12 h-12 rounded-full object-cover shadow-md border-2 border-[#854AE6]"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#854AE6] to-[#6F33C5] flex items-center justify-center text-white font-bold text-lg shadow-md">
                {((getUser()?.firstName || 'U')[0] + (getUser()?.lastName || 'U')[0]).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Total Team Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#854AE6]">{stats?.totalMembers || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Total Leads Scanned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats?.totalLeads || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">License Keys Assigned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats?.totalLicenseKeys || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Leads Graph */}
        {events?.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle>Leads Scanned Over Time</CardTitle>
                <div className="flex gap-3">
                  <select
                    value={selectedEvent}
                    onChange={(e) => setSelectedEvent(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none"
                  >
                    {events.map((event) => (
                      <option key={event._id} value={event._id}>
                        {event.eventName}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setPeriod('hourly')}
                      className={`px-4 text-sm font-medium transition-colors ${period === 'hourly'
                          ? 'bg-[#854AE6] text-white hover:bg-[#6F33C5]'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      Hourly
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setPeriod('daily')}
                      className={`px-4 text-sm font-medium transition-colors ${period === 'daily'
                          ? 'bg-[#854AE6] text-white hover:bg-[#6F33C5]'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      Daily
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {graphData ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={graphData.graphData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="label"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        interval="preserveStartEnd"
                      />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#854AE6"
                        strokeWidth={2}
                        name="Leads"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center text-gray-500">
                  Select an event to view leads graph
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* License Keys */}
        {stats && stats.licenseKeys && stats.licenseKeys.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent License Keys</CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/manager/license-keys')}
                  className="text-[#854AE6] hover:text-[#6F33C5] hover:bg-[#F2E9FF]"
                >
                  View All ({stats.totalLicenseKeys})
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.licenseKeys.map((key, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex-1">
                      <div className="font-mono text-sm font-medium text-gray-900">{key.key}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {key.stallName && <span>{key.stallName} • </span>}
                        {key.email}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {key.usedCount} / {key.maxActivations}
                      </div>
                      <div className="text-xs text-gray-500">
                        Expires: {new Date(key.expiresAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {stats.totalLicenseKeys > 5 && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => navigate('/manager/license-keys')}
                    className="text-sm text-[#854AE6] hover:text-[#6F33C5] font-medium"
                  >
                    View all {stats.totalLicenseKeys} license keys →
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TeamManagerDashboard;
