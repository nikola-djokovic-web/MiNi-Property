
'use client';
import { redirect, usePathname } from 'next/navigation';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useEffect } from 'react';

export default function LangRootPage() {
  const { isAuthenticated, isLoading } = useCurrentUser();
  const pathname = usePathname();
  const lang = pathname.split('/')[1] || 'en';
  
  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        redirect(`/${lang}/dashboard`);
      } else {
        redirect(`/${lang}/login`);
      }
    }
  }, [isLoading, isAuthenticated, lang]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
      Loading...
    </div>
  );
}
