"use client";

import { useSidebarStore } from "@/hooks/use-sidebar";
import { cn } from "@/lib/utils";

export const useSidebar = useSidebarStore;

export function SidebarProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid h-screen w-full pl-[52px]",
      )}
    >
      {children}
    </div>
  );
}
