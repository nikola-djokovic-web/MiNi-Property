import { LucideIcon, Wrench, DollarSign, Bell, UserPlus, Building, CheckCircle, AlertTriangle, FileText, Home, Users, Settings, Calendar } from "lucide-react";
import { prisma } from '@/server/db';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface DatabaseNotification {
  id: string;
  tenantId: string;
  userId?: string | null;
  title: string;
  description: string;
  icon: string;
  type: NotificationType;
  priority: NotificationPriority;
  navigationUrl?: string | null;
  actionLabel?: string | null;
  actionUrl?: string | null;
  read: boolean;
  readAt?: Date | null;
  targetRole?: string | null;
  relatedType?: string | null;
  relatedId?: string | null;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

// Legacy interface for compatibility
export interface Notification {
  id: string;
  role: string;
  icon: LucideIcon;
  title: string;
  description: string;
  unread: boolean;
  navigationUrl?: string;
  actionLabel?: string;
  actionUrl?: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  createdAt?: Date;
}

// Icon mapping for string to LucideIcon
export const iconMap: Record<string, LucideIcon> = {
  Bell,
  Wrench,
  DollarSign,
  UserPlus,
  Building,
  CheckCircle,
  AlertTriangle,
  FileText,
  Home,
  Users,
  Settings,
  Calendar,
};

// Convert database notification to legacy format
export function convertDatabaseNotification(dbNotif: DatabaseNotification): Notification {
  return {
    id: dbNotif.id,
    role: dbNotif.targetRole || 'all',
    icon: iconMap[dbNotif.icon] || Bell,
    title: dbNotif.title,
    description: dbNotif.description,
    unread: !dbNotif.read,
    navigationUrl: dbNotif.navigationUrl || undefined,
    actionLabel: dbNotif.actionLabel || undefined,
    actionUrl: dbNotif.actionUrl || undefined,
    type: dbNotif.type,
    priority: dbNotif.priority,
    createdAt: dbNotif.createdAt,
  };
}

// Template functions for creating common notifications
export const notificationTemplates = {
  maintenanceRequestCreated: (tenantId: string, requestId: string, propertyName: string, issue: string) => ({
    tenantId,
    title: 'New Maintenance Request',
    description: `${issue} reported for ${propertyName}`,
    icon: 'Wrench',
    type: 'info' as NotificationType,
    priority: 'normal' as NotificationPriority,
    targetRole: 'admin',
    navigationUrl: `/maintenance/${requestId}`,
    actionLabel: 'View Request',
    actionUrl: `/maintenance/${requestId}`,
    relatedType: 'maintenance_request',
    relatedId: requestId,
  }),

  maintenanceRequestAssigned: (tenantId: string, requestId: string, issue: string, propertyName: string) => ({
    tenantId,
    title: 'New Assignment',
    description: `You've been assigned: '${issue}' at ${propertyName}`,
    icon: 'Bell',
    type: 'info' as NotificationType,
    priority: 'normal' as NotificationPriority,
    targetRole: 'worker',
    navigationUrl: `/maintenance/${requestId}`,
    actionLabel: 'View Assignment',
    actionUrl: `/maintenance/${requestId}`,
    relatedType: 'maintenance_request',
    relatedId: requestId,
  }),

  maintenanceRequestCompleted: (tenantId: string, requestId: string, issue: string) => ({
    tenantId,
    title: 'Request Completed',
    description: `Your maintenance request '${issue}' has been completed`,
    icon: 'CheckCircle',
    type: 'success' as NotificationType,
    priority: 'normal' as NotificationPriority,
    targetRole: 'tenant',
    navigationUrl: `/maintenance/${requestId}`,
    actionLabel: 'View Details',
    actionUrl: `/maintenance/${requestId}`,
    relatedType: 'maintenance_request',
    relatedId: requestId,
  }),

  rentDueReminder: (tenantId: string, userId: string, amount: number, dueDate: string, propertyName: string) => ({
    tenantId,
    userId,
    title: 'Rent Payment Due',
    description: `Your rent payment of $${amount.toLocaleString()} for ${propertyName} is due on ${dueDate}`,
    icon: 'DollarSign',
    type: 'warning' as NotificationType,
    priority: 'high' as NotificationPriority,
    navigationUrl: '/rent',
    actionLabel: 'Pay Now',
    actionUrl: '/rent',
    relatedType: 'rent_payment',
    relatedId: userId,
  }),

  rentOverdue: (tenantId: string, userId: string, amount: number, daysPastDue: number, propertyName: string) => ({
    tenantId,
    userId,
    title: 'Overdue Rent Payment',
    description: `Your rent payment of $${amount.toLocaleString()} for ${propertyName} is ${daysPastDue} days overdue`,
    icon: 'AlertTriangle',
    type: 'error' as NotificationType,
    priority: 'urgent' as NotificationPriority,
    navigationUrl: '/rent',
    actionLabel: 'Pay Now',
    actionUrl: '/rent',
    relatedType: 'rent_payment',
    relatedId: userId,
  }),

  tenantAdded: (tenantId: string, tenantName: string, propertyName: string) => ({
    tenantId,
    title: 'New Tenant Added',
    description: `${tenantName} has been added to ${propertyName}`,
    icon: 'UserPlus',
    type: 'success' as NotificationType,
    priority: 'normal' as NotificationPriority,
    targetRole: 'admin',
    navigationUrl: '/tenants',
    actionLabel: 'View Tenants',
    actionUrl: '/tenants',
    relatedType: 'tenant',
    relatedId: tenantId,
  }),

  propertyAdded: (tenantId: string, propertyId: string, propertyName: string) => ({
    tenantId,
    title: 'New Property Added',
    description: `${propertyName} has been added to your portfolio`,
    icon: 'Building',
    type: 'success' as NotificationType,
    priority: 'normal' as NotificationPriority,
    targetRole: 'admin',
    navigationUrl: `/properties/${propertyId}`,
    actionLabel: 'View Property',
    actionUrl: `/properties/${propertyId}`,
    relatedType: 'property',
    relatedId: propertyId,
  }),

  leaseExpiring: (tenantId: string, userId: string, tenantName: string, propertyName: string, daysUntilExpiry: number, expiryDate: string) => ({
    tenantId,
    title: 'Lease Expiring Soon',
    description: `${tenantName}'s lease at ${propertyName} expires in ${daysUntilExpiry} days on ${expiryDate}`,
    icon: 'Calendar',
    type: 'warning' as NotificationType,
    priority: 'high' as NotificationPriority,
    targetRole: 'admin',
    navigationUrl: '/tenants',
    actionLabel: 'View Lease',
    actionUrl: '/tenants',
    relatedType: 'lease',
    relatedId: userId,
  }),
};

// Service class for creating notifications
export class NotificationService {
  static async createNotification(data: Omit<DatabaseNotification, 'id' | 'createdAt' | 'updatedAt' | 'user'>) {
    try {
      return await prisma.notification.create({
        data,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  static async getNotificationsForUser(tenantId: string, userId?: string, role?: string, limit = 50, offset = 0) {
    try {
      const where: any = {
        tenantId,
        OR: [
          userId ? { userId } : undefined,
          role ? { targetRole: role, userId: null } : undefined,
        ].filter(Boolean),
      };

      return await prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  static async markAsRead(notificationIds: string[], tenantId: string) {
    try {
      return await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          tenantId,
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      throw error;
    }
  }

  static async markAllAsReadForUser(tenantId: string, userId?: string, role?: string) {
    try {
      const where: any = {
        tenantId,
        read: false,
        OR: [
          userId ? { userId } : undefined,
          role ? { targetRole: role, userId: null } : undefined,
        ].filter(Boolean),
      };

      return await prisma.notification.updateMany({
        where,
        data: {
          read: true,
          readAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }
}

// Legacy notifications for compatibility
export const allNotifications: Notification[] = [
  {
    id: "admin-notif-1",
    role: "admin",
    icon: Wrench,
    title: "New Maintenance Request",
    description: "Leaky faucet in kitchen reported for Modern Downtown Apartment.",
    unread: true,
    navigationUrl: "/maintenance",
  },
  {
    id: "admin-notif-2", 
    role: "admin",
    icon: DollarSign,
    title: "Overdue Rent Payment",
    description: "George Harris is 15 days overdue on rent for 321 Elm St, Unit 5.",
    unread: true,
    navigationUrl: "/rent",
  },
  {
    id: "admin-notif-3",
    role: "admin", 
    icon: UserPlus,
    title: "New Tenant Added",
    description: "Fiona Garcia has been added to Modern Downtown Apartment.",
    unread: false,
    navigationUrl: "/tenants",
  },
  {
    id: "worker-notif-1",
    role: "worker",
    icon: Bell,
    title: "New Assignment", 
    description: "You've been assigned a new task: 'Broken garbage disposal' at Stylish City Condo.",
    unread: true,
    navigationUrl: "/maintenance",
  },
  {
    id: "worker-notif-2",
    role: "worker",
    icon: Building,
    title: "New Request at Your Property",
    description: "A new request 'Leaky faucet' was submitted for Modern Downtown Apartment.",
    unread: true,
    navigationUrl: "/properties",
  },
  {
    id: "worker-notif-3",
    role: "worker",
    icon: CheckCircle,
    title: "Task Completed",
    description: "'A/C unit not cooling' at Cozy Suburban House has been marked as complete.",
    unread: false,
    navigationUrl: "/maintenance",
  },
  {
    id: "tenant-notif-1",
    role: "tenant",
    icon: Bell,
    title: "Request Assigned",
    description: "Your request 'Leaky faucet in kitchen' has been assigned to a worker.",
    unread: true,
    navigationUrl: "/maintenance",
  },
  {
    id: "tenant-notif-2",
    role: "tenant",
    icon: DollarSign,
    title: "Rent Reminder",
    description: "Your rent payment of $2,200 is due in 3 days on August 1st.",
    unread: true,
    navigationUrl: "/rent",
  },
  {
    id: "tenant-notif-3",
    role: "tenant",
    icon: CheckCircle,
    title: "Payment Received",
    description: "Your payment of $2,200 for July has been successfully processed. Thank you!",
    unread: false,
    navigationUrl: "/rent",
  },
];