import { httpClient } from '../httpClient';
import type { ApiSuccess, PaginatedResult } from '@/types/api';
import type { AdminUserSummary } from '@/types/admin';

export interface AdminUserFilters {
  search?: string;
  role?: 'student' | 'admin';
  page?: number;
  pageSize?: number;
}

export const adminUsersApi = {
  async list(filters: AdminUserFilters = {}): Promise<PaginatedResult<AdminUserSummary>> {
    const { data } = await httpClient.get<ApiSuccess<PaginatedResult<AdminUserSummary>>>(
      '/admin/users',
      { params: filters },
    );
    return data.data;
  },

  async getById(id: string): Promise<AdminUserSummary> {
    const { data } = await httpClient.get<ApiSuccess<AdminUserSummary>>(`/admin/users/${id}`);
    return data.data;
  },

  async setActive(id: string, isActive: boolean): Promise<AdminUserSummary> {
    const { data } = await httpClient.patch<ApiSuccess<AdminUserSummary>>(`/admin/users/${id}`, {
      isActive,
    });
    return data.data;
  },

  async remove(id: string): Promise<void> {
    await httpClient.delete(`/admin/users/${id}`);
  },
};
