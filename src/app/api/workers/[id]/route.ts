import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { getSessionUser } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

const updateWorkerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
});

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    const { id } = await params;
    const tenantId = user.tenantId;

    const worker = await prisma.user.findFirst({
      where: { id, tenantId, role: "worker" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profileImage: true,
        createdAt: true,
      },
    });
    if (!worker) {
      return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    }

    const [properties, maintenanceRequests, workLogAgg] = await Promise.all([
      prisma.property.findMany({
        where: { tenantId, assignedWorkerId: id },
        select: { id: true, name: true, title: true, address: true, city: true, imageUrl: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.maintenanceRequest.findMany({
        where: { tenantId, assignedWorkerId: id },
        select: {
          id: true,
          issue: true,
          status: true,
          priority: true,
          dateSubmitted: true,
          property: { select: { id: true, name: true, title: true } },
        },
        orderBy: { dateSubmitted: "desc" },
      }),
      prisma.workLog.aggregate({
        where: { userId: id },
        _sum: { timeSpent: true },
        _count: { _all: true },
      }),
    ]);

    const stats = {
      assignedProperties: properties.length,
      activeRequests: maintenanceRequests.filter((r) => r.status !== "Completed").length,
      completedRequests: maintenanceRequests.filter((r) => r.status === "Completed").length,
      totalTimeLoggedSeconds: workLogAgg._sum.timeSpent ?? 0,
      workLogCount: workLogAgg._count._all,
    };

    return NextResponse.json({
      data: { worker, properties, maintenanceRequests, stats },
    });
  } catch (e: any) {
    console.error("GET /api/workers/[id] error:", e);
    return NextResponse.json({ error: e?.message ?? "Internal error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    if (user.role !== "admin" && user.role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    const tenantId = user.tenantId;

    const existing = await prisma.user.findFirst({ where: { id, tenantId, role: "worker" } });
    if (!existing) {
      return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    }

    const parsed = updateWorkerSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
    }

    const saved = await prisma.user.update({
      where: { id },
      data: {
        name: parsed.data.name,
        email: parsed.data.email.toLowerCase(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tenantId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ data: saved });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }
    console.error("PUT /api/workers/[id] error:", e);
    return NextResponse.json({ error: e?.message ?? "Internal error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (user.role !== "admin" && user.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const tenantId = user.tenantId;

  const existing = await prisma.user.findFirst({ where: { id, tenantId, role: "worker" } });
  if (!existing) {
    return NextResponse.json({ error: "Worker not found" }, { status: 404 });
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({});
}
