export type UserRole = 'student' | 'admin';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  school?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfileUpdate {
  fullName?: string;
  school?: string;
  avatarUrl?: string;
}

export interface UserSettings {
  currency: string;
  monthlyIncomeGoal?: number;
  budgetAlertThreshold: number; // percentage, e.g. 80 = warn at 80% of budget
  emailNotifications: boolean;
  pushNotifications: boolean;
  aiCategorizationEnabled: boolean;
  aiInsightsEnabled: boolean;
}
