import { cookies } from "next/headers";
import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/server/db";

export const SESSION_COOKIE = "mini_property_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);

  await prisma.session.create({
    data: { tokenHash: hashToken(token), userId, expiresAt },
  });

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });

  if (!session) return null;
  if (session.expiresAt <= new Date()) {
    await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  return session.user;
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("UNAUTHENTICATED");
  }
  return user;
}

/**
 * Session + role gate for API routes: returns the session user when it
 * exists and its role is in `roles`, otherwise a ready-to-return
 * NextResponse (401 if unauthenticated, 403 if the role doesn't match).
 */
export async function requireRole(roles: string[]) {
  const user = await getSessionUser();
  if (!user) {
    return { user: null, error: NextResponse.json({ error: "Authentication required" }, { status: 401 }) };
  }
  if (!roles.includes(user.role)) {
    return { user: null, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { user, error: null };
}

export function publicUser(user: {
  id: string;
  name: string | null;
  email: string;
  role: string;
  tenantId: string;
  profileImage: string | null;
  propertyId?: string | null;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId,
    profileImage: user.profileImage,
    propertyId: user.propertyId ?? null,
  };
}
