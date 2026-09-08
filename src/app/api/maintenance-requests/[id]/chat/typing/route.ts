import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { broadcastTyping } from '../../../../notifications/stream/route';
import { loadRequestForChatUser } from '@/server/maintenance-chat';

// POST /api/maintenance-requests/[id]/chat/typing - broadcast a lightweight
// "is typing" signal to everyone else viewing this request's chat. Nothing
// is persisted; the client is expected to call this at a low, debounced rate
// while the user is actively typing.
export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const { id: requestId } = await context.params;

    const request = await loadRequestForChatUser(requestId, user);
    if (!request) return NextResponse.json({ error: 'Maintenance request not found' }, { status: 404 });

    broadcastTyping(user.tenantId, {
      requestId,
      userId: user.id,
      userName: user.name || user.email,
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('POST /api/maintenance-requests/[id]/chat/typing error:', e);
    return NextResponse.json({ error: e?.message ?? 'Internal error' }, { status: 500 });
  }
}
