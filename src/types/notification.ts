export type NotificationType = 'budget-warning' | 'budget-exceeded' | 'insight-ready' | 'system';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}
