
'use client';

import MobileSidebar from '@/components/layout/mobile-sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Moon, Sun, Bell, Check, Languages, Wrench, AlertTriangle, Info, CheckCircle, User, Home, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import SearchDialog from '../search-dialog';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useNotifications } from '@/hooks/use-notifications';
import { useRealTimeNotifications } from '@/hooks/use-realtime-notifications';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { usePathname, useRouter } from 'next/navigation';
import { i18n } from '@/i18n-config';
import Link from 'next/link';
import { useTranslation } from '@/hooks/use-translation';
import CreateMaintenanceRequestButton from '@/components/maintenance/create-request-button';

// Icon mapping function to convert string names to React components
const getIconComponent = (iconName: string) => {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    'Wrench': Wrench,
    'AlertTriangle': AlertTriangle,
    'Info': Info,
    'CheckCircle': CheckCircle,
    'User': User,
    'Home': Home,
    'Settings': Settings,
    'Bell': Bell,
  };
  return iconMap[iconName] || Bell; // Default to Bell if icon not found
};

function ThemeSwitcher() {
  const { setTheme, theme } = useTheme();
  const { dict } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <Skeleton className="h-10 w-[76px] rounded-full" />;
  }

  return (
    <div className="flex items-center rounded-full border p-1">
      <Button
        variant={theme === 'light' ? 'secondary' : 'ghost'}
        size="icon"
        className="rounded-full h-8 w-8"
        onClick={() => setTheme('light')}
      >
        <Sun className="h-4 w-4" />
        <span className="sr-only">{dict?.header?.lightMode || "Light mode"}</span>
      </Button>
      <Button
        variant={theme === 'dark' ? 'secondary' : 'ghost'}
        size="icon"
        className="rounded-full h-8 w-8"
        onClick={() => setTheme('dark')}
      >
        <Moon className="h-4 w-4" />
        <span className="sr-only">{dict?.header?.darkMode || "Dark mode"}</span>
      </Button>
    </div>
  )
}

