import { budgetsApi } from '@/api/budgets.api';
import type { Budget } from '@/types/budget';
import { DEFAULT_BUDGET_ALERT_THRESHOLD } from '@/constants/config';

export type BudgetStatus = 'on-track' | 'warning' | 'exceeded';

export function getBudgetUtilization(budget: Budget): number {
  if (budget.limitAmount <= 0) return 0;
  return Math.round((budget.spentAmount / budget.limitAmount) * 100);
}

export function getBudgetStatus(
  budget: Budget,
  warningThreshold: number = DEFAULT_BUDGET_ALERT_THRESHOLD,
): BudgetStatus {
  const utilization = getBudgetUtilization(budget);
  if (utilization >= 100) return 'exceeded';
  if (utilization >= warningThreshold) return 'warning';
  return 'on-track';
}

export const budgetService = {
  ...budgetsApi,
  getBudgetUtilization,
  getBudgetStatus,
};
