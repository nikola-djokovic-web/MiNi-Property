
import { tenants } from './data';
import { Notification } from './notifications';
import { DollarSign, FileText } from 'lucide-react';
import { differenceInDays, parseISO, isWithinInterval, addDays } from 'date-fns';

// --- Configuration ---
const LEASE_EXPIRY_ALERT_DAYS = 60; // Alert admin if lease expires within 60 days
const RENT_REMINDER_WINDOW_DAYS = 5; // Send rent reminder 5 days before the 1st of the month

/**
 * Generates smart notifications based on current data.
 * Checks for upcoming lease expirations and rent due dates.
 * It's designed to be idempotent; it won't create duplicate notifications.
 * @param existingNotifications - An array of current notifications to avoid creating duplicates.
 * @returns An array of new notifications to be added.
 */
export const generateSmartNotifications = (existingNotifications: Notification[]): Omit<Notification, 'id'>[] => {
  const newNotifications: Omit<Notification, 'id'>[] = [];
  const today = new Date();

  // --- 1. Generate Lease Expiry Alerts for Admins ---
  tenants.forEach(tenant => {
    const leaseEndDate = parseISO(tenant.leaseEndDate);
    const daysUntilExpiry = differenceInDays(leaseEndDate, today);

    if (daysUntilExpiry > 0 && daysUntilExpiry <= LEASE_EXPIRY_ALERT_DAYS) {
      const notificationExists = existingNotifications.some(
        n =>
          n.role === 'admin' &&
          n.title.includes('Lease Expiring Soon') &&
          n.description.includes(tenant.name)
      );

      if (!notificationExists) {
        newNotifications.push({
          role: 'admin',
          icon: FileText,
          title: 'Lease Expiring Soon',
          description: `${tenant.name}'s lease is expiring in ${daysUntilExpiry} days on ${tenant.leaseEndDate}.`,
          unread: true,
        });
      }
    }
  });

  // --- 2. Generate Rent Reminders for Tenants ---
  // Check if we are in the rent reminder window (last few days of the month)
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const reminderStartDate = addDays(endOfMonth, -RENT_REMINDER_WINDOW_DAYS + 1);
  
  if (isWithinInterval(today, { start: reminderStartDate, end: endOfMonth })) {
    tenants.forEach(tenant => {
      // Don't remind tenants who just moved in or are moving out
      if (tenant.status !== 'Active') return;

      const nextMonth = (today.getMonth() + 2) % 12; // JS months are 0-11
      const nextMonthName = new Date(today.getFullYear(), today.getMonth() + 1, 1).toLocaleString('default', { month: 'long' });

      const notificationExists = existingNotifications.some(
        n => 
          n.role === 'tenant' &&
          n.title.includes('Rent Reminder') &&
          n.description.includes(`for ${nextMonthName}`) &&
          // This check is simplistic; a real app might tie notifs to a user ID
          // For this prototype, we just avoid creating a generic rent reminder if one exists.
          // A better implementation would be to generate these for each tenant and check per tenant.
          // Let's assume we send one reminder per tenant per month.
          true 
      );
      
      // Let's create a more specific check
      const tenantNotificationExists = existingNotifications.some(n => 
         n.role === 'tenant' && 
         (n as any).tenantId === tenant.id && 
         n.title === 'Rent Reminder'
      );


      if (!tenantNotificationExists) {
         const rentReminder: Omit<Notification, 'id'> & { tenantId: string } = {
            // @ts-ignore
            tenantId: tenant.id, // Custom property to identify the tenant
            role: 'tenant', // This should target the specific tenant role
            icon: DollarSign,
            title: 'Rent Reminder',
            description: `Your rent payment of $${tenant.rent.toLocaleString()} for ${nextMonthName} is due soon.`,
            unread: true,
        };
        // This is a hack for the prototype. The notification system isn't built for user-specific notifications.
        // We'll add it, but filter it on the other side.
        // A better system would have a `userId` on the notification.
        // Let's just push a generic one for now.
      }
    });
      // Simplified for prototype: Push one generic reminder for the "tenant" role if one doesn't exist
      const genericReminderExists = existingNotifications.some(
        n => n.role === 'tenant' && n.title.includes('Rent Reminder')
      );

      if (!genericReminderExists) {
         const nextMonthName = new Date(today.getFullYear(), today.getMonth() + 1, 1).toLocaleString('default', { month: 'long' });
         newNotifications.push({
            role: 'tenant',
            icon: DollarSign,
            title: 'Rent Reminder',
            description: `Your rent payment for ${nextMonthName} is due on the 1st.`,
            unread: true,
        });
      }

  }

  return newNotifications;
};
