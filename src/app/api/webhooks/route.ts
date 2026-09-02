import { NextRequest, NextResponse } from 'next/server';
import { prisma as db } from '@/server/db';
import { z } from 'zod';
import crypto from 'crypto';
import { getSessionUser } from '@/lib/auth';
import { assertPublicHttpUrl } from '@/lib/url-safety';

const createWebhookSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  events: z.array(z.string()).min(1),
  secret: z.string().optional(),
  headers: z.record(z.string()).optional(),
  active: z.boolean().default(true),
});

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user) {
    return { user: null, error: NextResponse.json({ error: 'Authentication required' }, { status: 401 }) };
  }
  if (user.role !== 'admin' && user.role !== 'owner') {
    return { user: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { user, error: null };
}

// GET /api/webhooks - Get all webhooks for tenant
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAdmin();
    if (error) return error;

    const webhooks = await db.notificationWebhook.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        url: true,
        active: true,
        events: true,
        headers: true,
        createdAt: true,
        updatedAt: true,
        // secret intentionally excluded - it's only needed server-side to sign deliveries
        deliveries: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            status: true,
            statusCode: true,
            createdAt: true,
            sentAt: true,
            deliveredAt: true,
          },
        },
      },
    });

    return NextResponse.json(webhooks);
  } catch (error) {
    console.error('Error fetching webhooks:', error);
    return NextResponse.json({ error: 'Failed to fetch webhooks' }, { status: 500 });
  }
}

// POST /api/webhooks - Create new webhook
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const validatedData = createWebhookSchema.parse(body);

    try {
      await assertPublicHttpUrl(validatedData.url);
    } catch (urlError: any) {
      return NextResponse.json({ error: urlError?.message ?? 'Invalid webhook URL' }, { status: 400 });
    }

    // Generate secret if not provided
    if (!validatedData.secret) {
      validatedData.secret = crypto.randomBytes(32).toString('hex');
    }

    const webhook = await db.notificationWebhook.create({
      data: {
        ...validatedData,
        tenantId: user.tenantId,
      },
    });

    return NextResponse.json(webhook, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    console.error('Error creating webhook:', error);
    return NextResponse.json({ error: 'Failed to create webhook' }, { status: 500 });
  }
}