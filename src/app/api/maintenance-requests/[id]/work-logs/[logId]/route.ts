import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/server/db';
import { getSessionUser } from '@/lib/auth';
import { loadRequestForUser } from '../_shared';

function formatTimestamp(date: Date) {
  return (
    date.toLocaleDateString('de-DE') +
    ' ' +
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );
}

const updateWorkLogSchema = z.object({
  notes: z.string().trim().min(1).max(5000),
  timeSpent: z.number().int().min(0).max(24 * 60 * 60).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const { id: requestId, logId } = await params;

    const maintenanceRequest = await loadRequestForUser(requestId, user);
    if (!maintenanceRequest) {
      return NextResponse.json({ error: 'Maintenance request not found' }, { status: 404 });
    }

    const workLog = await prisma.workLog.findFirst({
      where: { id: logId, maintenanceRequestId: requestId },
    });
    if (!workLog) {
      return NextResponse.json({ error: 'Work log not found' }, { status: 404 });
    }

    // Workers may only correct their own log entries; admins/owners can correct any.
    const canEdit = workLog.userId === user.id || user.role === 'admin' || user.role === 'owner';
    if (!canEdit) {
      return NextResponse.json({ error: 'Not authorized to edit this work log' }, { status: 403 });
    }

    const parsed = updateWorkLogSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
    }

    const updated = await prisma.workLog.update({
      where: { id: logId },
      data: {
        notes: parsed.data.notes,
        timeSpent: parsed.data.timeSpent ?? workLog.timeSpent,
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        requestId: updated.maintenanceRequestId,
        notes: updated.notes,
        userId: updated.userId,
        userName: updated.user.name || updated.user.email,
        timeSpent: updated.timeSpent,
        createdAt: updated.createdAt.toISOString(),
        timestamp: formatTimestamp(updated.createdAt),
      },
    });
  } catch (error) {
    console.error('Error updating work log:', error);
    return NextResponse.json({ error: 'Failed to update work log' }, { status: 500 });
  }
}
