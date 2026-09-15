import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    // Admin/owner see every worker; a worker may only see their own stats.
    if (user.role !== "admin" && user.role !== "owner" && user.role !== "worker") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const tenantId = user.tenantId;

    const workers = await prisma.user.findMany({
      where: {
        tenantId,
        role: "worker",
        ...(user.role === "worker" ? { id: user.id } : {}),
      },
      select: { id: true, name: true, email: true, profileImage: true },
      orderBy: { createdAt: "desc" },
    });

    const stats = await Promise.all(
      workers.map(async (worker) => {
        const [requests, workLogAgg] = await Promise.all([
          prisma.maintenanceRequest.findMany({
            where: { tenantId, assignedWorkerId: worker.id, deletedAt: null },
            select: { status: true, tenantConfirmed: true, rating: true, createdAt: true, closedAt: true },
          }),
          prisma.workLog.aggregate({
            where: { userId: worker.id },
            _sum: { timeSpent: true },
            _count: { _all: true },
          }),
        ]);

        const completedRequests = requests.filter((r) => r.status === "Completed").length;
        const activeRequests = requests.filter((r) => r.status !== "Completed").length;

        const ratings = requests
          .filter((r) => r.tenantConfirmed && r.rating != null)
          .map((r) => r.rating as number);
        const avgRating = ratings.length
          ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
          : null;

        const closeTimesHours = requests
          .filter((r) => r.tenantConfirmed && r.closedAt)
          .map((r) => (r.closedAt!.getTime() - r.createdAt.getTime()) / (1000 * 60 * 60));
        const avgCloseTimeHours = closeTimesHours.length
          ? closeTimesHours.reduce((sum, h) => sum + h, 0) / closeTimesHours.length
          : null;

        return {
          worker,
          completedRequests,
          activeRequests,
          avgRating,
          avgCloseTimeHours,
          totalTimeLoggedSeconds: workLogAgg._sum.timeSpent ?? 0,
          workLogCount: workLogAgg._count._all,
        };
      })
    );

    return NextResponse.json({ data: stats });
  } catch (e: any) {
    console.error("GET /api/workers/stats error:", e);
    return NextResponse.json({ error: e?.message ?? "Internal error" }, { status: 500 });
  }
}
