import { prisma } from '@/server/db';
import crypto from 'crypto';

interface WebhookPayload {
  event: string;
  tenantId: string;
  timestamp: string;
  data: any;
}

class NotificationWebhookService {
  async triggerWebhooks(tenantId: string, event: string, data: any) {
    try {
      // Get all active webhooks for this tenant that subscribe to this event
      const webhooks = await prisma.notificationWebhook.findMany({
        where: {
          tenantId,
          active: true,
          events: {
            has: event,
          },
        },
      });

      if (webhooks.length === 0) {
        return;
      }

      const payload: WebhookPayload = {
        event,
        tenantId,
        timestamp: new Date().toISOString(),
        data,
      };

      // Send webhooks in parallel
      await Promise.allSettled(
        webhooks.map(webhook => this.deliverWebhook(webhook, payload))
      );
    } catch (error) {
      console.error('Error triggering webhooks:', error);
      throw error;
    }
  }

  private async deliverWebhook(webhook: any, payload: WebhookPayload) {
    let delivery = null;
    
    try {
      // Create delivery record
      delivery = await prisma.notificationWebhookDelivery.create({
        data: {
          webhookId: webhook.id,
          notificationId: payload.data.notification?.id || null,
          status: 'pending',
          attempts: 1,
        },
      });

      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'MiNi-Property-Webhook/1.0',
        'X-Event-Type': payload.event,
        'X-Tenant-ID': payload.tenantId,
        'X-Delivery-ID': delivery.id,
      };

      // Add custom headers from webhook config
      if (webhook.headers) {
        Object.assign(headers, webhook.headers);
      }

      // Add signature if secret is provided
      if (webhook.secret) {
        const signature = this.generateSignature(JSON.stringify(payload), webhook.secret);
        headers['X-Webhook-Signature'] = signature;
      }

      // Make the HTTP request
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      const responseText = await response.text();

      // Update delivery record
      await prisma.notificationWebhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: response.ok ? 'delivered' : 'failed',
          statusCode: response.status,
          responseBody: responseText.substring(0, 1000), // Limit response body size
          deliveredAt: response.ok ? new Date() : null,
          sentAt: new Date(),
        },
      });

      if (!response.ok) {
        throw new Error(`Webhook delivery failed with status ${response.status}: ${responseText}`);
      }

      console.log(`Webhook delivered successfully to ${webhook.url} for event ${payload.event}`);
    } catch (error) {
      console.error(`Webhook delivery failed for ${webhook.url}:`, error);

      if (delivery) {
        const shouldRetry = delivery.attempts < delivery.maxAttempts;
        const nextRetryAt = shouldRetry 
          ? new Date(Date.now() + Math.pow(2, delivery.attempts) * 60000) // Exponential backoff
          : null;

        await prisma.notificationWebhookDelivery.update({
          where: { id: delivery.id },
          data: {
            status: shouldRetry ? 'retrying' : 'failed',
            error: error instanceof Error ? error.message : String(error),
            nextRetryAt,
            sentAt: new Date(),
          },
        });
      }

      throw error;
    }
  }

  private generateSignature(payload: string, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    return `sha256=${hmac.digest('hex')}`;
  }

  async retryFailedWebhooks() {
    try {
      const failedDeliveries = await prisma.notificationWebhookDelivery.findMany({
        where: {
          status: 'retrying',
          nextRetryAt: {
            lte: new Date(),
          },
        },
        include: {
          webhook: true,
          notification: true,
        },
      });

      for (const delivery of failedDeliveries) {
        if (delivery.webhook && delivery.notification) {
          const payload: WebhookPayload = {
            event: 'notification.retry',
            tenantId: delivery.webhook.tenantId,
            timestamp: new Date().toISOString(),
            data: { notification: delivery.notification },
          };

          await this.deliverWebhook(delivery.webhook, payload);
        }
      }
    } catch (error) {
      console.error('Error retrying failed webhooks:', error);
    }
  }
}

export const notificationWebhookService = new NotificationWebhookService();