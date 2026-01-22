import { apiClient } from './axios.config';

export interface TeamManager {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyName?: string;
}

export interface SendInvitationData {
  subject: string;
  message: string;
  recipients: string[];
  channel: 'email' | 'whatsapp';
}

export interface SendInvitationResult {
  sent: number;
  failed: number;
  failedRecipients: string[];
}

export const invitationAPI = {
  // Get all team managers for the exhibitor (past stall owners)
  getTeamManagers: async (): Promise<{
    success: boolean;
    message: string;
    data: { teamManagers: TeamManager[] };
  }> => {
    try {
      const response = await apiClient.get('/invitations/team-managers');
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Failed to fetch team managers');
      }
      throw error;
    }
  },

  // Send invitations to recipients
  sendInvitations: async (data: SendInvitationData): Promise<{
    success: boolean;
    message: string;
    data: SendInvitationResult;
  }> => {
    try {
      const response = await apiClient.post('/invitations/send', data);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Failed to send invitations');
      }
      throw error;
    }
  },
};
