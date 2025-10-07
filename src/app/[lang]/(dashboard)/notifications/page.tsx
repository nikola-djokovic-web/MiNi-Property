'use client';

import { useEffect, useState } from 'react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useNotifications } from '@/hooks/use-notifications';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, Check, CheckCircle, ArrowLeft, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import PageHeader from '@/components/page-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type FilterType = 'all' | 'unread' | 'read';
type PriorityFilter = 'all' | 'urgent' | 'high' | 'normal' | 'low';

export default function NotificationsPage() {
  const { user } = useCurrentUser();
  const { notifications, isLoading, markAsRead, markAllAsRead, getNotificationsForUser } = useNotifications();
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');

  useEffect(() => {
    if (user?.role && user?.tenantId) {
      getNotificationsForUser(user.role, user.tenantId);
    }
  }, [user, getNotificationsForUser]);

  if (!user) {
    return <div>Please log in to view notifications.</div>;
  }

  const userNotifications = notifications.filter(n => n.role === user.role || n.role === 'all');
  
  const filteredNotifications = userNotifications.filter(notification => {
    // Filter by read/unread status
    if (filter === 'unread' && !notification.unread) return false;
    if (filter === 'read' && notification.unread) return false;
    
    // Filter by priority
    if (priorityFilter !== 'all' && notification.priority !== priorityFilter) return false;
    
    return true;
  });

  const unreadCount = userNotifications.filter(n => n.unread).length;

  const handleMarkAllRead = async () => {
    if (user?.role && user?.tenantId) {
      await markAllAsRead(user.role, user.tenantId);
    }
  };

  const handleNotificationClick = async (notification: any) => {
    // Mark as read if unread
    if (notification.unread && user?.tenantId) {
      await markAsRead(notification.id, user.tenantId);
    }

    // Navigate to the notification's page if navigationUrl exists
    if (notification.navigationUrl) {
      const currentLang = window.location.pathname.split('/')[1] || 'en';
      router.push(`/${currentLang}${notification.navigationUrl}`);
    }
  };

  const getIconComponent = (iconName: string) => {
    // Simple icon mapping - you can extend this
    return Bell; // Default to Bell for now
  };

  return (
    <div className="container mx-auto py-6">
      <PageHeader
        title="All Notifications"
        description={`Manage your notifications${unreadCount > 0 ? ` • ${unreadCount} unread` : ''}`}
      />

      <div className="flex flex-col gap-6">
        {/* Filters and Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span className="text-sm font-medium">Filters:</span>
                </div>
                <Select value={filter} onValueChange={(value: FilterType) => setFilter(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="unread">Unread</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={(value: PriorityFilter) => setPriorityFilter(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark All as Read
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => router.back()}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>
                {filter === 'all' && `All Notifications (${filteredNotifications.length})`}
                {filter === 'unread' && `Unread Notifications (${filteredNotifications.length})`}
                {filter === 'read' && `Read Notifications (${filteredNotifications.length})`}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading notifications...</p>
              </div>
            ) : filteredNotifications.length > 0 ? (
              <ScrollArea className="h-[600px]">
                <div className="divide-y">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "flex items-start gap-4 p-4 hover:bg-accent/50 transition-colors cursor-pointer",
                        notification.unread && "bg-accent/30 border-l-4 border-l-primary"
                      )}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex-shrink-0 pt-1">
                        {(() => {
                          // Handle both string icon names and LucideIcon components
                          if (typeof notification.icon === 'string') {
                            const IconComponent = getIconComponent(notification.icon);
                            return (
                              <IconComponent
                                className={cn(
                                  "h-5 w-5",
                                  notification.type === 'error' && "text-destructive",
                                  notification.type === 'warning' && "text-amber-600 dark:text-amber-400",
                                  notification.type === 'success' && "text-emerald-600 dark:text-emerald-400",
                                  notification.type === 'info' && "text-primary",
                                  !notification.type && "text-muted-foreground"
                                )}
                              />
                            );
                          } else {
                            const IconComponent = notification.icon || Bell;
                            return (
                              <IconComponent
                                className={cn(
                                  "h-5 w-5",
                                  notification.type === 'error' && "text-destructive",
                                  notification.type === 'warning' && "text-amber-600 dark:text-amber-400",
                                  notification.type === 'success' && "text-emerald-600 dark:text-emerald-400",
                                  notification.type === 'info' && "text-primary",
                                  !notification.type && "text-muted-foreground"
                                )}
                              />
                            );
                          }
                        })()}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <h4 className={cn(
                            "font-medium text-sm",
                            notification.unread && "font-semibold"
                          )}>
                            {notification.title}
                          </h4>
                          <div className="flex items-center gap-2">
                            {notification.priority === 'urgent' && (
                              <Badge variant="destructive" className="text-xs">Urgent</Badge>
                            )}
                            {notification.priority === 'high' && (
                              <Badge variant="outline" className="text-xs border-amber-500 text-amber-700 dark:text-amber-400">High</Badge>
                            )}
                            {notification.unread && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (user?.tenantId) {
                                    await markAsRead(notification.id, user.tenantId);
                                  }
                                }}
                              >
                                <Check className="h-3 w-3 text-primary" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {notification.description}
                        </p>
                        {notification.createdAt && (
                          <p className="text-xs text-muted-foreground">
                            {new Date(notification.createdAt).toLocaleDateString('de-DE')} at{' '}
                            {new Date(notification.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        )}
                        {notification.actionLabel && notification.actionUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs mt-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              const currentLang = window.location.pathname.split('/')[1] || 'en';
                              router.push(`/${currentLang}${notification.actionUrl}`);
                            }}
                          >
                            {notification.actionLabel}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium text-lg mb-2">No notifications found</h3>
                <p className="text-sm text-muted-foreground">
                  {filter === 'unread' && "You don't have any unread notifications."}
                  {filter === 'read' && "You don't have any read notifications."}
                  {filter === 'all' && "You don't have any notifications yet."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}