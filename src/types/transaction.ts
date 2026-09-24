import type { CategoryType } from './category';

export type TransactionSource = 'manual' | 'csv-import' | 'ai-suggested';

export interface Transaction {
  id: string;
  userId: string;
  categoryId: string;
  type: CategoryType;
  amount: number;
  description?: string;
  merchant?: string;
  occurredAt: string;
  source: TransactionSource;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionPayload {
  categoryId: string;
  type: CategoryType;
  amount: number;
  description?: string;
  merchant?: string;
  occurredAt: string;
}

export interface TransactionFilters {
  categoryId?: string;
  type?: CategoryType;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CsvImportRow {
  occurredAt: string;
  description: string;
  amount: number;
  suggestedCategoryId?: string;
}

export interface CsvImportPreview {
  rows: CsvImportRow[];
  totalRows: number;
  invalidRows: number;
}
