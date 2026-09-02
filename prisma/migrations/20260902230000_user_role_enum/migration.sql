-- Convert User.role from a free-form string to a real Postgres enum,
-- so invalid role values can no longer be written (accidentally or via
-- a malicious request body).

CREATE TYPE "UserRole" AS ENUM ('admin', 'owner', 'worker', 'tenant');

ALTER TABLE "User"
  ALTER COLUMN "role" TYPE "UserRole" USING ("role"::"UserRole");
