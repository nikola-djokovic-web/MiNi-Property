import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/server/db";
import { hashToken } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";
import { enforceRateLimit, RateLimitError } from "@/lib/rate-limit";

const message = "If an account exists for that email, a reset link has been sent.";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email) return NextResponse.json({ message }, { status: 200 });

  try {
    await enforceRateLimit("forgot-password-ip", { maxRequests: 20, windowSeconds: 3600 });
    await enforceRateLimit("forgot-password", { maxRequests: 5, windowSeconds: 3600, extra: email });
  } catch (e) {
    if (e instanceof RateLimitError) {
      // Same generic message as success, to avoid leaking whether the
      // account exists or is just being rate-limited.
      return NextResponse.json({ message }, { status: 200 });
    }
    throw e;
  }

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