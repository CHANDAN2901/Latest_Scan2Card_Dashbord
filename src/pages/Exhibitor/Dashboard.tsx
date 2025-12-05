import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { eventAPI } from '../../api/event.api';

const ExhibitorDashboard = () => {
  const [stats, setStats] = useState({
    totalEvents: 0,
    activeEvents: 0,
    totalLeads: 0,
    teamMembers: 0,
  });
  const [topEvents, setTopEvents] = useState<any[]>([]);
  const [leadsTrend, setLeadsTrend] = useState<Array<{ date: string; count: number }>>([]);
  const [trendPeriod, setTrendPeriod] = useState(7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsRes, topEventsRes, trendRes] = await Promise.all([
          eventAPI.getDashboardStats(),
          eventAPI.getTopEventsByLeads(5),
          eventAPI.getLeadsTrend(trendPeriod),
        ]);

        if (statsRes.success) {
          setStats(statsRes.data);
        }
        if (topEventsRes.success) {
          setTopEvents(topEventsRes.data.topEvents);
        }
        if (trendRes.success) {
          setLeadsTrend(trendRes.data.trends);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  useEffect(() => {
    const fetchTrend = async () => {
      try {
        const response = await eventAPI.getLeadsTrend(trendPeriod);
        if (response.success) {
          setLeadsTrend(response.data.trends);
        }
      } catch (err: any) {
        console.error('Failed to load trend:', err);
      }
    };

    fetchTrend();
  }, [trendPeriod]);

  const periodOptions = [
    { label: '7 Days', value: 7 },
    { label: '30 Days', value: 30 },
    { label: '90 Days', value: 90 },
  ];

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Exhibitor Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your events and leads</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <p className="text-sm font-medium text-gray-600">Total Events</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{loading ? '...' : stats.totalEvents}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <p className="text-sm font-medium text-gray-600">Active Events</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{loading ? '...' : stats.activeEvents}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <p className="text-sm font-medium text-gray-600">Total Leads</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{loading ? '...' : stats.totalLeads}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <p className="text-sm font-medium text-gray-600">Team Members</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{loading ? '...' : stats.teamMembers}</p>
          </div>
        </div>

        {/* Top Events by Leads */}
        <Card className="mb-6 lg:mb-8">
          <CardHeader>
            <CardTitle>Top Events by Lead Capture</CardTitle>
            <CardDescription>Your best performing events based on leads collected</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : topEvents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No events yet. <Link to="/exhibitor/events" className="text-[#854AE6] hover:underline">Create your first event</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {topEvents.map((event, index) => (
                  <div key={event._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#E7D5FF] text-[#854AE6] font-bold">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">{event.eventName}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {event.leadCount} leads
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        event.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {event.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Leads Trend Chart */}
        <Card className="mb-6 lg:mb-8">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>Leads Trend</CardTitle>
              <CardDescription>Lead capture trends across all your events</CardDescription>
            </div>
            <select
              value={trendPeriod}
              onChange={(e) => setTrendPeriod(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none"
            >
              {periodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={leadsTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value) => [value, 'Leads']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#854AE6" 
                    strokeWidth={2}
                    dot={{ fill: '#854AE6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ExhibitorDashboard;
