import { notificationsApi } from '@/api/notifications.api';
import type { AppNotification } from '@/types/notification';

export function countUnread(notifications: AppNotification[]): number {
  return notifications.filter((notification) => !notification.isRead).length;
}

export const notificationService = {
  ...notificationsApi,
  countUnread,
};
