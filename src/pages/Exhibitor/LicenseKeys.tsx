import { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { eventAPI, type Event, type LicenseKey, type UpdateLicenseKeyData } from '../../api/event.api';
import { Button } from '@/components/ui/button';

interface LicenseKeyWithEvent extends LicenseKey {
  eventId: string;
  eventName: string;
}

const ExhibitorLicenseKeys = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [events, setEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventFilter, setSelectedEventFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingKey, setEditingKey] = useState<LicenseKeyWithEvent | null>(null);
  const [editFormData, setEditFormData] = useState({
    stallName: '',
    maxActivations: 1,
    expiresAt: '',
  });
  const [updateLoading, setUpdateLoading] = useState(false);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await eventAPI.getAll(1, 1000); // Get all events
      setEvents(response.data.events);
    } catch (err: any) {
      setError(err.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Auto-dismiss messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Flatten all license keys with event info
  const allLicenseKeys: LicenseKeyWithEvent[] = useMemo(() => {
    return events.flatMap(event =>
      event.licenseKeys.map(lk => ({
        ...lk,
        eventId: event._id,
        eventName: event.eventName,
      }))
    );
  }, [events]);

  // Filter license keys
  const filteredLicenseKeys = useMemo(() => {
    return allLicenseKeys.filter(lk => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery ||
        lk.key.toLowerCase().includes(searchLower) ||
        lk.stallName?.toLowerCase().includes(searchLower) ||
        lk.email?.toLowerCase().includes(searchLower) ||
        lk.eventName.toLowerCase().includes(searchLower);

      // Event filter
      const matchesEvent = selectedEventFilter === 'all' || lk.eventId === selectedEventFilter;

      // Status filter
      const isActive = lk.isActive && new Date(lk.expiresAt) > new Date();
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && isActive) ||
        (statusFilter === 'expired' && !isActive);

      return matchesSearch && matchesEvent && matchesStatus;
    });
  }, [allLicenseKeys, searchQuery, selectedEventFilter, statusFilter]);

  // Format license key with dashes
  const formatLicenseKey = (key: string): string => {
    return key.match(/.{1,3}/g)?.join('-') || key;
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('License key copied to clipboard!');
  };

  // Handle edit click
  const handleEditClick = (licenseKey: LicenseKeyWithEvent) => {
    setEditingKey(licenseKey);
    setEditFormData({
      stallName: licenseKey.stallName || '',
      maxActivations: licenseKey.maxActivations,
      expiresAt: new Date(licenseKey.expiresAt).toISOString().split('T')[0],
    });
    setShowEditModal(true);
  };

  // Handle update submit
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKey) return;

    setUpdateLoading(true);
    setError('');

    try {
      const updateData: UpdateLicenseKeyData = {};

      if (editFormData.stallName !== (editingKey.stallName || '')) {
        updateData.stallName = editFormData.stallName;
      }
      if (editFormData.maxActivations !== editingKey.maxActivations) {
        updateData.maxActivations = editFormData.maxActivations;
      }
      if (editFormData.expiresAt !== new Date(editingKey.expiresAt).toISOString().split('T')[0]) {
        updateData.expiresAt = editFormData.expiresAt;
      }

      if (Object.keys(updateData).length === 0) {
        setError('No changes detected');
        setUpdateLoading(false);
        return;
      }

      await eventAPI.updateLicenseKey(editingKey.eventId, editingKey._id, updateData);
      setSuccess('License key updated successfully!');
      setShowEditModal(false);
      setEditingKey(null);
      fetchEvents(); // Refresh data
    } catch (err: any) {
      setError(err.message || 'Failed to update license key');
    } finally {
      setUpdateLoading(false);
    }
  };

  // Calculate max date (15 days from today)
  const getMaxExpiryDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 15);
    return maxDate.toISOString().split('T')[0];
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Success/Error Messages */}
        {success && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] bg-green-50 border border-green-200 text-green-700 px-6 py-3 rounded-lg shadow-lg max-w-md w-full mx-4 animate-fade-in-down">
            <div className="flex items-center justify-between gap-3">
              <span>{success}</span>
              <button onClick={() => setSuccess('')} className="text-green-700 hover:text-green-900">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
        {error && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] bg-red-50 border border-red-200 text-red-700 px-6 py-3 rounded-lg shadow-lg max-w-md w-full mx-4 animate-fade-in-down">
            <div className="flex items-center justify-between gap-3">
              <span>{error}</span>
              <button onClick={() => setError('')} className="text-red-700 hover:text-red-900">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">License Keys</h1>
          <p className="text-gray-600 mt-1">View and manage all license keys across your events</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#F4ECFF] rounded-lg">
                <svg className="w-6 h-6 text-[#854AE6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{allLicenseKeys.length}</p>
                <p className="text-sm text-gray-500">Total Keys</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {allLicenseKeys.filter(lk => lk.isActive && new Date(lk.expiresAt) > new Date()).length}
                </p>
                <p className="text-sm text-gray-500">Active Keys</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {allLicenseKeys.filter(lk => !lk.isActive || new Date(lk.expiresAt) <= new Date()).length}
                </p>
                <p className="text-sm text-gray-500">Expired Keys</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by key, stall, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Event Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event</label>
              <select
                value={selectedEventFilter}
                onChange={(e) => setSelectedEventFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none"
              >
                <option value="all">All Events</option>
                {events.map(event => (
                  <option key={event._id} value={event._id}>{event.eventName}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedEventFilter('all');
                  setStatusFilter('all');
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </div>

        {/* License Keys Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading license keys...</div>
          ) : filteredLicenseKeys.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {allLicenseKeys.length === 0
                ? 'No license keys found. Generate license keys from the Events page.'
                : 'No license keys match your filters.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">License Key</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Event</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Stall</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Usage</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Expires</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredLicenseKeys.map((lk, index) => {
                    const isActive = lk.isActive && new Date(lk.expiresAt) > new Date();
                    return (
                      <tr key={lk._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3 text-sm whitespace-nowrap">
                          <code className="bg-[#F4ECFF] text-[#5E2AB2] px-2.5 py-1 rounded text-xs font-mono border border-[#E3D4FF]">
                            {formatLicenseKey(lk.key)}
                          </code>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-[150px] truncate" title={lk.eventName}>
                          {lk.eventName}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {lk.stallName || <span className="text-gray-400">-</span>}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-[180px] truncate" title={lk.email}>
                          {lk.email || <span className="text-gray-400">-</span>}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">{lk.usedCount}</span>
                            <span className="text-gray-400">/</span>
                            <span className="text-gray-600">{lk.maxActivations}</span>
                            <div className="flex-1 ml-2 bg-gray-200 rounded-full h-1.5 max-w-[60px]">
                              <div
                                className="bg-[#854AE6] h-1.5 rounded-full transition-all"
                                style={{ width: `${Math.min((lk.usedCount / lk.maxActivations) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(lk.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            isActive
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {isActive ? 'Active' : 'Expired'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditClick(lk)}
                              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => copyToClipboard(lk.key)}
                              className="text-[#854AE6] hover:bg-[#F4ECFF]"
                              title="Copy Key"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Results count */}
        {!loading && filteredLicenseKeys.length > 0 && (
          <p className="text-sm text-gray-500 mt-4">
            Showing {filteredLicenseKeys.length} of {allLicenseKeys.length} license keys
          </p>
        )}

        {/* Edit Modal */}
        {showEditModal && editingKey && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Edit License Key</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingKey(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">License Key</p>
                <code className="text-sm font-mono text-[#854AE6]">{formatLicenseKey(editingKey.key)}</code>
                <p className="text-sm text-gray-500 mt-2">Event</p>
                <p className="text-sm font-medium text-gray-900">{editingKey.eventName}</p>
                <p className="text-sm text-gray-500 mt-2">Email</p>
                <p className="text-sm text-gray-600">{editingKey.email}</p>
              </div>

              <form onSubmit={handleUpdateSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stall Name</label>
                    <input
                      type="text"
                      value={editFormData.stallName}
                      onChange={(e) => setEditFormData({ ...editFormData, stallName: e.target.value })}
                      maxLength={150}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none"
                      placeholder="Enter stall name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Activations</label>
                    <input
                      type="number"
                      min={editingKey.usedCount || 1}
                      max={10000}
                      value={editFormData.maxActivations}
                      onChange={(e) => setEditFormData({ ...editFormData, maxActivations: parseInt(e.target.value) || 1 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Current usage: {editingKey.usedCount} (minimum value)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiration Date</label>
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      max={getMaxExpiryDate()}
                      value={editFormData.expiresAt}
                      onChange={(e) => setEditFormData({ ...editFormData, expiresAt: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Maximum 15 days from today
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingKey(null);
                    }}
                    className="flex-1"
                    disabled={updateLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-[#854AE6] hover:bg-[#6F33C5] text-white"
                    disabled={updateLoading}
                  >
                    {updateLoading ? 'Updating...' : 'Update'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ExhibitorLicenseKeys;
