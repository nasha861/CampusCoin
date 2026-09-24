import { AUTH_TOKEN_STORAGE_KEY, REFRESH_TOKEN_STORAGE_KEY } from '@/constants/config';

export const tokenService = {
  getAccessToken(): string | null {
    return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  },

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
  },

  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
  },

  clearTokens(): void {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  },
};
