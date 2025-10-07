import { NextRequest, NextResponse } from 'next/server';
import { broadcastNotification } from '../stream/route';

// In-memory storage for notifications (fallback until database models are ready)
const notificationStorage = new Map<string, any[]>();

// GET /api/notifications/fallback - Get notifications from memory
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || 'default-tenant';
    const role = searchParams.get('role');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const key = `${tenantId}-${role}`;
    const allNotifications = notificationStorage.get(key) || [];
    
    const notifications = allNotifications
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(offset, offset + limit);

    return NextResponse.json({
      notifications,
      pagination: {
        total: allNotifications.length,
        limit,
        offset,
        hasMore: offset + limit < allNotifications.length,
      },
    });
  } catch (error) {
    console.error('Error fetching fallback notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

// POST /api/notifications/fallback - Create notification in memory
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || 'default-tenant';

    const notification = {
      ...body,
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

    // Broadcast to real-time connections
    broadcastNotification(tenantId, notification, notification.userId, notification.targetRole);

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error('Error creating fallback notification:', error);
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
  }
}

// PATCH /api/notifications/fallback - Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || 'default-tenant';

    const { notificationIds, markAsRead, role } = body;

    if (markAsRead === true) {
      const key = `${tenantId}-${role}`;
      const notifications = notificationStorage.get(key) || [];
      
      let updatedCount = 0;
      const updated = notifications.map(n => {
        if (notificationIds && Array.isArray(notificationIds)) {
          if (notificationIds.includes(n.id) && !n.read) {
            updatedCount++;
            return { ...n, read: true, readAt: new Date().toISOString() };
          }
        } else if (!n.read) {
          updatedCount++;
          return { ...n, read: true, readAt: new Date().toISOString() };
        }
        return n;
      });

      notificationStorage.set(key, updated);
      return NextResponse.json({ updated: updatedCount });
    }

    return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
  } catch (error) {
    console.error('Error updating fallback notifications:', error);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}