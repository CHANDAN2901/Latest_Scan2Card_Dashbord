import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import ConfirmModal from '../../components/ConfirmModal';
import { eventAPI, type Event, type CreateEventData } from '../../api/event.api';
import { authAPI } from '../../api/auth.api';
import { LicenseKeyQuota } from '../../components/LicenseKeyQuota';
import { LicenseKeyStats } from '../../components/LicenseKeyStats';
import { Button } from '@/components/ui/button';

const ExhibitorEvents = () => {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [generatedLicenseKey, setGeneratedLicenseKey] = useState<string>('');
  
  const [formData, setFormData] = useState<CreateEventData>({
    eventName: '',
    description: '',
    type: 'Offline',
    startDate: '',
    endDate: '',
    location: {
      venue: '',
      address: '',
      city: '',
    },
  });

  const [editFormData, setEditFormData] = useState({
    eventName: '',
    description: '',
    type: 'Offline' as 'Offline' | 'Online' | 'Hybrid',
    startDate: '',
    endDate: '',
    location: {
      venue: '' as string | undefined,
      address: '' as string | undefined,
      city: '' as string | undefined,
    },
    isActive: true,
  });

  const [licenseFormData, setLicenseFormData] = useState({
    stallName: '',
    email: '',
    maxActivations: 1,
    expiresAt: '',
  });

  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [bulkUploadResults, setBulkUploadResults] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  const fetchUserProfile = async () => {
    try {
      const response = await authAPI.getProfile();
      // Extract user from the response structure: { user: {...} }
      setUserProfile(response.user || response);
    } catch (err: any) {
      console.error('Failed to load user profile:', err);
      // Fallback to localStorage if API fails
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          setUserProfile(JSON.parse(storedUser));
        } catch (e) {
          console.error('Failed to parse stored user:', e);
        }
      }
    }
  };

  const fetchEvents = async () => {
    try {
      setFetchLoading(true);
      const response = await eventAPI.getAll();
      setEvents(response.data.events);
    } catch (err: any) {
      setError(err.message || 'Failed to load events');
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchUserProfile();
  }, []);

  // Auto-dismiss success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Auto-dismiss error message after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('location.')) {
      const locationField = name.split('.')[1];
      setFormData({
        ...formData,
        location: {
          ...formData.location,
          [locationField]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    if (name.startsWith('location.')) {
      const locationField = name.split('.')[1];
      setEditFormData({
        ...editFormData,
        location: {
          ...editFormData.location,
          [locationField]: value,
        },
      });
    } else {
      setEditFormData({
        ...editFormData,
        [name]: type === 'checkbox' ? checked : value,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await eventAPI.create(formData);
      setSuccess('Event created successfully');
      setShowForm(false);
      setFormData({
        eventName: '',
        description: '',
        type: 'Offline',
        startDate: '',
        endDate: '',
        location: { venue: '', address: '', city: '' },
      });
      fetchEvents();
    } catch (err: any) {
      setError(err.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (event: Event) => {
    setSelectedEvent(event);
    setEditFormData({
      eventName: event.eventName,
      description: event.description || '',
      type: event.type,
      startDate: event.startDate.split('T')[0],
      endDate: event.endDate.split('T')[0],
      location: {
        venue: event.location?.venue || '',
        address: event.location?.address || '',
        city: event.location?.city || '',
      },
      isActive: event.isActive,
    });
    setShowEditModal(true);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await eventAPI.update(selectedEvent._id, editFormData);
      setSuccess('Event updated successfully');
      setShowEditModal(false);
      fetchEvents();
    } catch (err: any) {
      setError(err.message || 'Failed to update event');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setEventToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!eventToDelete) return;

    try {
      await eventAPI.delete(eventToDelete);
      setSuccess('Event deleted successfully');
      setShowDeleteModal(false);
      setEventToDelete(null);
      fetchEvents();
    } catch (err: any) {
      setError(err.message || 'Failed to delete event');
      setShowDeleteModal(false);
      setEventToDelete(null);
    }
  };

  const handleGenerateLicenseKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;

    // Validate against quota before submitting
    if (userProfile?.maxLicenseKeys !== undefined && userProfile?.maxLicenseKeys !== null) {
      const remainingKeys = userProfile.maxLicenseKeys - (userProfile.currentLicenseKeyCount || 0);
      if (remainingKeys <= 0) {
        setError('You have reached your maximum license key limit. Please contact admin to increase your quota.');
        return;
      }
    }

    if (userProfile?.maxTotalActivations !== undefined && userProfile?.maxTotalActivations !== null) {
      const remainingActivations = userProfile.maxTotalActivations - (userProfile.currentTotalActivations || 0);
      if (licenseFormData.maxActivations > remainingActivations) {
        setError(`You only have ${remainingActivations} activations remaining. Please reduce the max activations or contact admin to increase your quota.`);
        return;
      }
    }

    setError('');
    setLoading(true);

    try {
      const response = await eventAPI.generateLicenseKey(selectedEvent._id, licenseFormData);
      setGeneratedLicenseKey(response.data.licenseKey);
      setSuccess('License key generated successfully!');
      setLicenseFormData({ stallName: '', email: '', maxActivations: 1, expiresAt: '' });
      // Refresh profile to update quota
      fetchUserProfile();
    } catch (err: any) {
      setError(err.message || 'Failed to generate license key');
    } finally {
      setLoading(false);
    }
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCsvFile(file);
    }
  };

  const handleBulkUpload = async () => {
    if (!csvFile || !selectedEvent) return;

    setError('');
    setLoading(true);
    setBulkUploadResults(null);

    try {
      const text = await csvFile.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      // Skip header row
      const dataLines = lines.slice(1);
      
      const licenseKeys = dataLines.map(line => {
        const [stallName, email, maxActivations, expiresAt] = line.split(',').map(v => v.trim());
        return {
          stallName: stallName || '',
          email,
          maxActivations: maxActivations ? parseInt(maxActivations) : 1,
          expiresAt,
        };
      });

      const response = await eventAPI.bulkGenerateLicenseKeys(selectedEvent._id, licenseKeys);
      setBulkUploadResults(response.data);
      setSuccess(`Successfully generated ${response.data.totalGenerated} license keys!`);
      setCsvFile(null);
      fetchEvents();
      fetchUserProfile(); // Refresh quota
    } catch (err: any) {
      setError(err.message || 'Failed to upload CSV');
    } finally {
      setLoading(false);
    }
  };

  const downloadSampleCsv = () => {
    const csvContent = 'stallName,email,maxActivations,expiresAt\nBooth A,user1@example.com,5,2025-12-31\nBooth B,user2@example.com,10,2026-01-15\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'license_keys_sample.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Format license key with dashes for display (XXX-XXX-XXX)
  const formatLicenseKey = (key: string): string => {
    // Add dash after every 3 characters
    return key.match(/.{1,3}/g)?.join('-') || key;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('License key copied to clipboard!');
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Success/Error Messages */}
        {success && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] bg-green-50 border border-green-200 text-green-700 px-6 py-3 rounded-lg shadow-lg max-w-md w-full mx-4 animate-fade-in-down">
            <div className="flex items-center justify-between gap-3">
              <span>{success}</span>
              <button
                onClick={() => setSuccess('')}
                className="text-green-700 hover:text-green-900 transition-colors"
                aria-label="Close"
              >
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
              <button
                onClick={() => setError('')}
                className="text-red-700 hover:text-red-900 transition-colors"
                aria-label="Close"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-6 lg:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Events</h1>
            <p className="text-gray-600 mt-1">Create and manage your events</p>
          </div>
          <Button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="bg-[#854AE6] hover:bg-[#6F33C5] text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {showForm ? 'Cancel' : 'Create Event'}
          </Button>
        </div>

        {/* License Key Usage Stats */}
        {userProfile && (
          <LicenseKeyStats
            maxLicenseKeys={userProfile.maxLicenseKeys}
            currentLicenseKeyCount={userProfile.currentLicenseKeyCount}
            maxTotalActivations={userProfile.maxTotalActivations}
            currentTotalActivations={userProfile.currentTotalActivations}
          />
        )}

        {/* Create Event Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 lg:mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Create New Event</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="eventName" className="block text-sm font-medium text-gray-700 mb-2">
                    Event Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="eventName"
                    name="eventName"
                    value={formData.eventName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none transition"
                    placeholder="Tech Conference 2025"
                  />
                </div>

                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                    Event Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none transition"
                  >
                    <option value="Offline">Offline</option>
                    <option value="Online">Online</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none transition"
                  />
                </div>

                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none transition"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none transition"
                    placeholder="Brief description of the event"
                  />
                </div>

                <div>
                  <label htmlFor="location.venue" className="block text-sm font-medium text-gray-700 mb-2">
                    Venue
                  </label>
                  <input
                    type="text"
                    id="location.venue"
                    name="location.venue"
                    value={formData.location?.venue}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none transition"
                    placeholder="Convention Center"
                  />
                </div>

                <div>
                  <label htmlFor="location.city" className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    id="location.city"
                    name="location.city"
                    value={formData.location?.city}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none transition"
                    placeholder="New York"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="location.address" className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    id="location.address"
                    name="location.address"
                    value={formData.location?.address}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none transition"
                    placeholder="123 Main Street"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="px-6"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="px-6 bg-[#854AE6] hover:bg-[#6F33C5] text-white"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Event'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Events Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {fetchLoading ? (
            <div className="text-center py-12 text-gray-500">
              Loading events...
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No events found. Create your first event!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date Range
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      License Keys
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Leads
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {events.map((event) => (
                    <tr 
                      key={event._id} 
                      onClick={() => {
                        setSelectedEvent(event);
                        setShowDetailsDrawer(true);
                      }}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{event.eventName}</div>
                        {event.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">{event.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {event.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div>{new Date(event.startDate).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-500">to {new Date(event.endDate).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {event.location?.city ? (
                          <div>
                            <div>{event.location.city}</div>
                            {event.location.venue && (
                              <div className="text-xs text-gray-500">{event.location.venue}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                          </svg>
                          {event.licenseKeys.length}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8m-8 5h5m-9 5h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          {event.leadCount ?? 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          event.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {event.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedEvent(event);
                              setGeneratedLicenseKey('');
                              setShowLicenseModal(true);
                            }}
                            className="text-[#854AE6] hover:text-[#6F33C5]"
                            title="Generate License Key"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(event)}
                            className="text-gray-600 hover:text-gray-900"
                            title="Edit"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(event._id)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete"
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
        </div>

        {/* Edit Modal - Similar to create form */}
        {showEditModal && selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full my-8">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Edit Event</h2>
                <form onSubmit={handleUpdateSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto pr-2">
                    {/* Similar fields as create form */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Event Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="eventName"
                        value={editFormData.eventName}
                        onChange={handleEditInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Event Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="type"
                        value={editFormData.type}
                        onChange={handleEditInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none transition"
                      >
                        <option value="Offline">Offline</option>
                        <option value="Online">Online</option>
                        <option value="Hybrid">Hybrid</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="startDate"
                        value={editFormData.startDate}
                        onChange={handleEditInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="endDate"
                        value={editFormData.endDate}
                        onChange={handleEditInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none transition"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea
                        name="description"
                        value={editFormData.description}
                        onChange={handleEditInputChange}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none transition"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="isActive"
                          checked={editFormData.isActive}
                          onChange={handleEditInputChange}
                          className="w-4 h-4 text-[#854AE6] border-gray-300 rounded focus:ring-[#854AE6]"
                        />
                        <span className="text-sm font-medium text-gray-700">Active</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowEditModal(false)}
                      className="px-6"
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="px-6 bg-[#854AE6] hover:bg-[#6F33C5] text-white"
                      disabled={loading}
                    >
                      {loading ? 'Updating...' : 'Update Event'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* License Key Generation Modal */}
        {showLicenseModal && selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 my-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Generate License Keys</h2>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBulkUpload(!showBulkUpload)}
                    className="px-4 text-sm"
                  >
                    {showBulkUpload ? 'Single Key' : 'Bulk Upload'}
                  </Button>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">Event: <strong>{selectedEvent.eventName}</strong></p>

              {/* Quota Display */}
              {userProfile && (
                <div className="mb-4">
                  <LicenseKeyQuota
                    maxLicenseKeys={userProfile.maxLicenseKeys}
                    currentLicenseKeyCount={userProfile.currentLicenseKeyCount}
                    maxTotalActivations={userProfile.maxTotalActivations}
                    currentTotalActivations={userProfile.currentTotalActivations}
                  />
                </div>
              )}

              {bulkUploadResults && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm font-medium text-blue-900 mb-2">Bulk Upload Results</p>
                  <p className="text-sm text-blue-700">Generated: {bulkUploadResults.totalGenerated} keys</p>
                  {bulkUploadResults.totalErrors > 0 && (
                    <p className="text-sm text-red-700">Errors: {bulkUploadResults.totalErrors}</p>
                  )}
                  {bulkUploadResults.errors && bulkUploadResults.errors.length > 0 && (
                    <div className="mt-2 max-h-32 overflow-y-auto">
                      {bulkUploadResults.errors.map((err: any, idx: number) => (
                        <p key={idx} className="text-xs text-red-600">Row {err.row}: {err.error}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {generatedLicenseKey && !showBulkUpload ? (
                <div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-green-700 mb-2">License Key Generated!</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-white px-3 py-2 rounded border text-sm font-mono break-all">
                        {formatLicenseKey(generatedLicenseKey)}
                      </code>
                      <Button
                        type="button"
                        onClick={() => copyToClipboard(generatedLicenseKey)}
                        className="px-3 py-2 bg-[#854AE6] hover:bg-[#6F33C5] text-white"
                        title="Copy"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={() => {
                        setShowLicenseModal(false);
                        setGeneratedLicenseKey('');
                        setLicenseFormData({ stallName: '', email: '', maxActivations: 1, expiresAt: '' });
                      }}
                      className="px-6 bg-[#854AE6] hover:bg-[#6F33C5] text-white"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              ) : showBulkUpload ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-900 mb-2">CSV Format Instructions</p>
                    <p className="text-xs text-gray-600 mb-3">
                      Upload a CSV file with columns: <code className="bg-white px-1 py-0.5 rounded">stallName,email,maxActivations,expiresAt</code>
                      <br />
                      <span className="text-gray-500">Date format: YYYY-MM-DD (e.g., 2025-12-31)</span>
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={downloadSampleCsv}
                      className="h-auto px-0 text-sm text-[#854AE6] hover:text-[#6F33C5] font-medium"
                    >
                      Download Sample CSV
                    </Button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload CSV File
                    </label>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCsvUpload}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none transition"
                    />
                    {csvFile && (
                      <p className="text-sm text-gray-600 mt-2">Selected: {csvFile.name}</p>
                    )}
                  </div>

                  <div className="flex gap-3 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowLicenseModal(false);
                        setGeneratedLicenseKey('');
                        setShowBulkUpload(false);
                        setCsvFile(null);
                        setBulkUploadResults(null);
                      }}
                      className="px-6"
                      disabled={loading}
                    >
                      Close
                    </Button>
                    <Button
                      type="button"
                      onClick={handleBulkUpload}
                      disabled={!csvFile || loading}
                      className="px-6 bg-[#854AE6] hover:bg-[#6F33C5] text-white"
                    >
                      {loading ? 'Uploading...' : 'Upload & Generate'}
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleGenerateLicenseKey}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={licenseFormData.email}
                        onChange={(e) => setLicenseFormData({ ...licenseFormData, email: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none transition"
                        placeholder="manager@example.com"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">A team manager account will be created for this email. Password will be the same as email.</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Stall Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={licenseFormData.stallName}
                        onChange={(e) => setLicenseFormData({ ...licenseFormData, stallName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none transition"
                        placeholder="Stall A1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Activations
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={licenseFormData.maxActivations}
                        onChange={(e) => setLicenseFormData({ ...licenseFormData, maxActivations: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none transition"
                      />
                      <p className="text-xs text-gray-500 mt-1">Number of employees who can use this key</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expiration Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        value={licenseFormData.expiresAt}
                        onChange={(e) => setLicenseFormData({ ...licenseFormData, expiresAt: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none transition"
                      />
                      <p className="text-xs text-gray-500 mt-1">Key will expire on this date</p>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowLicenseModal(false);
                        setGeneratedLicenseKey('');
                        setShowBulkUpload(false);
                      }}
                      className="px-6"
                      disabled={loading}
                    >
                      Close
                    </Button>
                    <Button
                      type="submit"
                      className="px-6 bg-[#854AE6] hover:bg-[#6F33C5] text-white"
                      disabled={loading}
                    >
                      {loading ? 'Generating...' : 'Generate'}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={showDeleteModal}
          title="Delete Event"
          message="Are you sure you want to delete this event? This action cannot be undone and all associated license keys will be removed."
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
          onConfirm={handleDeleteConfirm}
          onCancel={() => {
            setShowDeleteModal(false);
            setEventToDelete(null);
          }}
        />

        {/* Event Details Drawer */}
        {showDetailsDrawer && selectedEvent && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
              onClick={() => setShowDetailsDrawer(false)}
            />
            
            {/* Drawer */}
            <div className="fixed right-0 top-0 h-full w-full md:w-2/3 lg:w-1/2 bg-white shadow-2xl z-50 overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-[#854AE6] to-[#854AE6] px-6 py-5 flex justify-between items-center shadow-md">
                <h2 className="text-2xl font-bold text-white">Event Details</h2>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowDetailsDrawer(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Event Information Card */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <svg className="w-5 h-5 text-[#854AE6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Event Information
                    </h3>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Event Name</p>
                        <p className="text-lg font-semibold text-gray-900">{selectedEvent.eventName}</p>
                      </div>
                      
                      {selectedEvent.description && selectedEvent.description !== 'NA' && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Description</p>
                          <p className="text-base text-gray-700 leading-relaxed">{selectedEvent.description}</p>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Type</p>
                        <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          {selectedEvent.type}
                        </span>
                      </div>
                      
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Status</p>
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium border ${
                          selectedEvent.isActive 
                            ? 'bg-green-50 text-green-700 border-green-200' 
                            : 'bg-gray-50 text-gray-700 border-gray-200'
                        }`}>
                          <span className={`w-2 h-2 rounded-full mr-2 ${selectedEvent.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                          {selectedEvent.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Start Date</p>
                        <div className="flex items-center text-gray-900">
                          <svg className="w-4 h-4 mr-2 text-[#854AE6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-sm font-medium">{new Date(selectedEvent.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">End Date</p>
                        <div className="flex items-center text-gray-900">
                          <svg className="w-4 h-4 mr-2 text-[#854AE6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-sm font-medium">{new Date(selectedEvent.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                        </div>
                      </div>
                    </div>

                    {selectedEvent.location && (selectedEvent.location.venue || selectedEvent.location.city || selectedEvent.location.address) && (
                      <div className="pt-4 border-t border-gray-200">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center">
                          <svg className="w-4 h-4 mr-1.5 text-[#854AE6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Location
                        </p>
                        <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                          {selectedEvent.location.venue && (
                            <p className="text-sm font-medium text-gray-900">{selectedEvent.location.venue}</p>
                          )}
                          {selectedEvent.location.address && (
                            <p className="text-sm text-gray-600">{selectedEvent.location.address}</p>
                          )}
                          {selectedEvent.location.city && (
                            <p className="text-sm text-gray-600">{selectedEvent.location.city}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* License Keys Section */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <svg className="w-5 h-5 text-[#854AE6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      License Keys
                      <span className="ml-2 px-2.5 py-0.5 bg-[#854AE6] text-white text-xs font-semibold rounded-full">
                        {selectedEvent.licenseKeys.length}
                      </span>
                    </h3>
                  </div>

                  {selectedEvent.licenseKeys.length === 0 ? (
                    <div className="text-center py-12 px-6">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                      </div>
                      <p className="text-gray-600 font-medium mb-1">No license keys generated yet</p>
                      <p className="text-sm text-gray-500 mb-4">Generate license keys to share with your team or clients</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">License Key</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Stall</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Email</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Usage</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Expires</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Status</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {selectedEvent.licenseKeys.map((lk, index) => (
                            <tr key={lk._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-4 py-3 text-sm whitespace-nowrap">
                                <code className="bg-[#F4ECFF] text-[#5E2AB2] px-2.5 py-1 rounded text-xs font-mono border border-[#E3D4FF]">
                                  {formatLicenseKey(lk.key)}
                                </code>
                              </td>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                {lk.stallName || <span className="text-gray-400">-</span>}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
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
                                      style={{ width: `${(lk.usedCount / lk.maxActivations) * 100}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {new Date(lk.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                                  lk.isActive && new Date(lk.expiresAt) > new Date()
                                    ? 'bg-green-50 text-green-700 border border-green-200'
                                    : 'bg-red-50 text-red-700 border border-red-200'
                                }`}>
                                  {lk.isActive && new Date(lk.expiresAt) > new Date() ? 'Active' : 'Expired'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      // Navigate to leads page with event and stall filters
                                      navigate(`/organiser/leads?eventId=${selectedEvent._id}&licenseKey=${lk.key}`);
                                    }}
                                    className="text-[#854AE6] hover:bg-[#F4ECFF] px-3 py-1.5 text-xs font-medium"
                                    title="View Leads"
                                  >
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    View Leads
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => copyToClipboard(lk.key)}
                                    className="text-[#854AE6] hover:bg-[#F4ECFF]"
                                    title="Copy Key"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
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
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ExhibitorEvents;
