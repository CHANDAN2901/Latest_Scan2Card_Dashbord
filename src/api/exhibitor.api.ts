import { apiClient } from './axios.config';

export interface CreateExhibitorData {
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  companyName?: string;
  password?: string;
  address?: string;
}

export interface UpdateExhibitorData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  companyName?: string;
  password?: string;
  address?: string;
  isActive?: boolean;
}

export interface Exhibitor {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  role: string;
  companyName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  eventCount?: number;
  keyCount?: number;
}

export interface LicenseKey {
  _id: string;
  key: string;
  stallName?: string;
  email: string;
  maxActivations: number;
  usedCount: number;
  isActive: boolean;
  expiresAt: string;
  paymentStatus: "pending" | "completed";
  eventName: string;
  eventId: string;
  usagePercentage: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExhibitorKeysResponse {
  success: boolean;
  message: string;
  data: {
    exhibitor: {
      _id: string;
      firstName: string;
      lastName: string;
      email?: string;
      companyName?: string;
    };
    keys: LicenseKey[];
    totalKeys: number;
  };
}

export interface TopPerformer {
  userId: string;
  firstName: string;
  lastName: string;
  email?: string;
  companyName?: string;
  eventCount?: number;
  totalKeys?: number;
  usedKeysCount?: number;
  totalScans?: number;
}

export interface TopPerformersResponse {
  success: boolean;
  message: string;
  data: {
    mostEventsCreated: TopPerformer[];
    mostKeysCreated: TopPerformer[];
    mostLicenseKeyUsage: TopPerformer[];
  };
}

export interface ExhibitorResponse {
  success: boolean;
  message: string;
  data: {
    user: Exhibitor;
  };
  temporaryPassword?: string;
}

export interface ExhibitorsListResponse {
  success: boolean;
  message: string;
  data: {
    exhibitors: Exhibitor[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export const exhibitorAPI = {
  create: async (data: CreateExhibitorData): Promise<ExhibitorResponse> => {
    try {
      const response = await apiClient.post('/admin/exhibitors', data);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Failed to create exhibitor');
      }
      throw error;
    }
  },

  getAll: async (page = 1, limit = 10, search = ''): Promise<ExhibitorsListResponse> => {
    try {
      const response = await apiClient.get('/admin/exhibitors', {
        params: { page, limit, search },
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Failed to fetch exhibitors');
      }
      throw error;
    }
  },

  getById: async (id: string): Promise<{ success: boolean; message: string; data: Exhibitor }> => {
    try {
      const response = await apiClient.get(`/admin/exhibitors/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Failed to fetch exhibitor');
      }
      throw error;
    }
  },

  update: async (id: string, data: UpdateExhibitorData): Promise<{ success: boolean; message: string; data: Exhibitor }> => {
    try {
      const response = await apiClient.put(`/admin/exhibitors/${id}`, data);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Failed to update exhibitor');
      }
      throw error;
    }
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await apiClient.delete(`/admin/exhibitors/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Failed to delete exhibitor');
      }
      throw error;
    }
  },

  getTopPerformers: async (): Promise<TopPerformersResponse> => {
    try {
      const response = await apiClient.get('/admin/exhibitors/top-performers');
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Failed to fetch top performers');
      }
      throw error;
    }
  },

  getExhibitorKeys: async (exhibitorId: string): Promise<ExhibitorKeysResponse> => {
    try {
      const response = await apiClient.get(`/admin/exhibitors/${exhibitorId}/keys`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Failed to fetch exhibitor keys');
      }
      throw error;
    }
  },

  // Only accessible by SUPERADMIN
  updateKeyPaymentStatus: async (
    eventId: string,
    keyId: string,
    paymentStatus: "pending" | "completed"
  ): Promise<{ success: boolean; message: string; data: any }> => {
    try {
      const response = await apiClient.put(`/admin/events/${eventId}/keys/${keyId}/payment-status`, {
        paymentStatus,
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Failed to update payment status');
      }
      throw error;
    }
  },
};
