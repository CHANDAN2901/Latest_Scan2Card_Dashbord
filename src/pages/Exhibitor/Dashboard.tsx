import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { eventAPI } from '../../api/event.api';

interface EventPerformance {
  _id: string;
  eventName: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isExpired: boolean;
  leadCount: number;
}

interface StallPerformance {
  key: string;
  stallName: string;
  email: string;
  eventName: string;
  leadCount: number;
}

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

  // Event Performance Graph State
  const [eventPerformance, setEventPerformance] = useState<EventPerformance[]>([]);
  const [eventPerformanceLoading, setEventPerformanceLoading] = useState(false);
  const [eventStartDate, setEventStartDate] = useState('');
  const [eventEndDate, setEventEndDate] = useState('');

  // Stall Performance Graph State
  const [stallPerformance, setStallPerformance] = useState<StallPerformance[]>([]);
  const [stallPerformanceLoading, setStallPerformanceLoading] = useState(false);
  const [stallStartDate, setStallStartDate] = useState('');
  const [stallEndDate, setStallEndDate] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [allEvents, setAllEvents] = useState<Array<{ _id: string; eventName: string }>>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsRes, topEventsRes, trendRes, eventsListRes] = await Promise.all([
          eventAPI.getDashboardStats(),
          eventAPI.getTopEventsByLeads(5),
          eventAPI.getLeadsTrend(trendPeriod),
          eventAPI.getAll(1, 100), // Get all events for the dropdown
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
        if (eventsListRes.success) {
          setAllEvents(eventsListRes.data.events.map((e) => ({ _id: e._id, eventName: e.eventName })));
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

  // Fetch Event Performance
  useEffect(() => {
    const fetchEventPerformance = async () => {
      try {
        setEventPerformanceLoading(true);
        const response = await eventAPI.getEventPerformance(
          10,
          eventStartDate || undefined,
          eventEndDate || undefined
        );
        if (response.success) {
          setEventPerformance(response.data.events);
        }
      } catch (err: any) {
        console.error('Failed to load event performance:', err);
      } finally {
        setEventPerformanceLoading(false);
      }
    };

    fetchEventPerformance();
  }, [eventStartDate, eventEndDate]);

  // Fetch Stall Performance
  useEffect(() => {
    const fetchStallPerformance = async () => {
      try {
        setStallPerformanceLoading(true);
        const response = await eventAPI.getStallPerformance(
          selectedEventId || undefined,
          stallStartDate || undefined,
          stallEndDate || undefined
        );
        if (response.success) {
          setStallPerformance(response.data.stalls);
        }
      } catch (err: any) {
        console.error('Failed to load stall performance:', err);
      } finally {
        setStallPerformanceLoading(false);
      }
    };

    fetchStallPerformance();
  }, [selectedEventId, stallStartDate, stallEndDate]);

  const periodOptions = [
    { label: '7 Days', value: 7 },
    { label: '30 Days', value: 30 },
    { label: '90 Days', value: 90 },
  ];

  // Bar colors
  const COLORS = ['#854AE6', '#6F33C5', '#9B6FE8', '#B48FED', '#C9ACF2', '#DAC5F7', '#E7D5FF', '#854AE6', '#6F33C5', '#9B6FE8'];

  // Create unique display names for events with same names (using ID suffix)
  const eventPerformanceWithUniqueNames = eventPerformance.map((event) => {

    // Check if there are other events with the same name
    const sameNameEvents = eventPerformance.filter(e => e.eventName === event.eventName);
    if (sameNameEvents.length > 1) {
      // Find the index of this event among same-named events
      const sameNameIndex = sameNameEvents.findIndex(e => e._id === event._id) + 1;
      return {
        ...event,
        displayName: `${event.eventName} (${sameNameIndex})`,
      };
    }
    return {
      ...event,
      displayName: event.eventName,
    };
  });

  return (

    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Organizer Dashboard</h1>
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
                No events yet. <Link to="/organiser/events" className="text-[#854AE6] hover:underline">Create your first event</Link>
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
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${event.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
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

        {/* Event Performance Bar Graph */}
        <Card className="mb-6 lg:mb-8">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0 pb-4">
            <div>
              <CardTitle>Event Performance</CardTitle>
              <CardDescription>Top 10 events by lead count</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">From:</label>
                <input
                  type="date"
                  value={eventStartDate}
                  onChange={(e) => setEventStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">To:</label>
                <input
                  type="date"
                  value={eventEndDate}
                  onChange={(e) => setEventEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none"
                />
              </div>
              {(eventStartDate || eventEndDate) && (
                <button
                  onClick={() => {
                    setEventStartDate('');
                    setEventEndDate('');
                  }}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Clear
                </button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {eventPerformanceLoading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : eventPerformanceWithUniqueNames.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No event data available for the selected date range.
              </div>
            ) : (
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={eventPerformanceWithUniqueNames}
                    margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="displayName"
                      tick={{ fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={0}
                      tickFormatter={(value) => value.length > 15 ? value.substring(0, 15) + '...' : value}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                              <p className="font-medium text-gray-900">{data.eventName}</p>
                              <p className="text-sm text-gray-500">
                                {new Date(data.startDate).toLocaleDateString()} - {new Date(data.endDate).toLocaleDateString()}
                              </p>
                              <p className="text-sm font-medium text-[#854AE6] mt-1">
                                {data.leadCount} Leads
                              </p>
                              <p className={`text-xs mt-1 ${data.isExpired ? 'text-red-500' : 'text-green-500'}`}>
                                {data.isExpired ? 'Expired' : 'Active'}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="leadCount" radius={[4, 4, 0, 0]}>
                      {eventPerformanceWithUniqueNames.map((event) => (
                        <Cell key={event._id} fill={COLORS[eventPerformanceWithUniqueNames.indexOf(event) % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>



        {/* Stall Performance Bar Graph */}
        <Card className="mb-6 lg:mb-8">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0 pb-4">
            <div>
              <CardTitle>Stall Performance</CardTitle>
              <CardDescription>Lead count by stall/license key</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Event:</label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none min-w-[150px]"
                >
                  <option value="">All Events</option>
                  {allEvents.map((event) => (
                    <option key={event._id} value={event._id}>
                      {event.eventName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">From:</label>
                <input
                  type="date"
                  value={stallStartDate}
                  onChange={(e) => setStallStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">To:</label>
                <input
                  type="date"
                  value={stallEndDate}
                  onChange={(e) => setStallEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none"
                />
              </div>
              {(selectedEventId || stallStartDate || stallEndDate) && (
                <button
                  onClick={() => {
                    setSelectedEventId('');
                    setStallStartDate('');
                    setStallEndDate('');
                  }}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Clear
                </button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {stallPerformanceLoading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : stallPerformance.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No stall data available for the selected filters.
              </div>
            ) : (
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stallPerformance}
                    margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="stallName"
                      tick={{ fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={0}
                      tickFormatter={(value) => value.length > 12 ? value.substring(0, 12) + '...' : value}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload as StallPerformance;
                          return (
                            <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                              <p className="font-medium text-gray-900">{data.stallName}</p>
                              <p className="text-sm text-gray-600">{data.email}</p>
                              {data.eventName && (
                                <p className="text-sm text-gray-500">Event: {data.eventName}</p>
                              )}
                              <p className="text-sm font-medium text-[#854AE6] mt-1">
                                {data.leadCount} Leads
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="leadCount" radius={[4, 4, 0, 0]}>
                      {stallPerformance.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
};

export default ExhibitorDashboard;
