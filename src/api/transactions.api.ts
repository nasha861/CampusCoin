import { httpClient } from './httpClient';
import type { ApiSuccess, PaginatedResult } from '@/types/api';
import type { CsvImportPreview, Transaction, TransactionFilters, TransactionPayload } from '@/types/transaction';

export const transactionsApi = {
  async list(filters: TransactionFilters = {}): Promise<PaginatedResult<Transaction>> {
    const { data } = await httpClient.get<ApiSuccess<PaginatedResult<Transaction>>>('/transactions', {
      params: filters,
    });
    return data.data;
  },

  async getById(id: string): Promise<Transaction> {
    const { data } = await httpClient.get<ApiSuccess<Transaction>>(`/transactions/${id}`);
    return data.data;
  },

  async create(payload: TransactionPayload): Promise<Transaction> {
    const { data } = await httpClient.post<ApiSuccess<Transaction>>('/transactions', payload);
    return data.data;
  },

  async update(id: string, payload: Partial<TransactionPayload>): Promise<Transaction> {
    const { data } = await httpClient.patch<ApiSuccess<Transaction>>(`/transactions/${id}`, payload);
    return data.data;
  },

  async remove(id: string): Promise<void> {
    await httpClient.delete(`/transactions/${id}`);
  },

  async previewCsvImport(file: File): Promise<CsvImportPreview> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await httpClient.post<ApiSuccess<CsvImportPreview>>(
      '/transactions/import/preview',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return data.data;
  },

  async confirmCsvImport(rows: CsvImportPreview['rows']): Promise<{ imported: number }> {
    const { data } = await httpClient.post<ApiSuccess<{ imported: number }>>(
      '/transactions/import/confirm',
      { rows },
    );
    return data.data;
  },
};
