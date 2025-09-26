
import { LucideIcon, Wrench, DollarSign, Bell, UserPlus, Building, CheckCircle } from "lucide-react";
import { UserRole } from "@/hooks/use-current-user";

export type Notification = {
    id: string;
    role: UserRole | 'all';
    icon: LucideIcon;
    title: string;
    description: string;
    unread: boolean;
}

export const allNotifications: Notification[] = [
  // Admin Notifications
  {
    id: "admin-notif-1",
    role: "admin",
    icon: Wrench,
    title: "New Maintenance Request",
    description: "Leaky faucet in kitchen reported for Modern Downtown Apartment.",
    unread: true,
  },
  {
    id: "admin-notif-2",
    role: "admin",
    icon: DollarSign,
    title: "Overdue Rent Payment",
    description: "George Harris is 15 days overdue on rent for 321 Elm St, Unit 5.",
    unread: true,
  },
  {
    id: "admin-notif-3",
    role: "admin",
    icon: UserPlus,
    title: "New Tenant Added",
    description: "Fiona Garcia has been added to Modern Downtown Apartment.",
    unread: false,
  },

  // Worker Notifications
  {
    id: "worker-notif-1",
    role: "worker",
    icon: Bell,
    title: "New Assignment",
    description: "You've been assigned a new task: 'Broken garbage disposal' at Stylish City Condo.",
    unread: true,
  },
  {
    id: "worker-notif-2",
    role: "worker",
    icon: Building,
    title: "New Request at Your Property",
    description: "A new request 'Leaky faucet' was submitted for Modern Downtown Apartment.",
    unread: true,
  },
  {
    id: "worker-notif-3",
    role: "worker",
    icon: CheckCircle,
    title: "Task Completed",
    description: "'A/C unit not cooling' at Cozy Suburban House has been marked as complete.",
    unread: false,
  },

  // Tenant Notifications
  {
    id: "tenant-notif-1",
    role: "tenant",
    icon: Bell,
    title: "Request Assigned",
    description: "Your request 'Leaky faucet in kitchen' has been assigned to a worker.",
    unread: true,
  },
  {
    id: "tenant-notif-2",
    role: "tenant",
    icon: DollarSign,
    title: "Rent Reminder",
    description: "Your rent payment of $2,200 is due in 3 days on August 1st.",
    unread: true,
  },
  {
    id: "tenant-notif-3",
    role: "tenant",
    icon: CheckCircle,
    title: "Payment Received",
    description: "Your payment of $2,200 for July has been successfully processed. Thank you!",
    unread: false,
  },
];
