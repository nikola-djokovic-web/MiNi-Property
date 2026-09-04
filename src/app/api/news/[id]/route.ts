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

async function getAuthorizedPost(id: string) {
  const user = await getSessionUser();
  if (!user) return { error: NextResponse.json({ error: "Authentication required" }, { status: 401 }) };
  if (!canManageNews(user.role)) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  const post = await prisma.newsPost.findFirst({ where: { id, tenantId: user.tenantId } });
  if (!post) return { error: NextResponse.json({ error: "News post not found" }, { status: 404 }) };
  return { post };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authorized = await getAuthorizedPost(id);
    if (authorized.error) return authorized.error;
    const parsed = newsSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
    const data = await prisma.newsPost.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ data });
  } catch (error: any) {
    console.error("PATCH /api/news/[id] error:", error);
    return NextResponse.json({ error: error?.message ?? "Internal error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authorized = await getAuthorizedPost(id);
    if (authorized.error) return authorized.error;
    await prisma.newsPost.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/news/[id] error:", error);
    return NextResponse.json({ error: error?.message ?? "Internal error" }, { status: 500 });
  }
}
