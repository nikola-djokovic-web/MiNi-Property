import { NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/auth';

// Keep track of active connections
const connections = new Map<string, ReadableStreamDefaultController<Uint8Array>>();

// GET /api/notifications/stream - Server-Sent Events for real-time notifications
export async function GET(request: NextRequest) {
  // EventSource sends the session cookie automatically on same-origin
  // requests, so auth/tenant/role are derived from the session only -
  // never trusted from the query string.
  const user = await getSessionUser();
  if (!user) {
    return new Response('Authentication required', { status: 401 });
  }

  const userId = user.id;
  const tenantId = user.tenantId;
  const role = user.role;

  const connectionId = `${tenantId}-${userId || role || 'anonymous'}-${role}`;

  console.log('🔗 New SSE connection established:', {
    userId,
    tenantId,
    role,
    connectionId,
    totalConnections: connections.size + 1
  });

  // Clean up any existing connection with the same ID to prevent duplicates
  if (connections.has(connectionId)) {
    console.log('🧹 Cleaning up duplicate connection:', connectionId);
    const existingController = connections.get(connectionId);
    try {
      existingController?.close?.();
    } catch (e) {
      console.log('Warning: Error closing existing connection:', e);
    }
    connections.delete(connectionId);
  }

  // Create a ReadableStream for SSE
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      // Store the controller for this connection
      connections.set(connectionId, controller);

      // Send initial connection message
      const initialMessage = `data: ${JSON.stringify({
        type: 'connection',
        message: 'Connected to notification stream',
        timestamp: new Date().toISOString(),
      })}\n\n`;
      
      controller.enqueue(new TextEncoder().encode(initialMessage));

      // Send heartbeat every 30 seconds to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          // Check if controller is still writable before sending heartbeat
          if (controller && typeof controller.enqueue === 'function') {
            try {
              const heartbeatMessage = `data: ${JSON.stringify({
                type: 'heartbeat',
                timestamp: new Date().toISOString(),
              })}\n\n`;
              
              controller.enqueue(new TextEncoder().encode(heartbeatMessage));
            } catch (enqueueError) {
              // Controller was closed during enqueue, clean up quietly
              console.log('🔌 SSE connection closed during heartbeat, cleaning up:', connectionId);
              clearInterval(heartbeat);
              connections.delete(connectionId);
            }
          } else {
            // Controller is not available, clean up quietly
            console.log('🔌 SSE controller unavailable, cleaning up:', connectionId);
            clearInterval(heartbeat);
            connections.delete(connectionId);
          }
        } catch (error) {
          console.log('⚠️ Error during SSE heartbeat, cleaning up:', connectionId, error instanceof Error ? error.message : String(error));
          clearInterval(heartbeat);
          connections.delete(connectionId);
        }
      }, 30000);

      // Clean up on connection close
      return () => {
        console.log('🧹 SSE connection cleanup triggered for:', connectionId);
        clearInterval(heartbeat);
        connections.delete(connectionId);
      };
    },

    cancel() {
      connections.delete(connectionId);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// Function to broadcast notifications to connected clients
export function broadcastNotification(tenantId: string, notification: any, targetUserId?: string, targetRole?: string) {
  console.log('📡 broadcastNotification called with:', {
    tenantId,
    targetUserId,
    targetRole,
    notificationTitle: notification.title,
    activeConnections: connections.size,
    connectionIds: Array.from(connections.keys())
  });

  if (connections.size === 0) {
    console.log('⚠️ No active SSE connections to broadcast to!');
    return;
  }

  const message = `data: ${JSON.stringify({
    type: 'notification',
    data: notification,
    timestamp: new Date().toISOString(),
  })}\n\n`;

  const encodedMessage = new TextEncoder().encode(message);

  // Find matching connections
  let sentCount = 0;
  for (const [connectionId, controller] of connections.entries()) {
    const [connTenantId, connUserOrRole, connRole] = connectionId.split('-');
    
    console.log('🔍 Checking connection:', {
      connectionId,
      connTenantId,
      connUserOrRole,
      connRole,
      targetUserId,
      targetRole,
      tenantMatch: connTenantId === tenantId
    });
    
    // Check if this connection should receive the notification
    if (connTenantId === tenantId) {
      const shouldSend = !targetUserId && !targetRole || // Broadcast to all
        (targetUserId && connUserOrRole === targetUserId) || // Specific user
        (targetRole && connRole === targetRole); // Specific role

      console.log('🎯 Should send to this connection?', {
        connectionId,
        shouldSend,
        reason: !targetUserId && !targetRole ? 'broadcast-all' : 
                targetUserId && connUserOrRole === targetUserId ? 'specific-user' :
                targetRole && connRole === targetRole ? 'specific-role' : 'no-match'
      });

      if (shouldSend) {
        try {
          controller.enqueue(encodedMessage);
          sentCount++;
          console.log('✅ Notification sent to connection:', connectionId);
        } catch (error) {
          console.log('❌ Error broadcasting to connection:', connectionId, error instanceof Error ? error.message : String(error));
          connections.delete(connectionId);
        }
      }
    } else {
      console.log('⏭️ Skipping connection (different tenant):', connectionId);
    }
  }
  
  console.log(`📊 Notification broadcast complete. Sent to ${sentCount} connections out of ${connections.size} total.`);
}

// Function to broadcast a new chat message on a maintenance request to
// everyone connected in the same org - the client filters by requestId.
export function broadcastChatMessage(tenantId: string, chatMessage: any) {
  if (connections.size === 0) return;

  const message = `data: ${JSON.stringify({
    type: 'chat_message',
    data: chatMessage,
    timestamp: new Date().toISOString(),
  })}\n\n`;

  const encodedMessage = new TextEncoder().encode(message);

  for (const [connectionId, controller] of connections.entries()) {
    const [connTenantId] = connectionId.split('-');
    if (connTenantId !== tenantId) continue;
    try {
      controller.enqueue(encodedMessage);
    } catch (error) {
      console.log('Error broadcasting chat message to connection:', connectionId, error instanceof Error ? error.message : String(error));
      connections.delete(connectionId);
    }
  }
}

// Function to broadcast a "user is typing" indicator for a maintenance
// request chat to everyone else connected in the same org.
export function broadcastTyping(tenantId: string, data: { requestId: string; userId: string; userName: string }) {
  if (connections.size === 0) return;

  const message = `data: ${JSON.stringify({
    type: 'typing',
    data,
    timestamp: new Date().toISOString(),
  })}\n\n`;

  const encodedMessage = new TextEncoder().encode(message);

  for (const [connectionId, controller] of connections.entries()) {
    const [connTenantId] = connectionId.split('-');
    if (connTenantId !== tenantId) continue;
    try {
      controller.enqueue(encodedMessage);
    } catch (error) {
      console.log('Error broadcasting typing indicator to connection:', connectionId, error instanceof Error ? error.message : String(error));
      connections.delete(connectionId);
    }
  }
}

// Function to broadcast system-wide announcements
export function broadcastSystemAnnouncement(message: string, type: 'info' | 'warning' | 'maintenance' = 'info') {
  const announcement = `data: ${JSON.stringify({
    type: 'system',
    subtype: type,
    message,
    timestamp: new Date().toISOString(),
  })}\n\n`;

  const encodedMessage = new TextEncoder().encode(announcement);

  // Send to all connections
  for (const [connectionId, controller] of connections.entries()) {
    try {
      controller.enqueue(encodedMessage);
    } catch (error) {
      console.error('Error broadcasting system announcement to connection:', connectionId, error);
      connections.delete(connectionId);
    }
  }
}