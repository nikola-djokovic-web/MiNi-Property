import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { requireTenantId } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  try {
    const tenantId = requireTenantId(req);
    const data = await prisma.property.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
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
    const tenantId = requireTenantId(req);
    const body = await req.json();

    // Map + defaults for required columns to avoid 500s
    const title =
      (body.title ?? body.name ?? "").toString().trim() || "Untitled";
    const name = (body.name ?? body.title ?? title).toString().trim() || title;
    const address = (body.address ?? "").toString();
    const city = (body.city ?? "").toString();

    const created = await prisma.property.create({
      data: {
        tenantId,
        name,
        address,
        city,
        // presentation fields
        title,
        imageUrl: (body.imageUrl ?? "").toString(),
        imageHint: body.imageHint ?? null,
        type: (body.type ?? "Apartment").toString(),
        assignedWorkerId: body.assignedWorkerId ?? null,
      },
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (e: any) {
    console.error("POST /api/properties error:", e);
    return NextResponse.json(
      { error: e?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}
