import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import meetingApi, { type MeetingData, type CreateMeetingData } from '../../api/meeting.api';
import leadApi, { type Lead } from '../../api/lead.api';

const EndUserMeetings = () => {
  const [meetings, setMeetings] = useState<MeetingData[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);
  
  // Form state (using local datetime strings for input)
  const [formData, setFormData] = useState({
    leadId: '',
    title: '',
    description: '',
    meetingMode: 'online' as 'online' | 'offline' | 'phone',
    startAt: '', // Local datetime string for input
    endAt: '', // Local datetime string for input
    location: '',
    notifyAttendees: false,
  });

  useEffect(() => {
    fetchMeetings();
    fetchLeads();
  }, []);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const { meetings: fetchedMeetings } = await meetingApi.getAll({ limit: 100 });
      setMeetings(fetchedMeetings);
    } catch (err: any) {
      setError(err.message || 'Failed to load meetings');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeads = async () => {
    try {
      // Use minimal mode to only get ID and names (reduces response size)
      const { leads: fetchedLeads } = await leadApi.getAll({ limit: 100, minimal: true });
      setLeads(fetchedLeads);
    } catch (err: any) {
      console.error('Failed to load leads:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that startAt is before endAt
    const startDate = new Date(formData.startAt);
    const endDate = new Date(formData.endAt);

    if (startDate >= endDate) {
      setError('Start time must be before end time');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Convert local datetime to UTC ISO string
      const meetingData: CreateMeetingData = {
        leadId: formData.leadId,
        title: formData.title,
        description: formData.description,
        meetingMode: formData.meetingMode,
        startAt: startDate.toISOString(),
        endAt: endDate.toISOString(),
        location: formData.location,
        notifyAttendees: formData.notifyAttendees,
      };

      if (editingMeetingId) {
        await meetingApi.update(editingMeetingId, meetingData);
        setEditingMeetingId(null);
      } else {
        await meetingApi.create(meetingData);
      }

      setShowCreateForm(false);
      setFormData({
        leadId: '',
        title: '',
        description: '',
        meetingMode: 'online',
        startAt: '',
        endAt: '',
        location: '',
        notifyAttendees: false,
      });
      fetchMeetings();
    } catch (err: any) {
      setError(err.message || `Failed to ${editingMeetingId ? 'update' : 'create'} meeting`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (meeting: MeetingData) => {
    // Convert UTC timestamps to local datetime string for input
    const startDate = new Date(meeting.startAt);
    const endDate = new Date(meeting.endAt);

    // Format to 'YYYY-MM-DDTHH:MM' for datetime-local input
    const formatDatetimeLocal = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    setFormData({
      leadId: typeof meeting.leadId === 'string' ? meeting.leadId : meeting.leadId._id,
      title: meeting.title,
      description: meeting.description || '',
      meetingMode: meeting.meetingMode,
      startAt: formatDatetimeLocal(startDate),
      endAt: formatDatetimeLocal(endDate),
      location: meeting.location || '',
      notifyAttendees: false,
    });
    setEditingMeetingId(meeting._id);
    setShowCreateForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingMeetingId(null);
    setShowCreateForm(false);
    setError('');
    setFormData({
      leadId: '',
      title: '',
      description: '',
      meetingMode: 'online',
      startAt: '',
      endAt: '',
      location: '',
      notifyAttendees: false,
    });
  };

  const handleStatusUpdate = async (meetingId: string, status: string) => {
    try {
      await meetingApi.update(meetingId, { meetingStatus: status as any });
      fetchMeetings();
    } catch (err: any) {
      setError(err.message || 'Failed to update meeting');
    }
  };

  const handleDelete = async (meetingId: string) => {
    if (!confirm('Are you sure you want to delete this meeting?')) return;
    try {
      await meetingApi.delete(meetingId);
      fetchMeetings();
    } catch (err: any) {
      setError(err.message || 'Failed to delete meeting');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      case 'rescheduled': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'online':
        return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
      case 'phone':
        return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
      case 'offline':
        return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="mb-6 lg:mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Meetings</h1>
            <p className="text-gray-600 mt-1">Schedule and manage meetings with your leads</p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              if (showCreateForm) {
                handleCancelEdit();
              } else {
                setShowCreateForm(true);
              }
            }}
          >
            {showCreateForm ? 'Cancel' : '+ Schedule Meeting'}
          </Button>
        </div>

        {/* Create/Edit Meeting Form */}
        {showCreateForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{editingMeetingId ? 'Edit Meeting' : 'Schedule New Meeting'}</CardTitle>
              <CardDescription>
                {editingMeetingId ? 'Update meeting details' : 'Create a meeting with one of your leads'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lead *</label>
                    <select
                      value={formData.leadId}
                      onChange={(e) => setFormData({ ...formData, leadId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none"
                      required
                    >
                      <option value="">Select a lead</option>
                      {leads.map((lead) => (
                        <option key={lead._id} value={lead._id}>
                          {lead.details?.firstName || lead.details?.lastName
                            ? `${lead.details?.firstName || ''} ${lead.details?.lastName || ''}`.trim()
                            : lead.details?.email || lead.details?.company || 'Unknown'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none"
                      placeholder="Meeting title"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Mode *</label>
                    <select
                      value={formData.meetingMode}
                      onChange={(e) => setFormData({ ...formData, meetingMode: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none"
                      required
                    >
                      <option value="online">Online</option>
                      <option value="offline">Offline</option>
                      <option value="phone">Phone</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date & Time *</label>
                    <input
                      type="datetime-local"
                      value={formData.startAt}
                      onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date & Time *</label>
                    <input
                      type="datetime-local"
                      value={formData.endAt}
                      onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location / Link</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none"
                      placeholder="Meeting location or online link"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none"
                      rows={3}
                      placeholder="Meeting agenda or notes"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={loading} fullWidth>
                  {loading ? (editingMeetingId ? 'Updating...' : 'Scheduling...') : (editingMeetingId ? 'Update Meeting' : 'Schedule Meeting')}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Meetings Table */}
        <Card>
          <CardHeader>
            <CardTitle>Scheduled Meetings</CardTitle>
            <CardDescription>All your upcoming and past meetings</CardDescription>
          </CardHeader>
          <CardContent>
            {loading && !showCreateForm ? (
              <div className="text-center py-8 text-gray-500">Loading meetings...</div>
            ) : meetings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No meetings scheduled yet. Click "Schedule Meeting" to create one.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Meeting</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Lead</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date & Time</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Mode</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {meetings.map((meeting) => (
                      <tr key={meeting._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="text-sm font-medium text-gray-900">{meeting.title}</div>
                          {meeting.description && (
                            <div className="text-xs text-gray-600 mt-1">{meeting.description}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {meeting.leadId?.details.firstName || meeting.leadId?.details.lastName 
                            ? `${meeting.leadId.details.firstName || ''} ${meeting.leadId.details.lastName || ''}`.trim()
                            : meeting.leadId?.details.email || '-'}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          <div>{new Date(meeting.startAt).toLocaleDateString()}</div>
                          <div className="text-xs">
                            {new Date(meeting.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(meeting.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            {getModeIcon(meeting.meetingMode)}
                            <span className="capitalize">{meeting.meetingMode}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={meeting.meetingStatus}
                            onChange={(e) => handleStatusUpdate(meeting._id, e.target.value)}
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(meeting.meetingStatus)} border-0 outline-none`}
                          >
                            <option value="scheduled">Scheduled</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="rescheduled">Rescheduled</option>
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(meeting)}
                              className="text-[#854AE6] hover:text-[#6F33C5] hover:bg-[#F4ECFF]"
                              title="Edit meeting"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(meeting._id)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                              title="Delete meeting"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default EndUserMeetings;
