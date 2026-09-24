import { httpClient } from './httpClient';
import type {
  AuthResponse,
  ForgotPasswordPayload,
  LoginCredentials,
  RegisterPayload,
  ResetPasswordPayload,
} from '@/types/auth';
import type { ApiSuccess } from '@/types/api';

export const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data } = await httpClient.post<ApiSuccess<AuthResponse>>('/auth/login', credentials);
    return data.data;
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { data } = await httpClient.post<ApiSuccess<AuthResponse>>('/auth/register', payload);
    return data.data;
  },

  async logout(): Promise<void> {
    await httpClient.post('/auth/logout');
  },

  async forgotPassword(payload: ForgotPasswordPayload): Promise<void> {
    await httpClient.post('/auth/forgot-password', payload);
  },

  async resetPassword(payload: ResetPasswordPayload): Promise<void> {
    await httpClient.post('/auth/reset-password', payload);
  },

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const { data } = await httpClient.post<ApiSuccess<AuthResponse>>('/auth/refresh', {
      refreshToken,
    });
    return data.data;
  },
};
