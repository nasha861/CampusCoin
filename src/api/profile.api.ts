import { httpClient } from './httpClient';
import type { ApiSuccess } from '@/types/api';
import type { User, UserProfileUpdate, UserSettings } from '@/types/user';

export const profileApi = {
  async getProfile(): Promise<User> {
    const { data } = await httpClient.get<ApiSuccess<User>>('/profile');
    return data.data;
  },

  async updateProfile(payload: UserProfileUpdate): Promise<User> {
    const { data } = await httpClient.patch<ApiSuccess<User>>('/profile', payload);
    return data.data;
  },

  async getSettings(): Promise<UserSettings> {
    const { data } = await httpClient.get<ApiSuccess<UserSettings>>('/profile/settings');
    return data.data;
  },

  async updateSettings(payload: Partial<UserSettings>): Promise<UserSettings> {
    const { data } = await httpClient.patch<ApiSuccess<UserSettings>>('/profile/settings', payload);
    return data.data;
  },
};
