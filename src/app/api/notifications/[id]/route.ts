import { NextRequest, NextResponse } from 'next/server';
import { prisma as db } from '@/server/db';

// Fixed: Handle both local notifications and database notifications properly

// GET /api/notifications/[id] - Get specific notification
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 });
    }

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

    if (!notification) {
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
    const { id } = await params;
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 });
    }

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

    const notification = await db.notification.update({
      where: {
        id,
        tenantId,
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
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 });
    }

    // Handle local notifications (they don't exist in the database)
    if (id.startsWith('local-')) {
      // Return success for local notifications - they're handled in the frontend store
      return NextResponse.json({ 
        success: true,
        message: 'Local notification removed from frontend store only'
      });
    }

    await db.notification.delete({
      where: {
        id,
        tenantId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
  }
}