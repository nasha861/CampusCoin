import { httpClient } from './httpClient';
import type { ApiSuccess } from '@/types/api';
import type { MonthlyReport, ReportFilters } from '@/types/report';

export const reportsApi = {
  async getMonthlyReport(month: string, filters: ReportFilters = {}): Promise<MonthlyReport> {
    const { data } = await httpClient.get<ApiSuccess<MonthlyReport>>('/reports/monthly', {
      params: { month, ...filters },
    });
    return data.data;
  },
};
