import { NextRequest, NextResponse } from 'next/server';
import { prisma as db } from '@/server/db';
import { z } from 'zod';
import { notificationWebhookService } from '@/lib/webhook-service';

const createNotificationSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  icon: z.string().default('Bell'),
  type: z.enum(['info', 'success', 'warning', 'error']).default('info'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  navigationUrl: z.string().optional(),
  actionLabel: z.string().optional(),
  actionUrl: z.string().optional(),
  userId: z.string().optional(),
  targetRole: z.string().optional(),
  relatedType: z.string().optional(),
  relatedId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

// GET /api/notifications - Get notifications for current user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const role = searchParams.get('role');
    const tenantId = searchParams.get('tenantId');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 });
    }

    const where: any = {
      tenantId,
      OR: [
        // Direct user notifications (for specific userId)
        ...(userId ? [{ userId }] : []),
        // Role-based notifications (for the role, regardless of userId)
        ...(role ? [{ targetRole: role }] : []),
      ],
    };

    if (unreadOnly) {
      where.read = false;
    }

    const notifications = await db.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    const total = await db.notification.count({ where });

    return NextResponse.json({
      notifications,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

// POST /api/notifications - Create a new notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 });
    }

    const validatedData = createNotificationSchema.parse(body);

    const notification = await db.notification.create({
      data: {
        ...validatedData,
        tenantId,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Trigger webhooks
    try {
      await notificationWebhookService.triggerWebhooks(tenantId, 'notification.created', {
        notification,
      });
    } catch (webhookError) {
      console.error('Webhook delivery failed:', webhookError);
      // Don't fail the request if webhooks fail
    }

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    console.error('Error creating notification:', error);
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
  }
}

// PATCH /api/notifications - Bulk update notifications (mark as read)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 });
    }

    const { notificationIds, markAsRead, userId, role } = body;

    if (markAsRead === true) {
      const where: any = { tenantId };

      if (notificationIds && Array.isArray(notificationIds)) {
        where.id = { in: notificationIds };
      } else if (userId || role) {
        where.OR = [
          userId ? { userId } : undefined,
          role ? { targetRole: role, userId: null } : undefined,
        ].filter(Boolean);
      }

      const updated = await db.notification.updateMany({
        where,
        data: {
          read: true,
          readAt: new Date(),
        },
      });

      return NextResponse.json({ updated: updated.count });
    }

    return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}