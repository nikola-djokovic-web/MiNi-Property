import { NextRequest, NextResponse } from 'next/server';
import { prisma as db } from '@/server/db';

// POST /api/test-notifications - Quick endpoint to test notifications
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, requestId, workerId } = body;
    const tenantId = request.headers.get('x-tenant-id') || 'cmgas11js00000afqlxmyaio9';

    console.log('🧪 Test notification action:', { action, requestId, workerId, tenantId });

    if (action === 'assign-worker') {
      // Assign a worker to a maintenance request
      const updatedRequest = await db.maintenanceRequest.update({
        where: { id: requestId },
        data: {
          assignedWorkerId: workerId,
          status: 'In Progress',
          updatedAt: new Date(),
        },
        include: {
          property: {
            select: { id: true, name: true, title: true, address: true }
          },
          tenant: {
            select: { id: true, name: true }
          }
        }
      });

      // Get worker info separately
      const worker = await db.user.findFirst({
        where: { id: workerId },
        select: { id: true, name: true, email: true }
      });

      console.log('✅ Worker assigned to request:', {
        requestId,
        workerId,
        workerName: worker?.name,
        status: updatedRequest.status
      });

      return NextResponse.json({
        success: true,
        message: `Worker ${worker?.name} assigned to request "${updatedRequest.issue}"`,
        request: updatedRequest,
        worker
      });
    }

    if (action === 'get-test-data') {
      // Get some test data for quick testing
      const [maintenanceRequests, workers] = await Promise.all([
        db.maintenanceRequest.findMany({
          where: { tenantId },
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            property: { select: { name: true, title: true } }
          }
        }),
        db.user.findMany({
          where: { tenantId, role: 'worker' },
          select: { id: true, name: true, email: true }
        })
      ]);

      return NextResponse.json({
        success: true,
        data: {
          maintenanceRequests: maintenanceRequests.map(r => ({
            id: r.id,
            issue: r.issue,
            status: r.status,
            property: r.property?.name || r.property?.title || 'Unknown Property',
            assignedWorkerId: r.assignedWorkerId || null
          })),
          workers: workers.map(w => ({
            id: w.id,
            name: w.name,
            email: w.email
          }))
        }
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('❌ Test notification error:', error);
    return NextResponse.json({ 
      error: 'Failed to process test action',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}