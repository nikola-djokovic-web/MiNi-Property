import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { getSessionUser } from "@/lib/auth";

const updateTenantSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
  propertyId: z.string().min(1).nullable().optional(),
});

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    if (user.role !== "admin" && user.role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await context.params;
    const tenantId = user.tenantId;

    const existing = await prisma.user.findFirst({ where: { id, tenantId, role: "tenant" } });
    if (!existing) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const parsed = updateTenantSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
    }
    const { name, email, propertyId } = parsed.data;

    if (propertyId) {
      const property = await prisma.property.findFirst({ where: { id: propertyId, tenantId } });
      if (!property) {
        return NextResponse.json({ error: "Property not found" }, { status: 400 });
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        name,
        email: email.toLowerCase(),
        ...(propertyId !== undefined ? { propertyId } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tenantId: true,
        propertyId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }
    console.error("PUT /api/tenants/[id] error:", e);
    return NextResponse.json({ error: e?.message ?? "Internal error" }, { status: 500 });
  }
}
