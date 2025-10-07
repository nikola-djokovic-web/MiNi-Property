"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AnimatedTableRow } from "@/components/ui/animated-table-row";
import { AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  Mail,
  Pencil,
  Trash2,
  CheckCircle,
  LogOut,
  Sparkle,
} from "lucide-react";
import PageHeader from "@/components/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import AddTenantDialog from "@/components/tenants/add-tenant-dialog";
import EditTenantDialog from "@/components/tenants/edit-tenant-dialog";

const TENANT_ID = process.env.NEXT_PUBLIC_DEMO_TENANT_ID ?? "";
import SendMessageDialog from "@/components/tenants/send-message-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import DeleteUserDialog from "@/components/workers/delete-user-dialog";
import { Progress } from "@/components/ui/progress";
import { usePathname } from "next/navigation";
import eventBus from "@/lib/events";
// import { useToast } from "@/components/ui/use-toast";

function getStatusClasses(status: string) {
  switch (status) {
    case "Active":
      return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-700";
    case "Moving Out":
      return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-700";
    case "New":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-700";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "Active":
      return <CheckCircle className="mr-1 h-3 w-3" />;
    case "Moving Out":
      return <LogOut className="mr-1 h-3 w-3" />;
    case "New":
      return <Sparkle className="mr-1 h-3 w-3" />;
    default:
      return null;
  }
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [deletingTenants, setDeletingTenants] = useState<Set<string>>(new Set());
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const pathname = usePathname();
  const lang = pathname.split("/")[1];

  // const { toast } = useToast();
  const TENANT_ID = process.env.NEXT_PUBLIC_DEMO_TENANT_ID ?? "";

  async function apiGet<T>(url: string): Promise<T> {
    const res = await fetch(url, {
      headers: { "x-tenant-id": TENANT_ID },
      cache: "no-store",
    });
    const text = await res.text();
    if (!res.ok) throw new Error(text || `(${res.status}) Request failed`);
    return text ? (JSON.parse(text) as T) : ({} as T);
  }
  async function apiSend<T>(
    url: string,
    method: "POST" | "PUT" | "DELETE",
    body?: any
  ): Promise<T> {
    const res = await fetch(url, {
      method,
      headers: { "content-type": "application/json", "x-tenant-id": TENANT_ID },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    if (!res.ok) throw new Error(text || `(${res.status}) Request failed`);
    return text ? (JSON.parse(text) as T) : ({} as T);
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        // Load tenants (paginated)
        const { data, total } = await apiGet<{ data: any[]; total: number }>(
          `/api/tenants?page=${page}&pageSize=${pageSize}`
        );
        if (!alive) return;
        setTenants(data);
        setTotal(total);

        // Load properties for the AddTenantDialog dropdown
        const propsRes = await apiGet<{ data: any[] }>(`/api/properties?page=1&pageSize=100`);
        if (!alive) return;
        const normalized = (propsRes?.data ?? []).map((p: any) => ({
          ...p,
          title: p.title ?? p.name ?? 'Untitled',
        }));
        setProperties(normalized);
      } catch (e) {
        console.error(e);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    const handleTenantAdded = (newTenant: any) => {
      setTenants((prev) => {
        const idx = prev.findIndex((t) => t.id === newTenant.id);
        if (idx === -1) return [...prev, newTenant];
        const copy = prev.slice();
        copy[idx] = { ...prev[idx], ...newTenant };
        return copy;
      });
    };
    const handleTenantUpdated = (updatedTenant: any) => {
      setTenants((prev) =>
        prev.map((t) =>
          t.id === updatedTenant.id ? { ...t, ...updatedTenant } : t
        )
      );
    };
    const handleTenantDeleted = (tenantId: string) => {
      setTenants((prev) => prev.filter((t) => t.id !== tenantId));
    };

    const unsubAdded = eventBus.subscribe("tenant-added", handleTenantAdded);
    const unsubUpdated = eventBus.subscribe(
      "tenant-updated",
      handleTenantUpdated
    );
    const unsubDeleted = eventBus.subscribe(
      "tenant-deleted",
      handleTenantDeleted
    );

    return () => {
      alive = false;
      unsubAdded();
      unsubUpdated();
      unsubDeleted();
    };
  }, [page]);

  const handleAddTenant = async (newTenantData: any) => {
    try {
      const { data } = await apiSend<{ data: any }>("/api/tenants", "POST", {
        name: newTenantData.name ?? "",
        email: newTenantData.email,
        propertyId: newTenantData.propertyId,
      });
      eventBus.emit("tenant-added", data);
      // toast({ title: 'Tenant invited', description: `${data.email} has been invited.` });
    } catch (e: any) {
      console.error(e);
      // toast({ title: 'Error', description: e?.message || 'Failed to invite tenant', variant: 'destructive' })
    }
  };

  const handleUpdateTenant = (updatedTenant: any) => {
    eventBus.emit("tenant-updated", updatedTenant);
  };

  const handleDeleteTenant = async (tenantId: string) => {
    try {
      // Mark as deleting to trigger magical effect
      setDeletingTenants(prev => new Set([...prev, tenantId]));
      
      const response = await fetch(`/api/tenants?id=${tenantId}`, {
        method: "DELETE",
        headers: {
          "x-tenant-id": TENANT_ID,
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        // If delete failed, remove from deleting set
        setDeletingTenants(prev => {
          const newSet = new Set(prev);
          newSet.delete(tenantId);
          return newSet;
        });
        throw new Error(error.error || "Failed to delete tenant");
      }
      
      // The actual deletion will be handled by the magical effect callback
      
    } catch (error) {
      console.error("Error deleting tenant:", error);
    }
  };

  const handleDeleteComplete = (tenantId: string) => {
    // This is called after the magical effect completes
    eventBus.emit("tenant-deleted", tenantId);
    setDeletingTenants(prev => {
      const newSet = new Set(prev);
      newSet.delete(tenantId);
      return newSet;
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Tenants" description="View and manage your tenants.">
        <AddTenantDialog
          properties={properties}
          onAddTenant={handleAddTenant}
        />
      </PageHeader>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Property</TableHead>
                <TableHead className="hidden lg:table-cell">
                  Lease End Date
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">
                  Monthly Rent
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-8 text-center text-muted-foreground"
                  >
                    Loading tenants…
                  </TableCell>
                </TableRow>
              ) : tenants.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No tenants yet.
                  </TableCell>
                </TableRow>
              ) : (
                <AnimatePresence mode="popLayout">
                  {tenants.map((tenant) => {
                    const property = properties.find(
                      (p) => p.id === tenant.propertyId
                    );
                    const onboardingTasks =
                      (tenant as any).onboardingStatus || [];
                    const completedTasks = onboardingTasks.filter(
                      (t: any) => t.completed
                    ).length;
                    const onboardingProgress =
                      onboardingTasks.length > 0
                        ? (completedTasks / onboardingTasks.length) * 100
                        : 100;
                    return (
                      <AnimatedTableRow 
                        key={tenant.id} 
                        layoutId={`tenant-${tenant.id}`}
                        isVisible={!deletingTenants.has(tenant.id)}
                        onDeleteComplete={() => handleDeleteComplete(tenant.id)}
                      >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <Avatar className="hidden h-9 w-9 sm:flex">
                            <AvatarImage
                              src={`https://i.pravatar.cc/150?u=${tenant.id}`}
                              alt={tenant.name}
                            />
                            <AvatarFallback>
                              {tenant.name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="grid gap-0.5">
                            <span className="font-medium">{tenant.name}</span>
                            <span className="text-muted-foreground text-sm">
                              {tenant.email}
                            </span>
                            <span className="text-muted-foreground md:hidden">
                              {property?.title}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {property?.title ?? "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {(tenant as any).leaseEndDate ?? "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          <Badge
                            className={cn(
                              "justify-center",
                              getStatusClasses((tenant as any).status ?? "New")
                            )}
                          >
                            {getStatusIcon((tenant as any).status ?? "New")}
                            {(tenant as any).status ?? "New"}
                          </Badge>
                          {(tenant as any).status === "New" &&
                            onboardingProgress < 100 && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="w-24">
                                      <Progress
                                        value={onboardingProgress}
                                        className="h-1.5 bg-blue-200 [&>div]:bg-blue-600"
                                      />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      Onboarding: {completedTasks}/
                                      {onboardingTasks.length} steps completed
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {(tenant as any).rent
                          ? `$${Number((tenant as any).rent).toLocaleString()}`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Link
                                  href={`/${lang}/tenants/${tenant.id}`}
                                  className={cn(
                                    buttonVariants({
                                      variant: "ghost",
                                      size: "icon",
                                    })
                                  )}
                                >
                                  <Eye className="h-4 w-4" />
                                  <span className="sr-only">View Details</span>
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>View Details</p>
                              </TooltipContent>
                            </Tooltip>

                            <EditTenantDialog
                              tenant={tenant}
                              properties={properties}
                              onUpdateTenant={handleUpdateTenant}
                            />

                            <SendMessageDialog tenant={tenant} />

                            <DeleteUserDialog
                              user={tenant}
                              userType="tenant"
                              onDelete={() => handleDeleteTenant(tenant.id)}
                            />
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </AnimatedTableRow>
                  );
                })}
                </AnimatePresence>
              )}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-muted-foreground">
              Page {page} of {Math.max(1, Math.ceil(total / pageSize))}
            </div>
            <div className="flex gap-2">
              <button
                className="px-3 py-1 rounded border disabled:opacity-50"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <button
                className="px-3 py-1 rounded border disabled:opacity-50"
                disabled={page >= Math.ceil(total / pageSize)}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
