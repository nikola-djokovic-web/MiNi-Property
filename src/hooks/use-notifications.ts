
'use client';

import { create } from 'zustand';
import { Notification } from '@/lib/notifications';
import { UserRole } from './use-current-user';
import { convertDatabaseNotification, DatabaseNotification } from '@/lib/notifications-db';

interface NotificationState {
  notifications: Notification[];
  isLoading: boolean;
  error: string | null;
  addNotification: (notification: Omit<Notification, 'id' | 'unread'>) => void;
  markAsRead: (id: string, tenantId?: string) => Promise<void>;
  markAllAsRead: (role: UserRole, tenantId?: string) => Promise<void>;
  getNotificationsForUser: (role: UserRole, tenantId?: string, userId?: string) => Promise<Notification[]>;
  refreshNotifications: (role: UserRole, tenantId?: string) => Promise<void>;
}

let notificationIdCounter = 1;

export const useNotifications = create<NotificationState>((set, get) => ({
  notifications: [],
  isLoading: false,
  error: null,
  
  addNotification: (notificationData) => {
    const newNotification: Notification = {
      ...notificationData,
      id: `local-${notificationIdCounter++}`,
      unread: true,
    };
    set(state => ({
      notifications: [newNotification, ...state.notifications],
    }));
  },

  markAsRead: async (id, tenantId) => {
    if (!tenantId) {
      // Fallback to local state update if no tenantId
      set(state => ({
        notifications: state.notifications.map(n => 
          n.id === id ? { ...n, unread: false } : n
        ),
      }));
      return;
    }

    try {
      // Try main API first, fallback to fallback API
      let response;
      try {
        response = await fetch(`/api/notifications/${id}?tenantId=${tenantId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ read: true }),
        });
      } catch (error) {
        console.log('Main API not available, using fallback');
        response = await fetch(`/api/notifications/fallback?tenantId=${tenantId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ markAsRead: true, notificationIds: [id] }),
        });
      }
      
      if (response.ok) {
        set(state => ({
          notifications: state.notifications.map(n => 
            n.id === id ? { ...n, unread: false } : n
          ),
        }));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Fallback to local update
      set(state => ({
        notifications: state.notifications.map(n => 
          n.id === id ? { ...n, unread: false } : n
        ),
      }));
    }
  },

  markAllAsRead: async (role, tenantId) => {
    if (!tenantId) {
      // Fallback to local state update
      set(state => ({
        notifications: state.notifications.map(n => 
          (n.role === role || n.role === 'all') ? { ...n, unread: false } : n
        ),
      }));
      return;
    }

    try {
      // Try main API first, fallback to fallback API
      let response;
      try {
        response = await fetch(`/api/notifications?tenantId=${tenantId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ markAsRead: true, role }),
        });
      } catch (error) {
        console.log('Main API not available, using fallback');
        response = await fetch(`/api/notifications/fallback?tenantId=${tenantId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ markAsRead: true, role }),
        });
      }
      
      if (response.ok) {
        set(state => ({
          notifications: state.notifications.map(n => 
            (n.role === role || n.role === 'all') ? { ...n, unread: false } : n
          ),
        }));
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      // Fallback to local update
      set(state => ({
        notifications: state.notifications.map(n => 
          (n.role === role || n.role === 'all') ? { ...n, unread: false } : n
        ),
      }));
    }
  },

  getNotificationsForUser: async (role, tenantId, userId) => {
    if (!tenantId) {
      // Return empty array if no tenantId
      return [];
    }

    try {
      set({ isLoading: true, error: null });
      
      // Try the main API first, fallback to the fallback API
      let response;
      try {
        const userIdParam = userId ? `&userId=${userId}` : '';
        response = await fetch(`/api/notifications?tenantId=${tenantId}&role=${role}&limit=50${userIdParam}`);
      } catch (error) {
        console.log('Main API not available, using fallback');
        const userIdParam = userId ? `&userId=${userId}` : '';
        response = await fetch(`/api/notifications/fallback?tenantId=${tenantId}&role=${role}&limit=50${userIdParam}`);
      }
      
      if (response.ok) {
        const data = await response.json();
        const notifications = data.notifications?.map((dbNotif: DatabaseNotification) => 
          convertDatabaseNotification(dbNotif)
        ) || [];
        
        set({ 
          notifications,
          isLoading: false 
        });
        
        return notifications;
      } else {
        set({ 
          error: 'Failed to fetch notifications',
          isLoading: false 
        });
        return [];
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      set({ 
        error: 'Network error',
        isLoading: false 
      });
      return [];
    }
  },

  refreshNotifications: async (role, tenantId) => {
    await get().getNotificationsForUser(role, tenantId);
  },
}));
