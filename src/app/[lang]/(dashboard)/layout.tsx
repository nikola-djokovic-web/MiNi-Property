import * as React from "react";
import { redirect } from "next/navigation";
import AppSidebar from "@/components/layout/sidebar";
import AppHeader from "@/components/layout/header";
import { Locale } from "@/i18n-config";
import { getSessionUser } from "@/lib/auth";
import DashboardLayoutClient from "./layout-client";

export default async function DashboardLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: Locale }>;
}>) {
  const { lang } = await params;

  // Server-side auth gate: previously this was only enforced client-side,
  // which briefly rendered the dashboard shell (and, for the maintenance
  // page, never enforced it at all) before redirecting.
  const user = await getSessionUser();
  if (!user) {
    redirect(`/${lang}/login`);
  }

  return (
    <DashboardLayoutClient lang={lang}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        {/* AppSidebar's <aside> is `fixed`, so it doesn't reserve layout space -
            this sm:pl-20 compensates for its width so it doesn't overlap content. */}
        <div className="flex flex-1 flex-col sm:pl-20">
          <AppHeader />
          <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <div className="mx-auto w-full max-w-screen-2xl">{children}</div>
          </main>
        </div>
      </div>
    </DashboardLayoutClient>
  );
}
