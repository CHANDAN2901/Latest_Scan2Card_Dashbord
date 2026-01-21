import axiosInstance from './axios.config';

// RSVP Interfaces
export interface Rsvp {
  _id: string;
  eventId: {
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
    isActive: boolean;
    isTrialEvent?: boolean;
  };
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
  };
  addedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  eventLicenseKey: string;
  expiresAt?: string;
  status: number;
  isActive: boolean;
  isDeleted: boolean;
  isRevoked: boolean;
  stallName?: string; // Added from license key matching
  // Meeting permission
  canCreateMeeting: boolean;
  // Calendar permission - allows user to use their own Google/Outlook calendar
  canUseOwnCalendar: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RsvpListResponse {
  success: boolean;
  data: {
    rsvps: Rsvp[];
    pagination: {
      total: number;
      page: number;
      pages: number;
      limit: number;
    };
  };
}

export interface CreateRsvpData {
  rsvpLicenseKey: string;
}

export interface ValidateLicenseKeyResponse {
  success: boolean;
  data: {
    valid: boolean;
    event: {
      id: string;
      name: string;
      type: string;
      startDate: string;
      endDate: string;
      location?: {
        venue?: string;
        address?: string;
        city?: string;
      };
    };
    licenseKey: {
      stallName?: string;
      isActive: boolean;
      expiresAt?: string;
      remainingActivations: number;
      isExpired: boolean;
      isMaxedOut: boolean;
    };
  };
}

// RSVP API Service
export const rsvpAPI = {
  // Validate license key before registration
  validateLicenseKey: async (licenseKey: string): Promise<ValidateLicenseKeyResponse> => {
    try {
      const response = await axiosInstance.post('/rsvp/validate', { licenseKey });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to validate license key');
    }
  },

  // Create RSVP (register for event)
  create: async (data: CreateRsvpData): Promise<{ success: boolean; message: string; data: { rsvp: Rsvp } }> => {
    try {
      const response = await axiosInstance.post('/rsvp', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to register for event');
    }
  },

  // Get user's RSVPs
  getMyRsvps: async (page = 1, limit = 10): Promise<RsvpListResponse> => {
    try {
      const response = await axiosInstance.get('/rsvp/my-rsvps', {
        params: { page, limit },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch RSVPs');
    }
  },

  // Get single RSVP details
  getById: async (rsvpId: string): Promise<{ success: boolean; data: { rsvp: Rsvp } }> => {
    try {
      const response = await axiosInstance.get(`/rsvp/${rsvpId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch RSVP details');
    }
  },

  // Cancel RSVP
  cancel: async (rsvpId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await axiosInstance.delete(`/rsvp/${rsvpId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to cancel RSVP');
    }
  },

  // Get event RSVPs (for exhibitors)
  getEventRsvps: async (eventId: string, page = 1, limit = 10): Promise<RsvpListResponse> => {
    try {
      const response = await axiosInstance.get(`/rsvp/event/${eventId}`, {
        params: { page, limit },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch event RSVPs');
    }
  },
};

export default rsvpAPI;
