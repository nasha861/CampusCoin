export interface CategoryBreakdownItem {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
}

export interface MonthlyReport {
  month: string; // 'YYYY-MM'
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  categoryBreakdown: CategoryBreakdownItem[];
  dailySpend: { date: string; amount: number }[];
}

export interface ReportFilters {
  startMonth?: string;
  endMonth?: string;
  categoryId?: string;
}
