import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { getSessionUser } from "@/lib/auth";
import { listTenantsForUser } from "@/server/queries";
import crypto from "node:crypto";
import { sendWorkerInviteEmail } from "@/lib/email";
import { broadcastNotification } from "../notifications/stream/route";

const inviteTenantSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  propertyId: z.string().min(1),
});

// tiny helper for json
function json(data: any, init?: number | ResponseInit) {
  const options: ResponseInit | undefined =
    typeof init === 'number' ? { status: init } : init;
  return NextResponse.json(data, options);
}

// List tenants (pagination)
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return json({ error: "Authentication required" }, 401);
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const pageSize = Math.min(
      50,
      Math.max(1, Number(searchParams.get("pageSize") ?? 10))
    );

    const result = await listTenantsForUser(user, { page, pageSize });

    return json(result);
  } catch (e: any) {
    console.error("GET /api/tenants error:", e);
    return json({ error: e?.message ?? "Internal error" }, { status: 500 });
  }
}

// Invite tenant (create or re-invite)
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return json({ error: "Authentication required" }, 401);
    if (user.role !== "admin" && user.role !== "owner") {
      return json({ error: "Forbidden" }, { status: 403 });
    }
    const tenantId = user.tenantId;

    const parsed = inviteTenantSchema.safeParse(await req.json());
    if (!parsed.success) {
      return json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
    }
    const name = parsed.data.name;
    const email = parsed.data.email.toLowerCase();
    const propertyId = parsed.data.propertyId;

    // Verify property exists and belongs to tenant
    const property = await prisma.property.findFirst({
      where: { id: propertyId, tenantId }
    });
    if (!property) {
      return json({ error: "Property not found" }, { status: 404 });
    }

    const existing = await prisma.user.findFirst({
      where: { tenantId, email },
    });
    if (existing) {
      if (existing.role !== "tenant") {
        return json(
          { error: "A user with this email already exists" },
          { status: 409 }
        );
      }
      // re-invite existing tenant: new token + email
      const token = crypto.randomUUID();
      await prisma.invite.create({
        data: {
          tenantId,
          email,
          userId: existing.id,
          token,
          propertyId,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
        },
      });
      sendWorkerInviteEmail({ email, token }).catch((err) =>
        console.error("invite email failed:", err)
      );
      return json({ data: { ...existing, propertyId } }, { status: 200 });
    }

    // create tenant user + invite
    const created = await prisma.user.create({
      data: { tenantId, role: "tenant", name, email },
    });
    const token = crypto.randomUUID();
    await prisma.invite.create({
      data: {
        tenantId,
        email,
        userId: created.id,
        token,
        propertyId,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
      },
    });
    sendWorkerInviteEmail({ email, token }).catch((err) =>
      console.error("invite email failed:", err)
    );

    // Create and broadcast notification for new tenant
    try {
      // Notification to admins about new tenant
      const adminNotification = {
        id: `tenant-admin-${created.id}-${Date.now()}`,
        tenantId: tenantId,
        title: 'New Tenant Added',
        description: `${created.name} has been added to ${property.name || property.title}`,
        icon: 'UserPlus',
        type: 'success' as const,
        priority: 'normal' as const,
        targetRole: 'admin',
        navigationUrl: '/tenants',
        actionLabel: 'View Tenants',
        actionUrl: '/tenants',
        relatedType: 'tenant',
        relatedId: created.id,
        read: false,
        createdAt: created.createdAt,
      };

      // Broadcast to real-time connections for admins
      broadcastNotification(tenantId, adminNotification, undefined, 'admin');

      // Welcome notification to the new tenant
      const welcomeNotification = {
        id: `tenant-welcome-${created.id}-${Date.now()}`,
        tenantId: tenantId,
        title: 'Welcome to Your Property Portal',
        description: `Welcome ${created.name}! You've been assigned to ${property.name || property.title}. You can now submit maintenance requests and track their progress.`,
        icon: 'Home',
        type: 'success' as const,
        priority: 'normal' as const,
        targetRole: 'tenant',
        navigationUrl: '/maintenance',
        actionLabel: 'View Dashboard',
        actionUrl: '/dashboard',
        relatedType: 'tenant',
        relatedId: created.id,
        read: false,
        createdAt: created.createdAt,
      };

      // Broadcast to real-time connections for the new tenant
      broadcastNotification(tenantId, welcomeNotification, created.id, 'tenant');

      // Also try to create database notifications
      try {
        await Promise.all([
          fetch(`${req.nextUrl.origin}/api/notifications/fallback?tenantId=${tenantId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: adminNotification.title,
              description: adminNotification.description,
              icon: adminNotification.icon,
              type: adminNotification.type,
              priority: adminNotification.priority,
              targetRole: adminNotification.targetRole,
              navigationUrl: adminNotification.navigationUrl,
              actionLabel: adminNotification.actionLabel,
              actionUrl: adminNotification.actionUrl,
              relatedType: adminNotification.relatedType,
              relatedId: adminNotification.relatedId,
            }),
          }),
          fetch(`${req.nextUrl.origin}/api/notifications/fallback?tenantId=${tenantId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: welcomeNotification.title,
              description: welcomeNotification.description,
              icon: welcomeNotification.icon,
              type: welcomeNotification.type,
              priority: welcomeNotification.priority,
              targetRole: welcomeNotification.targetRole,
              navigationUrl: welcomeNotification.navigationUrl,
              actionLabel: welcomeNotification.actionLabel,
              actionUrl: welcomeNotification.actionUrl,
              relatedType: welcomeNotification.relatedType,
              relatedId: welcomeNotification.relatedId,
            }),
          })
        ]);
      } catch (notifError) {
        console.log('Fallback notification creation failed:', notifError);
      }
    } catch (notificationError) {
      console.error('Error creating notifications for new tenant:', notificationError);
      // Don't fail the request if notification fails
    }

    return json({ data: { ...created, propertyId } }, { status: 201 });
  } catch (e: any) {
    if (e?.code === "P2002")
      return json({ error: "Email already in use" }, { status: 409 });
    console.error("POST /api/tenants error:", e);
    return json({ error: e?.message ?? "Internal error" }, { status: 500 });
  }
}

