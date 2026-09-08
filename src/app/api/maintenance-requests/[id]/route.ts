import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/server/db';
import { getSessionUser } from '@/lib/auth';
import { broadcastNotification } from '../../notifications/stream/route';
import { sendWorkCompletedEmail } from '@/lib/email';

const updateMaintenanceRequestSchema = z.object({
  issue: z.string().min(1).max(500).optional(),
  details: z.string().max(5000).optional(),
  priority: z.enum(['Low', 'Medium', 'High']).optional(),
  status: z.enum(['New', 'In Progress', 'Completed']).optional(),
  assignedWorkerId: z.string().min(1).nullable().optional(),
  tenantConfirmed: z.boolean().optional(),
  rating: z.number().int().min(1).max(5).optional(),
  ratingComment: z.string().max(2000).optional(),
});

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
    const tenantId = user.tenantId;

    const maintenanceRequest = await prisma.maintenanceRequest.findFirst({
      where: {
        id: requestId,
        tenantId: tenantId,
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!maintenanceRequest) {
      return NextResponse.json(
        { error: 'Maintenance request not found' },
        { status: 404 }
      );
    }

    if (user.role === 'worker' && maintenanceRequest.assignedWorkerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // If there's an assigned worker, fetch their details separately
    let assignedWorker = null;
    if (maintenanceRequest.assignedWorkerId) {
      assignedWorker = await prisma.user.findUnique({
        where: { id: maintenanceRequest.assignedWorkerId },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...maintenanceRequest,
        assignedWorker,
      },
    });
  } catch (error) {
    console.error('Error fetching maintenance request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch maintenance request' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const { id: requestId } = await params;
    const tenantId = user.tenantId;

    const parsed = updateMaintenanceRequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
    }
    const {
      issue,
      details,
      priority,
      status,
      assignedWorkerId,
      tenantConfirmed,
      rating,
      ratingComment,
    } = parsed.data;

    // Verify the request exists and belongs to the tenant
    const existingRequest = await prisma.maintenanceRequest.findFirst({
      where: {
        id: requestId,
        tenantId: tenantId,
      },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Maintenance request not found' },
        { status: 404 }
      );
    }

    if (user.role === 'worker') {
      if (existingRequest.assignedWorkerId !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      // Workers can update status/details on their own requests, but not reassign them.
      if (assignedWorkerId !== undefined && assignedWorkerId !== existingRequest.assignedWorkerId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    if (user.role === 'tenant') {
      const isEditingContent = issue !== undefined || details !== undefined || priority !== undefined;
      const isConfirmingWork = tenantConfirmed !== undefined || rating !== undefined || ratingComment !== undefined || status !== undefined;

      if (assignedWorkerId !== undefined) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      if (isEditingContent) {
        // Existing behavior: a tenant may edit their unassigned request's
        // content. Unchanged from before this feature - not identity-scoped,
        // since older requests have no submittedByUserId to check against.
        if (existingRequest.assignedWorkerId) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      } else if (isConfirmingWork) {
        // New: confirm-or-reopen a completed request. This IS identity-scoped
        // since submittedByUserId is only ever set on requests created after
        // this feature shipped.
        if (existingRequest.submittedByUserId !== user.id) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        if (existingRequest.status !== 'Completed' || existingRequest.tenantConfirmed) {
          return NextResponse.json({ error: 'This request is not awaiting confirmation' }, { status: 409 });
        }
        if (status !== undefined && status !== 'In Progress') {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      } else {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    if (assignedWorkerId) {
      const worker = await prisma.user.findFirst({
        where: { id: assignedWorkerId, tenantId, role: 'worker' },
        select: { id: true },
      });
      if (!worker) {
        return NextResponse.json({ error: 'Worker not found' }, { status: 400 });
      }
    }

    // Check if worker is being assigned for notifications
    const workerBeingAssigned = assignedWorkerId && assignedWorkerId !== existingRequest.assignedWorkerId;
    // A tenant reopening a request they rejected as "not actually done".
    const isReopening = user.role === 'tenant' && status === 'In Progress' && existingRequest.status === 'Completed';
    const isBeingMarkedCompleted = status === 'Completed' && existingRequest.status !== 'Completed';

    // Update the maintenance request
    const updatedRequest = await prisma.maintenanceRequest.update({
      where: {
        id: requestId,
      },
      data: {
        ...(issue && { issue }),
        ...(details !== undefined && { details }),
        ...(priority && { priority }),
        ...(status && { status }),
        ...(assignedWorkerId !== undefined && { assignedWorkerId }),
        ...(tenantConfirmed !== undefined && { tenantConfirmed }),
        ...(rating !== undefined && { rating }),
        ...(ratingComment !== undefined && { ratingComment }),
        // Reopening clears any stale confirmation state from a prior completion.
        ...(isReopening && { tenantConfirmed: false, rating: null, ratingComment: null }),
        updatedAt: new Date(),
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // If there's an assigned worker, fetch their details separately
    let assignedWorker = null;
    if (updatedRequest.assignedWorkerId) {
      assignedWorker = await prisma.user.findUnique({
        where: { id: updatedRequest.assignedWorkerId },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });
    }

    // Send notification to worker if they were just assigned
    if (workerBeingAssigned && assignedWorker) {
      try {
        console.log('🔔 Sending assignment notification to worker:', assignedWorker.name);
        const notification = {
          id: `maintenance-assigned-${Date.now()}`,
          title: '🔧 New Maintenance Assignment',
          description: `You have been assigned to: ${updatedRequest.issue} at ${updatedRequest.property?.name || 'Unknown Property'}`,
          icon: '🔧',
          type: 'assignment',
          priority: 'high',
          targetRole: 'worker',
          targetUserId: assignedWorker.id,
          navigationUrl: `/maintenance/${updatedRequest.id}`,
          actionLabel: 'View Request',
          actionUrl: `/maintenance/${updatedRequest.id}`,
          relatedType: 'maintenance_request',
          relatedId: updatedRequest.id,
          metadata: {
            requestId: updatedRequest.id,
            propertyName: updatedRequest.property?.name,
            issue: updatedRequest.issue,
            priority: updatedRequest.priority,
            assignedAt: new Date().toISOString(),
          },
        };

        // Save notification to database for persistence
        try {
          const persistedNotification = await prisma.notification.create({
            data: {
              title: notification.title,
              description: notification.description,
              icon: notification.icon,
              type: notification.type,
              priority: notification.priority,
              navigationUrl: notification.navigationUrl,
              actionLabel: notification.actionLabel,
              actionUrl: notification.actionUrl,
              userId: assignedWorker.id,
              targetRole: notification.targetRole,
              relatedType: notification.relatedType,
              relatedId: notification.relatedId,
              metadata: notification.metadata,
              tenantId: tenantId,
            },
          });
          console.log('💾 Notification saved to database:', persistedNotification.id);
        } catch (dbError) {
          console.error('❌ Failed to save notification to database:', dbError);
        }

        // Send real-time notification via SSE
        console.log('📢 Broadcasting assignment notification to worker:', notification);
        broadcastNotification(tenantId, notification, assignedWorker.id, 'worker');
        console.log('✅ Worker notification sent successfully');
      } catch (notificationError) {
        console.error('❌ Error sending worker assignment notification:', notificationError);
      }
    }

    // Notify the tenant who submitted the request that it's ready for their confirmation.
    if (isBeingMarkedCompleted && updatedRequest.submittedByUserId) {
      try {
        const submitter = await prisma.user.findUnique({
          where: { id: updatedRequest.submittedByUserId },
          select: { id: true, name: true, email: true },
        });

        if (submitter) {
          const notification = {
            id: `maintenance-completed-${Date.now()}`,
            title: 'Your maintenance request was completed',
            description: `"${updatedRequest.issue}" has been marked as completed. Please confirm the work was done.`,
            icon: 'CheckCircle',
            type: 'success',
            priority: 'normal',
            targetRole: 'tenant',
            targetUserId: submitter.id,
            navigationUrl: `/maintenance/${updatedRequest.id}`,
            actionLabel: 'Review and Confirm',
            actionUrl: `/maintenance/${updatedRequest.id}`,
            relatedType: 'maintenance_request',
            relatedId: updatedRequest.id,
          };

          try {
            await prisma.notification.create({
              data: {
                title: notification.title,
                description: notification.description,
                icon: notification.icon,
                type: notification.type,
                priority: notification.priority,
                navigationUrl: notification.navigationUrl,
                actionLabel: notification.actionLabel,
                actionUrl: notification.actionUrl,
                userId: submitter.id,
                targetRole: notification.targetRole,
                relatedType: notification.relatedType,
                relatedId: notification.relatedId,
                tenantId: tenantId,
              },
            });
          } catch (dbError) {
            console.error('Failed to save tenant-confirmation notification:', dbError);
          }

          broadcastNotification(tenantId, notification, submitter.id, 'tenant');

          if (submitter.email) {
            await sendWorkCompletedEmail({
              to: submitter.email,
              tenantName: submitter.name || submitter.email,
              issue: updatedRequest.issue,
              requestId: updatedRequest.id,
            }).catch((emailError) => {
              console.error('Failed to send work-completed email:', emailError);
            });
          }
        }
      } catch (notifyError) {
        console.error('Error notifying tenant of completed work:', notifyError);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...updatedRequest,
        assignedWorker,
      },
    });
  } catch (error) {
    console.error('Error updating maintenance request:', error);
    return NextResponse.json(
      { error: 'Failed to update maintenance request' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Verify the request exists and belongs to the tenant
    const existingRequest = await prisma.maintenanceRequest.findFirst({
      where: {
        id: requestId,
        tenantId: tenantId,
      },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Maintenance request not found' },
        { status: 404 }
      );
    }

    // Delete the maintenance request
    await prisma.maintenanceRequest.delete({
      where: {
        id: requestId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Maintenance request deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting maintenance request:', error);
    return NextResponse.json(
      { error: 'Failed to delete maintenance request' },
      { status: 500 }
    );
  }
}