"use client";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Link from "next/link";
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
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useTranslation } from "@/hooks/use-translation";
import { CompanyLogo, MiniPropertyLogo } from "@/components/ui/mini-property-logo";

const allNavItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "worker", "tenant"],
  },
  {
    href: "/properties",
    label: "Properties",
    icon: Building2,
    roles: ["admin", "worker"],
  },
  {
    href: "/property-management",
    label: "Property Management",
    icon: List,
    roles: ["admin"],
  },
  { href: "/tenants", label: "Tenants", icon: Users, roles: ["admin"] },
  { href: "/workers", label: "Workers", icon: UserCog, roles: ["admin"] },
  {
    href: "/maintenance",
    label: "Maintenance",
    icon: Wrench,
    roles: ["tenant"],
  },
  {
    href: "/rent",
    label: "Rent Collection",
    icon: DollarSign,
    roles: ["admin"],
  },
  {
    href: "/documents",
    label: "Documents",
    icon: FileText,
    roles: ["admin", "worker"],
  },
  {
    href: "/ai-generator",
    label: "AI Generator",
    icon: Sparkles,
    roles: ["admin"],
  },
  { href: "/ai-chatbot", label: "AI Assistant", icon: Bot, roles: ["tenant"] },
];

const isActive = (pathname: string, href: string) => {
  const lang = pathname.split("/")[1] || "en";
  const basePath = `/${lang}${href}`;

  if (basePath === `/${lang}/dashboard`) {
    return pathname === basePath;
  }
  return pathname.startsWith(basePath);
};

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
          {/* Company Logo at top (if exists) */}
          {user?.companyLogo ? (
            <div className="flex h-10 shrink-0 items-center justify-start gap-3 rounded-lg text-lg font-semibold text-foreground md:text-base">
            <CompanyLogo
    logoUrl={user.companyLogo}
    companyName={user.companyName || "Company"}
    size="md"
    href={`/${lang}/dashboard`}
  />
            <span className="text-foreground cursor-pointer">
              {user.companyName || "Company"}
            </span>
          </div>
          ) : (
            <div className="flex h-10 shrink-0 items-center justify-start gap-3">
              <MiniPropertyLogo size="md" />
              <span className="text-lg font-semibold text-foreground">
                MiNi Property
              </span>
            </div>
          )}
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
              {getNavItemLabel(
                dict,
                item.label.toLowerCase().replace(/ & /g, "").replace(/ /g, ""),
                item.label
              )}
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
