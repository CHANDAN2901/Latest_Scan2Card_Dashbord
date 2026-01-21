import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import teamManagerAPI, { type TeamMemberStats, type MemberEvent } from '../../api/teamManager.api';
import { Button } from '@/components/ui/button';

const TeamMembers = () => {
  const [members, setMembers] = useState<TeamMemberStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 1,
    limit: 10,
  });

  // Modal state
  const [showEventsModal, setShowEventsModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMemberStats | null>(null);
  const [memberEvents, setMemberEvents] = useState<MemberEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'revoke' | 'restore' | 'revoke-meeting' | 'restore-meeting' | 'grant-calendar' | 'revoke-calendar';
    eventId: string;
    eventName: string;
  } | null>(null);

  useEffect(() => {
    fetchTeamMembers();
  }, [page, search]);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const data = await teamManagerAPI.getTeamMembers(page, 10, search);
      setMembers(data.members);
      setPagination(data.pagination);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleManageAccess = async (member: TeamMemberStats) => {
    setSelectedMember(member);
    setShowEventsModal(true);
    setEventsLoading(true);
    setError('');

    try {
      const events = await teamManagerAPI.getTeamMemberEvents(member._id);
      setMemberEvents(events);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load member events');
    } finally {
      setEventsLoading(false);
    }
  };

  const handleRevokeClick = (eventId: string, eventName: string) => {
    setConfirmAction({ type: 'revoke', eventId, eventName });
    setShowConfirmDialog(true);
  };

  const handleRestoreClick = (eventId: string, eventName: string) => {
    setConfirmAction({ type: 'restore', eventId, eventName });
    setShowConfirmDialog(true);
  };

  // Meeting permission handlers
  const handleRevokeMeetingClick = (eventId: string, eventName: string) => {
    setConfirmAction({ type: 'revoke-meeting', eventId, eventName });
    setShowConfirmDialog(true);
  };

  const handleRestoreMeetingClick = (eventId: string, eventName: string) => {
    setConfirmAction({ type: 'restore-meeting', eventId, eventName });
    setShowConfirmDialog(true);
  };

  // Calendar permission handlers
  const handleGrantCalendarClick = (eventId: string, eventName: string) => {
    setConfirmAction({ type: 'grant-calendar', eventId, eventName });
    setShowConfirmDialog(true);
  };

  const handleRevokeCalendarClick = (eventId: string, eventName: string) => {
    setConfirmAction({ type: 'revoke-calendar', eventId, eventName });
    setShowConfirmDialog(true);
  };

  const handleConfirmAction = async () => {
    if (!confirmAction || !selectedMember) return;

    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      if (confirmAction.type === 'revoke') {
        await teamManagerAPI.revokeEventAccess(selectedMember._id, confirmAction.eventId);
        setSuccess(`Access revoked successfully for ${confirmAction.eventName}`);
      } else if (confirmAction.type === 'restore') {
        await teamManagerAPI.restoreEventAccess(selectedMember._id, confirmAction.eventId);
        setSuccess(`Access restored successfully for ${confirmAction.eventName}`);
      } else if (confirmAction.type === 'revoke-meeting') {
        await teamManagerAPI.revokeMeetingPermission(selectedMember._id, confirmAction.eventId);
        setSuccess(`Meeting creation permission revoked successfully for ${confirmAction.eventName}`);
      } else if (confirmAction.type === 'restore-meeting') {
        await teamManagerAPI.restoreMeetingPermission(selectedMember._id, confirmAction.eventId);
        setSuccess(`Meeting creation permission restored successfully for ${confirmAction.eventName}`);
      } else if (confirmAction.type === 'grant-calendar') {
        await teamManagerAPI.grantCalendarPermission(selectedMember._id, confirmAction.eventId);
        setSuccess(`Calendar permission granted successfully. Member can now connect their own calendar for ${confirmAction.eventName}`);
      } else if (confirmAction.type === 'revoke-calendar') {
        await teamManagerAPI.revokeCalendarPermission(selectedMember._id, confirmAction.eventId);
        setSuccess(`Calendar permission revoked successfully for ${confirmAction.eventName}`);
      }

      // Refresh member events
      const events = await teamManagerAPI.getTeamMemberEvents(selectedMember._id);
      setMemberEvents(events);
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${confirmAction.type.replace('-', ' ')}`);
    } finally {
      setActionLoading(false);
      setShowConfirmDialog(false);
      setConfirmAction(null);
    }
  };

  const closeModal = () => {
    setShowEventsModal(false);
    setSelectedMember(null);
    setMemberEvents([]);
    setError('');
    setSuccess('');
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Team Members</h1>
            <p className="text-gray-600 mt-1">View all team members and manage their event access</p>
          </div>
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

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <input
              type="text"
              placeholder="Search members by name or email..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none"
            />
          </CardContent>
        </Card>

        {/* Members Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Team Members ({pagination.total})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">Loading...</div>
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No team members found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Phone</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">Lead Count</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Joined</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => (
                      <tr key={member._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="font-medium text-gray-900">
                            {member.firstName} {member.lastName}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-600">{member.email}</td>
                        <td className="py-4 px-4 text-gray-600">{member.phoneNumber || '-'}</td>
                        <td className="py-4 px-4 text-center">
                          <span className="inline-flex items-center justify-center px-3 py-1 bg-[#854AE6]/10 text-[#854AE6] rounded-full text-sm font-medium">
                            {member.leadCount}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${member.isActive
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                              }`}
                          >
                            {member.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-gray-600">
                          {new Date(member.joinedAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleManageAccess(member)}
                            className="text-[#854AE6] border-[#854AE6] hover:bg-[#854AE6] hover:text-white"
                          >
                            Manage Access
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4"
                >
                  Previous
                </Button>
                <span className="px-4 py-2 text-gray-700">
                  Page {page} of {pagination.pages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPage(Math.min(pagination.pages, page + 1))}
                  disabled={page === pagination.pages}
                  className="px-4"
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Events Modal */}
      {showEventsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Manage Event Access
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {selectedMember?.firstName} {selectedMember?.lastName}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
              {eventsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-500">Loading events...</div>
                </div>
              ) : memberEvents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No events found for this member
                </div>
              ) : (
                <div className="space-y-4">
                  {memberEvents.map((event) => (
                    <div
                      key={event._id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {event.eventName}
                          </h3>
                          {event.description && (
                            <p className="text-gray-600 text-sm mt-1">
                              {event.description}
                            </p>
                          )}
                          <div className="flex gap-4 mt-2 text-sm text-gray-500">
                            <span>
                              {new Date(event.startDate).toLocaleDateString()} -{' '}
                              {new Date(event.endDate).toLocaleDateString()}
                            </span>
                            {event.licenseKey && (
                              <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
                                {event.licenseKey}
                              </span>
                            )}
                          </div>
                          {event.isRevoked && event.revokedAt && (
                            <div className="mt-2 text-sm text-red-600">
                              <span className="font-medium">Access Revoked:</span>{' '}
                              {new Date(event.revokedAt).toLocaleString()}
                              {event.revokedBy && (
                                <span className="ml-2">
                                  by {event.revokedBy.firstName} {event.revokedBy.lastName}
                                </span>
                              )}
                            </div>
                          )}
                          {!event.canCreateMeeting && event.meetingPermissionRevokedAt && (
                            <div className="mt-2 text-sm text-orange-600">
                              <span className="font-medium">Meeting Creation Disabled:</span>{' '}
                              {new Date(event.meetingPermissionRevokedAt).toLocaleString()}
                              {event.meetingPermissionRevokedBy && (
                                <span className="ml-2">
                                  by {event.meetingPermissionRevokedBy.firstName} {event.meetingPermissionRevokedBy.lastName}
                                </span>
                              )}
                            </div>
                          )}
                          {event.canUseOwnCalendar && event.calendarPermissionGrantedAt && (
                            <div className="mt-2 text-sm text-purple-600">
                              <span className="font-medium">Own Calendar Allowed:</span>{' '}
                              {new Date(event.calendarPermissionGrantedAt).toLocaleString()}
                              {event.calendarPermissionGrantedBy && (
                                <span className="ml-2">
                                  by {event.calendarPermissionGrantedBy.firstName} {event.calendarPermissionGrantedBy.lastName}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="ml-4 flex flex-col gap-2 min-w-[160px]">
                          {/* Event Access Status & Control */}
                          <div className="border-b border-gray-100 pb-2 mb-1">
                            <span className="text-xs font-medium text-gray-500 block mb-1">Event Access</span>
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${event.isRevoked
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-green-100 text-green-700'
                                }`}
                            >
                              {event.isRevoked ? 'Revoked' : 'Active'}
                            </span>
                            {event.isRevoked ? (
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleRestoreClick(event._id, event.eventName)}
                                className="bg-green-600 hover:bg-green-700 text-white mt-1 w-full text-xs"
                                disabled={actionLoading}
                              >
                                Restore Access
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleRevokeClick(event._id, event.eventName)}
                                className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white mt-1 w-full text-xs"
                                disabled={actionLoading}
                              >
                                Revoke Access
                              </Button>
                            )}
                          </div>
                          
                          {/* Meeting Permission Status & Control */}
                          <div className="border-b border-gray-100 pb-2 mb-1">
                            <span className="text-xs font-medium text-gray-500 block mb-1">Meeting Creation</span>
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${!event.canCreateMeeting
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-blue-100 text-blue-700'
                                }`}
                            >
                              {event.canCreateMeeting ? 'Allowed' : 'Disabled'}
                            </span>
                            {!event.canCreateMeeting ? (
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleRestoreMeetingClick(event._id, event.eventName)}
                                className="bg-blue-600 hover:bg-blue-700 text-white mt-1 w-full text-xs"
                                disabled={actionLoading || event.isRevoked}
                                title={event.isRevoked ? 'Restore event access first' : ''}
                              >
                                Allow Meetings
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleRevokeMeetingClick(event._id, event.eventName)}
                                className="text-orange-600 border-orange-600 hover:bg-orange-600 hover:text-white mt-1 w-full text-xs"
                                disabled={actionLoading || event.isRevoked}
                                title={event.isRevoked ? 'Event access is already revoked' : ''}
                              >
                                Disable Meetings
                              </Button>
                            )}
                          </div>

                          {/* Calendar Permission Status & Control */}
                          <div>
                            <span className="text-xs font-medium text-gray-500 block mb-1">Own Calendar</span>
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${event.canUseOwnCalendar
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-gray-100 text-gray-700'
                                }`}
                            >
                              {event.canUseOwnCalendar ? 'Allowed' : 'Not Allowed'}
                            </span>
                            {event.canUseOwnCalendar ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleRevokeCalendarClick(event._id, event.eventName)}
                                className="text-purple-600 border-purple-600 hover:bg-purple-600 hover:text-white mt-1 w-full text-xs"
                                disabled={actionLoading || event.isRevoked}
                                title={event.isRevoked ? 'Event access is already revoked' : ''}
                              >
                                Revoke Calendar
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleGrantCalendarClick(event._id, event.eventName)}
                                className="bg-purple-600 hover:bg-purple-700 text-white mt-1 w-full text-xs"
                                disabled={actionLoading || event.isRevoked}
                                title={event.isRevoked ? 'Restore event access first' : ''}
                              >
                                Allow Own Calendar
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {confirmAction.type === 'revoke' && 'Confirm Revoke Event Access'}
              {confirmAction.type === 'restore' && 'Confirm Restore Event Access'}
              {confirmAction.type === 'revoke-meeting' && 'Confirm Disable Meeting Creation'}
              {confirmAction.type === 'restore-meeting' && 'Confirm Allow Meeting Creation'}
              {confirmAction.type === 'grant-calendar' && 'Grant Calendar Permission'}
              {confirmAction.type === 'revoke-calendar' && 'Revoke Calendar Permission'}
            </h3>
            <p className="text-gray-600 mb-6">
              {(confirmAction.type === 'revoke' || confirmAction.type === 'restore') && (
                <>
                  Are you sure you want to {confirmAction.type} event access for{' '}
                  <span className="font-semibold">{selectedMember?.firstName} {selectedMember?.lastName}</span>{' '}
                  to the event <span className="font-semibold">{confirmAction.eventName}</span>?
                  {confirmAction.type === 'revoke' && (
                    <span className="block mt-2 text-red-600">
                      The user will no longer be able to see leads from this event.
                    </span>
                  )}
                </>
              )}
              {confirmAction.type === 'revoke-meeting' && (
                <>
                  Are you sure you want to disable meeting creation for{' '}
                  <span className="font-semibold">{selectedMember?.firstName} {selectedMember?.lastName}</span>{' '}
                  on the event <span className="font-semibold">{confirmAction.eventName}</span>?
                  <span className="block mt-2 text-orange-600">
                    The user will not be able to schedule meetings for leads from this event.
                  </span>
                </>
              )}
              {confirmAction.type === 'restore-meeting' && (
                <>
                  Are you sure you want to allow meeting creation for{' '}
                  <span className="font-semibold">{selectedMember?.firstName} {selectedMember?.lastName}</span>{' '}
                  on the event <span className="font-semibold">{confirmAction.eventName}</span>?
                  <span className="block mt-2 text-blue-600">
                    The user will be able to schedule meetings for leads from this event.
                  </span>
                </>
              )}
              {confirmAction.type === 'grant-calendar' && (
                <>
                  Are you sure you want to allow{' '}
                  <span className="font-semibold">{selectedMember?.firstName} {selectedMember?.lastName}</span>{' '}
                  to use their own calendar for <span className="font-semibold">{confirmAction.eventName}</span>?
                  <span className="block mt-2 text-purple-600">
                    The user can connect their own Google/Outlook calendar. Meetings they create will sync to their calendar instead of yours.
                  </span>
                </>
              )}
              {confirmAction.type === 'revoke-calendar' && (
                <>
                  Are you sure you want to revoke calendar permission for{' '}
                  <span className="font-semibold">{selectedMember?.firstName} {selectedMember?.lastName}</span>{' '}
                  on <span className="font-semibold">{confirmAction.eventName}</span>?
                  <span className="block mt-2 text-purple-600">
                    Meetings they create will sync to your calendar instead of theirs.
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
                  confirmAction.type === 'revoke'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : confirmAction.type === 'revoke-meeting'
                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                    : confirmAction.type === 'restore-meeting'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : confirmAction.type === 'grant-calendar' || confirmAction.type === 'revoke-calendar'
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
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

export default TeamMembers;
