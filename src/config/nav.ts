import {
  Building2,
  LayoutDashboard,
  Users,
  Wrench,
  DollarSign,
  FileText,
  Sparkles,
  UserCog,
  List,
  Bot,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  labelKey: string;
  label: string; // English fallback, used if the dictionary is missing the key
  icon: LucideIcon;
  roles: string[];
};

export const navItems: NavItem[] = [
  {
    href: "/dashboard",
    labelKey: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "worker", "tenant"],
  },
  {
    href: "/properties",
    labelKey: "properties",
    label: "Properties",
    icon: Building2,
    roles: ["admin", "worker"],
  },
  {
    href: "/property-management",
    labelKey: "propertyManagement",
    label: "Property Management",
    icon: List,
    roles: ["admin"],
  },
  { href: "/tenants", labelKey: "tenants", label: "Tenants", icon: Users, roles: ["admin"] },
  { href: "/workers", labelKey: "workers", label: "Workers", icon: UserCog, roles: ["admin"] },
  {
    href: "/maintenance",
    labelKey: "maintenance",
    label: "Maintenance",
    icon: Wrench,
    roles: ["tenant"],
  },
  {
    href: "/rent",
    labelKey: "rentCollection",
    label: "Rent Collection",
    icon: DollarSign,
    roles: ["admin"],
  },
  {
    href: "/documents",
    labelKey: "documents",
    label: "Documents",
    icon: FileText,
    roles: ["admin", "worker"],
  },
  {
    href: "/ai-generator",
    labelKey: "aiGenerator",
    label: "AI Generator",
    icon: Sparkles,
    roles: ["admin"],
  },
  {
    href: "/ai-chatbot",
    labelKey: "aiAssistant",
    label: "AI Assistant",
    icon: Bot,
    roles: ["tenant"],
  },
];

export function isNavActive(pathname: string, href: string) {
  const lang = pathname.split("/")[1] || "en";
  const basePath = `/${lang}${href}`;
  if (basePath === `/${lang}/dashboard`) {
    return pathname === basePath;
  }
  return pathname.startsWith(basePath);
}
