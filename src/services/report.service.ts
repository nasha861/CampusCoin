import { reportsApi } from '@/api/reports.api';
import type { MonthlyReport } from '@/types/report';

// Shapes API data into the {name, value}[] format most chart libraries
// (Recharts included) expect, keeping that transform out of components.
export function toChartData(report: MonthlyReport) {
  return report.categoryBreakdown.map((item) => ({
    name: item.categoryName,
    value: item.amount,
    percentage: item.percentage,
  }));
}

export const reportService = {
  ...reportsApi,
  toChartData,
};