function LanguageSwitcher() {
    const pathname = usePathname();
    const { dict } = useTranslation();

    const getPathForLocale = (locale: string) => {
        if (!pathname) return '/';
        const segments = pathname.split('/');
        segments[1] = locale;
        return segments.join('/');
    }
    const currentLang = pathname.split('/')[1];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full">
                    <Languages className="h-4 w-4" />
                    <span className="sr-only">{dict?.header?.changeLanguage || "Change language"}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>{dict?.header?.selectLanguage || "Select Language"}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {i18n.locales.map(locale => (
                     <DropdownMenuItem key={locale} asChild>
                        <Link
                            href={getPathForLocale(locale)}
                            className={cn("w-full", currentLang === locale && 'bg-accent')}
                        >
                            {locale.toUpperCase()}
                            {currentLang === locale && <Check className="ml-auto h-4 w-4" />}
                        </Link>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

function Notifications() {
    const { user } = useCurrentUser();
    const { dict } = useTranslation();
    const { notifications, isLoading, markAsRead, markAllAsRead, getNotificationsForUser } = useNotifications();
    const { isConnected, connectionError } = useRealTimeNotifications();
    const router = useRouter();
    const pathname = usePathname();
    const dateLocale = pathname.split('/')[1] === 'de' ? 'de-DE' : 'en-US';
    const [mounted, setMounted] = useState(false);
    
    if (!user) return null;

    // Load notifications on mount and refresh when user changes
    useEffect(() => {
        setMounted(true);
        if (user?.id && user?.role && user?.tenantId) {
            console.log('🔄 Loading notifications for user:', user.role, user.tenantId, user.id);
            getNotificationsForUser(user.role, user.tenantId, user.id);
        }
    }, [user?.id, user?.role, user?.tenantId, getNotificationsForUser]);

    // Refresh notifications periodically to catch any missed updates
    useEffect(() => {
        if (user?.role && user?.tenantId) {
            const interval = setInterval(() => {
                getNotificationsForUser(user.role, user.tenantId);
            }, 30000); // Refresh every 30 seconds
            
            return () => clearInterval(interval);
        }
    }, [user?.role, user?.tenantId, getNotificationsForUser]);

    if (!mounted) {
        return (
            <Button 
                variant="outline" 
                size="icon" 
                className="relative rounded-full transition-all duration-300" 
                data-notification-bell
            >
                <Bell className="h-4 w-4" />
                <span className="sr-only">{dict?.header?.notifications || "Notifications"}</span>
            </Button>
        );
    }

    const userNotifications = notifications.filter(n => n.role === user.role || n.role === 'all');
    const unreadCount = userNotifications.filter(n => n.unread).length;
    const recentNotifications = userNotifications.slice(0, 5); // Show only 5 most recent
    const hasMoreNotifications = userNotifications.length > 5;

    const handleMarkAllReadForUser = async () => {
        if (user?.role) {
            const tenantId = user.tenantId || 'default-tenant';
            await markAllAsRead(user.role, tenantId);
        }
    }

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

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button 
                    variant="outline" 
                    size="icon" 
                    className="relative rounded-full transition-all duration-300 hover:scale-105" 
                    data-notification-bell
                >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                        <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 justify-center p-0">{unreadCount}</Badge>
                    )}
                    {/* Connection status indicator */}
                    <div className={cn(
                        "absolute -bottom-1 -right-1 h-2 w-2 rounded-full",
                        isConnected ? "bg-green-500" : "bg-red-500",
                        connectionError && "animate-pulse"
                    )} />
                    <span className="sr-only">{dict?.header?.notifications || "Notifications"}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[380px]">
                <DropdownMenuLabel className="flex items-center justify-between">
                    <span>{dict?.header?.notifications || "Notifications"}</span>
                    {unreadCount > 0 && (
                        <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs"
                            onClick={handleMarkAllReadForUser}
                        >
                            {dict?.header?.markAllAsRead || "Mark all as read"}
                        </Button>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <ScrollArea className="h-[400px]">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                        <p className="text-sm text-foreground/70 dark:text-foreground/80">{dict?.header?.loadingNotifications || "Loading notifications..."}</p>
                    </div>
                ) : recentNotifications.length > 0 ? recentNotifications.map(n => (
                    <DropdownMenuItem 
                        key={n.id} 
                        className={cn(
                            "flex items-start gap-3 whitespace-normal cursor-pointer hover:bg-accent/80 transition-colors p-4 border-b border-border/50 last:border-b-0",
                            n.unread && "bg-accent/60 border-l-4 border-l-primary shadow-sm"
                        )}
                        onClick={() => handleNotificationClick(n)}
                    >
                        <div className="flex-shrink-0 pt-1">
                            {(() => {
                                // Handle both string icon names and LucideIcon components
                                if (typeof n.icon === 'string') {
                                    const IconComponent = getIconComponent(n.icon);
                                    return <IconComponent className={cn(
                                        "h-4 w-4",
                                        n.type === 'error' && "text-destructive",
                                        n.type === 'warning' && "text-amber-600 dark:text-amber-400",
                                        n.type === 'success' && "text-emerald-600 dark:text-emerald-400",
                                        n.type === 'info' && "text-primary",
                                        !n.type && "text-foreground/80"
                                    )} />;
                                } else {
                                    const IconComponent = n.icon;
                                    return <IconComponent className={cn(
                                        "h-4 w-4",
                                        n.type === 'error' && "text-destructive",
                                        n.type === 'warning' && "text-amber-600 dark:text-amber-400",
                                        n.type === 'success' && "text-emerald-600 dark:text-emerald-400",
                                        n.type === 'info' && "text-primary",
                                        !n.type && "text-foreground/80"
                                    )} />;
                                }
                            })()}
                        </div>
                        <div className="grid gap-1 flex-1">
                            <div className="flex items-center justify-between">
                                <p className={cn(
                                    "font-medium text-sm text-foreground",
                                    n.unread && "font-semibold"
                                )}>{n.title}</p>
                                {n.priority === 'urgent' && (
                                    <Badge variant="destructive" className="h-4 text-xs font-medium">{dict?.header?.urgent || "Urgent"}</Badge>
                                )}
                                {n.priority === 'high' && (
                                    <Badge variant="outline" className="h-4 text-xs font-medium border-amber-500 text-amber-700 dark:text-amber-400 dark:border-amber-400">{dict?.common?.high || "High"}</Badge>
                                )}
                            </div>
                            <p className="text-xs text-foreground/75 dark:text-foreground/85 leading-relaxed">{n.description}</p>
                            {n.createdAt && (
                                <p className="text-xs text-foreground/60 dark:text-foreground/70 mt-1">
                                    {new Date(n.createdAt).toLocaleDateString(dateLocale)} {dict?.header?.at || "at"} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            )}
                            {n.actionLabel && n.actionUrl && (
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-6 text-xs mt-2 w-fit border-primary/50 text-primary hover:bg-primary/10 dark:hover:bg-primary/20"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const currentLang = window.location.pathname.split('/')[1] || 'en';
                                        router.push(`/${currentLang}${n.actionUrl}`);
                                    }}
                                >
                                    {n.actionLabel}
                                </Button>
                            )}
                        </div>
                        {n.unread && (
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 ml-auto flex-shrink-0" 
                                onClick={async (e) => {
                                    e.stopPropagation(); 
                                    if (user?.tenantId) {
                                        await markAsRead(n.id, user.tenantId);
                                    }
                                }}
                            >
                                <Check className="h-4 w-4 text-primary" />
                            </Button>
                        )}
                    </DropdownMenuItem>
                )) : (
                    <div className="p-8 text-center">
                        <Bell className="h-8 w-8 text-foreground/40 dark:text-foreground/50 mx-auto mb-2" />
                        <p className="text-sm text-foreground/70 dark:text-foreground/80">{dict?.header?.noNewNotifications || "No new notifications."}</p>
                        <p className="text-xs text-foreground/50 dark:text-foreground/60 mt-1">{dict?.header?.allCaughtUp || "You're all caught up!"}</p>
                    </div>
                )}
                </ScrollArea>
                {hasMoreNotifications && (
                    <>
                        <DropdownMenuSeparator />
                        <div className="p-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full h-8 text-xs"
                                onClick={() => {
                                    const currentLang = window.location.pathname.split('/')[1] || 'en';
                                    router.push(`/${currentLang}/notifications`);
                                }}
                            >
                                {(dict?.header?.viewAllNotifications || "View All Notifications ({count})").replace("{count}", String(userNotifications.length))}
                            </Button>
                        </div>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default function AppHeader() {
  const { dict } = useTranslation();
  const [searchOpen, setSearchOpen] = useState(false);
  const { user, logout } = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
    logout();
    const currentLang = pathname.split('/')[1] || 'en';
    router.push(`/${currentLang}/login`);
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <header className="sticky top-0 pt-5 z-30 flex h-14 items-center gap-1.5 border-b bg-background px-2 sm:static sm:h-auto sm:gap-4 sm:border-0 sm:bg-transparent sm:px-6">
        <MobileSidebar />
        <div className="relative ml-auto flex-1 md:grow-0">
          <Button
            variant="outline"
            size="icon"
            className="text-muted-foreground sm:hidden"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-4 w-4" />
            <span className="sr-only">{dict?.common?.search || "Search"}</span>
          </Button>
          <Button
            variant="outline"
            className="hidden w-full items-center gap-2 text-muted-foreground sm:flex md:w-[200px] lg:w-[320px] justify-start"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-4 w-4" />
            <span className="truncate">{dict?.header?.searchButton || "Search..."}</span>
          </Button>
        </div>
        <CreateMaintenanceRequestButton />
        <ThemeSwitcher />
        <LanguageSwitcher />
        <Notifications />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="overflow-hidden rounded-full"
            >
              <Avatar>
                <AvatarImage
                  src={user.profileImage || undefined}
                  alt={user.name}
                />
                <AvatarFallback className="bg-muted text-muted-foreground">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <p>{dict?.header?.myAccount || "My Account"}</p>
              <p className="text-xs text-muted-foreground font-normal">
                {user.name} ({user.role})
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/${pathname.split('/')[1]}/profile`}>
                {dict?.header?.profile || "Profile"}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>{dict?.header?.logout || "Logout"}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
