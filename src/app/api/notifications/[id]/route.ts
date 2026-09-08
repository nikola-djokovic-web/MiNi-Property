import { NextRequest, NextResponse } from 'next/server';
import { prisma as db } from '@/server/db';
import { getSessionUser } from '@/lib/auth';

// Fixed: Handle both local notifications and database notifications properly

function canAccess(user: { id: string; role: string }, notification: { userId: string | null; targetRole: string | null }) {
  if (user.role === 'admin' || user.role === 'owner') return true;
  return notification.userId === user.id || notification.targetRole === user.role;
}

// GET /api/notifications/[id] - Get specific notification
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const tenantId = user.tenantId;
    const { id } = await params;

    // Handle local notifications (they don't exist in the database)
    if (id.startsWith('local-')) {
      return NextResponse.json({ error: 'Local notification not found in database' }, { status: 404 });
    }

    const notification = await db.notification.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!notification || !canAccess(user, notification)) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    return NextResponse.json(notification);
  } catch (error) {
    console.error('Error fetching notification:', error);
    return NextResponse.json({ error: 'Failed to fetch notification' }, { status: 500 });
  }
}

// PATCH /api/notifications/[id] - Mark notification as read/unread
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const tenantId = user.tenantId;
    const { id } = await params;
    const body = await request.json();
    const { read } = body;

    // Handle local notifications (they don't exist in the database)
    if (id.startsWith('local-')) {
      // Return success for local notifications - they're handled in the frontend store
      return NextResponse.json({
        id,
        read: read === true,
        message: 'Local notification updated in frontend store only'
      });
    }

    const existing = await db.notification.findFirst({ where: { id, tenantId } });
    if (!existing || !canAccess(user, existing)) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    const notification = await db.notification.update({
      where: {
        id,
      },
      data: {
        read: read === true,
        readAt: read === true ? new Date() : null,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(notification);
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}

// DELETE /api/notifications/[id] - Delete notification
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const tenantId = user.tenantId;
    const { id } = await params;

    // Handle local notifications (they don't exist in the database)
    if (id.startsWith('local-')) {
      // Return success for local notifications - they're handled in the frontend store
      return NextResponse.json({
        success: true,
        message: 'Local notification removed from frontend store only'
      });
    }

    const existing = await db.notification.findFirst({ where: { id, tenantId } });
    if (!existing || !canAccess(user, existing)) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    await db.notification.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
  }
}
