import { httpClient } from './httpClient';
import type { ApiSuccess } from '@/types/api';
import type { Bookmark, BookmarkTargetType, Insight, SavingTip } from '@/types/insight';

export const insightsApi = {
  async listInsights(month?: string): Promise<Insight[]> {
    const { data } = await httpClient.get<ApiSuccess<Insight[]>>('/insights', { params: { month } });
    return data.data;
  },

  async listSavingTips(): Promise<SavingTip[]> {
    const { data } = await httpClient.get<ApiSuccess<SavingTip[]>>('/saving-tips');
    return data.data;
  },

  async listBookmarks(): Promise<Bookmark[]> {
    const { data } = await httpClient.get<ApiSuccess<Bookmark[]>>('/bookmarks');
    return data.data;
  },

  async addBookmark(targetType: BookmarkTargetType, targetId: string): Promise<Bookmark> {
    const { data } = await httpClient.post<ApiSuccess<Bookmark>>('/bookmarks', { targetType, targetId });
    return data.data;
  },

  async removeBookmark(id: string): Promise<void> {
    await httpClient.delete(`/bookmarks/${id}`);
  },
};
