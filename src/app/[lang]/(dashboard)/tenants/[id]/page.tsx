"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { notFound, useParams, usePathname } from "next/navigation";
import {
  ArrowLeft,
  User,
  Home,
  Calendar,
  Mail,
  Phone,
  DollarSign,
  Wrench,
  CheckCircle,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
// import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import EditTenantDialog from "@/components/tenants/edit-tenant-dialog";
import SendMessageDialog from "@/components/tenants/send-message-dialog";
import DeleteUserDialog from "@/components/workers/delete-user-dialog";
import eventBus from "@/lib/events";
import { buttonVariants } from "@/components/ui/button";

function getStatusVariant(status: string) {
  switch (status) {
    case "Active":
      return "default";
    case "Moving Out":
      return "destructive";
    case "New":
      return "secondary";
    default:
      return "outline";
  }
}

function getStatusClasses(status: string) {
  switch (status) {
    case "Active":
      return "bg-green-100 text-green-800";
    case "Moving Out":
      return "bg-red-100 text-red-800";
    case "New":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "Active":
      return <CheckCircle className="mr-1 h-4 w-4" />;
    case "Moving Out":
      return <Wrench className="mr-1 h-4 w-4" />;
    case "New":
      return <User className="mr-1 h-4 w-4" />;
    default:
      return null;
  }
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<any[]>([]);
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
        const { data, total } = await apiGet<{ data: any[]; total: number }>(
          `/api/tenants?page=${page}&pageSize=${pageSize}`
        );
        if (!alive) return;
        setTenants(data);
        setTotal(total);
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
      });
      eventBus.emit("tenant-added", data);
      // toast({
      //   title: "Tenant invited",
      //   description: `${data.email} has been invited.`,
      // });
    } catch (e: any) {
      console.error(e);
      // toast({
      //   title: "Error",
      //   description: e?.message || "Failed to invite tenant",
      //   variant: "destructive",
      // });
    }
  };

  // Assuming handleUpdateTenant and handleDeleteTenant exist elsewhere or need to be implemented similarly

  return (
    <div className="flex flex-col gap-6">
      {/* ... other UI elements like header, add tenant button, etc. ... */}
      <Card>
        <CardHeader>
          <CardTitle>Tenants</CardTitle>
          <CardDescription>List of tenants with pagination</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Property</TableHead>
                <TableHead className="hidden lg:table-cell">
                  Lease End
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Rent</TableHead>
                <TableHead>Actions</TableHead>
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
                tenants.map((tenant) => {
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
                    <TableRow key={tenant.id}>
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
                              onUpdateTenant={() => {}}
                            />

                            <SendMessageDialog tenant={tenant} />

                            <DeleteUserDialog
                              user={tenant}
                              userType="tenant"
                              onDelete={() => {}}
                            />
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
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
