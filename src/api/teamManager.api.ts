import axiosInstance from './axios.config';

export interface TeamMemberStats {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  isActive: boolean;
  leadCount: number;
  joinedAt: string;
}

export interface DashboardStats {
  totalMembers: number;
  totalLeads: number;
  totalLicenseKeys: number;
  licenseKeys: Array<{
    key: string;
    email: string;
    stallName?: string;
    expiresAt: string;
    usedCount: number;
    maxActivations: number;
  }>;
}

export interface LeadsGraphData {
  period: 'hourly' | 'daily';
  eventName: string;
  startDate: string;
  endDate: string;
  graphData: Array<{
    label: string;
    count: number;
  }>;
}

export interface TeamManagerEvent {
  _id: string;
  eventName: string;
  description?: string;
  type: 'Offline' | 'Online' | 'Hybrid';
  startDate: string;
  endDate: string;
  location?: {
    venue?: string;
    address?: string;
    city?: string;
  };
  exhibitor: {
    firstName: string;
    lastName: string;
    companyName?: string;
  };
  myLicenseKeys: Array<{
    key: string;
    stallName?: string;
    expiresAt: string;
    usedCount: number;
    maxActivations: number;
  }>;
}

export interface LicenseKey {
  key: string;
  email: string;
  stallName?: string;
  expiresAt: string;
  usedCount: number;
  maxActivations: number;
  eventId: string;
  eventName: string;
  leadCount: number;
}

export interface LicenseKeysResponse {
  licenseKeys: LicenseKey[];
  pagination: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

export interface MemberEvent {
  _id: string;
  eventName: string;
  description?: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isRevoked: boolean;
  revokedAt?: string;
  revokedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  licenseKey?: string;
  // Meeting permission fields
  canCreateMeeting: boolean;
  meetingPermissionRevokedAt?: string;
  meetingPermissionRevokedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  // Calendar permission fields
  canUseOwnCalendar: boolean;
  calendarPermissionGrantedAt?: string;
  calendarPermissionGrantedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

// License key meeting permission status
export interface LicenseKeyMeetingPermissionStatus {
  licenseKey: string;
  allowTeamMeetings: boolean;
  totalMembers: number;
  revokedMembers: number;
  activeMembers: number;
  meetingPermissionUpdatedAt?: string;
}

// Bulk meeting permission response
export interface BulkMeetingPermissionResponse {
  modifiedCount: number;
  licenseKey: string;
  message: string;
}

const teamManagerAPI = {
  // Get leads for a specific team member (filtered to events managed by this team manager)
  getMemberLeads: async (memberId: string) => {
    const response = await axiosInstance.get<{ success: boolean; data: any[] }>(`/team-manager/team/member/${memberId}/leads`);
    return response.data.data;
  },
  // Get dashboard stats
  getDashboardStats: async () => {
    const response = await axiosInstance.get<{ success: boolean; data: DashboardStats }>('/team-manager/dashboard/stats');
    return response.data.data;
  },

  // Get leads graph data
  getLeadsGraph: async (eventId: string, period: 'hourly' | 'daily' = 'hourly') => {
    const response = await axiosInstance.get<{ success: boolean; data: LeadsGraphData }>('/team-manager/leads/graph', {
      params: { eventId, period },
    });
    return response.data.data;
  },

  // Get team members with lead count
  getTeamMembers: async (page = 1, limit = 10, search = '') => {
    const response = await axiosInstance.get('/team-manager/team/members', {
      params: { page, limit, search },
    });
    return response.data.data;
  },

  // Get my events
  getMyEvents: async () => {
    const response = await axiosInstance.get<{ success: boolean; data: TeamManagerEvent[] }>('/team-manager/events');
    return response.data.data;
  },

  // Get all license keys with pagination
  getAllLicenseKeys: async (page = 1, limit = 10, search = '') => {
    const response = await axiosInstance.get<{ success: boolean; data: LicenseKeysResponse }>('/team-manager/license-keys', {
      params: { page, limit, search },
    });
    return response.data.data;
  },

  // Get team member's events with revocation status
  getTeamMemberEvents: async (memberId: string) => {
    const response = await axiosInstance.get<{ success: boolean; data: MemberEvent[] }>(`/team-manager/team/member/${memberId}/events`);
    return response.data.data;
  },

  // Revoke event access for a team member
  revokeEventAccess: async (memberId: string, eventId: string) => {
    const response = await axiosInstance.patch<{ success: boolean; message: string }>(`/team-manager/team/member/${memberId}/revoke-access`, {
      eventId,
    });
    return response.data;
  },

  // Restore event access for a team member
  restoreEventAccess: async (memberId: string, eventId: string) => {
    const response = await axiosInstance.patch<{ success: boolean; message: string }>(`/team-manager/team/member/${memberId}/restore-access`, {
      eventId,
    });
    return response.data;
  },

  // ==========================================
  // MEETING PERMISSION MANAGEMENT APIs
  // ==========================================

  // Revoke meeting permission for a single team member
  revokeMeetingPermission: async (memberId: string, eventId: string) => {
    const response = await axiosInstance.patch<{ success: boolean; message: string }>(`/team-manager/team/member/${memberId}/revoke-meeting-permission`, {
      eventId,
    });
    return response.data;
  },

  // Restore meeting permission for a single team member
  restoreMeetingPermission: async (memberId: string, eventId: string) => {
    const response = await axiosInstance.patch<{ success: boolean; message: string }>(`/team-manager/team/member/${memberId}/restore-meeting-permission`, {
      eventId,
    });
    return response.data;
  },

  // Bulk revoke meeting permission for all team members by license key
  bulkRevokeMeetingPermission: async (eventId: string, licenseKey: string) => {
    const response = await axiosInstance.patch<{ success: boolean; message: string; data: BulkMeetingPermissionResponse }>('/team-manager/license-key/bulk-revoke-meeting-permission', {
      eventId,
      licenseKey,
    });
    return response.data;
  },

  // Bulk restore meeting permission for all team members by license key
  bulkRestoreMeetingPermission: async (eventId: string, licenseKey: string) => {
    const response = await axiosInstance.patch<{ success: boolean; message: string; data: BulkMeetingPermissionResponse }>('/team-manager/license-key/bulk-restore-meeting-permission', {
      eventId,
      licenseKey,
    });
    return response.data;
  },

  // Get license key meeting permission status
  getLicenseKeyMeetingPermissionStatus: async (eventId: string, licenseKey: string) => {
    const response = await axiosInstance.get<{ success: boolean; data: LicenseKeyMeetingPermissionStatus }>('/team-manager/license-key/meeting-permission-status', {
      params: { eventId, licenseKey },
    });
    return response.data.data;
  },

  // ==========================================
  // CALENDAR PERMISSION MANAGEMENT APIs
  // ==========================================

  // Grant calendar permission to a team member (allows them to use their own calendar)
  grantCalendarPermission: async (memberId: string, eventId: string) => {
    const response = await axiosInstance.patch<{ success: boolean; message: string }>(`/team-manager/team/member/${memberId}/grant-calendar-permission`, {
      eventId,
    });
    return response.data;
  },

  // Revoke calendar permission from a team member
  revokeCalendarPermission: async (memberId: string, eventId: string) => {
    const response = await axiosInstance.patch<{ success: boolean; message: string }>(`/team-manager/team/member/${memberId}/revoke-calendar-permission`, {
      eventId,
    });
    return response.data;
  },
};

export default teamManagerAPI;
