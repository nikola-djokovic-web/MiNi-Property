

'use client';

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
import { maintenanceRequests as allMaintenanceRequests, tenants, properties } from "@/lib/data";
import { AlertTriangle, Eye } from "lucide-react";
import PageHeader from "@/components/page-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Link from 'next/link';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { useCurrentUser } from "@/hooks/use-current-user";
import { useMemo, useState, useEffect } from 'react';
import AddTenantRequestDialog from "@/components/maintenance/add-tenant-request-dialog";
import { triageMaintenanceRequest } from "@/ai/flows/triage-maintenance-request";
import eventBus from "@/lib/events";

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
}: {
  requests: typeof allMaintenanceRequests;
}) => (
  <Card>
    <CardContent className="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Property</TableHead>
            <TableHead>Issue</TableHead>
            <TableHead className="hidden lg:table-cell">Submitted</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => {
            const property = properties.find((p) => p.id === request.propertyId);
            return (
              <TableRow key={request.id}>
                <TableCell>
                  <div className="font-medium">{property?.title}</div>
                </TableCell>
                <TableCell>{request.issue}</TableCell>
                <TableCell className="hidden lg:table-cell">
                  {request.dateSubmitted}
                </TableCell>
                <TableCell>
                  <Badge className={getPriorityClasses(request.priority)}>
                     <AlertTriangle className="mr-1 h-3 w-3" />
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
                        <Link href={`/maintenance/${request.id}`} className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}>
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
    </CardContent>
  </Card>
);

export default function MaintenancePage() {
  const { user } = useCurrentUser();
  const [maintenanceRequests, setMaintenanceRequests] = useState(allMaintenanceRequests);

  useEffect(() => {
    const handleNewRequest = (newRequest: any) => {
        setMaintenanceRequests((prevRequests) => [...prevRequests, newRequest]);
        // Also update the global mock data for prototype consistency
        allMaintenanceRequests.push(newRequest);
    };

    const unsubscribe = eventBus.subscribe('maintenance-request-added', handleNewRequest);

    return () => {
        unsubscribe();
    };
  }, []);


  const myRequests = useMemo(() => {
    if (user && user.role === 'tenant') {
      return maintenanceRequests.filter(r => r.tenantId === user.id);
    }
    return [];
  }, [user, maintenanceRequests]);
  
  const myProperties = useMemo(() => {
    if (user && user.role === 'tenant') {
      const myTenantRecord = tenants.find(t => t.id === user.id);
      if (myTenantRecord) {
          // This logic would need to be more complex if a tenant can be associated with multiple properties.
          // For now, we assume a tenant is at one property.
          return properties.filter(p => p.id === myTenantRecord.propertyId);
      }
    }
    return [];
  },[user]);

  const handleAddRequest = async (newRequestData: any) => {
    if (!user) return;

    // Call the AI triage flow
    const triageResult = await triageMaintenanceRequest({
        title: newRequestData.issue,
        details: newRequestData.details,
    });

    const today = new Date();
    const formattedDate = today.getFullYear() + '-' + (today.getMonth() + 1).toString().padStart(2, '0') + '-' + today.getDate().toString().padStart(2, '0');

    const newRequest = {
        id: `maint-${allMaintenanceRequests.length + 1}`,
        tenantId: user.id,
        propertyId: newRequestData.propertyId,
        issue: newRequestData.issue,
        details: newRequestData.details,
        dateSubmitted: formattedDate,
        status: "New",
        priority: triageResult.priority, // Use AI suggested priority
        category: triageResult.category, // Use AI suggested category
        assignedWorkerId: null,
    };
    
    eventBus.emit('maintenance-request-added', newRequest);
  }

  if (!user) {
    return null; // or a loading indicator
  }


  const newRequests = myRequests.filter((r) => r.status === "New");
  const inProgressRequests = myRequests.filter(
    (r) => r.status === "In Progress"
  );
  const completedRequests = myRequests.filter(
    (r) => r.status === "Completed"
  );

  if (user.role !== 'tenant') {
      return (
          <div className="flex flex-col gap-6 items-center justify-center h-full">
            <div className="text-center">
              <h1 className="text-2xl font-bold">Access Denied</h1>
              <p className="text-muted-foreground">This page is only available to tenants.</p>
            </div>
          </div>
      )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="My Maintenance Requests"
        description="Track and manage your maintenance requests."
      >
        <AddTenantRequestDialog properties={myProperties} onAddRequest={handleAddRequest} />
      </PageHeader>
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="new">New</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          <MaintenanceTable requests={myRequests} />
        </TabsContent>
        <TabsContent value="new" className="mt-4">
          <MaintenanceTable requests={newRequests} />
        </TabsContent>
        <TabsContent value="in-progress" className="mt-4">
          <MaintenanceTable requests={inProgressRequests} />
        </TabsContent>
        <TabsContent value="completed" className="mt-4">
          <MaintenanceTable requests={completedRequests} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
