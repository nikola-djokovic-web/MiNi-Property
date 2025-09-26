
import { create } from 'zustand';
import { allNotifications as initialNotifications, Notification } from '@/lib/notifications';
import { UserRole } from './use-current-user';

interface NotificationState {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'unread'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: (role: UserRole) => void;
  getNotificationsForUser: (role: UserRole) => Notification[];
}

let notificationIdCounter = initialNotifications.length + 1;

export const useNotifications = create<NotificationState>((set, get) => ({
  notifications: initialNotifications.sort((a, b) => b.id.localeCompare(a.id)),
  
  addNotification: (notificationData) => {
    const newNotification: Notification = {
      ...notificationData,
      id: `notif-${notificationIdCounter++}`,
      unread: true,
    };
    set(state => ({
      notifications: [newNotification, ...state.notifications],
    }));
  },

  markAsRead: (id) => {
    set(state => ({
      notifications: state.notifications.map(n => 
        n.id === id ? { ...n, unread: false } : n
      ),
    }));
  },

  markAllAsRead: (role) => {
    set(state => ({
      notifications: state.notifications.map(n => 
        (n.role === role || n.role === 'all') ? { ...n, unread: false } : n
      ),
    }));
  },

  getNotificationsForUser: (role) => {
    return get().notifications.filter(n => n.role === role || n.role === 'all');
  },
}));
