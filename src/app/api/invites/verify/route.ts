// src/app/api/invites/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") || "";
  if (!token)
    return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const invite = await prisma.invite.findUnique({ where: { token } });
  if (!invite || invite.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "Invalid or expired invite" },
      { status: 410 }
    );
  }

  // Return minimal info to show on the UI
  return NextResponse.json({
    data: { email: invite.email, tenantId: invite.tenantId },
  });
}
