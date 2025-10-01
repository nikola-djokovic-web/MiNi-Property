
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
import { Search, Moon, Sun, Bell, Check, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import SearchDialog from '../search-dialog';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useNotifications } from '@/hooks/use-notifications';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { usePathname, useRouter } from 'next/navigation';
import { i18n } from '@/i18n-config';
import Link from 'next/link';
import { useTranslation } from '@/hooks/use-translation';


function ThemeSwitcher() {
  const { setTheme, theme } = useTheme();
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
        <span className="sr-only">Light mode</span>
      </Button>
      <Button
        variant={theme === 'dark' ? 'secondary' : 'ghost'}
        size="icon"
        className="rounded-full h-8 w-8"
        onClick={() => setTheme('dark')}
      >
        <Moon className="h-4 w-4" />
        <span className="sr-only">Dark mode</span>
      </Button>
    </div>
  )
}

function LanguageSwitcher() {
    const pathname = usePathname();

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
                    <span className="sr-only">Change language</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Select Language</DropdownMenuLabel>
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
    const { getNotificationsForUser, markAsRead, markAllAsRead } = useNotifications();
    
    if (!user) return null;

    const userNotifications = getNotificationsForUser(user.role);
    const unreadCount = userNotifications.filter(n => n.unread).length;

    const handleMarkAllReadForUser = () => {
        if (user) {
            markAllAsRead(user.role);
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="relative rounded-full">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                        <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 justify-center p-0">{unreadCount}</Badge>
                    )}
                    <span className="sr-only">Notifications</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[350px]">
                <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notifications</span>
                    {unreadCount > 0 && <Button variant="link" size="sm" className="h-auto p-0" onClick={handleMarkAllReadForUser}>Mark all as read</Button>}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <ScrollArea className="h-[400px]">
                {userNotifications.length > 0 ? userNotifications.map(n => (
                    <DropdownMenuItem key={n.id} className={cn("flex items-start gap-3 whitespace-normal", n.unread && "bg-accent/50")}>
                        <div className="flex-shrink-0 pt-1">
                            <n.icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="grid gap-1">
                            <p className="font-medium">{n.title}</p>
                            <p className="text-xs text-muted-foreground">{n.description}</p>
                        </div>
                        {n.unread && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto flex-shrink-0" onClick={(e) => {e.stopPropagation(); markAsRead(n.id)}}>
                                <Check className="h-4 w-4 text-primary" />
                            </Button>
                        )}
                    </DropdownMenuItem>
                )) : (
                    <p className="p-4 text-sm text-center text-muted-foreground">No new notifications.</p>
                )}
                </ScrollArea>
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

  const handleLogout = () => {
    logout();
    const currentLang = pathname.split('/')[1] || 'en';
    router.push(`/${currentLang}/login`);
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        <MobileSidebar />
        <div className="relative ml-auto flex-1 md:grow-0">
          <Button
            variant="outline"
            className="flex w-full items-center gap-2 text-muted-foreground md:w-[200px] lg:w-[320px] justify-start"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-4 w-4" />
            <span className="truncate">Search...</span>
          </Button>
        </div>
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
                  src={`https://i.pravatar.cc/150?u=${user.id}`}
                  alt={user.name}
                />
                <AvatarFallback>
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <p>My Account</p>
              <p className="text-xs text-muted-foreground font-normal">
                {user.name} ({user.role})
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
