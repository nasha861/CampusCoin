import { httpClient } from '../httpClient';
import type { ApiSuccess } from '@/types/api';
import type { Category, CategoryPayload } from '@/types/category';

export const adminCategoriesApi = {
  async list(): Promise<Category[]> {
    const { data } = await httpClient.get<ApiSuccess<Category[]>>('/admin/categories');
    return data.data;
  },

  async create(payload: CategoryPayload): Promise<Category> {
    const { data } = await httpClient.post<ApiSuccess<Category>>('/admin/categories', payload);
    return data.data;
  },

  async update(id: string, payload: Partial<CategoryPayload>): Promise<Category> {
    const { data } = await httpClient.patch<ApiSuccess<Category>>(`/admin/categories/${id}`, payload);
    return data.data;
  },

  async remove(id: string): Promise<void> {
    await httpClient.delete(`/admin/categories/${id}`);
  },
};
