import { NextRequest, NextResponse } from 'next/server';
import { notificationTemplates } from '@/lib/notifications-db';
import { broadcastNotification } from '../stream/route';

// POST /api/notifications/test - Create test notifications
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || 'default-tenant';
    const role = searchParams.get('role') || 'admin';

    const testNotifications = [
      {
        id: `test-maint-${Date.now()}`,
        tenantId,
        title: 'New Maintenance Request',
        description: 'Leaky faucet in kitchen reported for Modern Downtown Apartment.',
        icon: 'Wrench',
        type: 'info' as const,
        priority: 'normal' as const,
        targetRole: 'admin',
        navigationUrl: '/maintenance',
        actionLabel: 'View Request',
        actionUrl: '/maintenance',
        relatedType: 'maintenance_request',
        relatedId: 'maint-123',
        read: false,
        createdAt: new Date(),
      },
      {
        id: `test-tenant-${Date.now()}`,
        tenantId,
        title: 'New Tenant Added',
        description: 'John Doe has been added to Downtown Apartment Complex.',
        icon: 'UserPlus',
        type: 'success' as const,
        priority: 'normal' as const,
        targetRole: 'admin',
        navigationUrl: '/tenants',
        actionLabel: 'View Tenants',
        actionUrl: '/tenants',
        relatedType: 'tenant',
        relatedId: 'tenant-456',
        read: false,
        createdAt: new Date(),
      },
      {
        id: `test-rent-${Date.now()}`,
        tenantId,
        title: 'Rent Payment Due',
        description: 'Your rent payment of $2,200 is due in 3 days.',
        icon: 'DollarSign',
        type: 'warning' as const,
        priority: 'high' as const,
        targetRole: 'tenant',
        navigationUrl: '/rent',
        actionLabel: 'Pay Now',
        actionUrl: '/rent',
        relatedType: 'rent_payment',
        relatedId: 'rent-789',
        read: false,
        createdAt: new Date(),
      }
    ];

    // Filter notifications for the specified role
    const filteredNotifications = testNotifications.filter(n => 
      n.targetRole === role || role === 'all'
    );

    // Broadcast notifications to connected clients
    for (const notification of filteredNotifications) {
      broadcastNotification(tenantId, notification, undefined, notification.targetRole);
    }

    return NextResponse.json({
      message: 'Test notifications created and broadcasted',
      notifications: filteredNotifications,
    });
  } catch (error) {
    console.error('Error creating test notifications:', error);
    return NextResponse.json({ error: 'Failed to create test notifications' }, { status: 500 });
  }
}