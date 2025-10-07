// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import "dotenv/config";

const prisma = new PrismaClient();

async function main() {
  // Seed a demo tenant
  const tenant = await prisma.tenant.upsert({
    where: { subdomain: "demo" },
    update: {},
    create: { name: "Demo Co", subdomain: "demo" },
  });

  // Hash password for seeded users
  const adminPasswordHash = await bcrypt.hash("admin123", 12);

  // Seed admin user with password
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      id: "user-admin", // Fixed ID to match frontend
      email: "admin@example.com",
      name: "Admin User",
      role: "admin",
      tenantId: tenant.id,
      passwordHash: adminPasswordHash,
    },
  });

  // Seed a demo user (owner without password for now)
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
  const property = await prisma.property.upsert({
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

  // Seed another property for variety
  const property2 = await prisma.property.upsert({
    where: { id: "seed-prop-2" },
    update: {},
    create: {
      id: "seed-prop-2",
      tenantId: tenant.id,
      name: "Sunset Apartments",
      address: "123 Sunset Blvd",
      city: "Los Angeles",
      country: "US",
    },
  });

  // Seed units
  const unit1 = await prisma.unit.upsert({
    where: { id: "seed-unit-1" },
    update: {},
    create: {
      id: "seed-unit-1",
      label: "A101",
      bedrooms: 2,
      rent: 1800,
      propertyId: property.id,
      tenantId: tenant.id,
    },
  });

  const unit2 = await prisma.unit.upsert({
    where: { id: "seed-unit-2" },
    update: {},
    create: {
      id: "seed-unit-2",
      label: "B205",
      bedrooms: 1,
      rent: 1400,
      propertyId: property2.id,
      tenantId: tenant.id,
    },
  });

  // Seed a test tenant user with password and property assignment
  const tenantPasswordHash = await bcrypt.hash("tenant123", 12);
  await prisma.user.upsert({
    where: { email: "tenant@example.com" },
    update: {},
    create: {
      email: "tenant@example.com",
      name: "Test Tenant",
      role: "tenant",
      tenantId: tenant.id,
      passwordHash: tenantPasswordHash,
      propertyId: property.id, // Assign to the property
    },
  });

  // Seed a test worker user with password  
  const workerPasswordHash = await bcrypt.hash("worker123", 12);
  const workerUser = await prisma.user.upsert({
    where: { email: "worker@example.com" },
    update: {},
    create: {
      id: "user-worker-1", // Fixed ID to match frontend
      email: "worker@example.com",
      name: "Test Worker",
      role: "worker",
      tenantId: tenant.id,
      passwordHash: workerPasswordHash,
    },
  });

  // Seed leases
  await prisma.lease.upsert({
    where: { id: "seed-lease-1" },
    update: {},
    create: {
      id: "seed-lease-1",
      unitId: unit1.id,
      resident: "Test Tenant",
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-12-31"),
      monthlyRent: 1800,
      tenantId: tenant.id,
    },
  });

  // Assign properties to the worker for testing role-based filtering
  await prisma.property.update({
    where: { id: property.id },
    data: { assignedWorkerId: workerUser.id },
  });

  // Seed maintenance requests for testing role-based filtering
  const maintenanceRequest1 = await prisma.maintenanceRequest.upsert({
    where: { id: "seed-maint-1" },
    update: {},
    create: {
      id: "seed-maint-1",
      tenantId: tenant.id,
      propertyId: property.id,
      issue: "Broken faucet in kitchen",
      details: "The kitchen faucet is leaking and needs repair",
      priority: "Medium",
      status: "New",
      dateSubmitted: new Date(),
    },
  });

  const maintenanceRequest2 = await prisma.maintenanceRequest.upsert({
    where: { id: "seed-maint-2" },
    update: {},
    create: {
      id: "seed-maint-2",
      tenantId: tenant.id,
      propertyId: property.id,
      issue: "Heating not working",
      details: "The heating system in unit A101 is not working properly",
      priority: "High",
      status: "In Progress",
      dateSubmitted: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      assignedWorkerId: workerUser.id, // Assign to worker for testing
    },
  });

  const maintenanceRequest3 = await prisma.maintenanceRequest.upsert({
    where: { id: "seed-maint-3" },
    update: {},
    create: {
      id: "seed-maint-3",
      tenantId: tenant.id,
      propertyId: property2.id,
      issue: "Light fixture replacement",
      details: "Replace broken light fixture in B205",
      priority: "Low",
      status: "Completed",
      dateSubmitted: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
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
