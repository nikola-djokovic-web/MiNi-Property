import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { requireTenantId } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  try {
    const tenantId = requireTenantId(req);
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.toLowerCase() || "";
    
    if (!query || query.length < 2) {
      return NextResponse.json({ 
        data: {
          properties: [],
          tenants: [],
          workers: [],
          maintenance: [],
          units: [],
          leases: []
        }
      });
    }

    // Search across all tables in parallel
    const [properties, tenants, workers, maintenance, units, leases] = await Promise.all([
      // Search Properties
      prisma.property.findMany({
        where: {
          tenantId,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { title: { contains: query, mode: 'insensitive' } },
            { address: { contains: query, mode: 'insensitive' } },
            { city: { contains: query, mode: 'insensitive' } },
            { type: { contains: query, mode: 'insensitive' } },
            { country: { contains: query, mode: 'insensitive' } }
          ]
        },
        take: 10,
        orderBy: { createdAt: 'desc' }
      }),

      // Search Tenants (Users with role 'tenant')
      prisma.user.findMany({
        where: {
          tenantId,
          role: 'tenant',
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } }
          ]
        },
        take: 10,
        orderBy: { createdAt: 'desc' }
      }),

      // Search Workers (Users with other roles)
      prisma.user.findMany({
        where: {
          tenantId,
          role: { not: 'tenant' },
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { role: { contains: query, mode: 'insensitive' } }
          ]
        },
        take: 10,
        orderBy: { createdAt: 'desc' }
      }),

      // Search Maintenance Requests
      prisma.maintenanceRequest.findMany({
        where: {
          tenantId,
          OR: [
            { issue: { contains: query, mode: 'insensitive' } },
            { details: { contains: query, mode: 'insensitive' } },
            { status: { contains: query, mode: 'insensitive' } },
            { priority: { contains: query, mode: 'insensitive' } }
          ]
        },
        include: {
          property: {
            select: { name: true, title: true, address: true }
          }
        },
        take: 10,
        orderBy: { dateSubmitted: 'desc' }
      }),

      // Search Units
      prisma.unit.findMany({
        where: {
          tenantId,
          OR: [
            { label: { contains: query, mode: 'insensitive' } }
          ]
        },
        include: {
          property: {
            select: { name: true, title: true, address: true }
          }
        },
        take: 10,
        orderBy: { createdAt: 'desc' }
      }),

      // Search Leases
      prisma.lease.findMany({
        where: {
          tenantId,
          OR: [
            { resident: { contains: query, mode: 'insensitive' } }
          ]
        },
        include: {
          unit: {
            include: {
              property: {
                select: { name: true, title: true, address: true }
              }
            }
          }
        },
        take: 10,
        orderBy: { startDate: 'desc' }
      })
    ]);

    return NextResponse.json({
      data: {
        properties,
        tenants,
        workers,
        maintenance,
        units,
        leases
      }
    });

  } catch (e: any) {
    console.error("GET /api/search error:", e);
    return NextResponse.json(
      { error: e?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}