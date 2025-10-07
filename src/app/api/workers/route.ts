import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { requireTenantId } from "@/lib/tenant";
import crypto from "node:crypto";
import { sendWorkerInviteEmail } from "@/lib/email";
import { broadcastNotification } from "../notifications/stream/route";

export async function GET(req: NextRequest) {
  try {
    const tenantId = requireTenantId(req);
    const workers = await prisma.user.findMany({
      where: { tenantId, role: "worker" },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ data: workers });
  } catch (e: any) {
    console.error("GET /api/workers error:", e);
    return NextResponse.json(
      { error: e?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = requireTenantId(req);

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant)
      return NextResponse.json({ error: "Invalid tenant id" }, { status: 400 });

    const body = await req.json();
    const name = (body.name ?? "").toString().trim() || null;
    const email = (body.email ?? "").toString().trim().toLowerCase();
    if (!email)
      return NextResponse.json({ error: "Email is required" }, { status: 400 });

    // idempotent: if same email already exists in tenant, return it (200) unless it’s a different role
    const existing = await prisma.user.findFirst({
      where: { tenantId, email },
    });
    if (existing) {
      if (existing.role !== "worker") {
        return NextResponse.json(
          { error: "A user with this email already exists" },
          { status: 409 }
        );
      }
      // Re-invite existing worker: issue new token and send email
      const token = crypto.randomUUID();
      await prisma.invite.create({
        data: {
          tenantId,
          email,
          userId: existing.id,
          token,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24h
        },
      });
      sendWorkerInviteEmail({ email, token }).catch((err) =>
        console.error("invite email failed:", err)
      );
      
      // Create notification for worker re-invitation
      try {
        const notification = {
          id: `worker-reinvite-${existing.id}-${Date.now()}`,
          tenantId: tenantId,
          title: 'Worker Re-invited',
          description: `${existing.name || email} has been re-invited to join the team`,
          icon: 'RotateCcw',
          type: 'info' as const,
          priority: 'normal' as const,
          targetRole: 'admin',
          navigationUrl: '/workers',
          actionLabel: 'View Workers',
          actionUrl: '/workers',
          relatedType: 'worker',
          relatedId: existing.id,
          read: false,
          createdAt: new Date(),
        };
        
        broadcastNotification(tenantId, notification, undefined, 'admin');
      } catch (notificationError) {
        console.error('Error creating re-invitation notification:', notificationError);
      }
      return NextResponse.json(
        { data: { ...existing, status: "Inactive" as const } },
        { status: 200 }
      );
    }

    const created = await prisma.user.create({
      data: { tenantId, role: "worker", name, email },
    });

    const token = crypto.randomUUID();
    await prisma.invite.create({
      data: {
        tenantId,
        email,
        userId: created.id,
        token,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24h
      },
    });

    // fire-and-forget; do not block the response if the provider is down
    sendWorkerInviteEmail({ email, token }).catch((err) =>
      console.error("invite email failed:", err)
    );

    // Create notification for new worker invitation
    try {
      const notification = {
        id: `worker-invite-${created.id}-${Date.now()}`,
        tenantId: tenantId,
        title: 'New Worker Invited',
        description: `${created.name || email} has been invited to join the team`,
        icon: 'UserPlus',
        type: 'success' as const,
        priority: 'normal' as const,
        targetRole: 'admin',
        navigationUrl: '/workers',
        actionLabel: 'View Workers',
        actionUrl: '/workers',
        relatedType: 'worker',
        relatedId: created.id,
        read: false,
        createdAt: created.createdAt,
      };
      
      broadcastNotification(tenantId, notification, undefined, 'admin');
      
      // Welcome notification to the new worker
      const welcomeNotification = {
        id: `worker-welcome-${created.id}-${Date.now()}`,
        tenantId: tenantId,
        title: 'Welcome to the Team',
        description: `Welcome ${created.name || email}! You've been invited to join as a maintenance worker. Please complete your registration.`,
        icon: 'Wrench',
        type: 'success' as const,
        priority: 'normal' as const,
        targetRole: 'worker',
        navigationUrl: '/dashboard',
        actionLabel: 'View Dashboard',
        actionUrl: '/dashboard',
        relatedType: 'worker',
        relatedId: created.id,
        read: false,
        createdAt: created.createdAt,
      };
      
      broadcastNotification(tenantId, welcomeNotification, created.id, 'worker');
    } catch (notificationError) {
      console.error('Error creating worker invitation notifications:', notificationError);
    }

    return NextResponse.json(
      { data: { ...created, status: "Inactive" as const } },
      { status: 201 }
    );
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 }
      );
    }
    console.error("POST /api/workers error:", e);
    return NextResponse.json(
      { error: e?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const tenantId = requireTenantId(req);
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('id');
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }
    
    const worker = await prisma.user.findFirst({
      where: { id: userId, tenantId, role: 'worker' },
    });
    
    if (!worker) {
      return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    }
    
    // Check for assigned properties and maintenance requests
    const assignedProperties = await prisma.property.findMany({
      where: { assignedWorkerId: userId },
      select: { id: true, title: true, name: true }
    });
    
    const assignedRequests = await prisma.maintenanceRequest.findMany({
      where: { assignedWorkerId: userId, status: { in: ['New', 'In Progress'] } },
      select: { id: true, issue: true }
    });
    
    // Unassign from properties and requests before deletion
    await Promise.all([
      prisma.property.updateMany({
        where: { assignedWorkerId: userId },
        data: { assignedWorkerId: null }
      }),
      prisma.maintenanceRequest.updateMany({
        where: { assignedWorkerId: userId },
        data: { assignedWorkerId: null, status: 'New' }
      })
    ]);
    
    await prisma.user.delete({
      where: { id: userId },
    });
    
    // Create notification for worker deletion
    try {
      const notification = {
        id: `worker-delete-${userId}-${Date.now()}`,
        tenantId: tenantId,
        title: 'Worker Removed',
        description: `${worker.name || worker.email} has been removed from the team${assignedProperties.length > 0 ? ` and unassigned from ${assignedProperties.length} properties` : ''}`,
        icon: 'UserMinus',
        type: 'warning' as const,
        priority: 'normal' as const,
        targetRole: 'admin',
        navigationUrl: '/workers',
        actionLabel: 'View Workers',
        actionUrl: '/workers',
        relatedType: 'worker',
        relatedId: userId,
        read: false,
        createdAt: new Date(),
      };
      
      broadcastNotification(tenantId, notification, undefined, 'admin');
      
      // Notify tenants if their maintenance requests were reassigned
      if (assignedRequests.length > 0) {
        const tenantNotification = {
          id: `worker-delete-tenant-${userId}-${Date.now()}`,
          tenantId: tenantId,
          title: 'Worker Assignment Changed',
          description: `A worker has been removed and your maintenance requests have been unassigned. They will be reassigned soon.`,
          icon: 'AlertCircle',
          type: 'info' as const,
          priority: 'normal' as const,
          targetRole: 'tenant',
          navigationUrl: '/maintenance',
          actionLabel: 'View Requests',
          actionUrl: '/maintenance',
          relatedType: 'worker',
          relatedId: userId,
          read: false,
          createdAt: new Date(),
        };
        
        broadcastNotification(tenantId, tenantNotification, undefined, 'tenant');
      }
    } catch (notificationError) {
      console.error('Error creating worker deletion notification:', notificationError);
    }
    
    return NextResponse.json({ 
      message: 'Worker deleted successfully',
      unassignedProperties: assignedProperties.length,
      unassignedRequests: assignedRequests.length
    });
  } catch (e: any) {
    console.error("DELETE /api/workers error:", e);
    return NextResponse.json(
      { error: e?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}
