

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
import { Eye, Mail, Pencil, Trash2, CheckCircle, LogOut, Sparkle } from 'lucide-react';
import PageHeader from '@/components/page-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState, useEffect } from 'react';
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
import { Progress } from '@/components/ui/progress';
import { usePathname } from 'next/navigation';
import eventBus from '@/lib/events';

function getStatusClasses(status: string) {
  switch (status) {
    case 'Active':
      return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-700';
    case 'Moving Out':
      return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-700';
    case 'New':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-700';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}

function getStatusIcon(status: string) {
    switch (status) {
        case 'Active':
            return <CheckCircle className="mr-1 h-3 w-3" />;
        case 'Moving Out':
            return <LogOut className="mr-1 h-3 w-3" />;
        case 'New':
            return <Sparkle className="mr-1 h-3 w-3" />;
        default:
            return null;
    }
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState(allTenants);
  const [properties, setProperties] = useState(allProperties);
  const pathname = usePathname();
  const lang = pathname.split('/')[1];

  useEffect(() => {
    const handleTenantAdded = (newTenant: any) => {
      setTenants(prev => [...prev, newTenant]);
      allTenants.push(newTenant);
    };
    const handleTenantUpdated = (updatedTenant: any) => {
      setTenants(prev => prev.map(t => t.id === updatedTenant.id ? updatedTenant : t));
      const index = allTenants.findIndex(t => t.id === updatedTenant.id);
      if (index !== -1) allTenants[index] = updatedTenant;
    };
    const handleTenantDeleted = (tenantId: string) => {
      setTenants(prev => prev.filter(t => t.id !== tenantId));
      const index = allTenants.findIndex(t => t.id === tenantId);
      if (index !== -1) allTenants.splice(index, 1);
    };
    
    const unsubAdded = eventBus.subscribe('tenant-added', handleTenantAdded);
    const unsubUpdated = eventBus.subscribe('tenant-updated', handleTenantUpdated);
    const unsubDeleted = eventBus.subscribe('tenant-deleted', handleTenantDeleted);

    return () => {
      unsubAdded();
      unsubUpdated();
      unsubDeleted();
    };
  }, []);

  const handleAddTenant = (newTenantData: any) => {
    const newTenant = {
        id: `ten-${allTenants.length + 1}`,
        onboardingStatus: [
            { text: "Send welcome email", completed: false },
            { text: "Sign lease agreement", completed: false },
            { text: "Collect security deposit", completed: false },
            { text: "Hand over keys", completed: false },
        ],
        ...newTenantData,
      };
    eventBus.emit('tenant-added', newTenant);
  }
  
  const handleUpdateTenant = (updatedTenant: any) => {
    eventBus.emit('tenant-updated', updatedTenant);
  }

  const handleDeleteTenant = (tenantId: string) => {
    eventBus.emit('tenant-deleted', tenantId);
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
                // @ts-ignore
                const onboardingTasks = tenant.onboardingStatus || [];
                const completedTasks = onboardingTasks.filter((task: any) => task.completed).length;
                const onboardingProgress = onboardingTasks.length > 0 ? (completedTasks / onboardingTasks.length) * 100 : 100;

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
                      <div className="flex flex-col gap-2">
                        <Badge className={cn("justify-center", getStatusClasses(tenant.status))}>
                          {getStatusIcon(tenant.status)}
                          {tenant.status}
                        </Badge>
                        {tenant.status === 'New' && onboardingProgress < 100 && (
                           <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="w-24">
                                  <Progress value={onboardingProgress} className="h-1.5 bg-blue-200 [&>div]:bg-blue-600" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Onboarding: {completedTasks}/{onboardingTasks.length} steps completed</p>
                              </TooltipContent>
                            </Tooltip>
                           </TooltipProvider>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      ${tenant.rent.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link href={`/${lang}/tenants/${tenant.id}`} className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}>
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
