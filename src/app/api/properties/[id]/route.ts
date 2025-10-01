import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { requireTenantId } from "@/lib/tenant";

type Params = { params: { id: string } };

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const tenantId = requireTenantId(req);
    const body = await req.json();

    const data: any = {
      name: body.name ?? body.title ?? undefined,
      title: body.title ?? body.name ?? undefined,
      address: body.address ?? undefined,
      city: body.city ?? undefined,
      imageUrl: body.imageUrl ?? undefined,
      imageHint: body.imageHint ?? undefined,
      type: body.type ?? undefined,
      assignedWorkerId: body.assignedWorkerId ?? null,
    };
    Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);

    // scope by tenant to avoid cross-tenant edits
    const result = await prisma.property.updateMany({
      where: { id: params.id, tenantId },
      data,
    });
    if (result.count === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const saved = await prisma.property.findUnique({
      where: { id: params.id },
    });
    return NextResponse.json({ data: saved });
  } catch (e: any) {
    console.error("PUT /api/properties/[id] error:", e);
    return NextResponse.json(
      { error: e?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const tenantId = requireTenantId(req);
    const result = await prisma.property.deleteMany({
      where: { id: params.id, tenantId },
    });
    if (result.count === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({});
  } catch (e: any) {
    console.error("DELETE /api/properties/[id] error:", e);
    return NextResponse.json(
      { error: e?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}
