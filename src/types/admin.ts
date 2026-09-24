import type { User } from './user';

export interface AdminUserSummary extends User {
  transactionCount: number;
  isActive: boolean;
}

export type AnnouncementAudience = 'all' | 'students' | 'admins';

export interface Announcement {
  id: string;
  title: string;
  body: string;
  audience: AnnouncementAudience;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AnnouncementPayload {
  title: string;
  body: string;
  audience: AnnouncementAudience;
  publishNow?: boolean;
}

export interface SystemStatistics {
  totalUsers: number;
  activeUsersLast30Days: number;
  totalTransactions: number;
  totalCategories: number;
  averageMonthlySpendPerUser: number;
  generatedAt: string;
}
