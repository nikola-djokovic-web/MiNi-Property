import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import bcrypt from "bcryptjs";
import { createSession, publicUser } from "@/lib/auth";
import { enforceRateLimit, RateLimitError } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    try {
      // Broad per-IP limit (catches credential stuffing across many emails)
      // plus a tighter per-account limit (catches brute-forcing one email).
      await enforceRateLimit("login-ip", { maxRequests: 30, windowSeconds: 900 });
      await enforceRateLimit("login", { maxRequests: 10, windowSeconds: 900, extra: email.toLowerCase() });
    } catch (e) {
      if (e instanceof RateLimitError) {
        return NextResponse.json(
          { error: "Too many login attempts. Please try again later." },
          { status: 429, headers: { "Retry-After": String(e.retryAfterSeconds) } }
        );
      }
      throw e;
    }

    // Find user by email
    const user = await prisma.user.findFirst({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Check if user has a password (completed registration)
    if (!user.passwordHash) {
      return NextResponse.json(
        { error: "Account not activated. Please check your email for registration instructions." },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    await createSession(user.id);

    return NextResponse.json({
      user: publicUser(user),
    });

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}