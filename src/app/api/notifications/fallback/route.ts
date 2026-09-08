import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { notificationStorage, createFallbackNotification } from '@/lib/notification-fallback-store';

// GET /api/notifications/fallback - Get notifications from memory
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const tenantId = user.tenantId;

    const { searchParams } = new URL(request.url);
    const requestedRole = searchParams.get('role');
    // Non-admins may only read notifications targeted at their own role.
    const role = user.role === 'admin' || user.role === 'owner' ? requestedRole : user.role;
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
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (user.role !== 'admin' && user.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const tenantId = user.tenantId;

    const body = await request.json();
    const notification = createFallbackNotification(tenantId, body);

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error('Error creating fallback notification:', error);
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
  }
}

// PATCH /api/notifications/fallback - Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const tenantId = user.tenantId;

    const body = await request.json();
    const { notificationIds, markAsRead, role: requestedRole } = body;
    // Non-admins may only mark their own role's notifications as read.
    const role = user.role === 'admin' || user.role === 'owner' ? requestedRole : user.role;

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
