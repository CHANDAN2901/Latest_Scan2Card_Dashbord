import axios from './axios.config';

export interface MeetingData {
  _id: string;
  userId: string;
  leadId: {
    _id: string;
    details: {
      firstName?: string;
      lastName?: string;
      company?: string;
      email?: string;
      phoneNumber?: string;
    };
  };
  eventId?: {
    _id: string;
    eventName: string;
  };
  title: string;
  description?: string;
  meetingMode: 'online' | 'offline' | 'phone';
  meetingStatus: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  startAt: string; // ISO 8601 UTC timestamp
  endAt: string; // ISO 8601 UTC timestamp
  location?: string;
  notifyAttendees: boolean;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMeetingData {
  leadId: string;
  eventId?: string;
  title: string;
  description?: string;
  meetingMode: 'online' | 'offline' | 'phone';
  startAt: string; // ISO 8601 UTC timestamp
  endAt: string; // ISO 8601 UTC timestamp
  location?: string;
  notifyAttendees?: boolean;
}

export interface UpdateMeetingData {
  title?: string;
  description?: string;
  meetingMode?: 'online' | 'offline' | 'phone';
  meetingStatus?: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  startAt?: string; // ISO 8601 UTC timestamp
  endAt?: string; // ISO 8601 UTC timestamp
  location?: string;
  notifyAttendees?: boolean;
  isActive?: boolean;
}

export interface GetMeetingsParams {
  page?: number;
  limit?: number;
  leadId?: string;
  eventId?: string;
  meetingStatus?: string;
  meetingMode?: string;
}

const meetingApi = {
  // Create a new meeting
  create: async (data: CreateMeetingData) => {
    const response = await axios.post('/meetings', data);
    return response.data;
  },

  // Get all meetings with pagination and filters
  getAll: async (params?: GetMeetingsParams) => {
    const response = await axios.get('/meetings', { params });
    return {
      meetings: response.data.data as MeetingData[],
      pagination: response.data.pagination,
    };
  },

  // Get meeting by ID
  getById: async (id: string) => {
    const response = await axios.get(`/meetings/${id}`);
    return response.data;
  },

  // Update meeting
  update: async (id: string, data: UpdateMeetingData) => {
    const response = await axios.put(`/meetings/${id}`, data);
    return response.data;
  },

  // Delete meeting
  delete: async (id: string) => {
    const response = await axios.delete(`/meetings/${id}`);
    return response.data;
  },
};

export default meetingApi;
