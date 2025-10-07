// src/app/api/invites/complete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { token, password, name } = (await req.json()) as {
    token?: string;
    password?: string;
    name?: string;
  };
  if (!token || !password) {
    return NextResponse.json(
      { error: "Missing token or password" },
      { status: 400 }
    );
  }

  const invite = await prisma.invite.findUnique({ 
    where: { token },
    include: { property: true }
  });
  if (!invite || invite.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "Invalid or expired invite" },
      { status: 410 }
    );
  }

  const hash = await bcrypt.hash(password, 12);
  const updatedUser = await prisma.user.update({
    where: { id: invite.userId },
    data: {
      passwordHash: hash,
      propertyId: invite.propertyId, // Store the property assignment
      ...(name ? { name } : {}),
      // activatedAt: new Date(), // optional if you add the field
    },
  });

  // Consume the invite so the link can't be reused
  await prisma.invite.delete({ where: { token } });

  // Return user data for auto-login
  return NextResponse.json({ 
    ok: true,
    user: {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      tenantId: updatedUser.tenantId,
      profileImage: (updatedUser as any).profileImage || null,
    }
  });
}
