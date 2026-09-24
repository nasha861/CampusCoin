import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authService, profileService, tokenService } from '@/services';
import type { LoginCredentials, RegisterPayload } from '@/types/auth';
import type { User } from '@/types/user';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!tokenService.getAccessToken()) {
      setUser(null);
      return;
    }
    try {
      const profile = await profileService.getProfile();
      setUser(profile);
    } catch {
      tokenService.clearTokens();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const result = await authService.login(credentials);
    setUser(result.user);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const result = await authService.register(payload);
    setUser(result.user);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, isLoading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
