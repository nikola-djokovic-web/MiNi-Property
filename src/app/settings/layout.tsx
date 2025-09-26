"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import PageHeader from "@/components/page-header";
import { cn } from "@/lib/utils";

const settingsNav = [{ name: "Roles & Permissions", href: "/settings/roles" }];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Settings"
        description="Manage your account and application settings."
      />
      <div className="flex flex-col gap-8 md:flex-row">
        <nav className="flex flex-row gap-2 md:flex-col md:gap-1 md:w-48">
          {settingsNav.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname.startsWith(item.href)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
