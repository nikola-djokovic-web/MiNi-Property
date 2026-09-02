import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/server/db';
import { getSessionUser } from '@/lib/auth';

function formatTimestamp(date: Date) {
  return (
    date.toLocaleDateString('de-DE') +
    ' ' +
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );
}

const createWorkLogSchema = z.object({
  notes: z.string().trim().min(1).max(5000),
  timeSpent: z.number().int().min(0).max(24 * 60 * 60).optional(),
});

async function loadRequestForUser(requestId: string, user: { tenantId: string; role: string; id: string }) {
  const maintenanceRequest = await prisma.maintenanceRequest.findFirst({
    where: { id: requestId, tenantId: user.tenantId },
  });
  if (!maintenanceRequest) return null;
  if (user.role === 'worker' && maintenanceRequest.assignedWorkerId !== user.id) {
    return null;
  }
  return maintenanceRequest;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const { id: requestId } = await params;

    const maintenanceRequest = await loadRequestForUser(requestId, user);
    if (!maintenanceRequest) {
      return NextResponse.json(
        { error: 'Maintenance request not found' },
        { status: 404 }
      );
    }

    const workLogs = await prisma.workLog.findMany({
      where: { maintenanceRequestId: requestId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: workLogs.map((log) => ({
        id: log.id,
        requestId: log.maintenanceRequestId,
        notes: log.notes,
        userId: log.userId,
        userName: log.user.name || log.user.email,
        timeSpent: log.timeSpent,
        createdAt: log.createdAt.toISOString(),
        timestamp: formatTimestamp(log.createdAt),
      })),
    });
  } catch (error) {
    console.error('Error fetching work logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch work logs' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const { id: requestId } = await params;

    const maintenanceRequest = await loadRequestForUser(requestId, user);
    if (!maintenanceRequest) {
      return NextResponse.json(
        { error: 'Maintenance request not found' },
        { status: 404 }
      );
    }

    const parsed = createWorkLogSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
    }

    const workLog = await prisma.workLog.create({
      data: {
        maintenanceRequestId: requestId,
        userId: user.id,
        notes: parsed.data.notes,
        timeSpent: parsed.data.timeSpent ?? 0,
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: workLog.id,
        requestId: workLog.maintenanceRequestId,
        notes: workLog.notes,
        userId: workLog.userId,
        userName: workLog.user.name || workLog.user.email,
        timeSpent: workLog.timeSpent,
        createdAt: workLog.createdAt.toISOString(),
        timestamp: formatTimestamp(workLog.createdAt),
      },
    });
  } catch (error) {
    console.error('Error creating work log:', error);
    return NextResponse.json(
      { error: 'Failed to create work log' },
      { status: 500 }
    );
  }
}
