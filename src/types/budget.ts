export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  month: string; // ISO format 'YYYY-MM'
  limitAmount: number;
  spentAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetPayload {
  categoryId: string;
  month: string;
  limitAmount: number;
}

export interface BudgetSummary {
  month: string;
  totalBudgeted: number;
  totalSpent: number;
  remaining: number;
  budgets: Budget[];
}
