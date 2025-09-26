

"use client";
import Image from "next/image";
import Link from 'next/link';
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
import { properties as allProperties, maintenanceRequests as allMaintenanceRequests, workers, tenants } from "@/lib/data";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
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

const MaintenanceTable = ({ requests }: { requests: (typeof allMaintenanceRequests)}) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tenant</TableHead>
          <TableHead>Issue</TableHead>
          <TableHead className="hidden lg:table-cell">Submitted</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
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
);


export default function PropertiesPage() {
  const [properties, setProperties] = useState(allProperties);
  const [maintenanceRequests, setMaintenanceRequests] = useState(allMaintenanceRequests);
  const { user } = useCurrentUser();
  const { addNotification } = useNotifications();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  const handleAddProperty = (newProperty: any) => {
    const newProp = {
      id: `prop-${properties.length + 1}`,
      ...newProperty,
      assignedWorkerId: null,
    };
    setProperties([
      ...properties,
      newProp,
    ]);
    setSelectedPropertyId(newProp.id);
  };
  
  const handleAssignWorker = (propertyId: string, workerId: string | null) => {
      setProperties(properties.map(p => p.id === propertyId ? {...p, assignedWorkerId: workerId} : p));
  }

  const handleAddRequest = (newRequest: any) => {
    const today = new Date();
    const formattedDate = today.getFullYear() + '-' + (today.getMonth() + 1).toString().padStart(2, '0') + '-' + today.getDate().toString().padStart(2, '0');

    const fullRequest = {
        id: `maint-${maintenanceRequests.length + 1}`,
        ...newRequest,
        dateSubmitted: formattedDate,
        status: newRequest.assignedWorkerId ? "In Progress" : "New",
    };

    setMaintenanceRequests([
        ...maintenanceRequests,
        fullRequest
    ]);

    const property = properties.find(p => p.id === newRequest.propertyId);

    // Notify admin
    addNotification({
        role: "admin",
        icon: Wrench,
        title: "New Maintenance Request",
        description: `${newRequest.issue} reported for ${property?.title}.`
    });

    // Notify worker if assigned
    if (newRequest.assignedWorkerId) {
        const worker = workers.find(w => w.id === newRequest.assignedWorkerId);
        if (worker) {
            addNotification({
                role: 'worker',
                icon: Wrench,
                title: "New Assignment",
                description: `You've been assigned: "${newRequest.issue}" at ${property?.title}.`
            });
        }
    }
  }


  const filteredProperties = useMemo(() => {
    if (user.role === 'admin') {
      return properties;
    }
    if (user.role === 'worker') {
      return properties.filter(p => user.assignedPropertyIds?.includes(p.id) || p.assignedWorkerId === user.id);
    }
    if (user.role === 'tenant') {
        const tenantPropertyIds = tenants.filter(t => t.id === user.id).map(t => t.propertyId);
        return properties.filter(p => tenantPropertyIds.includes(p.id));
    }
    return [];
  }, [user, properties]);

  useEffect(() => {
    if (filteredProperties.length > 0 && !selectedPropertyId) {
      setSelectedPropertyId(filteredProperties[0].id);
    } else if (filteredProperties.length > 0 && selectedPropertyId && !filteredProperties.find(p => p.id === selectedPropertyId)) {
      setSelectedPropertyId(filteredProperties[0].id);
    } else if (filteredProperties.length === 0) {
      setSelectedPropertyId(null);
    }
  }, [filteredProperties, selectedPropertyId]);


  const selectedProperty = useMemo(() => {
    return filteredProperties.find(p => p.id === selectedPropertyId) || null;
  }, [selectedPropertyId, filteredProperties]);

  const selectedMaintenanceRequests = useMemo(() => {
    if (!selectedProperty) return [];
    return maintenanceRequests.filter(req => req.propertyId === selectedProperty.id);
  }, [selectedProperty, maintenanceRequests]);

  const assignedWorker = useMemo(() => {
    if (!selectedProperty?.assignedWorkerId) return null;
    return workers.find(w => w.id === selectedProperty.assignedWorkerId);
  }, [selectedProperty]);

  const tenantsForSelectedProperty = useMemo(() => {
    if (!selectedProperty) return [];
    return tenants.filter(t => t.propertyId === selectedProperty.id);
  }, [selectedProperty]);


  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Properties & Maintenance"
        description="Manage your properties and their maintenance requests."
      >
        {user.role === 'admin' && <Button asChild><Link href="/properties/management"><Settings className="mr-2 h-4" />Manage Properties</Link></Button>}
      </PageHeader>
      
      {filteredProperties.length > 0 ? (
        <div className="space-y-6">
           <Tabs value={selectedPropertyId || ''} onValueChange={setSelectedPropertyId} className="w-full">
            <Carousel
              opts={{
                align: "start",
                dragFree: true,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-4">
                {filteredProperties.map((property) => {
                  const requestCount = maintenanceRequests.filter(
                    (req) => req.propertyId === property.id
                  ).length;
                  return (
                    <CarouselItem
                      key={property.id}
                      className="pl-4 basis-auto"
                    >
                      <button
                        role="tab"
                        aria-selected={selectedPropertyId === property.id}
                        data-state={selectedPropertyId === property.id ? 'active' : 'inactive'}
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
                            <Badge
                              variant="default"
                              className="bg-primary"
                            >
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
          
            {filteredProperties.map(property => (
              <TabsContent key={property.id} value={property.id} className="mt-0 w-full">
                <Card className="overflow-hidden">
                  <CardHeader className="flex flex-col items-start gap-4 bg-muted/20 p-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                       <Dialog>
                          <DialogTrigger asChild>
                            <button className="relative aspect-video h-20 w-32 flex-shrink-0 overflow-hidden rounded-md">
                                <Image
                                  src={property.imageUrl}
                                  alt={property.title}
                                  fill
                                  className="object-cover"
                                  data-ai-hint={property.imageHint}
                                />
                            </button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl">
                               <Image
                                  src={property.imageUrl}
                                  alt={property.title}
                                  width={1200}
                                  height={800}
                                  className="rounded-md object-contain"
                                />
                          </DialogContent>
                       </Dialog>
                       <div>
                          <CardTitle className="mb-1 text-xl">{property.title}</CardTitle>
                          <CardDescription>{property.address}</CardDescription>
                       </div>
                    </div>
                     <div className="flex items-center gap-2 text-sm">
                          <UserCog className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            Assigned to: {assignedWorker ? (
                                <Link href={`/workers/${assignedWorker.id}`} className="text-primary hover:underline">
                                    {assignedWorker.name}
                                </Link>
                            ) : 'Unassigned'}
                          </span>
                          {user.role === 'admin' && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="sm">Change</Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                  <DropdownMenuLabel>Assign Worker</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  {workers.map(worker => (
                                    <DropdownMenuItem key={worker.id} onSelect={() => handleAssignWorker(property.id, worker.id)}>
                                        {worker.name}
                                    </DropdownMenuItem>
                                  ))}
                                  <DropdownMenuItem onSelect={() => handleAssignWorker(property.id, null)}>
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
                          Maintenance Requests ({selectedMaintenanceRequests.length})
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
                            <MaintenanceTable requests={selectedMaintenanceRequests} />
                        ) : (
                            <p className="text-sm text-muted-foreground">No maintenance requests for this property.</p>
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
                <p className="text-center text-muted-foreground">No properties assigned to your account.</p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
    
    

    


