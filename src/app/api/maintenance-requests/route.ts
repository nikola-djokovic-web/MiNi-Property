import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { getSessionUser } from "@/lib/auth";
import { listMaintenanceRequestsForUser } from "@/server/queries";
import { broadcastNotification } from "../notifications/stream/route";

const createMaintenanceRequestSchema = z.object({
  propertyId: z.string().min(1),
  issue: z.string().min(1).max(500),
  details: z.string().max(5000).optional(),
  priority: z.enum(["Low", "Medium", "High"]).optional(),
  status: z.enum(["New", "In Progress", "Completed"]).optional(),
  assignedWorkerId: z.string().min(1).nullable().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const data = await listMaintenanceRequestsForUser(user);

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
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    const tenantId = user.tenantId;

    const parsed = createMaintenanceRequestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
    }
    const body = parsed.data;

    const property = await prisma.property.findFirst({
      where: { id: body.propertyId, tenantId },
      select: { id: true },
    });
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

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
