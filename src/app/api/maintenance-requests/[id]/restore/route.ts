import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { getSessionUser } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (user.role !== 'admin' && user.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { id: requestId } = await params;
    const tenantId = user.tenantId;

    const existingRequest = await prisma.maintenanceRequest.findFirst({
      where: { id: requestId, tenantId, deletedAt: { not: null } },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Deleted maintenance request not found' },
        { status: 404 }
      );
    }

    const restored = await prisma.maintenanceRequest.update({
      where: { id: requestId },
      data: { deletedAt: null, deletedByUserId: null },
    });

    return NextResponse.json({ success: true, data: restored });
  } catch (error) {
    console.error('Error restoring maintenance request:', error);
    return NextResponse.json(
      { error: 'Failed to restore maintenance request' },
      { status: 500 }
    );
  }
}
