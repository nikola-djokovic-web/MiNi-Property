import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { getSessionUser } from "@/lib/auth";

const newsSchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().min(1).max(5000),
});

function canManageNews(role: string) {
  return role === "admin" || role === "owner";
}

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const data = await prisma.newsPost.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({ data });
  } catch (error: any) {
    console.error("GET /api/news error:", error);
    return NextResponse.json({ error: error?.message ?? "Internal error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    if (!canManageNews(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const parsed = newsSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });

    const data = await prisma.newsPost.create({ data: { ...parsed.data, tenantId: user.tenantId } });
    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/news error:", error);
    return NextResponse.json({ error: error?.message ?? "Internal error" }, { status: 500 });
  }
}
