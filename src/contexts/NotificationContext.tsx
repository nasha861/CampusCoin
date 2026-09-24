import { createContext, useCallback, useMemo, useState, type ReactNode } from 'react';
import { notificationService } from '@/services';
import type { AppNotification } from '@/types/notification';
import { useAuth } from '@/hooks/useAuth';

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const result = await notificationService.list();
      setNotifications(result);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const markAsRead = useCallback(async (id: string) => {
    await notificationService.markAsRead(id);
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, isRead: true } : notification,
      ),
    );
  }, []);

  const markAllAsRead = useCallback(async () => {
    await notificationService.markAllAsRead();
    setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })));
  }, []);

  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications,
      unreadCount: notificationService.countUnread(notifications),
      isLoading,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
    }),
    [notifications, isLoading, fetchNotifications, markAsRead, markAllAsRead],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}
