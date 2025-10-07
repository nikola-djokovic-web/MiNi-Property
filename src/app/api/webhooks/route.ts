import { NextRequest, NextResponse } from 'next/server';
import { prisma as db } from '@/server/db';
import { z } from 'zod';
import crypto from 'crypto';

const createWebhookSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  events: z.array(z.string()).min(1),
  secret: z.string().optional(),
  headers: z.record(z.string()).optional(),
  active: z.boolean().default(true),
});

// GET /api/webhooks - Get all webhooks for tenant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 });
    }

    const webhooks = await db.notificationWebhook.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
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
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 });
    }

    const validatedData = createWebhookSchema.parse(body);

    // Generate secret if not provided
    if (!validatedData.secret) {
      validatedData.secret = crypto.randomBytes(32).toString('hex');
    }

    const webhook = await db.notificationWebhook.create({
      data: {
        ...validatedData,
        tenantId,
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