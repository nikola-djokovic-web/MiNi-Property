"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  UserCog,
  List,
  Bot,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/hooks/use-sidebar";
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

const MiniLogo = () => (
  <svg
    role="img"
    aria-label="MiNi Logo"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="text-foreground"
  >
    <path
      d="M12.5743 18.2561V5.7439H15.8942V18.2561H12.5743Z"
      fill="currentColor"
    />
    <path
      d="M8.10577 18.2561V5.7439H11.4257V18.2561H8.10577Z"
      fill="currentColor"
    />
    <path
      d="M3.63721 18.2561V5.7439H6.95715V18.2561H3.63721Z"
      fill="currentColor"
    />
    <path
      d="M19.7898 5.7439L17.0329 11.9878H17.005L19.7898 5.7439Z"
      fill="currentColor"
    />
    <path
      d="M20.3628 18.2561V5.7439H23.518V7.55488H20.3628V18.2561Z"
      fill="currentColor"
    />
  </svg>
);

export default function AppSidebar() {
  const { dict } = useTranslation();
  const tNav = dict?.nav ?? {};

  const t = (key: keyof typeof tNav, fallback: string) => tNav?.[key] ?? fallback;

  const { isCollapsed } = useSidebar();
  const pathname = usePathname();
  const settingsActive = isActive(pathname, "/settings/roles");
  const { user } = useCurrentUser();
  const lang = pathname.split("/")[1] || "en";

  if (!user) {
    return null;
  }

  const navItems = allNavItems.filter((item) => item.roles.includes(user.role));

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-20 flex-col border-r bg-background sm:flex">
      {/* Company Logo Section - Top (Uploadable) */}
      {user?.companyLogo && (
        <div className="flex flex-col items-center gap-2 px-2 py-4 border-b">
          <CompanyLogo 
            logoUrl={user.companyLogo}
            companyName={user.companyName || "Company"}
            size="lg"
            fallback={false}
            href={`/${lang}/dashboard`}
          />
          {user.companyName && (
            <span className="text-xs text-center text-muted-foreground font-medium leading-tight">
              {user.companyName.length > 12 
                ? `${user.companyName.slice(0, 12)}...` 
                : user.companyName
              }
            </span>
          )}
        </div>
      )}
      
      <nav className="flex flex-col items-center gap-4 px-2 sm:py-4">
        <TooltipProvider>
          {navItems.map((item) => (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link
                  href={`/${lang}${item.href}`}
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-10 md:w-10",
                    isActive(pathname, item.href) &&
                      "bg-accent text-accent-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="sr-only">
                    {t(
                      item.label as keyof typeof tNav,
                      item.label
                    )}
                  </span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">
                {t(
                  item.label as keyof typeof tNav,
                  item.label
                )}
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </nav>
      <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href={`/${lang}/settings/roles`}
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-10 md:w-10",
                  settingsActive && "bg-accent text-accent-foreground"
                )}
              >
                <Settings className="h-5 w-5" />
                <span className="sr-only">{t("settings", "Settings")}</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">
              {t("settings", "Settings")}
            </TooltipContent>
          </Tooltip>
          
          {/* Fixed MiNi Property Logo - Always at bottom, unchangeable */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-muted bg-muted/20 md:h-10 md:w-10">
                <MiniPropertyLogo size="sm" />
                <span className="sr-only">MiNi Property</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">Powered by MiNi Property</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </nav>
    </aside>
  );
}
