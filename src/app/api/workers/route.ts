import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { requireTenantId } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  try {
    const tenantId = requireTenantId(req);
    const data = await prisma.user.findMany({
      where: { tenantId, role: "worker" },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ data });
  } catch (e: any) {
    console.error("GET /api/workers error:", e);
    return NextResponse.json(
      { error: e?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}
