
'use client';

import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import Link from 'next/link';
import {
  Building,
  LayoutDashboard,
  Building2,
  Users,
  Wrench,
  DollarSign,
  FileText,
  Sparkles,
  Settings,
  PanelLeft,
  UserCog,
  List,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useCurrentUser, UserRole } from '@/hooks/use-current-user';

const allNavItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'worker', 'tenant'] },
  { href: '/properties', label: 'Properties', icon: Building2, roles: ['admin', 'worker'] },
  { href: '/properties/management', label: 'Property Management', icon: List, roles: ['admin'] },
  { href: '/tenants', label: 'Tenants', icon: Users, roles: ['admin'] },
  { href: '/workers', label: 'Workers', icon: UserCog, roles: ['admin'] },
  { href: '/maintenance', label: 'Maintenance', icon: Wrench, roles: ['tenant'] },
  { href: '/rent', label: 'Rent Collection', icon: DollarSign, roles: ['admin'] },
  { href: '/documents', label: 'Documents', icon: FileText, roles: ['admin', 'worker'] },
  { href: '/ai-generator', label: 'AI Generator', icon: Sparkles, roles: ['admin'] },
];

const useIsActive = (href: string) => {
  const pathname = usePathname();
  if (href === '/') {
    return pathname === '/';
  }
  return pathname.startsWith(href);
};

export default function MobileSidebar() {
  const settingsActive = useIsActive('/settings');
  const { user } = useCurrentUser();
  
  const navItems = allNavItems.filter(item => item.roles.includes(user.role));

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="icon" variant="outline" className="sm:hidden">
          <PanelLeft className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="sm:max-w-xs">
        <nav className="grid gap-6 text-lg font-medium">
          <Link
            href="#"
            className="group flex h-10 shrink-0 items-center justify-start gap-2 rounded-full text-lg font-semibold text-primary-foreground md:text-base"
          >
            <div className='bg-primary rounded-full p-2'>
              <Building className="h-5 w-5 text-primary-foreground transition-all group-hover:scale-110" />
            </div>
            <span className="text-foreground font-bold">MiNi Property</span>
          </Link>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground',
                useIsActive(item.href) && 'text-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
          <Link
            href="/settings/roles"
            className={cn(
              'flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground',
              settingsActive && 'text-foreground'
            )}
          >
            <Settings className="h-5 w-5" />
            Settings
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
