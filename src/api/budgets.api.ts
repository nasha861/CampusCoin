import { httpClient } from './httpClient';
import type { ApiSuccess } from '@/types/api';
import type { Budget, BudgetPayload, BudgetSummary } from '@/types/budget';

export const budgetsApi = {
  async getSummary(month: string): Promise<BudgetSummary> {
    const { data } = await httpClient.get<ApiSuccess<BudgetSummary>>('/budgets', {
      params: { month },
    });
    return data.data;
  },

  async create(payload: BudgetPayload): Promise<Budget> {
    const { data } = await httpClient.post<ApiSuccess<Budget>>('/budgets', payload);
    return data.data;
  },

  async update(id: string, payload: Partial<BudgetPayload>): Promise<Budget> {
    const { data } = await httpClient.patch<ApiSuccess<Budget>>(`/budgets/${id}`, payload);
    return data.data;
  },

  async remove(id: string): Promise<void> {
    await httpClient.delete(`/budgets/${id}`);
  },
};
