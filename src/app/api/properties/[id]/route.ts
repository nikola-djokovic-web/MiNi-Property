import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { getSessionUser } from "@/lib/auth";
import { broadcastNotification } from "../../notifications/stream/route";

const updatePropertySchema = z.object({
  title: z.string().trim().max(200).optional(),
  name: z.string().trim().max(200).optional(),
  address: z.string().trim().max(300).optional(),
  city: z.string().trim().max(120).optional(),
  imageUrl: z.string().trim().max(2000).optional(),
  imageHint: z.string().trim().max(200).nullable().optional(),
  type: z.enum(["Apartment", "House", "Condo", "Townhouse", "Commercial"]).optional(),
  assignedWorkerId: z.string().min(1).nullable().optional(),
});

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    if (user.role !== "admin" && user.role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const tenantId = user.tenantId;
    const params = await context.params;
    const propertyId = params.id;

    const parsed = updatePropertySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
    }
    const body = parsed.data;

    if (body.assignedWorkerId) {
      const worker = await prisma.user.findFirst({
        where: { id: body.assignedWorkerId, tenantId, role: "worker" },
        select: { id: true },
      });
      if (!worker) {
        return NextResponse.json({ error: "Worker not found" }, { status: 400 });
      }
    }

    // Get current property to compare changes
    const currentProperty = await prisma.property.findFirst({
      where: { id: propertyId, tenantId },
    });
    
    if (!currentProperty) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }
    
    const updated = await prisma.property.update({
      where: { id: propertyId },
      data: {
        name: body.name || currentProperty.name,
        address: body.address || currentProperty.address,
        city: body.city || currentProperty.city,
        title: body.title || currentProperty.title,
        imageUrl: body.imageUrl !== undefined ? body.imageUrl : currentProperty.imageUrl,
        imageHint: body.imageHint !== undefined ? body.imageHint : currentProperty.imageHint,
        type: body.type || currentProperty.type,
        assignedWorkerId: body.assignedWorkerId !== undefined ? body.assignedWorkerId : currentProperty.assignedWorkerId,
        updatedAt: new Date(),
      },
    });
    
    // Create notification for worker assignment changes
    if (body.assignedWorkerId !== undefined && body.assignedWorkerId !== currentProperty.assignedWorkerId) {
      await handleWorkerPropertyAssignmentNotification(tenantId, currentProperty, updated, req);
    }
    
    // Create notification for property updates
    const notification = {
      id: `property-update-${updated.id}-${Date.now()}`,
      tenantId: tenantId,
      title: 'Property Updated',
      description: `${updated.title} has been updated`,
      icon: 'Building',
      type: 'info' as const,
      priority: 'normal' as const,
      targetRole: 'admin',
      navigationUrl: '/properties',
      actionLabel: 'View Properties',
      actionUrl: '/properties',
      relatedType: 'property',
      relatedId: updated.id,
      read: false,
      createdAt: updated.updatedAt,
    };
    
    broadcastNotification(tenantId, notification, undefined, 'admin');
    
    return NextResponse.json({ data: updated });
  } catch (e: any) {
    console.error("PUT /api/properties/[id] error:", e);
    return NextResponse.json(
      { error: e?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}

async function handleWorkerPropertyAssignmentNotification(
  tenantId: string,
  currentProperty: any,
  updatedProperty: any,
  req: NextRequest
) {
  try {
    // If worker was assigned to property
    if (updatedProperty.assignedWorkerId && !currentProperty.assignedWorkerId) {
      const workerNotification = {
        id: `property-assign-${updatedProperty.id}-${Date.now()}`,
        tenantId: tenantId,
        title: 'Property Assigned',
        description: `You have been assigned to property: ${updatedProperty.title}`,
        icon: 'MapPin',
        type: 'info' as const,
        priority: 'normal' as const,
        targetRole: 'worker',
        navigationUrl: `/properties/${updatedProperty.id}`,
        actionLabel: 'View Property',
        actionUrl: `/properties/${updatedProperty.id}`,
        relatedType: 'property',
        relatedId: updatedProperty.id,
        read: false,
        createdAt: new Date(),
      };
      
      // Save notification to database for persistence
      try {
        await prisma.notification.create({
          data: {
            title: workerNotification.title,
            description: workerNotification.description,
            icon: workerNotification.icon,
            type: workerNotification.type,
            priority: workerNotification.priority,
            navigationUrl: workerNotification.navigationUrl,
            actionLabel: workerNotification.actionLabel,
            actionUrl: workerNotification.actionUrl,
            userId: updatedProperty.assignedWorkerId,
            targetRole: workerNotification.targetRole,
            relatedType: workerNotification.relatedType,
            relatedId: workerNotification.relatedId,
            metadata: {
              propertyId: updatedProperty.id,
              propertyName: updatedProperty.title,
              assignedAt: new Date().toISOString(),
            },
            tenantId: tenantId,
          },
        });
        console.log('💾 Property assignment notification saved to database');
      } catch (dbError) {
        console.error('❌ Failed to save property assignment notification to database:', dbError);
      }
      
      broadcastNotification(tenantId, workerNotification, updatedProperty.assignedWorkerId, 'worker');
    }
    
    // If worker assignment was changed
    else if (updatedProperty.assignedWorkerId !== currentProperty.assignedWorkerId) {
      // Notify old worker (if any)
      if (currentProperty.assignedWorkerId) {
        const oldWorkerNotification = {
          id: `property-unassign-${updatedProperty.id}-${Date.now()}`,
          tenantId: tenantId,
          title: 'Property Assignment Removed',
          description: `You are no longer assigned to property: ${updatedProperty.title}`,
          icon: 'MapPinOff',
          type: 'info' as const,
          priority: 'normal' as const,
          targetRole: 'worker',
          navigationUrl: '/properties',
          actionLabel: 'View Properties',
          actionUrl: '/properties',
          relatedType: 'property',
          relatedId: updatedProperty.id,
          read: false,
          createdAt: new Date(),
        };
        
        // Save unassignment notification to database for persistence
        try {
          await prisma.notification.create({
            data: {
              title: oldWorkerNotification.title,
              description: oldWorkerNotification.description,
              icon: oldWorkerNotification.icon,
              type: oldWorkerNotification.type,
              priority: oldWorkerNotification.priority,
              navigationUrl: oldWorkerNotification.navigationUrl,
              actionLabel: oldWorkerNotification.actionLabel,
              actionUrl: oldWorkerNotification.actionUrl,
              userId: currentProperty.assignedWorkerId,
              targetRole: oldWorkerNotification.targetRole,
              relatedType: oldWorkerNotification.relatedType,
              relatedId: oldWorkerNotification.relatedId,
              metadata: {
                propertyId: updatedProperty.id,
                propertyName: updatedProperty.title,
                unassignedAt: new Date().toISOString(),
              },
              tenantId: tenantId,
            },
          });
          console.log('💾 Property unassignment notification saved to database');
        } catch (dbError) {
          console.error('❌ Failed to save property unassignment notification to database:', dbError);
        }
        
        broadcastNotification(tenantId, oldWorkerNotification, currentProperty.assignedWorkerId, 'worker');
      }
      
      // Notify new worker (if any)
      if (updatedProperty.assignedWorkerId) {
        const newWorkerNotification = {
          id: `property-reassign-${updatedProperty.id}-${Date.now()}`,
          tenantId: tenantId,
          title: 'Property Assigned',
          description: `You have been assigned to property: ${updatedProperty.title}`,
          icon: 'MapPin',
          type: 'info' as const,
          priority: 'normal' as const,
          targetRole: 'worker',
          navigationUrl: `/properties/${updatedProperty.id}`,
          actionLabel: 'View Property',
          actionUrl: `/properties/${updatedProperty.id}`,
          relatedType: 'property',
          relatedId: updatedProperty.id,
          read: false,
          createdAt: new Date(),
        };
        
        // Save new assignment notification to database for persistence
        try {
          await prisma.notification.create({
            data: {
              title: newWorkerNotification.title,
              description: newWorkerNotification.description,
              icon: newWorkerNotification.icon,
              type: newWorkerNotification.type,
              priority: newWorkerNotification.priority,
              navigationUrl: newWorkerNotification.navigationUrl,
              actionLabel: newWorkerNotification.actionLabel,
              actionUrl: newWorkerNotification.actionUrl,
              userId: updatedProperty.assignedWorkerId,
              targetRole: newWorkerNotification.targetRole,
              relatedType: newWorkerNotification.relatedType,
              relatedId: newWorkerNotification.relatedId,
              metadata: {
                propertyId: updatedProperty.id,
                propertyName: updatedProperty.title,
                reassignedAt: new Date().toISOString(),
              },
              tenantId: tenantId,
            },
          });
          console.log('💾 Property reassignment notification saved to database');
        } catch (dbError) {
          console.error('❌ Failed to save property reassignment notification to database:', dbError);
        }
        
        broadcastNotification(tenantId, newWorkerNotification, updatedProperty.assignedWorkerId, 'worker');
      }
    }
  } catch (error) {
    console.error('Error creating property assignment notification:', error);
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    if (user.role !== "admin" && user.role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const tenantId = user.tenantId;
    const params = await context.params;
    const propertyId = params.id;
    
    const property = await prisma.property.findFirst({
      where: { id: propertyId, tenantId },
    });
    
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }
    
    await prisma.property.delete({
      where: { id: propertyId },
    });
    
    // Create notification for property deletion
    const notification = {
      id: `property-delete-${propertyId}-${Date.now()}`,
      tenantId: tenantId,
      title: 'Property Deleted',
      description: `${property.title} has been removed from the system`,
      icon: 'Trash2',
      type: 'warning' as const,
      priority: 'normal' as const,
      targetRole: 'admin',
      navigationUrl: '/properties',
      actionLabel: 'View Properties',
      actionUrl: '/properties',
      relatedType: 'property',
      relatedId: propertyId,
      read: false,
      createdAt: new Date(),
    };
    
    // Save deletion notification to database for persistence
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
          userId: null,
          targetRole: notification.targetRole,
          relatedType: notification.relatedType,
          relatedId: notification.relatedId,
          metadata: {
            propertyId: propertyId,
            propertyName: property.title,
            deletedAt: new Date().toISOString(),
          },
          tenantId: tenantId,
        },
      });
      console.log('💾 Property deletion notification saved to database');
    } catch (dbError) {
      console.error('❌ Failed to save property deletion notification to database:', dbError);
    }

    broadcastNotification(tenantId, notification, undefined, 'admin');
    
    // Notify assigned worker if any
    if (property.assignedWorkerId) {
      const workerNotification = {
        id: `property-worker-delete-${propertyId}-${Date.now()}`,
        tenantId: tenantId,
        title: 'Assigned Property Deleted',
        description: `Property ${property.title} that was assigned to you has been removed`,
        icon: 'AlertTriangle',
        type: 'warning' as const,
        priority: 'normal' as const,
        targetRole: 'worker',
        navigationUrl: '/properties',
        actionLabel: 'View Properties',
        actionUrl: '/properties',
        relatedType: 'property',
        relatedId: propertyId,
        read: false,
        createdAt: new Date(),
      };
      
      broadcastNotification(tenantId, workerNotification, property.assignedWorkerId, 'worker');
    }
    
    return NextResponse.json({ message: 'Property deleted successfully' });
  } catch (e: any) {
    console.error("DELETE /api/properties/[id] error:", e);
    return NextResponse.json(
      { error: e?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    const tenantId = user.tenantId;
    const params = await context.params;
    const propertyId = params.id;

    const property = await prisma.property.findFirst({
      where: { id: propertyId, tenantId },
    });

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    if (user.role === "worker" && property.assignedWorkerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ data: property });
  } catch (e: any) {
    console.error("GET /api/properties/[id] error:", e);
    return NextResponse.json(
      { error: e?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}
