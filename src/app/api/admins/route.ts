import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { requireTenantId } from "@/lib/tenant";
import crypto from "node:crypto";
import { sendAdminInviteEmail } from "@/lib/email";

// tiny helper for json
function json(data: any, init?: number | ResponseInit) {
  const options: ResponseInit | undefined =
    typeof init === 'number' ? { status: init } : init;
  return NextResponse.json(data, options);
}

export async function GET(req: NextRequest) {
  try {
    const tenantId = requireTenantId(req);
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const pageSize = Math.min(
      50,
      Math.max(1, Number(searchParams.get("pageSize") ?? 10))
    );

    const where = { tenantId, role: "admin" as const };
    const [total, data] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return json({ data, total, page, pageSize });
  } catch (e: any) {
    console.error("GET /api/admins error:", e);
    return json({ error: e?.message ?? "Internal error" }, { status: 500 });
  }
}

// Invite admin (create or re-invite)
export async function POST(req: NextRequest) {
  try {
    const tenantId = requireTenantId(req);
    const body = await req.json();

    const name = (body.name ?? "").toString().trim() || null;
    const email = (body.email ?? "").toString().trim().toLowerCase();
    
    if (!email) return json({ error: "Email is required" }, { status: 400 });
    if (!name) return json({ error: "Name is required" }, { status: 400 });

    const existing = await prisma.user.findFirst({
      where: { tenantId, email },
    });
    if (existing) {
      if (existing.role !== "admin") {
        return json(
          { error: "A user with this email already exists with a different role" },
          { status: 409 }
        );
      }
      // re-invite existing admin: new token + email
      const token = crypto.randomUUID();
      await prisma.invite.create({
        data: {
          tenantId,
          email,
          userId: existing.id,
          token,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
        },
      });
      sendAdminInviteEmail({ email, token }).catch((err: any) =>
        console.error("invite email failed:", err)
      );
      return json({ data: existing }, { status: 200 });
    }

    // create admin user + invite
    const created = await prisma.user.create({
      data: { tenantId, role: "admin", name, email },
    });
    const token = crypto.randomUUID();
    await prisma.invite.create({
      data: {
        tenantId,
        email,
        userId: created.id,
        token,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
      },
    });
    sendAdminInviteEmail({ email, token }).catch((err: any) =>
      console.error("invite email failed:", err)
    );

    return json({ data: created }, { status: 201 });
  } catch (e: any) {
    if (e?.code === "P2002")
      return json({ error: "Email already in use" }, { status: 409 });
    console.error("POST /api/admins error:", e);
    return json({ error: e?.message ?? "Internal error" }, { status: 500 });
  }
}

// Delete admin
export async function DELETE(req: NextRequest) {
  try {
    const tenantId = requireTenantId(req);
    const url = new URL(req.url);
    const userId = url.searchParams.get("id");
    
    if (!userId) {
      return json({ error: "User ID is required" }, { status: 400 });
    }

    // Verify the user exists and belongs to this tenant
    const user = await prisma.user.findFirst({
      where: { id: userId, tenantId, role: "admin" },
    });
    
    if (!user) {
      return json({ error: "Administrator not found" }, { status: 404 });
    }

    // Check if this is the last admin (prevent deletion of last admin)
    const adminCount = await prisma.user.count({
      where: { tenantId, role: "admin" },
    });

    if (adminCount <= 1) {
      return json({ 
        error: "Cannot delete the last administrator. There must be at least one admin." 
      }, { status: 400 });
    }

    // Delete related records first (due to foreign key constraints)
    await prisma.invite.deleteMany({
      where: { userId },
    });
    
    // Update maintenance requests to remove worker assignment if this user was assigned
    await prisma.maintenanceRequest.updateMany({
      where: { assignedWorkerId: userId },
      data: { assignedWorkerId: null },
    });
    
    // Delete the user
    await prisma.user.delete({
      where: { id: userId },
    });

    return json({ success: true }, { status: 200 });
  } catch (e: any) {
    console.error("DELETE /api/admins error:", e);
    return json({ error: e?.message ?? "Internal error" }, { status: 500 });
  }
}