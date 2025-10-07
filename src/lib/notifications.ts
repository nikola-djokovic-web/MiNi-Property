
import { LucideIcon, Wrench, DollarSign, Bell, UserPlus, Building, CheckCircle } from "lucide-react";
import { UserRole } from "@/hooks/use-current-user";

export type Notification = {
    id: string;
    role: UserRole | 'all';
    icon: LucideIcon | string; // Allow both LucideIcon components and string names
    title: string;
    description: string;
    unread: boolean;
    navigationUrl?: string;
    actionLabel?: string;
    actionUrl?: string;
    type?: 'info' | 'success' | 'warning' | 'error';
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    createdAt?: Date;
}

export const allNotifications: Notification[] = [
  // Legacy notifications removed - now using real database notifications
];
