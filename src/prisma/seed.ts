import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { subdomain: "demo" },
    update: {},
    create: { name: "Demo Co", subdomain: "demo" },
  });
  await prisma.user.upsert({
    where: { email: "owner@demo.com" },
    update: {},
    create: {
      email: "owner@demo.com",
      name: "Owner",
      role: "owner",
      tenantId: tenant.id,
    },
  });
  console.log("Seeded tenant", tenant.subdomain);
}
main().finally(() => prisma.$disconnect());
