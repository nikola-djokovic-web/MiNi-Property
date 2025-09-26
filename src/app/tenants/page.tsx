
'use client';

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
import { Badge } from '@/components/ui/badge';
import { tenants as allTenants, properties as allProperties } from '@/lib/data';
import { Eye, Mail, Pencil, Trash2 } from 'lucide-react';
import PageHeader from '@/components/page-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState } from 'react';
import AddTenantDialog from '@/components/tenants/add-tenant-dialog';
import EditTenantDialog from '@/components/tenants/edit-tenant-dialog';
import SendMessageDialog from '@/components/tenants/send-message-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import DeleteUserDialog from '@/components/workers/delete-user-dialog';


function getStatusVariant(status: string) {
  switch (status) {
    case 'Active':
      return 'default';
    case 'Moving Out':
      return 'destructive';
    case 'New':
      return 'secondary';
    default:
      return 'outline';
  }
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState(allTenants);
  const [properties, setProperties] = useState(allProperties);

  const handleAddTenant = (newTenant: any) => {
    setTenants([
      ...tenants,
      {
        id: `ten-${tenants.length + 1}`,
        ...newTenant,
      }
    ]);
  }
  
  const handleUpdateTenant = (updatedTenant: any) => {
    setTenants(tenants.map(t => t.id === updatedTenant.id ? updatedTenant : t));
  }

  const handleDeleteTenant = (tenantId: string) => {
    // Soft delete: filter out the tenant from the list
    setTenants(tenants.filter(t => t.id !== tenantId));
  }


  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Tenants" description="View and manage your tenants.">
        <AddTenantDialog properties={properties} onAddTenant={handleAddTenant} />
      </PageHeader>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">
                  Property
                </TableHead>
                <TableHead className="hidden lg:table-cell">
                  Lease End Date
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">
                  Monthly Rent
                </TableHead>
                <TableHead className="text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant) => {
                const property = properties.find(
                  (p) => p.id === tenant.propertyId
                );
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
                            {tenant.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="grid gap-0.5">
                          <span className="font-medium">{tenant.name}</span>
                           <span className="text-muted-foreground text-sm">{tenant.email}</span>
                          <span className="text-muted-foreground md:hidden">
                            {property?.title}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {property?.title}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {tenant.leaseEndDate}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(tenant.status)}>
                        {tenant.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      ${tenant.rent.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link href={`/tenants/${tenant.id}`} className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}>
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

                          <DeleteUserDialog user={tenant} userType="tenant" onDelete={() => handleDeleteTenant(tenant.id)} />

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
