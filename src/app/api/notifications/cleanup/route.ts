import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';

// POST /api/notifications/cleanup - Clean up old notifications (older than 30 days)
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 });
    }

    // Delete notifications older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const deletedNotifications = await prisma.notification.deleteMany({
      where: {
        tenantId,
        createdAt: {
          lt: thirtyDaysAgo,
        },
      },
    });

    console.log(`🧹 Cleaned up ${deletedNotifications.count} old notifications for tenant ${tenantId}`);

    return NextResponse.json({
      success: true,
      deletedCount: deletedNotifications.count,
      cleanupDate: thirtyDaysAgo.toISOString(),
    });
  } catch (error) {
    console.error('Error cleaning up notifications:', error);
    return NextResponse.json({ error: 'Failed to cleanup notifications' }, { status: 500 });
  }
}

// GET /api/notifications/cleanup - Check how many notifications would be cleaned up
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 });
    }

    // Count notifications older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const oldNotificationsCount = await prisma.notification.count({
      where: {
        tenantId,
        createdAt: {
          lt: thirtyDaysAgo,
        },
      },
    });

    const totalNotificationsCount = await prisma.notification.count({
      where: {
        tenantId,
      },
    });

    return NextResponse.json({
      tenantId,
      oldNotifications: oldNotificationsCount,
      totalNotifications: totalNotificationsCount,
      cleanupDate: thirtyDaysAgo.toISOString(),
    });
  } catch (error) {
    console.error('Error checking notifications for cleanup:', error);
    return NextResponse.json({ error: 'Failed to check notifications' }, { status: 500 });
  }
}