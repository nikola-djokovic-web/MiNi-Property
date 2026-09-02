import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { getSessionUser } from "@/lib/auth";
import { sendMessageEmail } from "@/lib/email";

const sendMessageSchema = z.object({
  subject: z.string().trim().min(1, "Subject is required").max(200),
  message: z.string().trim().min(1, "Message is required").max(5000),
});

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    if (user.role !== "admin" && user.role !== "owner" && user.role !== "worker") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await context.params;

    const tenant = await prisma.user.findFirst({
      where: { id, tenantId: user.tenantId, role: "tenant" },
      select: { email: true },
    });
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const parsed = sendMessageSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
    }

    await sendMessageEmail({
      to: tenant.email,
      fromName: user.name || user.email,
      subject: parsed.data.subject,
      message: parsed.data.message,
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("POST /api/tenants/[id]/message error:", e);
    return NextResponse.json({ error: e?.message ?? "Failed to send message" }, { status: 500 });
  }
}
