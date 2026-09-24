export type CategoryType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  icon?: string;
  color?: string;
  isDefault: boolean; // system-provided category vs. user-created
  userId?: string; // absent for default/global categories
  createdAt: string;
  updatedAt: string;
}

export interface CategoryPayload {
  name: string;
  type: CategoryType;
  icon?: string;
  color?: string;
}
