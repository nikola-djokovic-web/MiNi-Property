import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { getSessionUser } from "@/lib/auth";

const updateLeaseSchema = z.object({
  resident: z.string().trim().min(1).max(200).optional(),
  startDate: z.string().trim().min(1).optional(),
  endDate: z.string().trim().min(1).nullable().optional(),
  monthlyRent: z.number().min(0).max(1_000_000).optional(),
});

async function loadLeaseForUser(leaseId: string, user: { tenantId: string }) {
  return prisma.lease.findFirst({ where: { id: leaseId, tenantId: user.tenantId } });
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    if (user.role !== "admin" && user.role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await context.params;

    const lease = await loadLeaseForUser(id, user);
    if (!lease) return NextResponse.json({ error: "Lease not found" }, { status: 404 });

    const parsed = updateLeaseSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
    }

    const data: any = { ...parsed.data };
    if (data.startDate) {
      const d = new Date(data.startDate);
      if (Number.isNaN(d.getTime())) return NextResponse.json({ error: "Invalid start date" }, { status: 400 });
      data.startDate = d;
    }
    if (data.endDate !== undefined) {
      if (data.endDate === null) {
        data.endDate = null;
      } else {
        const d = new Date(data.endDate);
        if (Number.isNaN(d.getTime())) return NextResponse.json({ error: "Invalid end date" }, { status: 400 });
        data.endDate = d;
      }
    }

    const updated = await prisma.lease.update({ where: { id }, data });

    return NextResponse.json({ data: updated });
  } catch (e: any) {
    console.error("PATCH /api/leases/[id] error:", e);
    return NextResponse.json({ error: e?.message ?? "Internal error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    if (user.role !== "admin" && user.role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await context.params;

    const lease = await loadLeaseForUser(id, user);
    if (!lease) return NextResponse.json({ error: "Lease not found" }, { status: 404 });

    await prisma.lease.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("DELETE /api/leases/[id] error:", e);
    return NextResponse.json({ error: e?.message ?? "Internal error" }, { status: 500 });
  }
}
