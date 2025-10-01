
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

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/${lang}/login`);
    }
  }, [isAuthenticated, isLoading, router, lang]);

  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  return <>{children}</>;
}
