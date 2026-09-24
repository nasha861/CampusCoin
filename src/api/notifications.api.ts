import { httpClient } from './httpClient';
import type { ApiSuccess } from '@/types/api';
import type { AppNotification } from '@/types/notification';

export const notificationsApi = {
  async list(): Promise<AppNotification[]> {
    const { data } = await httpClient.get<ApiSuccess<AppNotification[]>>('/notifications');
    return data.data;
  },

  async markAsRead(id: string): Promise<void> {
    await httpClient.patch(`/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<void> {
    await httpClient.patch('/notifications/read-all');
  },
};
