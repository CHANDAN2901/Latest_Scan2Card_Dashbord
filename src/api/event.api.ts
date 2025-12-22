import { apiClient } from './axios.config';

export interface CreateEventData {
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
}

export interface UpdateEventData {
  eventName?: string;
  description?: string;
  type?: 'Offline' | 'Online' | 'Hybrid';
  startDate?: string;
  endDate?: string;
  location?: {
    venue?: string;
    address?: string;
    city?: string;
  };
  isActive?: boolean;
}

export interface LicenseKey {
  key: string;
  stallName?: string;
  email?: string;
  expiresAt: string;
  isActive: boolean;
  maxActivations: number;
  usedCount: number;
  usedBy: string[];
  _id: string;
}

export interface Event {
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
  licenseKeys: LicenseKey[];
  exhibitorId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  leadCount?: number;
}

export interface EventsListResponse {
  success: boolean;
  message: string;
  data: {
    events: Event[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface GenerateLicenseKeyData {
  stallName?: string;
  email?: string;
  maxActivations?: number;
  expiresAt: string;
}

export interface BulkLicenseKeyData {
  stallName?: string;
  email?: string;
  maxActivations?: number;
  expiresAt: string;
}

export const eventAPI = {
  create: async (data: CreateEventData): Promise<{ success: boolean; message: string; data: Event }> => {
    try {
      const response = await apiClient.post('/events', data);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Failed to create event');
      }
      throw error;
    }
  },

  getAll: async (page = 1, limit = 10, search = ''): Promise<EventsListResponse> => {
    try {
      const response = await apiClient.get('/events', {
        params: { page, limit, search },
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Failed to fetch events');
      }
      throw error;
    }
  },

  getById: async (id: string): Promise<{ success: boolean; message: string; data: Event }> => {
    try {
      const response = await apiClient.get(`/events/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Failed to fetch event');
      }
      throw error;
    }
  },

  update: async (id: string, data: UpdateEventData): Promise<{ success: boolean; message: string; data: Event }> => {
    try {
      const response = await apiClient.put(`/events/${id}`, data);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Failed to update event');
      }
      throw error;
    }
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await apiClient.delete(`/events/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Failed to delete event');
      }
      throw error;
    }
  },

  generateLicenseKey: async (
    eventId: string,
    data: GenerateLicenseKeyData
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      licenseKey: string;
      stallName?: string;
      email?: string;
      expiresAt: string;
      maxActivations: number;
    };
  }> => {
    try {
      const response = await apiClient.post(`/events/${eventId}/license-keys`, data);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Failed to generate license key');
      }
      throw error;
    }
  },

  bulkGenerateLicenseKeys: async (
    eventId: string,
    licenseKeys: BulkLicenseKeyData[]
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      generatedKeys: Array<{
        licenseKey: string;
        stallName?: string;
        email?: string;
        expiresAt: string;
        maxActivations: number;
      }>;
      errors?: Array<{ row: number; error: string; email?: string }>;
      totalGenerated: number;
      totalErrors: number;
    };
  }> => {
    try {
      const response = await apiClient.post(`/events/${eventId}/license-keys/bulk`, { licenseKeys });
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Failed to generate license keys');
      }
      throw error;
    }
  },

  getLicenseKeys: async (
    eventId: string
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      eventName: string;
      licenseKeys: LicenseKey[];
    };
  }> => {
    try {
      const response = await apiClient.get(`/events/${eventId}/license-keys`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Failed to fetch license keys');
      }
      throw error;
    }
  },

  getDashboardStats: async (): Promise<{
    success: boolean;
    message: string;
    data: {
      totalEvents: number;
      activeEvents: number;
      totalLeads: number;
      teamMembers: number;
    };
  }> => {
    try {
      const response = await apiClient.get('/events/dashboard/stats');
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Failed to fetch dashboard stats');
      }
      throw error;
    }
  },

  getTopEventsByLeads: async (limit = 5): Promise<{
    success: boolean;
    message: string;
    data: {
      topEvents: Array<{
        _id: string;
        eventName: string;
        type: string;
        startDate: string;
        endDate: string;
        isActive: boolean;
        leadCount: number;
      }>;
    };
  }> => {
    try {
      const response = await apiClient.get('/events/dashboard/top-events', {
        params: { limit },
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Failed to fetch top events');
      }
      throw error;
    }
  },

  getLeadsTrend: async (days = 30): Promise<{
    success: boolean;
    message: string;
    data: {
      trends: Array<{ date: string; count: number }>;
    };
  }> => {
    try {
      const response = await apiClient.get('/events/dashboard/leads-trend', {
        params: { days },
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Failed to fetch leads trend');
      }
      throw error;
    }
  },

  getEventPerformance: async (
    limit = 10,
    startDate?: string,
    endDate?: string
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      events: Array<{
        _id: string;
        eventName: string;
        startDate: string;
        endDate: string;
        isActive: boolean;
        isExpired: boolean;
        leadCount: number;
      }>;
    };
  }> => {
    try {
      const response = await apiClient.get('/events/dashboard/event-performance', {
        params: { limit, startDate, endDate },
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Failed to fetch event performance');
      }
      throw error;
    }
  },

  getStallPerformance: async (
    eventId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      stalls: Array<{
        key: string;
        stallName: string;
        email: string;
        eventName: string;
        leadCount: number;
      }>;
    };
  }> => {
    try {
      const response = await apiClient.get('/events/dashboard/stall-performance', {
        params: { eventId, startDate, endDate },
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Failed to fetch stall performance');
      }
      throw error;
    }
  },
};
