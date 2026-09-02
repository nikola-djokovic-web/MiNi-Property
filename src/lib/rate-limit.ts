import { createHash } from 'crypto';
import { headers } from 'next/headers';
import { Prisma } from '@prisma/client';
import { prisma } from '@/server/db';

export class RateLimitError extends Error {
  constructor(public readonly retryAfterSeconds: number) {
    super(`Too many requests. Please try again in ${retryAfterSeconds} seconds.`);
    this.name = 'RateLimitError';
  }
}

async function getClientIp() {
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get('x-forwarded-for');
  return (
    forwardedFor?.split(',')[0]?.trim() ||
    requestHeaders.get('x-real-ip') ||
    'unknown'
  );
}

/**
 * Generic per-bucket rate limiter, backed by the same PostgreSQL table used
 * for AI rate limiting (an atomic upsert, so it's race-safe and enforced
 * across instances/restarts). `extra` narrows the key further (e.g. by
 * email) so a single IP can't be used to hammer many different accounts.
 *
 * Fails open (logs and allows the request through) if the storage check
 * itself errors - a rate-limit outage should not lock every user out.
 */
export async function enforceRateLimit(
  bucket: string,
  { maxRequests, windowSeconds, extra }: { maxRequests: number; windowSeconds: number; extra?: string }
) {
  const now = new Date();
  const windowStart = new Date(
    Math.floor(now.getTime() / (windowSeconds * 1000)) * windowSeconds * 1000
  );

  try {
    const ip = await getClientIp();
    const identifier = createHash('sha256')
      .update(`${bucket}:${ip}:${extra ?? ''}`)
      .digest('hex');

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
      throw new RateLimitError(retryAfterSeconds);
    }
  } catch (error) {
    if (error instanceof RateLimitError) throw error;
    console.error(`Rate limit check failed for bucket "${bucket}":`, error);
  }
}
