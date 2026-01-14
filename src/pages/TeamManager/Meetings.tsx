import React, { useEffect, useState } from "react";
import axios from "../../api/axios.config";
import DashboardLayout from "../../components/DashboardLayout";
import { Button } from "@/components/ui/button";

interface Meeting {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  leadId: {
    _id: string;
    details: {
      firstName?: string;
      lastName?: string;
      email?: string;
      company?: string;
    };
    eventId?: string;
  };
  eventId?: {
    _id: string;
    eventName: string;
  };
  title: string;
  meetingMode: string;
  meetingStatus: string;
  startAt: string; // ISO 8601 UTC timestamp
  endAt: string; // ISO 8601 UTC timestamp
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const TeamManagerMeetings: React.FC = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Sorting state
  const [sortBy, setSortBy] = useState<'startAt' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchMeetings();
  }, [currentPage, sortBy, sortOrder]);

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/team-manager/meetings/team", {
        params: {
          page: currentPage,
          limit: 10,
          sortBy,
          sortOrder
        }
      });
      setMeetings(res.data.data || []);
      setPagination(res.data.pagination || { total: 0, page: 1, limit: 10, totalPages: 0, hasNextPage: false, hasPrevPage: false });
    } catch (err) {
      setMeetings([]);
    }
    setLoading(false);
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Team Meetings</h2>
          <p className="text-gray-600">View all meetings scheduled by your team members</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#854AE6]"></div>
          </div>
        ) : !meetings?.length ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No meetings found</h3>
            <p className="text-gray-600 mb-4">No meetings have been scheduled by your team members yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Sort Controls */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {meetings.length} of {pagination.total} meetings
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Sort by:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value as 'startAt' | 'createdAt');
                      setCurrentPage(1);
                    }}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none"
                  >
                    <option value="createdAt">Created Date</option>
                    <option value="startAt">Meeting Date</option>
                  </select>
                  <select
                    value={sortOrder}
                    onChange={(e) => {
                      setSortOrder(e.target.value as 'asc' | 'desc');
                      setCurrentPage(1);
                    }}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#854AE6] focus:border-transparent outline-none"
                  >
                    <option value="desc">Newest First</option>
                    <option value="asc">Oldest First</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Team Member</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Lead</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Event</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Mode</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {meetings.map((meeting) => (
                    <tr key={meeting._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {meeting.userId.firstName} {meeting.userId.lastName}
                          </p>
                          <p className="text-sm text-gray-600">{meeting.userId.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {meeting.leadId.details?.firstName} {meeting.leadId.details?.lastName}
                          </p>
                          <p className="text-sm text-gray-600">{meeting.leadId.details?.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">{meeting.eventId?.eventName || '-'}</td>
                      <td className="px-6 py-4">{meeting.title}</td>
                      <td className="px-6 py-4">{new Date(meeting.startAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        {new Date(meeting.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(meeting.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 capitalize">{meeting.meetingMode}</td>
                      <td className="px-6 py-4 capitalize">{meeting.meetingStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Page {pagination.page} of {pagination.totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={!pagination.hasPrevPage}
                    >
                      Previous
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={!pagination.hasNextPage}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TeamManagerMeetings;
