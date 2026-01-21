import { apiClient } from './axios.config';

// ============================================
// Calendar Feed (iCal Subscription) Types
// ============================================

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

// ============================================
// Calendar OAuth Integration Types
// ============================================

export interface CalendarOAuthStatus {
  isConnected: boolean;
  provider: 'google' | 'outlook' | null;
  email: string | null;
  connectedAt: string | null;
  isTokenValid: boolean | null;
  availableProviders: {
    google: boolean;
    outlook: boolean;
  };
}

export interface InitiateOAuthResponse {
  authUrl: string;
  provider: 'google' | 'outlook';
}

const calendarApi = {
  // ============================================
  // Calendar Feed APIs (iCal Subscription - Fallback)
  // ============================================

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

  // ============================================
  // Calendar OAuth APIs (Google & Microsoft Integration)
  // ============================================

  // Get OAuth connection status and available providers
  getOAuthStatus: async (): Promise<CalendarOAuthStatus> => {
    const response = await apiClient.get('/calendar/oauth/status');
    return response.data.data;
  },

  // Initiate Google OAuth flow
  initiateGoogleOAuth: async (): Promise<InitiateOAuthResponse> => {
    const response = await apiClient.get('/calendar/oauth/google');
    return response.data.data;
  },

  // Initiate Microsoft Outlook OAuth flow
  initiateOutlookOAuth: async (): Promise<InitiateOAuthResponse> => {
    const response = await apiClient.get('/calendar/oauth/outlook');
    return response.data.data;
  },

  // Disconnect calendar integration
  disconnectCalendar: async (): Promise<void> => {
    await apiClient.delete('/calendar/oauth/disconnect');
  },
};

export default calendarApi;
