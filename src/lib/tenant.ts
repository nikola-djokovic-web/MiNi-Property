import type { NextRequest } from "next/server";
import { prisma } from "@/server/db";

// Synchronous version that expects the actual tenant ID
export function requireTenantId(req: NextRequest) {
  const tid = req.headers.get("x-tenant-id") ?? "";
  if (!tid) throw new Error("Missing tenant (x-tenant-id)");
  return tid;
}

// Async version that can resolve subdomain to tenant ID
export async function resolveTenantId(req: NextRequest) {
  const tid = req.headers.get("x-tenant-id") ?? "";
  if (!tid) throw new Error("Missing tenant (x-tenant-id)");
  
  // If it looks like a subdomain (no special characters), try to look it up
  if (/^[a-z0-9-]+$/.test(tid)) {
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { subdomain: tid },
        select: { id: true }
      });
      if (tenant) {
        return tenant.id;
      }
    } catch (error) {
      console.warn("Failed to lookup tenant by subdomain:", tid, error);
    }
  }
  
  // Otherwise assume it's already a tenant ID
  return tid;
}
