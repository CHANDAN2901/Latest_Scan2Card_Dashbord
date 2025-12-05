import React, { useEffect, useState } from "react";
import axios from "../../api/axios.config";

interface TeamMember {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface EventInfo {
  _id: string;
  eventName: string;
}

interface Lead {
  _id: string;
  userId: string;
  eventId: string;
  scannedCardImage: string;
  details: any;
  createdAt: string;
}

const TeamManagerLeads: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [events, setEvents] = useState<EventInfo[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    // Fetch team members
    axios.get("/team-manager/team/members").then(res => {
      setTeamMembers(res.data.data.members || []);
    });
    // Fetch events
    axios.get("/team-manager/events").then(res => {
      setEvents(res.data.data || []);
    });
    // Fetch all leads initially
    fetchLeads();
  }, []);

  const fetchLeads = async (memberId = "", eventId = "") => {
    setLoading(true);
    try {
      let res;
      if (!memberId) {
        // Fetch all leads for all events managed by this team manager, with optional event filter
        const params: any = {};
        if (eventId) params.eventId = eventId;
        res = await axios.get("/team-manager/leads/all", { params });
      } else {
        // Fetch leads for a specific member (optionally filtered by event)
        res = await axios.get(`/team-manager/leads/all`, { params: { memberId, eventId } });
      }
      console.log("[DEBUG] API response for leads:", res.data);
      setLeads(res.data.data);
    } catch (err) {
      console.error("[DEBUG] Error fetching leads:", err);
      setLeads([]);
    }
    setLoading(false);
  };

  const handleMemberChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMember(e.target.value);
    fetchLeads(e.target.value, selectedEvent);
  };

  const handleEventChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedEvent(e.target.value);
    fetchLeads(selectedMember, e.target.value);
  };

  // Filtered leads based on search
  const filteredLeads = leads.filter(lead => {
    const member = teamMembers.find(m => m._id === lead.userId);
    const event = events.find(e => e._id === lead.eventId);
    const searchLower = search.toLowerCase();
    return (
      (!search ||
        (lead.details?.firstName?.toLowerCase().includes(searchLower)) ||
        (lead.details?.lastName?.toLowerCase().includes(searchLower)) ||
        (lead.details?.email?.toLowerCase().includes(searchLower)) ||
        (member && (member.firstName + ' ' + member.lastName).toLowerCase().includes(searchLower)) ||
        (event && event.eventName.toLowerCase().includes(searchLower))
      )
    );
  });

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Team Leads</h2>
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <select value={selectedMember} onChange={handleMemberChange} className="border p-2 rounded min-w-[200px]">
          <option value="">Filter by Team Member</option>
          {teamMembers.map(member => (
            <option key={member._id} value={member._id}>
              {member.firstName} {member.lastName} ({member.email})
            </option>
          ))}
        </select>
        <select value={selectedEvent} onChange={handleEventChange} className="border p-2 rounded min-w-[200px]">
          <option value="">Filter by Event</option>
          {events.map(event => (
            <option key={event._id} value={event._id}>{event.eventName}</option>
          ))}
        </select>
        <input
          type="text"
          className="border p-2 rounded min-w-[220px] flex-1"
          placeholder="Search by name, email, event..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Leads Table */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#854AE6]"></div>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No leads found</h3>
          <p className="text-gray-600 mb-4">No leads have been captured for the selected filters or search.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Team Member</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Event</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Lead Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Scanned Card</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLeads.map(lead => (
                  <tr key={lead._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {teamMembers.find(m => m._id === lead.userId)?.firstName || "-"}
                        </p>
                        <p className="text-sm text-gray-600">{teamMembers.find(m => m._id === lead.userId)?.email || "-"}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{events.find(e => e._id === lead.eventId)?.eventName || "-"}</td>
                    <td className="px-6 py-4">{lead.details?.firstName} {lead.details?.lastName}</td>
                    <td className="px-6 py-4">{lead.details?.email}</td>
                    <td className="px-6 py-4">
                      {lead.scannedCardImage ? <img src={lead.scannedCardImage} alt="Scanned Card" className="h-12 rounded shadow" /> : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(lead.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagerLeads;
