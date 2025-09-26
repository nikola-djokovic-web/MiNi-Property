
"use client";

import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { properties as allProperties, workers as allWorkers } from '@/lib/data';
import { Eye, Mail, Pencil, Trash2, UserCog, Building } from 'lucide-react';
import PageHeader from '@/components/page-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import Image from 'next/image';
import AddPropertyDialog from '@/components/properties/add-property-dialog';
import EditPropertyDialog from '@/components/properties/edit-property-dialog';
import DeletePropertyDialog from '@/components/properties/delete-property-dialog';
import { useNotifications } from '@/hooks/use-notifications';

export default function PropertiesManagementPage() {
  const [properties, setProperties] = useState(allProperties);
  const [workers, setWorkers] = useState(allWorkers);
  const { addNotification } = useNotifications();


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
  };
  
  const handleUpdateProperty = (updatedProperty: any) => {
    setProperties(properties.map(p => p.id === updatedProperty.id ? updatedProperty : p));
  }

  const handleDeleteProperty = (propertyId: string) => {
    setProperties(properties.filter(p => p.id !== propertyId));
  }

  const handleAssignWorker = (propertyId: string, workerId: string | null) => {
      setProperties(properties.map(p => {
        if (p.id === propertyId) {
            // If the worker is changing and it's a new worker
            if (p.assignedWorkerId !== workerId && workerId) {
                const worker = allWorkers.find(w => w.id === workerId);
                const property = allProperties.find(prop => prop.id === propertyId);
                if (worker && property) {
                     addNotification({
                        role: "worker",
                        icon: Building,
                        title: "New Property Assignment",
                        description: `You have been assigned to ${property.title}.`,
                    });
                }
            }
            return {...p, assignedWorkerId: workerId};
        }
        return p;
      }));
  }


  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Property Management" description="Manage all properties in your portfolio.">
        <AddPropertyDialog onAddProperty={handleAddProperty} />
      </PageHeader>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead className="hidden md:table-cell">
                  Address
                </TableHead>
                <TableHead>Assigned Worker</TableHead>
                <TableHead className="text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.map((property) => {
                const assignedWorker = property.assignedWorkerId ? workers.find(w => w.id === property.assignedWorkerId) : null;
                return (
                  <TableRow key={property.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Image
                            src={property.imageUrl}
                            alt={property.title}
                            width={64}
                            height={64}
                            className="hidden h-16 w-16 rounded-md object-cover sm:flex"
                            data-ai-hint={property.imageHint}
                        />
                        <div className="grid gap-0.5">
                          <span className="font-medium">{property.title}</span>
                           <span className="text-muted-foreground text-sm">{property.type}</span>
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
                                <Link href={`/workers/${assignedWorker.id}`} className="text-primary hover:underline">
                                    {assignedWorker.name}
                                </Link>
                            ) : 'Unassigned'}
                        </span>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-7">Change</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                <DropdownMenuLabel>Assign Worker</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {workers.map(worker => (
                                <DropdownMenuItem key={worker.id} onSelect={() => handleAssignWorker(property.id, worker.id)}>
                                    {worker.name}
                                </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={() => handleAssignWorker(property.id, null)}>
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
                          <DeletePropertyDialog property={property} onDelete={() => handleDeleteProperty(property.id)} />
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
