-- Shared, persistent counters for AI-provider usage.
CREATE TABLE "AiRateLimit" (
    "key" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiRateLimit_pkey" PRIMARY KEY ("key", "windowStart")
);
