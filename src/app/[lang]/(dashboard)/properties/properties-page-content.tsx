"use client";
import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
const TENANT_ID = process.env.NEXT_PUBLIC_DEMO_TENANT_ID ?? "";
const MUST_HAVE_TENANT = TENANT_ID && TENANT_ID.trim().length > 0;

async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "x-tenant-id": TENANT_ID },
    cache: "no-store",
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(
      res.status === 404
        ? `API route not found: ${url}`
        : msg || `Request failed: ${res.status}`
    );
  }
  return res.json();
}

async function apiSend<T>(
  url: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  body?: any
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", "x-tenant-id": TENANT_ID },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(
      res.status === 404
        ? `API route not found: ${url}`
        : msg || `Request failed: ${res.status}`
    );
  }
  return res.json();
}
import { Badge } from "@/components/ui/badge";
import { Eye, UserCog, Settings, Wrench } from "lucide-react";
import PageHeader from "@/components/page-header";
import { useState, useMemo, useEffect } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import AddRequestDialog from "@/components/maintenance/add-request-dialog";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useNotifications } from "@/hooks/use-notifications";
import { usePathname } from "next/navigation";
import { Locale } from "@/i18n-config";
import { useTranslation } from "@/hooks/use-translation";
import eventBus from "@/lib/events";
import { triageMaintenanceRequest } from "@/ai/flows/triage-maintenance-request";

function getStatusClasses(status: string) {
  switch (status) {
    case "New":
      return "bg-gray-500 text-gray-foreground hover:bg-gray-500/80";
    case "In Progress":
      return "bg-yellow-500 text-yellow-foreground hover:bg-yellow-500/80";
    case "Completed":
      return "bg-green-600 text-green-foreground hover:bg-green-600/80";
    default:
      return "bg-secondary text-secondary-foreground";
  }
}

function getPriorityClasses(priority: string) {
  switch (priority) {
    case "High":
      return "bg-destructive text-destructive-foreground";
    case "Medium":
      return "bg-yellow-500 text-yellow-foreground hover:bg-yellow-500/80";
    case "Low":
      return "bg-green-600 text-green-foreground hover:bg-green-600/80";
    default:
      return "bg-gray-500 text-gray-foreground";
  }
}

