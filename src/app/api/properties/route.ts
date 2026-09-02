import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { getSessionUser } from "@/lib/auth";
import { listPropertiesForUser } from "@/server/queries";
import { broadcastNotification } from "../notifications/stream/route";

const createPropertySchema = z.object({
  title: z.string().trim().max(200).optional(),
  name: z.string().trim().max(200).optional(),
  address: z.string().trim().max(300).optional(),
  city: z.string().trim().max(120).optional(),
  imageUrl: z.string().trim().max(2000).optional(),
  imageHint: z.string().trim().max(200).nullable().optional(),
  type: z.enum(["Apartment", "House", "Condo", "Townhouse", "Commercial"]).optional(),
  assignedWorkerId: z.string().min(1).nullable().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const data = await listPropertiesForUser(user);

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
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    if (user.role !== "admin" && user.role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const tenantId = user.tenantId;

    const parsed = createPropertySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
    }
    const body = parsed.data;

    // Map + defaults for required columns to avoid 500s
    const title = (body.title ?? body.name ?? "").trim() || "Untitled";
    const name = (body.name ?? body.title ?? title).trim() || title;
    const address = body.address ?? "";
    const city = body.city ?? "";

    const created = await prisma.property.create({
      data: {
        tenantId,
        name,
        address,
        city,
        // presentation fields
        title,
        imageUrl: body.imageUrl ?? "",
        imageHint: body.imageHint ?? null,
        type: body.type ?? "Apartment",
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
