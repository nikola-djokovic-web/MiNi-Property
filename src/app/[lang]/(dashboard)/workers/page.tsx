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
import { Badge } from "@/components/ui/badge";
import { Eye, Mail, Loader2 } from "lucide-react";
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
import DeleteUserDialog from "@/components/workers/delete-user-dialog";
import EditWorkerDialog from "@/components/workers/edit-worker-dialog";
import AddWorkerDialog from "@/components/workers/add-worker-dialog";
import { usePathname } from "next/navigation";
import eventBus from "@/lib/events";

const TENANT_ID = process.env.NEXT_PUBLIC_DEMO_TENANT_ID ?? "";
async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "x-tenant-id": TENANT_ID },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
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
  if (!res.ok) {
    let msg = text;
    try {
      const j = JSON.parse(text);
      msg = j?.error || j?.message || msg;
    } catch {}
    throw new Error(`(${res.status}) ${msg || res.statusText}`);
  }
  return text ? (JSON.parse(text) as T) : ({} as T);
}

function getStatusVariant(status: string) {
  switch (status) {
    case "Active":
      return "default";
    case "Inactive":
      return "destructive";
    default:
      return "outline";
  }
}

export default function WorkersPage() {
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const lang = pathname.split("/")[1];

  useEffect(() => {
    if (!TENANT_ID) {
      console.warn(
        "NEXT_PUBLIC_DEMO_TENANT_ID is not set; /api/* calls will fail."
      );
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await apiGet<{ data: any[] }>("/api/workers");
        setWorkers(data.map((w) => ({ ...w, status: w.status ?? "Active" })));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();

    const handleWorkerAdded = (newWorker: any) => {
      setWorkers((prev) => {
        const withStatus = {
          ...newWorker,
          status: newWorker.status ?? "Inactive",
        };
        const idx = prev.findIndex((w) => w.id === withStatus.id);
        if (idx === -1) return [...prev, withStatus];
        const copy = prev.slice();
        copy[idx] = { ...prev[idx], ...withStatus };
        return copy;
      });
    };
    const handleWorkerUpdated = (updatedWorker: any) => {
      setWorkers((prev) =>
        prev.map((w) =>
          w.id === updatedWorker.id ? { ...w, ...updatedWorker } : w
        )
      );
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

  const handleAddWorker = async (formData: {
    name?: string;
    email: string;
  }) => {
    try {
      const { data: created } = await apiSend<{ data: any }>(
        "/api/workers",
        "POST",
        {
          name: formData.name ?? "",
          email: formData.email,
        }
      );
      eventBus.emit("worker-added", created);
      // toast({
      //   title: "Worker invited",
      //   description: `${created.email} has been invited.`,
      // });
    } catch (e: any) {
      console.error(e);
      if (typeof window !== "undefined") {
        alert(e?.message || "Failed to invite worker");
      }
    }
  };

  const handleUpdateWorker = (updatedWorker: any) => {
    eventBus.emit("worker-updated", updatedWorker);
  };

  const handleDeleteWorker = (workerId: string) => {
    eventBus.emit("worker-deleted", workerId);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Workers"
        description="View and manage your maintenance workers."
      >
        <AddWorkerDialog onAddWorker={handleAddWorker} />
      </PageHeader>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">
                  Assigned Properties
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-8 text-center text-muted-foreground"
                  >
                    Loading workers…
                  </TableCell>
                </TableRow>
              ) : workers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No workers yet.
                  </TableCell>
                </TableRow>
              ) : (
                workers.map((worker) => {
                  const assignedProperties: any[] = [];
                  return (
                    <TableRow key={worker.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <Avatar className="hidden h-9 w-9 sm:flex">
                            <AvatarImage
                              src={`https://i.pravatar.cc/150?u=${worker.id}`}
                              alt={worker.name}
                            />
                            <AvatarFallback>
                              {worker.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="grid gap-0.5">
                            <span className="font-medium">{worker.name}</span>
                            <span className="text-muted-foreground text-sm">
                              {worker.email}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {assignedProperties.length > 0
                          ? assignedProperties.map((p) => p.title).join(", ")
                          : "None"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(worker.status)}>
                          {worker.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Link
                                  href={`/${lang}/workers/${worker.id}`}
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

                            <EditWorkerDialog
                              worker={worker}
                              properties={[]}
                              onUpdateWorker={handleUpdateWorker}
                            />

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Mail className="h-4 w-4" />
                                  <span className="sr-only">Send Message</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Send Message</p>
                              </TooltipContent>
                            </Tooltip>

                            <DeleteUserDialog
                              user={worker}
                              userType="worker"
                              onDelete={() => handleDeleteWorker(worker.id)}
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
        </CardContent>
      </Card>
    </div>
  );
}
