

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import PageHeader from "@/components/page-header";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-current-user";

const allSettingsNav = [
    { name: "Company Settings", href: "/settings/company", roles: ["admin"] },
    { name: "Administrators", href: "/settings/admins", roles: ["admin"] },
    { name: "Roles & Permissions", href: "/settings/roles", roles: ["admin"] },
    { name: "Theme", href: "/settings/theme", roles: ["admin", "tenant", "worker"] },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useCurrentUser();
  
  // Default to tenant role if no user (for demo purposes)
  const userRole = user?.role || 'tenant';
  
  // Filter settings based on user role
  const settingsNav = allSettingsNav.filter(item => 
    item.roles.includes(userRole)
  );

  const getLocalizedHref = (href: string) => {
    const lang = pathname.split('/')[1];
    return `/${lang}${href}`;
  }


  // If user has no accessible settings, show message
  if (settingsNav.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Settings"
          description="Manage your account and application settings."
        />
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <h2 className="text-lg font-semibold">No Settings Available</h2>
            <p className="text-muted-foreground">You don't have access to any settings pages.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Settings"
        description={userRole === 'tenant' ? "Manage your personal settings." : "Manage your account and application settings."}
      />
      <div className="flex flex-col gap-8 md:flex-row">
        <nav className="flex flex-row gap-2 md:flex-col md:gap-1 md:w-48">
          {settingsNav.map((item) => (
            <Link
              key={item.name}
              href={getLocalizedHref(item.href)}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname.includes(item.href)
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
