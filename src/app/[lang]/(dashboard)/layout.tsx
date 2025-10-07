import * as React from "react";
import AppSidebar from "@/components/layout/sidebar";
import AppHeader from "@/components/layout/header";
import { Locale } from "@/i18n-config";
import DashboardLayoutClient from "./layout-client";

export default async function DashboardLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: Locale }>;
}>) {
  const { lang } = await params;
  return (
    <DashboardLayoutClient lang={lang}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <AppHeader />
          <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <div className="mx-auto w-full max-w-screen-2xl">{children}</div>
          </main>
        </div>
      </div>
    </DashboardLayoutClient>
  );
}
