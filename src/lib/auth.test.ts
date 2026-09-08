import { describe, expect, it, vi, beforeEach } from "vitest";
import { hashToken } from "./auth";

const mockCookieStore = { get: vi.fn() };
vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve(mockCookieStore),
}));

const mockSessionFindUnique = vi.fn();
const mockSessionDelete = vi.fn();
vi.mock("@/server/db", () => ({
  prisma: {
    session: {
      findUnique: (...args: unknown[]) => mockSessionFindUnique(...args),
      delete: (...args: unknown[]) => mockSessionDelete(...args),
    },
  },
}));

describe("requireRole", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when there is no session cookie", async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    const { requireRole } = await import("./auth");

    const { user, error } = await requireRole(["admin", "owner"]);

    expect(user).toBeNull();
    expect(error?.status).toBe(401);
  });

  it("returns 403 when the session user's role is not allowed", async () => {
    mockCookieStore.get.mockReturnValue({ value: "some-token" });
    mockSessionFindUnique.mockResolvedValue({
      expiresAt: new Date(Date.now() + 1000 * 60),
      user: { id: "u1", role: "tenant", tenantId: "t1" },
    });
    const { requireRole } = await import("./auth");

    const { user, error } = await requireRole(["admin", "owner"]);

    expect(user).toBeNull();
    expect(error?.status).toBe(403);
  });

  it("returns the user when the role is allowed", async () => {
    mockCookieStore.get.mockReturnValue({ value: "some-token" });
    mockSessionFindUnique.mockResolvedValue({
      expiresAt: new Date(Date.now() + 1000 * 60),
      user: { id: "u1", role: "admin", tenantId: "t1" },
    });
    const { requireRole } = await import("./auth");

    const { user, error } = await requireRole(["admin", "owner"]);

    expect(error).toBeNull();
    expect(user?.role).toBe("admin");
  });
});

describe("hashToken", () => {
  it("is deterministic for the same input", () => {
    expect(hashToken("my-secret-token")).toBe(hashToken("my-secret-token"));
  });

  it("produces different hashes for different inputs", () => {
    expect(hashToken("token-a")).not.toBe(hashToken("token-b"));
  });

  it("returns a 64-character hex sha256 digest", () => {
    const hash = hashToken("anything");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("does not return the original token", () => {
    expect(hashToken("plaintext-session-token")).not.toBe("plaintext-session-token");
  });
});
