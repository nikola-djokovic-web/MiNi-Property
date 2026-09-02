import { describe, expect, it, vi, beforeEach } from "vitest";

const lookupMock = vi.fn();
vi.mock("node:dns/promises", () => ({
  default: { lookup: (...args: any[]) => lookupMock(...args) },
  lookup: (...args: any[]) => lookupMock(...args),
}));

import { assertPublicHttpUrl } from "./url-safety";

describe("assertPublicHttpUrl", () => {
  beforeEach(() => {
    lookupMock.mockReset();
  });

  it("rejects non-http(s) protocols", async () => {
    await expect(assertPublicHttpUrl("ftp://example.com/file")).rejects.toThrow();
    await expect(assertPublicHttpUrl("file:///etc/passwd")).rejects.toThrow();
  });

  it("rejects malformed URLs", async () => {
    await expect(assertPublicHttpUrl("not a url")).rejects.toThrow();
  });

  it("rejects literal loopback/private IPv4 addresses without a DNS lookup", async () => {
    await expect(assertPublicHttpUrl("http://127.0.0.1/")).rejects.toThrow();
    await expect(assertPublicHttpUrl("http://10.0.0.5/")).rejects.toThrow();
    await expect(assertPublicHttpUrl("http://192.168.1.1/")).rejects.toThrow();
    await expect(assertPublicHttpUrl("http://172.16.0.1/")).rejects.toThrow();
    await expect(assertPublicHttpUrl("http://169.254.169.254/latest/meta-data/")).rejects.toThrow();
    expect(lookupMock).not.toHaveBeenCalled();
  });

  it("rejects the literal hostname 'localhost'", async () => {
    await expect(assertPublicHttpUrl("http://localhost:9002/api/debug")).rejects.toThrow();
  });

  it("allows a literal public IPv4 address", async () => {
    await expect(assertPublicHttpUrl("http://93.184.216.34/")).resolves.toBeUndefined();
    expect(lookupMock).not.toHaveBeenCalled();
  });

  it("allows a hostname that resolves to a public IP", async () => {
    lookupMock.mockResolvedValue([{ address: "93.184.216.34" }]);
    await expect(assertPublicHttpUrl("https://example.com/webhook")).resolves.toBeUndefined();
  });

  it("rejects a hostname that resolves to a private IP (DNS rebinding)", async () => {
    lookupMock.mockResolvedValue([{ address: "127.0.0.1" }]);
    await expect(assertPublicHttpUrl("https://attacker.example/hook")).rejects.toThrow();
  });

  it("rejects a hostname that fails to resolve", async () => {
    lookupMock.mockRejectedValue(new Error("ENOTFOUND"));
    await expect(assertPublicHttpUrl("https://does-not-exist.invalid/hook")).rejects.toThrow();
  });
});
