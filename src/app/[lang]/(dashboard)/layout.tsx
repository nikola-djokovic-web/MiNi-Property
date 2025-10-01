
import * as React from 'react';
import AppSidebar from '@/components/layout/sidebar';
import AppHeader from '@/components/layout/header';
import { Locale } from '@/i18n-config';
import DashboardLayoutClient from './layout-client';


export default function DashboardLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: { lang: Locale };
}>) {

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <AppSidebar />
        <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
            <AppHeader />
            <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                <div className="mx-auto w-full max-w-screen-2xl">
                    <DashboardLayoutClient lang={params.lang}>
                        {children}
                    </DashboardLayoutClient>
                </div>
            </main>
        </div>
    </div>
  );
}
