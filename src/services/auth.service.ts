import { authApi } from '@/api/auth.api';
import { tokenService } from './token.service';
import type {
  AuthResponse,
  ForgotPasswordPayload,
  LoginCredentials,
  RegisterPayload,
  ResetPasswordPayload,
} from '@/types/auth';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const result = await authApi.login(credentials);
    tokenService.setTokens(result.accessToken, result.refreshToken);
    return result;
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const result = await authApi.register(payload);
    tokenService.setTokens(result.accessToken, result.refreshToken);
    return result;
  },

  async logout(): Promise<void> {
    try {
      await authApi.logout();
    } finally {
      tokenService.clearTokens();
    }
  },

  forgotPassword(payload: ForgotPasswordPayload): Promise<void> {
    return authApi.forgotPassword(payload);
  },

  resetPassword(payload: ResetPasswordPayload): Promise<void> {
    return authApi.resetPassword(payload);
  },

  isAuthenticated(): boolean {
    return Boolean(tokenService.getAccessToken());
  },
};
