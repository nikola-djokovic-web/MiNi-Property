import { describe, expect, it } from "vitest";
import { hashToken } from "./auth";

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
