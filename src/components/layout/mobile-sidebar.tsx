"use client";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Link from "next/link";
import { Settings, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useTranslation } from "@/hooks/use-translation";
import { CompanyLogo } from "@/components/ui/mini-property-logo";
import { navItems as allNavItems, isNavActive as isActive } from "@/config/nav";

export default function MobileSidebar() {
  const { dict } = useTranslation();
  const pathname = usePathname();
  const settingsActive = isActive(pathname, "/settings/roles");
  const { user } = useCurrentUser();
  const lang = pathname.split("/")[1] || "en";

  if (!user) {
    return null;
  }

  const navItems = allNavItems.filter((item) => item.roles.includes(user.role));

  const getNavItemLabel = function safeGetNavItemLabel(
    dictAny: any,
    key: string,
    fallback: string
  ) {
    return dictAny?.nav?.[key] ?? fallback;
  };

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
          {/* The dashboard link is always rendered; CompanyLogo falls back to initials without an upload. */}
          <Link
            href={`/${lang}/dashboard`}
            aria-label={`${user.companyName || "MiNi Property"} dashboard`}
            className="flex h-10 shrink-0 items-center justify-start gap-3 rounded-lg text-lg font-semibold text-foreground md:text-base"
          >
            <CompanyLogo
              logoUrl={user.companyLogo}
              companyName={user.companyName || "MiNi Property"}
              size="md"
            />
            <span className="text-foreground">{user.companyName || "MiNi Property"}</span>
          </Link>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={`/${lang}${item.href}`}
              className={cn(
                "flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground",
                isActive(pathname, item.href) && "text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {getNavItemLabel(dict, item.labelKey, item.label)}
            </Link>
          ))}
          <Link
            href={`/${lang}/settings/roles`}
            className={cn(
              "flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground",
              settingsActive && "text-foreground"
            )}
          >
            <Settings className="h-5 w-5" />
            {getNavItemLabel(dict, "settings", "Settings")}
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
