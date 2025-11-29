import axios from './axios.config';

export interface LeadDetails {
  firstName?: string;
  lastName?: string;
  company?: string;
  position?: string;
  email?: string;
  phoneNumber?: string;
  website?: string;
  address?: string;
  city?: string;
  country?: string;
  notes?: string;
}

export interface Lead {
  _id: string;
  userId: string;
  eventId?: {
    _id: string;
    eventName: string;
    type: string;
    startDate: string;
    endDate: string;
  };
  isIndependentLead: boolean;
  leadType: "full_scan" | "entry_code" | "manual";
  scannedCardImage?: string;
  entryCode?: string;
  ocrText?: string;
  details?: LeadDetails;
  rating?: number;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeadData {
  eventId?: string;
  isIndependentLead?: boolean;
  leadType?: "full_scan" | "entry_code" | "manual";
  scannedCardImage?: string;
  entryCode?: string;
  ocrText?: string;
  details?: LeadDetails;
  rating?: number;
}

export interface UpdateLeadData {
  eventId?: string;
  isIndependentLead?: boolean;
  leadType?: "full_scan" | "entry_code" | "manual";
  scannedCardImage?: string;
  entryCode?: string;
  ocrText?: string;
  details?: LeadDetails;
  rating?: number;
  isActive?: boolean;
}

export interface LeadStats {
  totalLeads: number;
  activeLeads: number;
  independentLeads: number;
  eventLeads: number;
  ratingDistribution: Array<{ _id: number; count: number }>;
}

export interface GetLeadsParams {
  page?: number;
  limit?: number;
  eventId?: string;
  isIndependentLead?: boolean;
  rating?: number;
  search?: string;
}

export interface ScanCardResponse {
  success: boolean;
  message: string;
  data: {
    scannedCardImage: string;
    ocrText: string;
    details: LeadDetails;
    confidence: number;
  };
}


export interface ScanQRResponse {
  success: boolean;
  message?: string;
  leadType?: "full_scan" | "entry_code" | "manual";
  data?: {
    details?: LeadDetails;
    entryCode?: string;
    rawData: string;
    confidence: number;
  };
  type?: 'url' | 'vcard' | 'plaintext' | 'entry_code';
  confidence?: number;
}


const leadApi = {
  // Scan business card using AI
  scanCard: async (image: string): Promise<ScanCardResponse> => {
    const response = await axios.post('/leads/scan-card', { image });
    return response.data;
  },

  // Scan QR code (digital business card)
  scanQRCode: async (qrText: string): Promise<ScanQRResponse> => {
    const response = await axios.post('/leads/scan-qr', { qrText });
    return response.data;
  },

  // Create a new lead
  create: async (data: CreateLeadData): Promise<Lead> => {
    const response = await axios.post('/leads', data);
    return response.data.data;
  },

  // Get all leads with pagination and filters
  getAll: async (params?: GetLeadsParams) => {
    const response = await axios.get('/leads', { params });
    return {
      leads: response.data.data as Lead[],
      pagination: response.data.pagination,
    };
  },

  // Get lead by ID
  getById: async (id: string): Promise<Lead> => {
    const response = await axios.get(`/leads/${id}`);
    return response.data.data;
  },

  // Update lead
  update: async (id: string, data: UpdateLeadData): Promise<Lead> => {
    const response = await axios.put(`/leads/${id}`, data);
    return response.data.data;
  },

  // Delete lead
  delete: async (id: string): Promise<void> => {
    await axios.delete(`/leads/${id}`);
  },

  // Get lead statistics
  getStats: async (): Promise<LeadStats> => {
    const response = await axios.get('/leads/stats');
    return response.data.data;
  },
};

export default leadApi;
