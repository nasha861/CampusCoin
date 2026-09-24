import { httpClient } from '../httpClient';
import type { ApiSuccess } from '@/types/api';
import type { SystemStatistics } from '@/types/admin';

export const adminStatisticsApi = {
  async getOverview(): Promise<SystemStatistics> {
    const { data } = await httpClient.get<ApiSuccess<SystemStatistics>>('/admin/statistics');
    return data.data;
  },
};
