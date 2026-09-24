import { httpClient } from '../httpClient';
import type { ApiSuccess } from '@/types/api';
import type { Announcement, AnnouncementPayload } from '@/types/admin';

export const adminAnnouncementsApi = {
  async list(): Promise<Announcement[]> {
    const { data } = await httpClient.get<ApiSuccess<Announcement[]>>('/admin/announcements');
    return data.data;
  },

  async create(payload: AnnouncementPayload): Promise<Announcement> {
    const { data } = await httpClient.post<ApiSuccess<Announcement>>('/admin/announcements', payload);
    return data.data;
  },

  async update(id: string, payload: Partial<AnnouncementPayload>): Promise<Announcement> {
    const { data } = await httpClient.patch<ApiSuccess<Announcement>>(
      `/admin/announcements/${id}`,
      payload,
    );
    return data.data;
  },

  async remove(id: string): Promise<void> {
    await httpClient.delete(`/admin/announcements/${id}`);
  },
};
