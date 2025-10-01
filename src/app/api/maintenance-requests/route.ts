import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { requireTenantId } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  const tenantId = requireTenantId(req);
  const data = await prisma.lease.findMany(); // placeholder – use your actual MaintenanceRequest model if/when added
  // If you don't have a model yet, skip GET and only leave POST implemented once the model exists.
  return NextResponse.json({ data: [] }); // temporary until model is defined
}

export async function POST(req: NextRequest) {
  const tenantId = requireTenantId(req);
  const body = await req.json();
  // You likely want a MaintenanceRequest model; if not yet in schema, temporarily store requests as a JSON log or skip DB write.
  // Example if you add a model later:
  // const created = await prisma.maintenanceRequest.create({ data: { ...body, tenantId } });

  const created = { id: crypto.randomUUID(), tenantId, ...body }; // TEMP fake response so UI works
  return NextResponse.json({ data: created }, { status: 201 });
}
