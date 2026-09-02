import { createHash } from 'crypto';
import { headers } from 'next/headers';
import { Prisma } from '@prisma/client';
import { prisma } from '@/server/db';

const DEFAULT_MAX_REQUESTS = 20;
const DEFAULT_WINDOW_SECONDS = 60 * 60;

export class AiRateLimitError extends Error {
  constructor(public readonly retryAfterSeconds: number) {
    super(`AI request limit reached. Please try again in ${retryAfterSeconds} seconds.`);
    this.name = 'AiRateLimitError';
  }
}

function positiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

async function getClientIdentifier() {
  const requestHeaders = await headers();
  // On Vercel/Cloudflare these headers are set by the reverse proxy. Do not use
  // a client-provided user ID here: it could be changed to bypass the limit.
  const forwardedFor = requestHeaders.get('x-forwarded-for');
  const ip = forwardedFor?.split(',')[0]?.trim()
    || requestHeaders.get('x-real-ip')
    || 'unknown';

  return createHash('sha256').update(ip).digest('hex');
}

/**
 * Uses PostgreSQL as shared storage, so the quota is enforced across server
 * instances and survives restarts. All AI features intentionally share it.
 */
export async function enforceAiRateLimit() {
  const maxRequests = positiveInteger(
    process.env.AI_RATE_LIMIT_MAX_REQUESTS,
    DEFAULT_MAX_REQUESTS
  );
  const windowSeconds = positiveInteger(
    process.env.AI_RATE_LIMIT_WINDOW_SECONDS,
    DEFAULT_WINDOW_SECONDS
  );
  const now = new Date();
  const windowStart = new Date(
    Math.floor(now.getTime() / (windowSeconds * 1000)) * windowSeconds * 1000
  );
  try {
    const identifier = await getClientIdentifier();
    const rows = await prisma.$queryRaw<{ count: number }[]>(Prisma.sql`
      INSERT INTO "AiRateLimit" ("key", "windowStart", "count", "updatedAt")
      VALUES (${identifier}, ${windowStart}, 1, ${now})
      ON CONFLICT ("key", "windowStart")
      DO UPDATE SET "count" = "AiRateLimit"."count" + 1, "updatedAt" = ${now}
      RETURNING "count"
    `);

    if (!rows[0] || rows[0].count > maxRequests) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((windowStart.getTime() + windowSeconds * 1000 - now.getTime()) / 1000)
      );
      throw new AiRateLimitError(retryAfterSeconds);
    }
  } catch (error) {
    if (error instanceof AiRateLimitError) throw error;

    // Do not call the provider when the protection layer is unavailable.
    console.error('AI rate-limit check failed:', error);
    throw new Error('AI service is temporarily unavailable. Please try again later.');
  }
}
