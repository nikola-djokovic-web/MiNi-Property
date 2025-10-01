import type { NextRequest } from "next/server";

export function requireTenantId(req: NextRequest) {
  const tid = req.headers.get("x-tenant-id") ?? "";
  if (!tid) throw new Error("Missing tenant (x-tenant-id)");
  return tid;
}
