import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { getSessionUser } from "@/lib/auth";

const updateUnitSchema = z.object({
  label: z.string().trim().min(1).max(50).optional(),
  bedrooms: z.number().int().min(0).max(50).optional(),
  rent: z.number().min(0).max(1_000_000).optional(),
});

async function loadUnitForUser(unitId: string, user: { tenantId: string }) {
  return prisma.unit.findFirst({ where: { id: unitId, tenantId: user.tenantId } });
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    if (user.role !== "admin" && user.role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await context.params;

    const unit = await loadUnitForUser(id, user);
    if (!unit) return NextResponse.json({ error: "Unit not found" }, { status: 404 });

    const parsed = updateUnitSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
    }

    const updated = await prisma.unit.update({
      where: { id },
      data: parsed.data,
      include: { leases: { orderBy: { startDate: "desc" } } },
    });

    return NextResponse.json({ data: updated });
  } catch (e: any) {
    console.error("PATCH /api/units/[id] error:", e);
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

    const unit = await loadUnitForUser(id, user);
    if (!unit) return NextResponse.json({ error: "Unit not found" }, { status: 404 });

    await prisma.unit.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("DELETE /api/units/[id] error:", e);
    return NextResponse.json({ error: e?.message ?? "Internal error" }, { status: 500 });
  }
}
