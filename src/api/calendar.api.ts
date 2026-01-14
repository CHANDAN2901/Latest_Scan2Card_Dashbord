import { apiClient } from './axios.config';

export interface CalendarFeedStatus {
  enabled: boolean;
  hasToken: boolean;
  feedUrl: string | null;
  webcalUrl: string | null;
}

export interface GenerateTokenResponse {
  token: string;
  feedUrl: string;
  webcalUrl: string;
}

const calendarApi = {
  // Get calendar feed status
  getStatus: async (): Promise<CalendarFeedStatus> => {
    const response = await apiClient.get('/calendar/status');
    return response.data.data;
  },

  // Generate new calendar feed token
  generateToken: async (): Promise<GenerateTokenResponse> => {
    const response = await apiClient.post('/calendar/token');
    return response.data.data;
  },

  // Revoke calendar feed token
  revokeToken: async (): Promise<void> => {
    await apiClient.delete('/calendar/token');
  },
};

export default calendarApi;
