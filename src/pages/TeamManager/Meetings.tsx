import React, { useEffect, useState } from "react";
import axios from "../../api/axios.config";
import DashboardLayout from "../../components/DashboardLayout";

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

const TeamManagerMeetings: React.FC = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMeetings = async () => {
      setLoading(true);
      try {
        const res = await axios.get("/team-manager/meetings/team");
        setMeetings(res.data.data);
      } catch (err) {
        setMeetings([]);
      }
      setLoading(false);
    };
    fetchMeetings();
  }, []);

  return (
    <DashboardLayout>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Team Meetings</h2>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#854AE6]"></div>
          </div>
        ) : meetings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No meetings found</h3>
            <p className="text-gray-600 mb-4">No meetings have been scheduled by your team members yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TeamManagerMeetings;
