import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import ConfirmModal from '../../components/ConfirmModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { exhibitorAPI, type Exhibitor, type TopPerformer, type LicenseKey } from '../../api/exhibitor.api';
import { Button } from '@/components/ui/button';

const SuperAdminExhibitors = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showKeysModal, setShowKeysModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [topPerformersLoading, setTopPerformersLoading] = useState(false);
  const [keysLoading, setKeysLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [exhibitors, setExhibitors] = useState<Exhibitor[]>([]);
  const [topPerformers, setTopPerformers] = useState<{
    mostEventsCreated: TopPerformer[];
    mostKeysCreated: TopPerformer[];
    mostLicenseKeyUsage: TopPerformer[];
  } | null>(null);
  const [selectedExhibitor, setSelectedExhibitor] = useState<Exhibitor | null>(null);
  const [exhibitorToDelete, setExhibitorToDelete] = useState<string | null>(null);
  const [exhibitorKeys, setExhibitorKeys] = useState<LicenseKey[]>([]);
  const [selectedExhibitorInfo, setSelectedExhibitorInfo] = useState<{
    firstName: string;
    lastName: string;
    companyName?: string;
  } | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    password: '',
    address: '',
  });
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    companyName: '',
    password: '',
    isActive: true,
  });

  // Fetch exhibitors
  const fetchExhibitors = async () => {
    try {
      setFetchLoading(true);
      const response = await exhibitorAPI.getAll(pagination.page, pagination.limit);
      setExhibitors(response.data.exhibitors);
      setPagination(response.data.pagination);
    } catch (err: any) {
      setError(err.message || 'Failed to load exhibitors');
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchExhibitors();
  }, [pagination.page]);

  // Fetch top performers
  const fetchTopPerformers = async () => {
    try {
      setTopPerformersLoading(true);
      const response = await exhibitorAPI.getTopPerformers();
      setTopPerformers(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load top performers');
    } finally {
      setTopPerformersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'top-performers') {
      fetchTopPerformers();
    }
  }, [activeTab]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setEditFormData({
      ...editFormData,
      [e.target.name]: e.target.name === 'isActive' ? value : e.target.value,
    });
  };

  const handleEdit = (exhibitor: Exhibitor) => {
    setSelectedExhibitor(exhibitor);
    setEditFormData({
      firstName: exhibitor.firstName,
      lastName: exhibitor.lastName,
      email: exhibitor.email || '',
      phoneNumber: exhibitor.phoneNumber || '',
      companyName: exhibitor.companyName || '',
      password: '',
      isActive: exhibitor.isActive,
    });
    setShowEditModal(true);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExhibitor) return;

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const updateData: any = {
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        email: editFormData.email || undefined,
        phoneNumber: editFormData.phoneNumber || undefined,
        companyName: editFormData.companyName || undefined,
        isActive: editFormData.isActive,
      };

      if (editFormData.password) {
        updateData.password = editFormData.password;
      }

      await exhibitorAPI.update(selectedExhibitor._id, updateData);
      setSuccess('Exhibitor updated successfully');
      setShowEditModal(false);
      fetchExhibitors();
    } catch (err: any) {
      setError(err.message || 'Failed to update exhibitor');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setExhibitorToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!exhibitorToDelete) return;

    try {
      await exhibitorAPI.delete(exhibitorToDelete);
      setSuccess('Exhibitor deleted successfully');
      setShowDeleteModal(false);
      setExhibitorToDelete(null);
      fetchExhibitors();
    } catch (err: any) {
      setError(err.message || 'Failed to delete exhibitor');
      setShowDeleteModal(false);
      setExhibitorToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setExhibitorToDelete(null);
  };

  const handleViewKeys = async (exhibitor: Exhibitor) => {
    setSelectedExhibitorInfo({
      firstName: exhibitor.firstName,
      lastName: exhibitor.lastName,
      companyName: exhibitor.companyName,
    });
    setShowKeysModal(true);
    setKeysLoading(true);
    setExhibitorKeys([]);

    try {
      const response = await exhibitorAPI.getExhibitorKeys(exhibitor._id);
      setExhibitorKeys(response.data.keys);
    } catch (err: any) {
      setError(err.message || 'Failed to load exhibitor keys');
    } finally {
      setKeysLoading(false);
    }
  };

  // Only SUPERADMIN can change payment status
  const handlePaymentStatusChange = async (key: LicenseKey, newStatus: "pending" | "completed") => {
    try {
      setError('');
      await exhibitorAPI.updateKeyPaymentStatus(key.eventId, key._id, newStatus);

      // Update local state
      setExhibitorKeys(exhibitorKeys.map(k =>
        k._id === key._id ? { ...k, paymentStatus: newStatus } : k
      ));

      setSuccess(`Payment status updated to ${newStatus}`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update payment status');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Split contactName into firstName and lastName
      const nameParts = formData.contactName.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || nameParts[0];

      const exhibitorData = {
        firstName,
        lastName,
        email: formData.email || undefined,
        phoneNumber: formData.phone || undefined,
        companyName: formData.companyName || undefined,
        password: formData.password || undefined,
        address: formData.address || undefined,
      };

      const response = await exhibitorAPI.create(exhibitorData);
      
      setSuccess(response.message + (response.temporaryPassword ? ` Temporary Password: ${response.temporaryPassword}` : ''));
      setShowForm(false);
      setFormData({
        companyName: '',
        contactName: '',
        email: '',
        phone: '',
        password: '',
        address: '',
      });

      // Refresh exhibitors list
      fetchExhibitors();
    } catch (err: any) {
      setError(err.message || 'Failed to create exhibitor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Header */}
        <div className="mb-6 lg:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Organisers</h1>
            <p className="text-gray-600 mt-1">Manage all Organisers accounts</p>
          </div>
          {activeTab === 'all' && (
            <Button
              type="button"
              onClick={() => setShowForm(!showForm)}
              className="bg-[#854AE6] hover:bg-[#7340CC] text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {showForm ? 'Cancel' : 'Add Organisers'}
            </Button>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="all">All Organisers</TabsTrigger>
            <TabsTrigger value="top-performers">Top Performers</TabsTrigger>
          </TabsList>

          {/* All Exhibitors Tab */}
          <TabsContent value="all" className="space-y-6">
        {/* Create Exhibitor Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 lg:mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Create New Organisers</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="companyName"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none transition"
                    placeholder="Enter company name"
                  />
                </div>

                <div>
                  <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Person Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="contactName"
                    name="contactName"
                    value={formData.contactName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none transition"
                    placeholder="Enter contact person name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none transition"
                    placeholder="Organisers@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none transition"
                    placeholder="+1 234 567 8900"
                  />
                  <p className="text-xs text-gray-500 mt-1">Either email or phone is required</p>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    minLength={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none transition"
                    placeholder="Minimum 6 characters"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty to auto-generate</p>
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none transition"
                    placeholder="Enter address"
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
                  className="px-6 bg-[#854AE6] hover:bg-[#7340CC] text-white"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Organisers'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Exhibitors Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Events</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keys</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {fetchLoading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      Loading Organisers...
                    </td>
                  </tr>
                ) : exhibitors.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      No Organisers found
                    </td>
                  </tr>
                ) : (
                  exhibitors.map((exhibitor) => (
                    <tr key={exhibitor._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{exhibitor.firstName} {exhibitor.lastName}</div>
                        {exhibitor.companyName && <div className="text-xs text-gray-500">{exhibitor.companyName}</div>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{exhibitor.email || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{exhibitor.phoneNumber || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{exhibitor.eventCount || 0}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">{exhibitor.keyCount || 0}</span>
                          {exhibitor.keyCount && exhibitor.keyCount > 0 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewKeys(exhibitor)}
                              className="text-[#854AE6] hover:text-[#7340CC] hover:bg-[#854AE6]/10"
                              title="View Keys"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </Button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          exhibitor.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {exhibitor.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{new Date(exhibitor.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <Button 
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(exhibitor)}
                            className="text-[#854AE6] hover:text-[#7340CC] hover:bg-[#854AE6]/10"
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
                            onClick={() => handleDeleteClick(exhibitor._id)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                            title="Delete"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
          </TabsContent>

          {/* Top Performers Tab */}
          <TabsContent value="top-performers" className="space-y-6">
            {topPerformersLoading ? (
              <div className="text-center py-12">
                <div className="text-gray-500">Loading top performers...</div>
              </div>
            ) : topPerformers ? (
              <>
                {/* Most Events Created */}
                <Card>
                  <CardHeader>
                    <CardTitle>Most Events Created</CardTitle>
                    <CardDescription>Top Organisers by number of events created</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {topPerformers.mostEventsCreated.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No Organisers have created events yet
                      </div>
                    ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Organiser</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Events</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {topPerformers.mostEventsCreated.map((performer, index) => (
                            <tr key={performer.userId} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#854AE6]/10 text-[#854AE6] font-bold">
                                  {index + 1}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {performer.firstName} {performer.lastName}
                                </div>
                                {performer.email && (
                                  <div className="text-xs text-gray-500">{performer.email}</div>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {performer.companyName || '-'}
                              </td>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                  {performer.eventCount}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    )}
                  </CardContent>
                </Card>

                {/* Most Keys Created */}
                <Card>
                  <CardHeader>
                    <CardTitle>Most License Keys Created</CardTitle>
                    <CardDescription>Top Organisers by number of license keys generated</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {topPerformers.mostKeysCreated.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No Organisers have created license keys yet
                      </div>
                    ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Organiser</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keys</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {topPerformers.mostKeysCreated.map((performer, index) => (
                            <tr key={performer.userId} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#854AE6]/10 text-[#854AE6] font-bold">
                                  {index + 1}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {performer.firstName} {performer.lastName}
                                </div>
                                {performer.email && (
                                  <div className="text-xs text-gray-500">{performer.email}</div>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {performer.companyName || '-'}
                              </td>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                  {performer.totalKeys}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    )}
                  </CardContent>
                </Card>

                {/* Most License Key Usage */}
                <Card>
                  <CardHeader>
                    <CardTitle>Most License Key Usage</CardTitle>
                    <CardDescription>Top Organisers by license key scans and usage</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {topPerformers.mostLicenseKeyUsage.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No license keys have been used yet
                      </div>
                    ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Organisers</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Used Keys</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Scans</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {topPerformers.mostLicenseKeyUsage.map((performer, index) => (
                            <tr key={performer.userId} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#854AE6]/10 text-[#854AE6] font-bold">
                                  {index + 1}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {performer.firstName} {performer.lastName}
                                </div>
                                {performer.email && (
                                  <div className="text-xs text-gray-500">{performer.email}</div>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {performer.companyName || '-'}
                              </td>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                                  {performer.usedKeysCount}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#854AE6]/10 text-[#5E2AB2]">
                                  {performer.totalScans?.toLocaleString()}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                No data available
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Edit Modal */}
        {showEditModal && selectedExhibitor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Edit Organisers</h2>
                <form onSubmit={handleUpdateSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="edit-firstName" className="block text-sm font-medium text-gray-700 mb-2">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="edit-firstName"
                        name="firstName"
                        value={editFormData.firstName}
                        onChange={handleEditInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none transition"
                      />
                    </div>

                    <div>
                      <label htmlFor="edit-lastName" className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="edit-lastName"
                        name="lastName"
                        value={editFormData.lastName}
                        onChange={handleEditInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none transition"
                      />
                    </div>

                    <div>
                      <label htmlFor="edit-companyName" className="block text-sm font-medium text-gray-700 mb-2">
                        Company Name
                      </label>
                      <input
                        type="text"
                        id="edit-companyName"
                        name="companyName"
                        value={editFormData.companyName}
                        onChange={handleEditInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none transition"
                      />
                    </div>

                    <div>
                      <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="edit-email"
                        name="email"
                        value={editFormData.email}
                        onChange={handleEditInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none transition"
                      />
                    </div>

                    <div>
                      <label htmlFor="edit-phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="edit-phoneNumber"
                        name="phoneNumber"
                        value={editFormData.phoneNumber}
                        onChange={handleEditInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none transition"
                      />
                    </div>

                    <div>
                      <label htmlFor="edit-password" className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        id="edit-password"
                        name="password"
                        value={editFormData.password}
                        onChange={handleEditInputChange}
                        minLength={6}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none transition"
                        placeholder="Leave empty to keep current"
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
                      className="px-6 bg-[#854AE6] hover:bg-[#7340CC] text-white"
                      disabled={loading}
                    >
                      {loading ? 'Updating...' : 'Update Organiser'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Keys View Modal */}
        {showKeysModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      License Keys
                    </h2>
                    {selectedExhibitorInfo && (
                      <p className="text-gray-600 mt-1">
                        {selectedExhibitorInfo.firstName} {selectedExhibitorInfo.lastName}
                        {selectedExhibitorInfo.companyName && ` - ${selectedExhibitorInfo.companyName}`}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowKeysModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {keysLoading ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#854AE6]"></div>
                    <p className="text-gray-600 mt-4">Loading keys...</p>
                  </div>
                ) : exhibitorKeys.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    <p className="text-gray-600 mt-4">No license keys found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">License Key</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stall</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {exhibitorKeys.map((key) => (
                          <tr key={key._id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{key.eventName}</div>
                            </td>
                            <td className="px-4 py-4">
                              <code className="text-xs bg-[#854AE6]/10 text-[#6F3EC2] px-2 py-1 rounded">
                                {key.key}
                              </code>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600">{key.stallName || '-'}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600">{key.email}</div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-gray-900">
                                    {key.usedCount} / {key.maxActivations}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    ({key.usagePercentage}%)
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${
                                      key.usagePercentage >= 100
                                        ? 'bg-red-600'
                                        : key.usagePercentage >= 75
                                        ? 'bg-yellow-500'
                                        : 'bg-green-500'
                                    }`}
                                    style={{ width: `${Math.min(key.usagePercentage, 100)}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600">
                                {new Date(key.expiresAt).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  key.isActive && new Date(key.expiresAt) > new Date()
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {key.isActive && new Date(key.expiresAt) > new Date() ? 'Active' : 'Expired'}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <select
                                value={key.paymentStatus}
                                onChange={(e) => handlePaymentStatusChange(key, e.target.value as "pending" | "completed")}
                                className={`text-xs font-medium px-3 py-1 rounded-lg border-2 transition-colors cursor-pointer ${
                                  key.paymentStatus === 'completed'
                                    ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                    : 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100'
                                }`}
                              >
                                <option value="pending">Pending</option>
                                <option value="completed">Completed</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    Total Keys: <span className="font-semibold">{exhibitorKeys.length}</span>
                  </p>
                  <Button
                    type="button"
                    onClick={() => setShowKeysModal(false)}
                    className="px-6 bg-[#854AE6] hover:bg-[#7340CC] text-white"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={showDeleteModal}
          title="Delete Organisers"
          message="Are you sure you want to delete this Organiser? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      </div>
    </DashboardLayout>
  );
};

export default SuperAdminExhibitors;
