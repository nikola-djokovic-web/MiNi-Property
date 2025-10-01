// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const prisma = new PrismaClient();

async function main() {
  // Seed a demo tenant
  const tenant = await prisma.tenant.upsert({
    where: { subdomain: "demo" },
    update: {},
    create: { name: "Demo Co", subdomain: "demo" },
  });

  // Seed a demo user
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

  // Seed one property
  await prisma.property.upsert({
    where: { id: "seed-prop-1" },
    update: {},
    create: {
      id: "seed-prop-1",
      tenantId: tenant.id,
      name: "Hauptstraße 1",
      address: "Hauptstraße 1",
      city: "Berlin",
      country: "DE",
    },
  });

  console.log("✅ Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
