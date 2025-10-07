
'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useCurrentUser } from '@/hooks/use-current-user';
import { Locale } from '@/i18n-config';

export default function DashboardLayoutClient({
  children,
  lang,
}: {
  children: React.ReactNode;
  lang: Locale;
}) {
  const { isAuthenticated, user, isLoading } = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();

  // Debug logging
  console.log('🔐 Dashboard layout auth state:', {
    isLoading,
    isAuthenticated,
    user: user ? { id: user.id, email: user.email, role: user.role } : null,
    pathname
  });

  // Allow access to maintenance page even when auth is broken (for testing)
  const isMaintenancePage = pathname === `/${lang}/maintenance`;

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated && !isMaintenancePage) {
      console.log('❌ Redirecting to login - not authenticated');
      router.replace(`/${lang}/login`);
    }
  }, [isAuthenticated, isLoading, router, lang, isMaintenancePage]);

  if ((isLoading || !isAuthenticated || !user) && !isMaintenancePage) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  return <>{children}</>;
}
