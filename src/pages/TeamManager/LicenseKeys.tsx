import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import teamManagerAPI, { type LicenseKey, type LicenseKeyMeetingPermissionStatus } from '../../api/teamManager.api';

const LicenseKeys = () => {
  const [licenseKeys, setLicenseKeys] = useState<LicenseKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  // Meeting permission modal state
  const [showMeetingPermissionModal, setShowMeetingPermissionModal] = useState(false);
  const [selectedLicenseKey, setSelectedLicenseKey] = useState<LicenseKey | null>(null);
  const [meetingPermissionStatus, setMeetingPermissionStatus] = useState<LicenseKeyMeetingPermissionStatus | null>(null);
  const [permissionLoading, setPermissionLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'revoke' | 'restore' | null>(null);

  useEffect(() => {
    fetchLicenseKeys();
  }, [page, search]);

  const fetchLicenseKeys = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await teamManagerAPI.getAllLicenseKeys(page, limit, search);
      setLicenseKeys(data.licenseKeys);
      setTotalPages(data.pagination.pages);
      setTotal(data.pagination.total);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load license keys');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const getStatusColor = (key: LicenseKey) => {
    const now = new Date();
    const expiresAt = new Date(key.expiresAt);
    const isExpired = expiresAt < now;
    const isFull = key.usedCount >= key.maxActivations;

    if (isExpired) return 'text-red-600';
    if (isFull) return 'text-orange-600';
    return 'text-green-600';
  };

  const getStatusText = (key: LicenseKey) => {
    const now = new Date();
    const expiresAt = new Date(key.expiresAt);
    const isExpired = expiresAt < now;
    const isFull = key.usedCount >= key.maxActivations;

    if (isExpired) return 'Expired';
    if (isFull) return 'Full';
    return 'Active';
  };

  // Meeting permission handlers
  const handleManageMeetingPermission = async (key: LicenseKey) => {
    setSelectedLicenseKey(key);
    setShowMeetingPermissionModal(true);
    setPermissionLoading(true);
    setError('');
    setSuccess('');

    try {
      const status = await teamManagerAPI.getLicenseKeyMeetingPermissionStatus(key.eventId, key.key);
      setMeetingPermissionStatus(status);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load meeting permission status');
    } finally {
      setPermissionLoading(false);
    }
  };

  const handleBulkRevokeClick = () => {
    setConfirmAction('revoke');
    setShowConfirmDialog(true);
  };

  const handleBulkRestoreClick = () => {
    setConfirmAction('restore');
    setShowConfirmDialog(true);
  };

  const handleConfirmAction = async () => {
    if (!confirmAction || !selectedLicenseKey) return;

    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      if (confirmAction === 'revoke') {
        const result = await teamManagerAPI.bulkRevokeMeetingPermission(selectedLicenseKey.eventId, selectedLicenseKey.key);
        setSuccess(result.message || `Meeting permission revoked for all team members under ${selectedLicenseKey.key}`);
      } else {
        const result = await teamManagerAPI.bulkRestoreMeetingPermission(selectedLicenseKey.eventId, selectedLicenseKey.key);
        setSuccess(result.message || `Meeting permission restored for all team members under ${selectedLicenseKey.key}`);
      }

      // Refresh permission status
      const status = await teamManagerAPI.getLicenseKeyMeetingPermissionStatus(selectedLicenseKey.eventId, selectedLicenseKey.key);
      setMeetingPermissionStatus(status);
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${confirmAction} meeting permission`);
    } finally {
      setActionLoading(false);
      setShowConfirmDialog(false);
      setConfirmAction(null);
    }
  };

  const closeMeetingPermissionModal = () => {
    setShowMeetingPermissionModal(false);
    setSelectedLicenseKey(null);
    setMeetingPermissionStatus(null);
    setError('');
    setSuccess('');
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">License Keys</h1>
          <p className="text-gray-600 mt-1">Manage all your license keys across events</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* Search and Stats */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="w-full sm:w-96">
                <input
                  type="text"
                  placeholder="Search by key, email, stall name, or event..."
                  value={search}
                  onChange={handleSearchChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none"
                />
              </div>
              <div className="text-sm text-gray-600">
                Total: <span className="font-semibold text-gray-900">{total}</span> license keys
              </div>
            </div>
          </CardContent>
        </Card>

        {/* License Keys List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading...</div>
          </div>
        ) : licenseKeys.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No license keys found</h3>
              <p className="text-gray-600">
                {search ? 'Try adjusting your search criteria' : 'No license keys have been assigned yet'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {licenseKeys.map((key, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Left Section - Key Details */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="font-mono text-sm font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded">
                          {key.key}
                        </div>
                        <span className={`text-sm font-semibold ${getStatusColor(key)}`}>
                          {getStatusText(key)}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {key.email}
                        </div>
                        {key.stallName && (
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            {key.stallName}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {key.eventName}
                        </div>
                      </div>
                    </div>

                    {/* Right Section - Usage Stats */}
                    <div className="flex items-center gap-6 lg:border-l lg:pl-6 border-gray-200">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-[#854AE6]">
                          {key.usedCount} / {key.maxActivations}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Activations</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {key.leadCount}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Leads</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-semibold text-gray-900">
                          {new Date(key.expiresAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Expires</div>
                      </div>
                      <div className="text-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleManageMeetingPermission(key)}
                          className="text-[#854AE6] border-[#854AE6] hover:bg-[#854AE6] hover:text-white"
                        >
                          Manage Meetings
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      page === pageNum
                        ? 'bg-[#854AE6] text-white'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Meeting Permission Modal */}
      {showMeetingPermissionModal && selectedLicenseKey && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Manage Meeting Permissions
                  </h2>
                  <p className="text-gray-600 mt-1">
                    License Key: <span className="font-mono font-semibold">{selectedLicenseKey.key}</span>
                  </p>
                  <p className="text-gray-500 text-sm">
                    Event: {selectedLicenseKey.eventName}
                  </p>
                </div>
                <button
                  onClick={closeMeetingPermissionModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
                  {success}
                </div>
              )}

              {permissionLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-500">Loading...</div>
                </div>
              ) : meetingPermissionStatus ? (
                <div className="space-y-6">
                  {/* Status Overview */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-gray-700">Current Status</span>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          meetingPermissionStatus.allowTeamMeetings
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}
                      >
                        {meetingPermissionStatus.allowTeamMeetings ? 'Meetings Allowed' : 'Meetings Disabled'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-gray-900">
                          {meetingPermissionStatus.totalMembers}
                        </div>
                        <div className="text-xs text-gray-500">Total Members</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-600">
                          {meetingPermissionStatus.activeMembers}
                        </div>
                        <div className="text-xs text-gray-500">Can Create Meetings</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-orange-600">
                          {meetingPermissionStatus.revokedMembers}
                        </div>
                        <div className="text-xs text-gray-500">Meetings Disabled</div>
                      </div>
                    </div>

                    {meetingPermissionStatus.meetingPermissionUpdatedAt && (
                      <div className="mt-4 text-xs text-gray-500 text-center">
                        Last updated: {new Date(meetingPermissionStatus.meetingPermissionUpdatedAt).toLocaleString()}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 mb-2">
                      Control meeting creation for <span className="font-semibold">all team members</span> under this license key:
                    </p>
                    
                    {meetingPermissionStatus.allowTeamMeetings ? (
                      <Button
                        type="button"
                        onClick={handleBulkRevokeClick}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                        disabled={actionLoading}
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                        Disable Meetings for All Team Members
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onClick={handleBulkRestoreClick}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        disabled={actionLoading}
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Allow Meetings for All Team Members
                      </Button>
                    )}
                    
                    <p className="text-xs text-gray-500 text-center">
                      💡 Tip: You can give individual exceptions in the "Team Members" page
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Failed to load meeting permission status
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bulk Confirmation Dialog */}
      {showConfirmDialog && confirmAction && selectedLicenseKey && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {confirmAction === 'revoke' 
                ? 'Disable Meetings for All Team Members?' 
                : 'Allow Meetings for All Team Members?'}
            </h3>
            <p className="text-gray-600 mb-6">
              {confirmAction === 'revoke' ? (
                <>
                  This will disable meeting creation for <span className="font-semibold">all {meetingPermissionStatus?.totalMembers} team members</span> using 
                  license key <span className="font-mono font-semibold">{selectedLicenseKey.key}</span>.
                  <span className="block mt-2 text-orange-600">
                    Team members will not be able to schedule meetings for leads from this event.
                  </span>
                </>
              ) : (
                <>
                  This will allow meeting creation for <span className="font-semibold">all {meetingPermissionStatus?.totalMembers} team members</span> using 
                  license key <span className="font-mono font-semibold">{selectedLicenseKey.key}</span>.
                  <span className="block mt-2 text-blue-600">
                    Team members will be able to schedule meetings for leads from this event.
                  </span>
                </>
              )}
            </p>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowConfirmDialog(false);
                  setConfirmAction(null);
                }}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConfirmAction}
                className={
                  confirmAction === 'revoke'
                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : 'Yes, Confirm'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default LicenseKeys;
