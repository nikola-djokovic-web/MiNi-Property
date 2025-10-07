import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { resolveTenantId } from "@/lib/tenant";
import { broadcastNotification } from "../notifications/stream/route";

export async function GET(req: NextRequest) {
  try {
    const tenantId = await resolveTenantId(req);
    const { searchParams } = new URL(req.url);
    const userRole = searchParams.get('userRole');
    const userId = searchParams.get('userId');
    
    let whereClause: any = { tenantId };
    
    // Role-based filtering: workers only see assigned properties
    if (userRole === 'worker' && userId) {
      whereClause.assignedWorkerId = userId;
    }
    // Admin users see all properties (no additional filtering needed)
    
    const data = await prisma.property.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });
    
    return NextResponse.json({ data });
  } catch (e: any) {
    console.error("GET /api/properties error:", e);
    return NextResponse.json(
      { error: e?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = await resolveTenantId(req);
    const body = await req.json();

    // Map + defaults for required columns to avoid 500s
    const title =
      (body.title ?? body.name ?? "").toString().trim() || "Untitled";
    const name = (body.name ?? body.title ?? title).toString().trim() || title;
    const address = (body.address ?? "").toString();
    const city = (body.city ?? "").toString();

    const created = await prisma.property.create({
      data: {
        tenantId,
        name,
        address,
        city,
        // presentation fields
        title,
        imageUrl: (body.imageUrl ?? "").toString(),
        imageHint: body.imageHint ?? null,
        type: (body.type ?? "Apartment").toString(),
        assignedWorkerId: body.assignedWorkerId ?? null,
      },
    });

    // Create and broadcast notification for new property
    try {
      const notification = {
        id: `property-${created.id}-${Date.now()}`,
        tenantId: tenantId,
        title: 'New Property Added',
        description: `${created.title} has been added to the system`,
        icon: 'Building',
        type: 'info' as const,
        priority: 'normal' as const,
        targetRole: 'admin',
        navigationUrl: '/properties',
        actionLabel: 'View Properties',
        actionUrl: '/properties',
        relatedType: 'property',
        relatedId: created.id,
        read: false,
        createdAt: created.createdAt,
      };

      // Broadcast to real-time connections
      broadcastNotification(tenantId, notification, undefined, 'admin');

      // Also try to create database notification
      try {
        await fetch(`${req.nextUrl.origin}/api/notifications/fallback?tenantId=${tenantId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: notification.title,
            description: notification.description,
            icon: notification.icon,
            type: notification.type,
            priority: notification.priority,
            targetRole: notification.targetRole,
            navigationUrl: notification.navigationUrl,
            actionLabel: notification.actionLabel,
            actionUrl: notification.actionUrl,
            relatedType: notification.relatedType,
            relatedId: notification.relatedId,
          }),
        });
      } catch (notifError) {
        console.log('Fallback notification creation failed:', notifError);
      }
    } catch (notificationError) {
      console.error('Error creating notification for new property:', notificationError);
      // Don't fail the request if notification fails
    }

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (e: any) {
    console.error("POST /api/properties error:", e);
    return NextResponse.json(
      { error: e?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}
