export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  role: 'SUPERADMIN' | 'EXHIBITOR' | 'TEAMMANAGER' | 'ENDUSER';
  companyName?: string;
  profileImage?: string;
  isActive?: boolean;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    refreshToken?: string;
    expiresIn?: string;
    user: User;
    requires2FA?: boolean;
    userId?: string;
    email?: string;
  };
}

export interface RefreshTokenResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    expiresIn: string;
    user: User;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}
