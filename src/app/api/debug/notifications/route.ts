import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { requireTenantId } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  try {
    const tenantId = requireTenantId(req);
    
    // Get all notifications for this tenant
    const notifications = await prisma.notification.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    console.log('🔍 Debug: Found notifications in database:', {
      count: notifications.length,
      notifications: notifications.map(n => ({
        id: n.id,
        title: n.title,
        targetRole: n.targetRole,
        read: n.read,
        createdAt: n.createdAt
      }))
    });

    return NextResponse.json({ 
      success: true,
      count: notifications.length,
      notifications: notifications.map(n => ({
        id: n.id,
        title: n.title,
        description: n.description,
        targetRole: n.targetRole,
        read: n.read,
        createdAt: n.createdAt,
        relatedType: n.relatedType,
        relatedId: n.relatedId
      }))
    });
  } catch (e: any) {
    console.error("Debug notifications error:", e);
    return NextResponse.json(
      { error: e?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}