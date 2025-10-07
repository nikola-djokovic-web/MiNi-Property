import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { requireTenantId } from "@/lib/tenant";
import { broadcastNotification } from "../notifications/stream/route";

export async function GET(req: NextRequest) {
  try {
    const tenantId = requireTenantId(req);
    const { searchParams } = new URL(req.url);
    const userRole = searchParams.get('userRole');
    const userId = searchParams.get('userId');
    
    console.log('🔍 Fetching maintenance requests for tenant ID:', tenantId, 'Role:', userRole, 'User ID:', userId);
    
    let whereClause: any = { tenantId };
    
    // Role-based filtering: workers only see assigned requests
    if (userRole === 'worker' && userId) {
      whereClause.assignedWorkerId = userId;
    }
    // Admin users see all requests (no additional filtering needed)
    
    const data = await prisma.maintenanceRequest.findMany({
      where: whereClause,
      include: {
        property: {
          select: { id: true, name: true, title: true, address: true }
        },
        tenant: {
          select: { id: true, name: true }
        }
      },
      orderBy: { dateSubmitted: 'desc' }
    });
    
    console.log('📊 Found maintenance requests:', {
      count: data.length,
      tenantId,
      requests: data.map(r => ({
        id: r.id,
        tenantId: r.tenantId,
        issue: r.issue,
        propertyName: r.property?.name
      }))
    });
    
    return NextResponse.json({ data });
  } catch (e: any) {
    console.error("GET /api/maintenance-requests error:", e);
    return NextResponse.json(
      { error: e?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = requireTenantId(req);
    const body = await req.json();
    
    const created = await prisma.maintenanceRequest.create({
      data: {
        tenantId,
        propertyId: body.propertyId,
        issue: body.issue,
        details: body.details || "",
        dateSubmitted: new Date(),
        priority: body.priority || "Medium",
        status: body.status || "New",
        assignedWorkerId: body.assignedWorkerId || null
      },
      include: {
        property: {
          select: { id: true, name: true, title: true, address: true }
        }
      }
    });

    // Create and broadcast notification for new maintenance request
    try {
      console.log('🔔 Creating notification for new maintenance request...');
      const notification = {
        id: `maint-${created.id}-${Date.now()}`,
        tenantId: tenantId,
        title: 'New Maintenance Request',
        description: `${created.issue} reported for ${created.property?.name || 'Property'}`,
        icon: 'Wrench',
        type: 'info' as const,
        priority: created.priority === 'High' ? 'high' as const : 'normal' as const,
        targetRole: 'admin',
        navigationUrl: `/maintenance/${created.id}`,
        actionLabel: 'View Request',
        actionUrl: `/maintenance/${created.id}`,
        relatedType: 'maintenance_request',
        relatedId: created.id,
        read: false,
        createdAt: created.dateSubmitted,
      };

      console.log('📢 Broadcasting notification to admins:', notification);
      // Broadcast to real-time connections
      broadcastNotification(tenantId, notification, undefined, 'admin');

      // Save notification to database for persistence
      try {
        const persistedNotification = await prisma.notification.create({
          data: {
            title: notification.title,
            description: notification.description,
            icon: notification.icon,
            type: notification.type,
            priority: notification.priority,
            navigationUrl: notification.navigationUrl,
            actionLabel: notification.actionLabel,
            actionUrl: notification.actionUrl,
            userId: null, // Admin notifications are role-based, not user-specific
            targetRole: notification.targetRole,
            relatedType: notification.relatedType,
            relatedId: notification.relatedId,
            metadata: {
              requestId: created.id,
              propertyName: created.property?.name,
              issue: created.issue,
              priority: created.priority,
              submittedAt: new Date().toISOString(),
            },
            tenantId: tenantId,
          },
        });
        console.log('💾 Admin notification saved to database:', persistedNotification.id);
      } catch (dbError) {
        console.error('❌ Failed to save admin notification to database:', dbError);
      }
    } catch (notificationError) {
      console.error('Error creating notification for maintenance request:', notificationError);
      // Don't fail the request if notification fails
    }
    
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (e: any) {
    console.error("POST /api/maintenance-requests error:", e);
    return NextResponse.json(
      { error: e?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}
