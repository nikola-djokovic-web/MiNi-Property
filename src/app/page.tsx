
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import {
  Building2,
  DollarSign,
  Users,
  Eye,
  Wrench,
  FileText,
} from 'lucide-react';
import {
  maintenanceRequests as allMaintenanceRequests,
  overdueTenants,
  properties,
  tenants,
} from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useMemo, useState } from 'react';

function getStatusClasses(status: string) {
  switch (status) {
    case 'New':
      return 'bg-gray-500 text-gray-foreground hover:bg-gray-500/80';
    case 'In Progress':
      return 'bg-yellow-500 text-yellow-foreground hover:bg-yellow-500/80';
    case 'Completed':
      return 'bg-green-600 text-green-foreground hover:bg-green-600/80';
    default:
      return 'bg-secondary text-secondary-foreground';
  }
}

export default function Dashboard() {
  const { user } = useCurrentUser();
  const [maintenanceRequests, setMaintenanceRequests] = useState(allMaintenanceRequests);

  const {
    keyMetrics,
    filteredMaintenanceRequests,
    filteredOverdueTenants,
  } = useMemo(() => {
    let metrics = [];
    let filteredMaintenance = [];
    let filteredOverdue = overdueTenants;

    if (user.role === 'admin') {
      metrics = [
        {
          title: 'Total Properties',
          value: properties.length.toString(),
          icon: <Building2 className="h-4 w-4 text-muted-foreground" />,
          change: '+5% from last month',
        },
        {
          title: 'Total Tenants',
          value: tenants.length.toString(),
          icon: <Users className="h-4 w-4 text-muted-foreground" />,
          change: '+10% from last month',
        },
        {
          title: 'Occupancy Rate',
          value: '92.5%',
          icon: <Users className="h-4 w-4 text-muted-foreground" />,
          change: '+2% from last month',
        },
        {
          title: 'Monthly Rent',
          value: '$68,500',
          icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
          change: '+3.2% from last month',
        },
      ];
      filteredMaintenance = maintenanceRequests
        .filter((r) => r.status === 'New' || r.status === 'In Progress')
        .slice(0, 3);
    } else if (user.role === 'worker') {
      const workerProperties = user.assignedPropertyIds || [];
      const workerTenants = tenants.filter(t => workerProperties.includes(t.propertyId));
      filteredMaintenance = maintenanceRequests.filter(
        (r) => r.assignedWorkerId === user.id && r.status !== 'Completed'
      );
      metrics = [
        {
          title: 'Assigned Properties',
          value: workerProperties.length.toString(),
          icon: <Building2 className="h-4 w-4 text-muted-foreground" />,
        },
        {
          title: 'Tenants in Properties',
          value: workerTenants.length.toString(),
          icon: <Users className="h-4 w-4 text-muted-foreground" />,
        },
        {
          title: 'Open Tasks',
          value: filteredMaintenance.length.toString(),
          icon: <Wrench className="h-4 w-4 text-muted-foreground" />,
        },
      ];
    } else if (user.role === 'tenant') {
       const tenantRequests = maintenanceRequests.filter(
        (r) => r.tenantId === user.id
      );
      const openRequests = tenantRequests.filter(r => r.status !== 'Completed');
      filteredMaintenance = tenantRequests.slice(0,3);

      metrics = [
         {
          title: 'My Open Requests',
          value: openRequests.length.toString(),
          icon: <Wrench className="h-4 w-4 text-muted-foreground" />,
        },
        {
          title: 'My Documents',
          value: "3", // dummy data
          icon: <FileText className="h-4 w-4 text-muted-foreground" />,
        },
        {
          title: 'Rent Due',
          value: '$2,200', // dummy data
          icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
        },
      ];
      filteredOverdue = overdueTenants.filter(t => t.id === user.id);
    }

    return {
      keyMetrics: metrics,
      filteredMaintenanceRequests: filteredMaintenance,
      filteredOverdueTenants: filteredOverdue,
    };
  }, [user, maintenanceRequests]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        {keyMetrics.map((metric) => (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
              {metric.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              {metric.change && <p className="text-xs text-muted-foreground">{metric.change}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Maintenance Requests</CardTitle>
              <CardDescription>
                {user.role === 'tenant' ? 'Your recent requests.' : 'New and in-progress maintenance issues.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Issue</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMaintenanceRequests.map((request) => {
                    const tenant = tenants.find(
                      (t) => t.id === request.tenantId
                    );
                    const property = properties.find(
                      (p) => p.id === request.propertyId
                    );
                    return (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div className="font-medium">{tenant?.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {property?.title}
                          </div>
                        </TableCell>
                        <TableCell>{request.issue}</TableCell>
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
                                  href={`/maintenance/${request.id}`}
                                  className={cn(
                                    buttonVariants({
                                      variant: 'ghost',
                                      size: 'icon',
                                    })
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
            </CardContent>
          </Card>
        </div>
        {user.role === 'admin' && (
          <Card>
            <CardHeader>
              <CardTitle>Overdue Payments</CardTitle>
              <CardDescription>
                Tenants with outstanding rent payments.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-8">
              {filteredOverdueTenants.map((tenant) => (
                <div key={tenant.id} className="flex items-center gap-4">
                  <Avatar className="hidden h-9 w-9 sm:flex">
                    <AvatarImage
                      src={`https://i.pravatar.cc/150?u=${tenant.id}`}
                      alt={tenant.name}
                    />
                    <AvatarFallback>{tenant.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="grid gap-1">
                    <p className="text-sm font-medium leading-none">
                      {tenant.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {/* This assumes overdueTenants has property info */}
                      {/* @ts-ignore */}
                      {tenant.property}
                    </p>
                  </div>
                  <div className="ml-auto font-medium text-destructive">
                     {/* @ts-ignore */}
                    {tenant.amount}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
