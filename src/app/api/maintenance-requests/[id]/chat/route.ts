import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/server/db';
import { getSessionUser } from '@/lib/auth';
import { broadcastChatMessage } from '../../../notifications/stream/route';
import { loadRequestForChatUser } from '@/server/maintenance-chat';

const createChatMessageSchema = z.object({
  text: z.string().trim().min(1).max(4000),
});

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const { id: requestId } = await context.params;

    const request = await loadRequestForChatUser(requestId, user);
    if (!request) return NextResponse.json({ error: 'Maintenance request not found' }, { status: 404 });

    const messages = await prisma.chatMessage.findMany({
      where: { maintenanceRequestId: requestId },
      include: { sender: { select: { id: true, name: true, email: true, role: true } } },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      data: messages.map((m) => ({
        id: m.id,
        requestId: m.maintenanceRequestId,
        senderId: m.senderId,
        senderName: m.sender.name || m.sender.email,
        senderRole: m.sender.role,
        text: m.text,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (e: any) {
    console.error('GET /api/maintenance-requests/[id]/chat error:', e);
    return NextResponse.json({ error: e?.message ?? 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const { id: requestId } = await context.params;

    const request = await loadRequestForChatUser(requestId, user);
    if (!request) return NextResponse.json({ error: 'Maintenance request not found' }, { status: 404 });

    const parsed = createChatMessageSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
    }

    const created = await prisma.chatMessage.create({
      data: {
        maintenanceRequestId: requestId,
        senderId: user.id,
        text: parsed.data.text,
      },
      include: { sender: { select: { id: true, name: true, email: true, role: true } } },
    });

    const payload = {
      id: created.id,
      requestId: created.maintenanceRequestId,
      senderId: created.senderId,
      senderName: created.sender.name || created.sender.email,
      senderRole: created.sender.role,
      text: created.text,
      createdAt: created.createdAt.toISOString(),
    };

    broadcastChatMessage(user.tenantId, payload);

    return NextResponse.json({ data: payload });
  } catch (e: any) {
    console.error('POST /api/maintenance-requests/[id]/chat error:', e);
    return NextResponse.json({ error: e?.message ?? 'Internal error' }, { status: 500 });
  }
}
