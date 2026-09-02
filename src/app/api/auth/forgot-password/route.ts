import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/server/db";
import { hashToken } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";

const message = "If an account exists for that email, a reset link has been sent.";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email) return NextResponse.json({ message }, { status: 200 });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ message });

  const token = crypto.randomBytes(32).toString("base64url");
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
  await prisma.passwordResetToken.create({
    data: {
      tokenHash: hashToken(token),
      userId: user.id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  try {
    await sendPasswordResetEmail({ email: user.email, token });
  } catch (error) {
    console.error("Password reset email failed:", error);
  }

  return NextResponse.json({ message });
}