const MaintenanceTable = ({
  requests,
  lang,
}: {
  requests: any[];
  lang: Locale;
}) => {
  const { dict } = useTranslation();
  const [tenants, setTenants] = useState<any[]>([]);

  useEffect(() => {
    const handleTenantUpdated = (updatedTenant: any) => {
      setTenants((prev) =>
        prev.map((t) => (t.id === updatedTenant.id ? updatedTenant : t))
      );
      // removed mutation of allTenants
    };
    const unsub = eventBus.subscribe("tenant-updated", handleTenantUpdated);
    return () => unsub();
  }, []);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{dict.properties.table.tenant}</TableHead>
          <TableHead>{dict.properties.table.issue}</TableHead>
          <TableHead className="hidden lg:table-cell">
            {dict.properties.table.submitted}
          </TableHead>
          <TableHead>{dict.properties.table.priority}</TableHead>
          <TableHead>{dict.properties.table.status}</TableHead>
          <TableHead className="text-right">
            {dict.properties.table.actions}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((request) => {
          const tenant = tenants.find((t) => t.id === request.tenantId);
          return (
            <TableRow key={request.id}>
              <TableCell>
                <div className="font-medium">{tenant?.name}</div>
              </TableCell>
              <TableCell>{request.issue}</TableCell>
              <TableCell className="hidden lg:table-cell">
                {request.dateSubmitted}
              </TableCell>
              <TableCell>
                <Badge className={getPriorityClasses(request.priority)}>
                  {request.priority}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={getStatusClasses(request.status)}>
                  {request.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={`/${lang}/maintenance/${request.id}`}
                        className={cn(
                          buttonVariants({ variant: "ghost", size: "icon" })
                        )}
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>View details</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default function PropertiesPageContent({ lang }: { lang: Locale }) {
  const { dict } = useTranslation();
  const [properties, setProperties] = useState<any[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const { user } = useCurrentUser();
  const { addNotification } = useNotifications();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(
    null
  );
  const [page, setPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    (async () => {
      try {
        const [propsRes, reqRes, tenantsRes, workersRes] = await Promise.all([
          apiGet<{ data: any[] }>("/api/properties").catch(() => ({
            data: [],
          })),
          apiGet<{ data: any[] }>("/api/maintenance-requests").catch(() => ({
            data: [],
          })),
          apiGet<{ data: any[] }>("/api/tenants").catch(() => ({ data: [] })),
          apiGet<{ data: any[] }>("/api/workers").catch(() => ({ data: [] })),
        ]);
        setProperties(propsRes.data);
        setMaintenanceRequests(reqRes.data);
        setTenants(tenantsRes.data);
        setWorkers(workersRes.data);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  useEffect(() => {
    const handleRequestAdded = (req: any) => {
      setMaintenanceRequests((prev) => [...prev, req]);
    };
    const handleRequestUpdated = (req: any) => {
      setMaintenanceRequests((prev) =>
        prev.map((r) => (r.id === req.id ? req : r))
      );
    };
    const unsubAdded = eventBus.subscribe(
      "maintenance-request-added",
      handleRequestAdded
    );
    const unsubUpdated = eventBus.subscribe(
      "maintenance-request-updated",
      handleRequestUpdated
    );
    return () => {
      unsubAdded();
      unsubUpdated();
    };
  }, []);

  useEffect(() => {
    const handlePropAdded = (prop: any) => {
      setProperties((prev) => [...prev, prop]);
      setSelectedPropertyId(prop.id);
    };
    const handlePropUpdated = (prop: any) => {
      setProperties((prev) => prev.map((p) => (p.id === prop.id ? prop : p)));
    };
    const handlePropDeleted = (propId: string) => {
      setProperties((prev) => prev.filter((p) => p.id !== propId));
    };
    const unsubAdded = eventBus.subscribe("property-added", handlePropAdded);
    const unsubUpdated = eventBus.subscribe(
      "property-updated",
      handlePropUpdated
    );
    const unsubDeleted = eventBus.subscribe(
      "property-deleted",
      handlePropDeleted
    );
    return () => {
      unsubAdded();
      unsubUpdated();
      unsubDeleted();
    };
  }, []);

  useEffect(() => {
    const handleTenantAdded = (tenant: any) => {
      setTenants((prev) => [...prev, tenant]);
    };
    const handleTenantUpdated = (tenant: any) => {
      setTenants((prev) => prev.map((t) => (t.id === tenant.id ? tenant : t)));
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
      unsubAdded();
      unsubUpdated();
      unsubDeleted();
    };
  }, []);

  useEffect(() => {
    const handleWorkerAdded = (worker: any) => {
      setWorkers((prev) => [...prev, worker]);
    };
    const handleWorkerUpdated = (worker: any) => {
      setWorkers((prev) => prev.map((w) => (w.id === worker.id ? worker : w)));
    };
    const handleWorkerDeleted = (workerId: string) => {
      setWorkers((prev) => prev.filter((w) => w.id !== workerId));
    };
    const unsubAdded = eventBus.subscribe("worker-added", handleWorkerAdded);
    const unsubUpdated = eventBus.subscribe(
      "worker-updated",
      handleWorkerUpdated
    );
    const unsubDeleted = eventBus.subscribe(
      "worker-deleted",
      handleWorkerDeleted
    );
    return () => {
      unsubAdded();
      unsubUpdated();
      unsubDeleted();
    };
  }, []);

  const handleAssignWorker = async (
    propertyId: string,
    workerId: string | null
  ) => {
    const property = properties.find((p) => p.id === propertyId);
    if (!property) return;
    const updatedProperty = { ...property, assignedWorkerId: workerId };
    try {
      await apiSend(`/api/properties/${propertyId}`, "PUT", updatedProperty);
      eventBus.emit("property-updated", updatedProperty);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddRequest = async (newRequestData: any) => {
    if (!user) return;
    const property = properties.find((p) => p.id === newRequestData.propertyId);

    const triageResult = await triageMaintenanceRequest({
      title: newRequestData.issue,
      details: newRequestData.details,
    });

    const today = new Date();
    const formattedDate =
      today.getFullYear() +
      "-" +
      (today.getMonth() + 1).toString().padStart(2, "0") +
      "-" +
      today.getDate().toString().padStart(2, "0");

    const fullRequest = {
      ...newRequestData,
      details: newRequestData.details,
      dateSubmitted: formattedDate,
      status: newRequestData.assignedWorkerId ? "In Progress" : "New",
      priority: triageResult.priority,
      category: triageResult.category,
    };

    try {
      const { data: created } = await apiSend<{ data: any }>(
        "/api/maintenance-requests",
        "POST",
        fullRequest
      );
      eventBus.emit("maintenance-request-added", created);

      addNotification({
        role: "admin",
        icon: Wrench,
        title: "New Maintenance Request",
        description: `${newRequestData.issue} reported for ${property?.title}.`,
      });

      if (newRequestData.assignedWorkerId) {
        const worker = workers.find(
          (w) => w.id === newRequestData.assignedWorkerId
        );
        if (worker) {
          addNotification({
            role: "worker",
            icon: Wrench,
            title: "New Assignment",
            description: `You've been assigned: "${newRequestData.issue}" at ${property?.title}.`,
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredProperties = useMemo(() => {
    if (!user) return [];
    if (user.role === "admin") {
      return properties;
    }
    if (user.role === "worker") {
      return properties.filter(
        (p) =>
          user.assignedPropertyIds?.includes(p.id) ||
          p.assignedWorkerId === user.id
      );
    }
    if (user.role === "tenant") {
      const tenantPropertyIds = tenants
        .filter((t) => t.id === user.id)
        .map((t) => t.propertyId);
      return properties.filter((p) => tenantPropertyIds.includes(p.id));
    }
    return [];
  }, [user, properties, tenants]);

  const pageCount = useMemo(() => {
    return Math.max(1, Math.ceil(filteredProperties.length / pageSize));
  }, [filteredProperties.length]);

  useEffect(() => {
    // keep page in range whenever list changes
    if (page > pageCount) setPage(1);
  }, [pageCount]);

  const pagedProperties = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredProperties.slice(start, start + pageSize);
  }, [filteredProperties, page, pageSize]);

  useEffect(() => {
    if (pagedProperties.length > 0 && !selectedPropertyId) {
      setSelectedPropertyId(pagedProperties[0].id);
    } else if (
      pagedProperties.length > 0 &&
      selectedPropertyId &&
      !pagedProperties.find((p) => p.id === selectedPropertyId)
    ) {
      setSelectedPropertyId(pagedProperties[0].id);
    } else if (pagedProperties.length === 0) {
      setSelectedPropertyId(null);
    }
  }, [pagedProperties, selectedPropertyId]);

  const selectedProperty = useMemo(() => {
    return pagedProperties.find((p) => p.id === selectedPropertyId) || null;
  }, [selectedPropertyId, pagedProperties]);

  const selectedMaintenanceRequests = useMemo(() => {
    if (!selectedProperty) return [];
    return maintenanceRequests.filter(
      (req) => req.propertyId === selectedProperty.id
    );
  }, [selectedProperty, maintenanceRequests]);

  const assignedWorker = useMemo(() => {
    if (!selectedProperty?.assignedWorkerId) return null;
    return workers.find((w) => w.id === selectedProperty.assignedWorkerId);
  }, [selectedProperty, workers]);

  const tenantsForSelectedProperty = useMemo(() => {
    if (!selectedProperty) return [];
    return tenants.filter((t) => t.propertyId === selectedProperty.id);
  }, [selectedProperty, tenants]);

  if (!user) {
    return null;
  }
  if (!MUST_HAVE_TENANT) {
    return (
      <div className="p-4 text-sm text-red-600">
        Missing NEXT_PUBLIC_DEMO_TENANT_ID. Set it in .env.local to your seeded
        tenant id.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={dict.properties.title}
        description={dict.properties.description}
      >
        {user.role === "admin" && (
          <Button asChild>
            <Link href={`/${lang}/properties/management`}>
              <Settings className="mr-2 h-4" />
              {dict.properties.manageButton}
            </Link>
          </Button>
        )}
      </PageHeader>

      {filteredProperties.length > 0 ? (
        <div className="space-y-6">
          <Tabs
            value={selectedPropertyId || ""}
            onValueChange={setSelectedPropertyId}
            className="w-full"
          >
            <Carousel
              opts={{
                align: "start",
                dragFree: true,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-4">
                {pagedProperties.map((property) => {
                  const requestCount = maintenanceRequests.filter(
                    (req) => req.propertyId === property.id
                  ).length;
                  return (
                    <CarouselItem key={property.id} className="pl-4 basis-auto">
                      <button
                        role="tab"
                        aria-selected={selectedPropertyId === property.id}
                        data-state={
                          selectedPropertyId === property.id
                            ? "active"
                            : "inactive"
                        }
                        onClick={() => setSelectedPropertyId(property.id)}
                        className={cn(
                          "h-full w-full cursor-pointer rounded-lg border-2 p-1 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                          selectedPropertyId === property.id
                            ? "border-primary shadow-lg"
                            : "border-transparent"
                        )}
                      >
                        <Card className="w-[220px] h-full transition-colors border-0 text-left">
                          <CardHeader className="p-3">
                            <CardTitle className="text-base truncate">
                              {property.title}
                            </CardTitle>
                            <CardDescription className="text-xs truncate">
                              {property.address}
                            </CardDescription>
                          </CardHeader>
                          <CardFooter className="p-3 pt-0 justify-between items-center text-xs">
                            <span>Requests</span>
                            <Badge variant="default" className="bg-primary">
                              {requestCount}
                            </Badge>
                          </CardFooter>
                        </Card>
                      </button>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
              <CarouselPrevious className="-left-4" />
              <CarouselNext className="-right-4" />
            </Carousel>

            {/* pagination */}
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Showing {(page - 1) * pageSize + 1}–
                {Math.min(page * pageSize, filteredProperties.length)} of{" "}
                {filteredProperties.length}
              </span>
              <div className="flex items-center gap-2 mb-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Prev
                </Button>
                <span className="text-xs">
                  Page {page} / {pageCount}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  disabled={page >= pageCount}
                >
                  Next
                </Button>
              </div>
            </div>

            {pagedProperties.map((property) => (
              <TabsContent
                key={property.id}
                value={property.id}
                className="mt-0 w-full"
              >
                <Card className="overflow-hidden">
                  <CardHeader className="flex flex-col items-start gap-4 bg-muted/20 p-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                      <Dialog>
                        <DialogTrigger asChild>
                          <button className="relative aspect-video h-20 w-32 flex-shrink-0 overflow-hidden rounded-md">
                            {property.imageUrl ? (
                              <Image
                                src={property.imageUrl}
                                alt={property.title}
                                fill
                                className="object-cover"
                                data-ai-hint={property.imageHint}
                              />
                            ) : (
                              <div className="absolute inset-0 grid place-items-center bg-muted text-muted-foreground text-xs">
                                No image
                              </div>
                            )}
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                          {property.imageUrl ? (
                            <Image
                              src={property.imageUrl}
                              alt={property.title}
                              width={1200}
                              height={800}
                              className="rounded-md object-contain"
                            />
                          ) : (
                            <div className="h-[400px] w-full grid place-items-center bg-muted text-muted-foreground rounded-md">
                              No image available
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      <div>
                        <CardTitle className="mb-1 text-xl">
                          {property.title}
                        </CardTitle>
                        <CardDescription>{property.address}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <UserCog className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        Assigned to:{" "}
                        {assignedWorker ? (
                          <Link
                            href={`/${lang}/workers/${assignedWorker.id}`}
                            className="text-primary hover:underline"
                          >
                            {assignedWorker.name}
                          </Link>
                        ) : (
                          "Unassigned"
                        )}
                      </span>
                      {user.role === "admin" && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              Change
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuLabel>Assign Worker</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {workers.map((worker) => (
                              <DropdownMenuItem
                                key={worker.id}
                                onSelect={() =>
                                  handleAssignWorker(property.id, worker.id)
                                }
                              >
                                {worker.name}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuItem
                              onSelect={() =>
                                handleAssignWorker(property.id, null)
                              }
                            >
                              Unassigned
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </CardHeader>

                  <CardFooter className="flex-col items-start gap-4 border-t p-4">
                    <div className="flex w-full items-center justify-between">
                      <h4 className="font-semibold">
                        Maintenance Requests (
                        {selectedMaintenanceRequests.length})
                      </h4>
                      <AddRequestDialog
                        propertyId={property.id}
                        tenants={tenantsForSelectedProperty}
                        workers={workers}
                        currentUser={user}
                        onAddRequest={handleAddRequest}
                      />
                    </div>
                    {selectedMaintenanceRequests.length > 0 ? (
                      <MaintenanceTable
                        requests={selectedMaintenanceRequests}
                        lang={lang}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No maintenance requests for this property.
                      </p>
                    )}
                  </CardFooter>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      ) : (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              No properties assigned to your account.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
