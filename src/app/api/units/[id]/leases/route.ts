import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { getSessionUser } from "@/lib/auth";

const createLeaseSchema = z.object({
  resident: z.string().trim().min(1).max(200),
  startDate: z.string().trim().min(1),
  endDate: z.string().trim().min(1).nullable().optional(),
  monthlyRent: z.number().min(0).max(1_000_000),
});

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    if (user.role !== "admin" && user.role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id: unitId } = await context.params;

    const unit = await prisma.unit.findFirst({ where: { id: unitId, tenantId: user.tenantId } });
    if (!unit) return NextResponse.json({ error: "Unit not found" }, { status: 404 });

    const parsed = createLeaseSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
    }

    const startDate = new Date(parsed.data.startDate);
    const endDate = parsed.data.endDate ? new Date(parsed.data.endDate) : null;
    if (Number.isNaN(startDate.getTime()) || (endDate && Number.isNaN(endDate.getTime()))) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }

    const lease = await prisma.lease.create({
      data: {
        tenantId: user.tenantId,
        unitId,
        resident: parsed.data.resident,
        startDate,
        endDate,
        monthlyRent: parsed.data.monthlyRent,
      },
    });

    return NextResponse.json({ data: lease });
  } catch (e: any) {
    console.error("POST /api/units/[id]/leases error:", e);
    return NextResponse.json({ error: e?.message ?? "Internal error" }, { status: 500 });
  }
}
