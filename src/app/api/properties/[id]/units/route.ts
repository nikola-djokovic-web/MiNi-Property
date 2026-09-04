import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { getSessionUser } from "@/lib/auth";

const createUnitSchema = z.object({
  label: z.string().trim().min(1).max(50),
  bedrooms: z.number().int().min(0).max(50),
  rent: z.number().min(0).max(1_000_000),
});

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    if (user.role !== "admin" && user.role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id: propertyId } = await context.params;

    const property = await prisma.property.findFirst({
      where: { id: propertyId, tenantId: user.tenantId },
      select: { id: true },
    });
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const units = await prisma.unit.findMany({
      where: { propertyId },
      include: { leases: { orderBy: { startDate: "desc" } } },
      orderBy: { label: "asc" },
    });

    return NextResponse.json({ data: units });
  } catch (e: any) {
    console.error("GET /api/properties/[id]/units error:", e);
    return NextResponse.json({ error: e?.message ?? "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    if (user.role !== "admin" && user.role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id: propertyId } = await context.params;

    const property = await prisma.property.findFirst({
      where: { id: propertyId, tenantId: user.tenantId },
      select: { id: true },
    });
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const parsed = createUnitSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
    }

    const unit = await prisma.unit.create({
      data: {
        tenantId: user.tenantId,
        propertyId,
        label: parsed.data.label,
        bedrooms: parsed.data.bedrooms,
        rent: parsed.data.rent,
      },
      include: { leases: true },
    });

    return NextResponse.json({ data: unit });
  } catch (e: any) {
    console.error("POST /api/properties/[id]/units error:", e);
    return NextResponse.json({ error: e?.message ?? "Internal error" }, { status: 500 });
  }
}
