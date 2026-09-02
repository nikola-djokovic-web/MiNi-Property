import { prisma } from "@/server/db";
import type { User } from "@prisma/client";

export async function listPropertiesForUser(user: Pick<User, "tenantId" | "role" | "id">) {
  const whereClause: any = { tenantId: user.tenantId };
  if (user.role === "worker") {
    whereClause.assignedWorkerId = user.id;
  }
  return prisma.property.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
  });
}

export async function listMaintenanceRequestsForUser(user: Pick<User, "tenantId" | "role" | "id">) {
  const whereClause: any = { tenantId: user.tenantId };
  if (user.role === "worker") {
    whereClause.assignedWorkerId = user.id;
  }
  return prisma.maintenanceRequest.findMany({
    where: whereClause,
    include: {
      property: {
        select: { id: true, name: true, title: true, address: true },
      },
      tenant: {
        select: { id: true, name: true },
      },
    },
    orderBy: { dateSubmitted: "desc" },
  });
}

export async function listTenantsForUser(
  user: Pick<User, "tenantId">,
  { page = 1, pageSize = 10 }: { page?: number; pageSize?: number } = {}
) {
  const tenantId = user.tenantId;
  const where = { tenantId, role: "tenant" as const };

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        email: true,
        name: true,
        profileImage: true,
        role: true,
        tenantId: true,
        createdAt: true,
        updatedAt: true,
        passwordHash: true, // only used to derive `registered` below, never returned
      },
    }),
  ]);

  const userIds = users.map((u) => u.id);
  const userInvites = userIds.length
    ? await prisma.invite.findMany({
        where: { tenantId, userId: { in: userIds } },
        include: {
          property: { select: { id: true, title: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const inviteMap = new Map<string, (typeof userInvites)[number]>();
  userInvites.forEach((invite) => {
    if (invite.userId && !inviteMap.has(invite.userId)) {
      inviteMap.set(invite.userId, invite);
    }
  });

  const data = users.map(({ passwordHash, ...u }) => {
    const latestInvite = inviteMap.get(u.id);
    return {
      ...u,
      propertyId: latestInvite?.propertyId || null,
      property: latestInvite?.property || null,
      // Whether the tenant has completed registration (set a password) yet -
      // used by the UI to show a "New" vs "Active" status badge.
      registered: passwordHash != null,
    };
  });

  return { data, total, page, pageSize };
}
