import { broadcastNotification } from "@/app/api/notifications/stream/route";

// In-memory storage for notifications (fallback until database models are ready)
export const notificationStorage = new Map<string, any[]>();

export interface FallbackNotificationInput {
  title: string;
  description: string;
  icon?: string;
  type?: string;
  priority?: string;
  targetRole?: string;
  userId?: string;
  navigationUrl?: string;
  actionLabel?: string;
  actionUrl?: string;
  relatedType?: string;
  relatedId?: string;
  [key: string]: unknown;
}

/**
 * Persists a notification in the in-memory fallback store and broadcasts it
 * over SSE. Used both by the /api/notifications/fallback route itself and by
 * other API routes (tenants, properties) that need to create a notification
 * as a side effect of their own request, in-process rather than via a
 * self-HTTP-fetch (which would not carry the caller's session cookie).
 */
export function createFallbackNotification(tenantId: string, input: FallbackNotificationInput) {
  const notification = {
    ...input,
    id: `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    tenantId,
    read: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const key = `${tenantId}-${notification.targetRole}`;
  const existing = notificationStorage.get(key) || [];
  existing.unshift(notification);
  notificationStorage.set(key, existing);

  broadcastNotification(tenantId, notification, notification.userId, notification.targetRole);

  return notification;
}