// Delete tenant
export async function DELETE(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) return json({ error: "Authentication required" }, 401);
    if (sessionUser.role !== "admin" && sessionUser.role !== "owner") {
      return json({ error: "Forbidden" }, { status: 403 });
    }
    const tenantId = sessionUser.tenantId;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('id');
    
    if (!userId) {
      return json({ error: "User ID is required" }, { status: 400 });
    }
    
    const user = await prisma.user.findFirst({
      where: { id: userId, tenantId, role: 'tenant' },
      include: {
        property: {
          select: { id: true, name: true, title: true }
        }
      }
    });
    
    if (!user) {
      return json({ error: "Tenant not found" }, { status: 404 });
    }
    
    await prisma.user.delete({
      where: { id: userId },
    });
    
    // Create notification for tenant deletion
    try {
      const notification = {
        id: `tenant-delete-${userId}-${Date.now()}`,
        tenantId: tenantId,
        title: 'Tenant Removed',
        description: `${user.name || user.email} has been removed from ${user.property?.name || user.property?.title || 'the property'}`,
        icon: 'UserMinus',
        type: 'warning' as const,
        priority: 'normal' as const,
        targetRole: 'admin',
        navigationUrl: '/tenants',
        actionLabel: 'View Tenants',
        actionUrl: '/tenants',
        relatedType: 'tenant',
        relatedId: userId,
        read: false,
        createdAt: new Date(),
      };
      
      broadcastNotification(tenantId, notification, undefined, 'admin');
    } catch (notificationError) {
      console.error('Error creating tenant deletion notification:', notificationError);
    }
    
    return json({ message: 'Tenant deleted successfully' });
  } catch (e: any) {
    console.error("DELETE /api/tenants error:", e);
    return json({ error: e?.message ?? "Internal error" }, { status: 500 });
  }
}
