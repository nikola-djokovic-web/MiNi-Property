import dns from "node:dns/promises";
import net from "node:net";

const BLOCKED_HOSTNAMES = new Set(["localhost"]);

function isPrivateIp(ip: string): boolean {
  if (net.isIP(ip) === 4) {
    const parts = ip.split(".").map(Number);
    if (parts[0] === 0) return true; // "this" network
    if (parts[0] === 10) return true; // RFC1918
    if (parts[0] === 127) return true; // loopback
    if (parts[0] === 169 && parts[1] === 254) return true; // link-local / cloud metadata
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true; // RFC1918
    if (parts[0] === 192 && parts[1] === 168) return true; // RFC1918
    return false;
  }
  if (net.isIP(ip) === 6) {
    const lower = ip.toLowerCase();
    if (lower === "::1") return true; // loopback
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique local
    if (lower.startsWith("fe80")) return true; // link-local
    if (lower.startsWith("::ffff:")) return isPrivateIp(lower.slice(7));
    return false;
  }
  return true; // not a recognizable IP - treat as unsafe
}

/**
 * Throws if the given URL points at a private/loopback/link-local address,
 * to block SSRF via outbound webhook requests. Resolves the hostname so a
 * public-looking domain that points at an internal IP is also rejected.
 */
export async function assertPublicHttpUrl(urlStr: string): Promise<void> {
  let parsed: URL;
  try {
    parsed = new URL(urlStr);
  } catch {
    throw new Error("Invalid URL");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("URL must use http or https");
  }

  const hostname = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    throw new Error("URL host is not allowed");
  }

  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) throw new Error("URL host is not allowed");
    return;
  }

  let addresses: string[];
  try {
    const results = await dns.lookup(hostname, { all: true });
    addresses = results.map((r) => r.address);
  } catch {
    throw new Error("Could not resolve URL host");
  }

  if (addresses.length === 0 || addresses.some(isPrivateIp)) {
    throw new Error("URL host is not allowed");
  }
}
