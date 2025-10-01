import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { requireTenantId } from "@/lib/tenant";

type Params = { params: { id: string } };

export async function PUT(req: NextRequest, { params }: Params) {
  const tenantId = requireTenantId(req);
  const body = await req.json();

  const saved = await prisma.user.update({
    where: { id: params.id, tenantId },
    data: {
      name: body.name,
      email: body.email,
      // add other fields you keep for workers
    },
  });

  return NextResponse.json({ data: saved });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const tenantId = requireTenantId(req);
  await prisma.user.delete({
    where: { id: params.id, tenantId },
  });
  return NextResponse.json({});
}
