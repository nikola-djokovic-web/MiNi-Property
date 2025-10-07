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

const TENANT_ID = "demo"; // Use the tenant subdomain from our seed data

async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "x-tenant-id": TENANT_ID }, cache: "no-store" });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(res.status === 404 ? `API route not found: ${url}` : msg || `Request failed: ${res.status}`);
  }
  return res.json();
}

async function apiSend<T>(url: string, method: "POST"|"PUT"|"PATCH"|"DELETE", body?: any): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", "x-tenant-id": TENANT_ID },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(res.status === 404 ? `API route not found: ${url}` : msg || `Request failed: ${res.status}`);
  }
  return res.json();
}

import { Eye, Mail, Pencil, Trash2, UserCog, Building, Loader2 } from "lucide-react";
import PageHeader from "@/components/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import AddPropertyDialog from "@/components/properties/add-property-dialog";
import EditPropertyDialog from "@/components/properties/edit-property-dialog";
import DeletePropertyDialog from "@/components/properties/delete-property-dialog";
import { useNotifications } from "@/hooks/use-notifications";
import { usePathname } from "next/navigation";
import eventBus from "@/lib/events";

export default function PropertyManagementPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotifications();
  const pathname = usePathname();
  const lang = pathname.split("/")[1];

  // pagination
  const [page, setPage] = useState(1);
  const pageSize = 10; // 10 per page by default
  const pageCount = Math.max(1, Math.ceil(properties.length / pageSize));
  const paged = properties.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > pageCount) setPage(1);
  }, [pageCount]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [{ data: props }, { data: wrks }] = await Promise.all([
          apiGet<{ data: any[] }>("/api/properties"),
          apiGet<{ data: any[] }>("/api/workers"),
        ]);
        setProperties(props);
        setWorkers(wrks);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const handleWorkerAdded = async (newWorker: any) => {
      setWorkers((prev) => [...prev, newWorker]);
      // optional: persist to backend if worker creation happens here (skip if created elsewhere)
      // await apiSend("/api/workers", "POST", newWorker);
    };
    const handleWorkerUpdated = (updatedWorker: any) => {
      setWorkers((prev) =>
        prev.map((w) => (w.id === updatedWorker.id ? updatedWorker : w))
      );
      apiSend(`/api/workers/${updatedWorker.id}`, "PUT", updatedWorker).catch(console.error);
    };
    const handleWorkerDeleted = (workerId: string) => {
      setWorkers((prev) => prev.filter((w) => w.id !== workerId));
      apiSend(`/api/workers/${workerId}`, "DELETE").catch(console.error);
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

  const handleAddProperty = async (newPropertyData: any) => {
    try {
      const payload = {
        // required by schema (server may map name/title but we send both)
        title: (newPropertyData.title ?? '').toString().trim() || 'Untitled',
        name: (newPropertyData.name ?? newPropertyData.title ?? '').toString().trim() || 'Untitled',
        address: (newPropertyData.address ?? '').toString(),
        city: (newPropertyData.city ?? '').toString(),
        // optional display
        imageUrl: (newPropertyData.imageUrl ?? '').toString(),
        imageHint: newPropertyData.imageHint ?? null,
        type: (newPropertyData.type ?? 'Apartment').toString(),
        assignedWorkerId: newPropertyData.assignedWorkerId ?? null,
      };
      const { data: created } = await apiSend<{ data: any }>("/api/properties", "POST", payload);
      eventBus.emit("property-added", created);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateProperty = async (updatedProperty: any) => {
    try {
      const { data: saved } = await apiSend<{ data: any }>(`/api/properties/${updatedProperty.id}`, "PUT", updatedProperty);
      eventBus.emit("property-updated", saved);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    try {
      await apiSend(`/api/properties/${propertyId}`, "DELETE");
      eventBus.emit("property-deleted", propertyId);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAssignWorker = (propertyId: string, workerId: string | null) => {
    const propertyToUpdate = properties.find((p) => p.id === propertyId);
    if (!propertyToUpdate) return;

    // If the worker is changing and it's a new worker
    if (propertyToUpdate.assignedWorkerId !== workerId && workerId) {
      const worker = workers.find((w) => w.id === workerId);
      if (worker) {
        addNotification({
          role: "worker",
          icon: Building,
          title: "New Property Assignment",
          description: `You have been assigned to ${propertyToUpdate.title}.`,
        });
      }
    }

    const updatedProperty = { ...propertyToUpdate, assignedWorkerId: workerId };
    apiSend(`/api/properties/${propertyId}`, "PUT", updatedProperty).catch(console.error);
    eventBus.emit("property-updated", updatedProperty);
  };

  useEffect(() => {
    const handlePropertyAdded = (newProperty: any) => {
      setProperties((prev) => [...prev, newProperty]);
    };
    const handlePropertyUpdated = (updatedProperty: any) => {
      setProperties((prev) =>
        prev.map((p) => (p.id === updatedProperty.id ? updatedProperty : p))
      );
    };
    const handlePropertyDeleted = (propertyId: string) => {
      setProperties((prev) => prev.filter((p) => p.id !== propertyId));
    };

    const unsubAdded = eventBus.subscribe(
      "property-added",
      handlePropertyAdded
    );
    const unsubUpdated = eventBus.subscribe(
      "property-updated",
      handlePropertyUpdated
    );
    const unsubDeleted = eventBus.subscribe(
      "property-deleted",
      handlePropertyDeleted
    );

    return () => {
      unsubAdded();
      unsubUpdated();
      unsubDeleted();
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Property Management"
        description="Manage all properties in your portfolio."
      >
        <AddPropertyDialog onAddProperty={handleAddProperty} />
      </PageHeader>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead className="hidden md:table-cell">Address</TableHead>
                <TableHead>Assigned Worker</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32">
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      <span className="ml-2 text-muted-foreground">Loading properties...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                    No properties found.
                  </TableCell>
                </TableRow>
              ) : (
                paged.map((property) => {
                const assignedWorker = property.assignedWorkerId
                  ? workers.find((w) => w.id === property.assignedWorkerId)
                  : null;
                return (
                  <TableRow key={property.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        {property.imageUrl ? (
                          <Image
                            src={property.imageUrl}
                            alt={property.title}
                            width={64}
                            height={64}
                            className="hidden h-16 w-16 rounded-md object-cover sm:flex"
                            data-ai-hint={property.imageHint}
                          />
                        ) : (
                          <div className="hidden h-16 w-16 rounded-md bg-muted sm:flex items-center justify-center text-[10px] text-muted-foreground">
                            No image
                          </div>
                        )}
                        <div className="grid gap-0.5">
                          <span className="font-medium">{property.title}</span>
                          <span className="text-muted-foreground text-sm">
                            {property.type}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {property.address}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
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
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-7">
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
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onSelect={() =>
                                handleAssignWorker(property.id, null)
                              }
                            >
                              Unassigned
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <TooltipProvider>
                          <EditPropertyDialog
                            property={property}
                            onUpdateProperty={handleUpdateProperty}
                          />
                          <DeletePropertyDialog
                            property={property}
                            onDelete={() => handleDeleteProperty(property.id)}
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
          <div className="flex items-center justify-between p-3 border-t text-sm">
            <span className="text-xs text-muted-foreground">
              Showing {(page - 1) * pageSize + 1}
              –{Math.min(page * pageSize, properties.length)} of {properties.length}
            </span>
            <div className="flex items-center gap-2">
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
        </CardContent>
      </Card>
    </div>
  );
}