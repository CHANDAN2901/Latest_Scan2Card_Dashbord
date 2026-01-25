import React, { useEffect, useState } from "react";
import axios from "../../api/axios.config";
import MultiInput from "@/components/ui/MultiInput";
import leadApi from "../../api/lead.api";

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
  images?: string[];
  details: any;
  createdAt: string;
  rating?: number;
}

interface DrawerState {
  isOpen: boolean;
  lead: Lead | null;
  isEditing: boolean;
}

const TeamManagerLeads: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [events, setEvents] = useState<EventInfo[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [drawer, setDrawer] = useState<DrawerState>({
    isOpen: false,
    lead: null,
    isEditing: false,
  });
  const [editedLead, setEditedLead] = useState<Lead | null>(null);
  const [saving, setSaving] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);
  const leadsPerPage = 10;

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

  const fetchLeads = async (memberId = "", eventId = "", page = 1) => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit: leadsPerPage,
      };
      if (memberId) params.memberId = memberId;
      if (eventId) params.eventId = eventId;
      if (search) params.search = search;

      const res = await axios.get("/team-manager/leads", { params });
      console.log("[DEBUG] API response for leads:", res.data);

      // Handle different response structures
      if (res.data.data) {
        setLeads(Array.isArray(res.data.data) ? res.data.data : res.data.data.leads || []);
      } else {
        setLeads([]);
      }

      // Update pagination info
      if (res.data.pagination) {
        setTotalPages(res.data.pagination.pages || res.data.pagination.totalPages || 1);
        setTotalLeads(res.data.pagination.total || 0);
      } else if (res.data.data?.pagination) {
        setTotalPages(res.data.data.pagination.pages || res.data.data.pagination.totalPages || 1);
        setTotalLeads(res.data.data.pagination.total || 0);
      }
    } catch (err) {
      console.error("[DEBUG] Error fetching leads:", err);
      setLeads([]);
    }
    setLoading(false);
  };

  const handleMemberChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMember(e.target.value);
    setCurrentPage(1);
    fetchLeads(e.target.value, selectedEvent, 1);
  };

  const handleEventChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedEvent(e.target.value);
    setCurrentPage(1);
    fetchLeads(selectedMember, e.target.value, 1);
  };

  const openDrawer = (lead: Lead) => {
    setDrawer({ isOpen: true, lead, isEditing: false });
    setEditedLead(JSON.parse(JSON.stringify(lead)));
  };

  const closeDrawer = () => {
    setDrawer({ isOpen: false, lead: null, isEditing: false });
    setEditedLead(null);
  };

  const enableEdit = () => {
    setDrawer(prev => ({ ...prev, isEditing: true }));
  };

  const handleEditChange = (field: string, value: any) => {
    setEditedLead(prev => {
      if (!prev) return null;
      return {
        ...prev,
        details: {
          ...prev.details,
          [field]: value,
        },
      };
    });
  };

  const handleRatingChange = (rating: number) => {
    setEditedLead(prev => {
      if (!prev) return null;
      return {
        ...prev,
        rating,
      };
    });
  };

  const saveLead = async () => {
    if (!editedLead) return;
    setSaving(true);
    try {
      await axios.put(`/leads/${editedLead._id}`, {
        details: editedLead.details,
        rating: editedLead.rating,
      });

      // Update the leads list
      setLeads(leads.map(l => l._id === editedLead._id ? editedLead : l));
      setDrawer({ isOpen: false, lead: null, isEditing: false });
      setEditedLead(null);
    } catch (err) {
      console.error("Error saving lead:", err);
      alert("Failed to save lead");
    } finally {
      setSaving(false);
    }
  };

  // Export functions
  const handleExportAllData = async () => {
    try {
      setExportLoading(true);
      await leadApi.exportLeads({
        type: 'all',
        eventId: selectedEvent || undefined,
        search: search || undefined,
      });
    } catch (error: any) {
      console.error('Export error:', error);
      alert('Failed to export leads data');
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportEntryOnly = async () => {
    try {
      setExportLoading(true);
      await leadApi.exportLeads({
        type: 'entryOnly',
        eventId: selectedEvent || undefined,
        search: search || undefined,
      });
    } catch (error: any) {
      console.error('Export error:', error);
      alert('Failed to export entry codes');
    } finally {
      setExportLoading(false);
    }
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchLeads(selectedMember, selectedEvent, 1);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  // Fetch leads when page changes
  useEffect(() => {
    fetchLeads(selectedMember, selectedEvent, currentPage);
  }, [currentPage]);

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Team Leads</h2>
          <p className="text-gray-600 mt-1">View and manage all captured leads by your team</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleExportAllData}
            disabled={exportLoading}
            className="px-4 py-2 bg-[#854AE6] hover:bg-[#6F33C5] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exportLoading ? 'Exporting...' : 'Export with All Data'}
          </button>
          <button
            onClick={handleExportEntryOnly}
            disabled={exportLoading}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exportLoading ? 'Exporting...' : 'Export Entry Key Only'}
          </button>
        </div>
      </div>
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
      ) : leads.length === 0 ? (
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
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Phone Number</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Scanned Card</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {leads.map((lead) => (
                  <tr
                    key={lead._id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => openDrawer(lead)}
                  >
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
                    <td className="px-6 py-4">
                      {lead.details?.emails && lead.details.emails.length > 0 ? (
                        lead.details.emails.map((e: string, i: number) => <div key={i}>{e}</div>)
                      ) : (
                        lead.details?.email
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {lead.details?.phoneNumbers && lead.details.phoneNumbers.length > 0 ? (
                        lead.details.phoneNumbers.map((p: string, i: number) => <div key={i}>{p}</div>)
                      ) : (
                        lead.details?.phoneNumber || '-'
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {lead.images && lead.images.length > 0 ? (
                        <img src={lead.images[0]} alt="Scanned Card" className="h-12 rounded shadow" />
                      ) : lead.scannedCardImage ? (
                        <img src={lead.scannedCardImage} alt="Scanned Card" className="h-12 rounded shadow" />
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(lead.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && leads.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-600">
                Showing <span className="font-semibold">{((currentPage - 1) * leadsPerPage) + 1}</span> to{' '}
                <span className="font-semibold">{Math.min(currentPage * leadsPerPage, totalLeads)}</span> of{' '}
                <span className="font-semibold">{totalLeads}</span> leads
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  title="First page"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                </button>

                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1.5 text-sm min-w-[40px] rounded-lg border ${currentPage === pageNum
                          ? 'bg-[#854AE6] text-white border-[#854AE6] hover:bg-[#6F33C5]'
                          : 'bg-white border-gray-300 hover:bg-gray-50'
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  Next
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  title="Last page"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lead Details Drawer */}
      {drawer.isOpen && drawer.lead && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-40 z-40 backdrop-blur-sm"
            onClick={closeDrawer}
          />

          {/* Drawer */}
          <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-[#854AE6] to-[#6F33C5] px-6 py-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {drawer.isEditing ? "Edit Lead" : "Lead Details"}
                </h2>
                <p className="text-[#E8D5F8] text-sm mt-1">
                  {drawer.lead.details?.firstName} {drawer.lead.details?.lastName}
                </p>
              </div>
              <button
                onClick={closeDrawer}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-8 space-y-6">
              {/* Source Info Card */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-5 border border-slate-200">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#854AE6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Source Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Team Member</p>
                    <p className="text-gray-900 font-medium mt-1">
                      {drawer.lead && teamMembers.find(m => m._id === drawer.lead!.userId)?.firstName} {drawer.lead && teamMembers.find(m => m._id === drawer.lead!.userId)?.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</p>
                    <p className="text-gray-900 font-medium mt-1 break-all">
                      {drawer.lead && teamMembers.find(m => m._id === drawer.lead!.userId)?.email || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Event</p>
                    <p className="text-gray-900 font-medium mt-1">
                      {drawer.lead && events.find(e => e._id === drawer.lead!.eventId)?.eventName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Created</p>
                    <p className="text-gray-900 font-medium mt-1">
                      {drawer.lead && new Date(drawer.lead.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Lead Information Section */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#854AE6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Contact Information
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  {/* First Name */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">First Name</label>
                    {drawer.isEditing ? (
                      <input
                        type="text"
                        value={editedLead?.details?.firstName || ""}
                        onChange={(e) => handleEditChange("firstName", e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#854AE6] focus:ring-2 focus:ring-[#854AE6]/10 outline-none transition-all"
                        placeholder="Enter first name"
                      />
                    ) : (
                      <p className="text-gray-900 font-medium py-3 px-4 bg-gray-50 rounded-lg">
                        {drawer.lead.details?.firstName || "-"}
                      </p>
                    )}
                  </div>

                  {/* Last Name */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">Last Name</label>
                    {drawer.isEditing ? (
                      <input
                        type="text"
                        value={editedLead?.details?.lastName || ""}
                        onChange={(e) => handleEditChange("lastName", e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#854AE6] focus:ring-2 focus:ring-[#854AE6]/10 outline-none transition-all"
                        placeholder="Enter last name"
                      />
                    ) : (
                      <p className="text-gray-900 font-medium py-3 px-4 bg-gray-50 rounded-lg">
                        {drawer.lead.details?.lastName || "-"}
                      </p>
                    )}
                  </div>

                  {/* Company */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">Company</label>
                    {drawer.isEditing ? (
                      <input
                        type="text"
                        value={editedLead?.details?.company || ""}
                        onChange={(e) => handleEditChange("company", e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#854AE6] focus:ring-2 focus:ring-[#854AE6]/10 outline-none transition-all"
                        placeholder="Enter company"
                      />
                    ) : (
                      <p className="text-gray-900 font-medium py-3 px-4 bg-gray-50 rounded-lg">
                        {drawer.lead.details?.company || "-"}
                      </p>
                    )}
                  </div>

                  {/* Position */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">Position</label>
                    {drawer.isEditing ? (
                      <input
                        type="text"
                        value={editedLead?.details?.position || ""}
                        onChange={(e) => handleEditChange("position", e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#854AE6] focus:ring-2 focus:ring-[#854AE6]/10 outline-none transition-all"
                        placeholder="Enter position"
                      />
                    ) : (
                      <p className="text-gray-900 font-medium py-3 px-4 bg-gray-50 rounded-lg">
                        {drawer.lead.details?.position || "-"}
                      </p>
                    )}
                  </div>

                  {/* Email - Full Width */}
                  <div className="col-span-2 space-y-2">
                    {drawer.isEditing ? (
                      <MultiInput
                        label="Email(s)"
                        values={editedLead?.details?.emails || (editedLead?.details?.email ? [editedLead.details.email] : [])}
                        onChange={(newValues) => {
                          const firstEmail = newValues.length > 0 ? newValues[0] : '';
                          setEditedLead(prev => {
                            if (!prev) return null;
                            return {
                              ...prev,
                              details: {
                                ...prev.details,
                                emails: newValues,
                                email: firstEmail
                              }
                            };
                          });
                        }}
                        type="email"
                        placeholder="Type email & Enter"
                      />
                    ) : (
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">Email(s)</label>
                        <div className="text-gray-900 font-medium py-3 px-4 bg-gray-50 rounded-lg break-all">
                          {drawer.lead.details?.emails && drawer.lead.details.emails.length > 0 ? (
                            drawer.lead.details.emails.map((email: string, idx: number) => (
                              <div key={idx}>{email}</div>
                            ))
                          ) : (
                            drawer.lead.details?.email || "-"
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="col-span-2 space-y-2">
                    {drawer.isEditing ? (
                      <MultiInput
                        label="Phone Number(s)"
                        values={editedLead?.details?.phoneNumbers || (editedLead?.details?.phoneNumber ? [editedLead.details.phoneNumber] : [])}
                        onChange={(newValues) => {
                          const firstPhone = newValues.length > 0 ? newValues[0] : '';
                          setEditedLead(prev => {
                            if (!prev) return null;
                            return {
                              ...prev,
                              details: {
                                ...prev.details,
                                phoneNumbers: newValues,
                                phoneNumber: firstPhone
                              }
                            };
                          });
                        }}
                        type="tel"
                        placeholder="Type number & Enter"
                      />
                    ) : (
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">Phone Number(s)</label>
                        <div className="text-gray-900 font-medium py-3 px-4 bg-gray-50 rounded-lg">
                          {drawer.lead.details?.phoneNumbers && drawer.lead.details.phoneNumbers.length > 0 ? (
                            drawer.lead.details.phoneNumbers.map((phone: string, idx: number) => (
                              <div key={idx}>{phone}</div>
                            ))
                          ) : (
                            drawer.lead.details?.phoneNumber || "-"
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Website */}
                  <div className="col-span-2 space-y-2">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">Website</label>
                    {drawer.isEditing ? (
                      <input
                        type="url"
                        value={editedLead?.details?.website || ""}
                        onChange={(e) => handleEditChange("website", e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#854AE6] focus:ring-2 focus:ring-[#854AE6]/10 outline-none transition-all"
                        placeholder="https://example.com"
                      />
                    ) : (
                      <p className="text-gray-900 font-medium py-3 px-4 bg-gray-50 rounded-lg break-all">
                        {drawer.lead.details?.website ? (
                          <a href={drawer.lead.details.website} target="_blank" rel="noopener noreferrer" className="text-[#854AE6] hover:underline">
                            {drawer.lead.details.website}
                          </a>
                        ) : "-"}
                      </p>
                    )}
                  </div>

                  {/* Notes */}
                  <div className="col-span-2 space-y-2">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">Notes</label>
                    {drawer.isEditing ? (
                      <textarea
                        value={editedLead?.details?.notes || ""}
                        onChange={(e) => handleEditChange("notes", e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#854AE6] focus:ring-2 focus:ring-[#854AE6]/10 outline-none transition-all resize-none"
                        placeholder="Add notes about this lead..."
                      />
                    ) : (
                      <p className="text-gray-900 font-medium py-3 px-4 bg-gray-50 rounded-lg whitespace-pre-wrap">
                        {drawer.lead.details?.notes || "-"}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Rating Section */}
              <div className="space-y-3 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-200">
                <label className="block text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Rating
                </label>
                {drawer.isEditing ? (
                  <div className="flex items-center gap-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRatingChange(star)}
                        className={`text-3xl transition-all transform hover:scale-110 ${star <= (editedLead?.rating || 0) ? "text-amber-400 drop-shadow-md" : "text-gray-300 hover:text-amber-300"
                          }`}
                      >
                        ★
                      </button>
                    ))}
                    {(editedLead?.rating || 0) > 0 && (
                      <span className="text-sm font-medium text-gray-600 ml-2">
                        {editedLead?.rating}/5
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {drawer.lead && drawer.lead.rating ? (
                      <>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`text-2xl ${star <= drawer.lead!.rating! ? "text-amber-400" : "text-gray-300"
                                }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="text-sm font-semibold text-gray-700 ml-2">
                          {drawer.lead.rating.toFixed(1)}/5
                        </span>
                      </>
                    ) : (
                      <p className="text-gray-600 text-sm">No rating assigned yet</p>
                    )}
                  </div>
                )}
              </div>

              {/* Scanned Card Image */}
              {drawer.lead.scannedCardImage && (
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-900">Scanned Business Card</label>
                  <div className="rounded-xl overflow-hidden border-2 border-gray-200 shadow-md">
                    <img src={drawer.lead.scannedCardImage} alt="Scanned Card" className="w-full h-auto" />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t-2 border-gray-100 px-8 py-4 flex items-center justify-end gap-3 shadow-md">
              {drawer.isEditing ? (
                <>
                  <button
                    onClick={() => {
                      setEditedLead(drawer.lead);
                      setDrawer(prev => ({ ...prev, isEditing: false }));
                    }}
                    className="px-5 py-2.5 border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveLead}
                    disabled={saving}
                    className="px-5 py-2.5 bg-gradient-to-r from-[#854AE6] to-[#6F33C5] text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 active:scale-95"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Save Changes
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={closeDrawer}
                    className="px-5 py-2.5 border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-all active:scale-95"
                  >
                    Close
                  </button>
                  <button
                    onClick={enableEdit}
                    className="px-5 py-2.5 bg-gradient-to-r from-[#854AE6] to-[#6F33C5] text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center gap-2 active:scale-95"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TeamManagerLeads;
