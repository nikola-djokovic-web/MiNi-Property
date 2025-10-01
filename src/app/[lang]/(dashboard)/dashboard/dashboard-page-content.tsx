

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
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import {
  Tooltip as ShadTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useMemo, useState, useEffect } from 'react';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import AddTenantRequestDialog from '@/components/maintenance/add-tenant-request-dialog';
import { triageMaintenanceRequest } from '@/ai/flows/triage-maintenance-request';
import PageHeader from '@/components/page-header';
import { Locale } from '@/i18n-config';
import { useTranslation } from '@/hooks/use-translation';
import eventBus from '@/lib/events';


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

interface DashboardPageContentProps {
    lang: Locale;
    chartData: {
        maintenance: any[];
        financial: any[];
    };
    maintenanceChartConfig: ChartConfig;
    financialChartConfig: ChartConfig;
    maintenanceRequestsInit: any[];
    overdueTenantsInit: any[];
    propertiesInit: any[];
    tenantsInit: any[];
    rentPaymentsInit: any[];
}

export default function DashboardPageContent({ 
    lang,
    chartData,
    maintenanceChartConfig,
    financialChartConfig,
    maintenanceRequestsInit,
    overdueTenantsInit,
    propertiesInit,
    tenantsInit,
    rentPaymentsInit,
}: DashboardPageContentProps) {
  const { dict } = useTranslation();
  const { user } = useCurrentUser();
  const [maintenanceRequests, setMaintenanceRequests] = useState(
    maintenanceRequestsInit
  );

  useEffect(() => {
    const handleNewRequest = (newRequest: any) => {
        setMaintenanceRequests((prevRequests) => [...prevRequests, newRequest]);
        // (removed mutation of global mock data)
    };

    const unsubscribe = eventBus.subscribe('maintenance-request-added', handleNewRequest);

    return () => {
        unsubscribe();
    };
  }, []);

  const {
    keyMetrics,
    filteredMaintenanceRequests,
    filteredOverdueTenants,
    myProperties
  } = useMemo(() => {
    let metrics = [];
    let filteredMaintenance = [];
    let filteredOverdue = overdueTenantsInit;
    let tenantProperties: typeof propertiesInit = [];

    if (!user) {
      return {
        keyMetrics: [],
        filteredMaintenanceRequests: [],
        filteredOverdueTenants: [],
        myProperties: [],
      };
    }

    if (user.role === 'admin') {
      metrics = [
        {
          title: dict.dashboard.totalProperties,
          value: propertiesInit.length.toString(),
          icon: <Building2 className="h-4 w-4 text-muted-foreground" />,
          change: '+5% from last month',
        },
        {
          title: dict.dashboard.totalTenants,
          value: tenantsInit.length.toString(),
          icon: <Users className="h-4 w-4 text-muted-foreground" />,
          change: '+10% from last month',
        },
        {
          title: dict.dashboard.occupancyRate,
          value: '92.5%',
          icon: <Users className="h-4 w-4 text-muted-foreground" />,
          change: '+2% from last month',
        },
        {
          title: dict.dashboard.monthlyRent,
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
      const workerTenants = tenantsInit.filter((t) =>
        workerProperties.includes(t.propertyId)
      );
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
      const openRequests = tenantRequests.filter(
        (r) => r.status !== 'Completed'
      );
      filteredMaintenance = tenantRequests.slice(0, 3);
      
      const myTenantRecord = tenantsInit.find(t => t.id === user.id);
      if (myTenantRecord) {
          tenantProperties = propertiesInit.filter(p => p.id === myTenantRecord.propertyId);
      }

      metrics = [
        {
          title: 'My Open Requests',
          value: openRequests.length.toString(),
          icon: <Wrench className="h-4 w-4 text-muted-foreground" />,
        },
        {
          title: 'My Documents',
          value: '3', // dummy data
          icon: <FileText className="h-4 w-4 text-muted-foreground" />,
        },
        {
          title: 'Rent Due',
          value: '$2,200', // dummy data
          icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
        },
      ];
      filteredOverdue = overdueTenantsInit.filter((t) => t.id === user.id);
    }

    return {
      keyMetrics: metrics,
      filteredMaintenanceRequests: filteredMaintenance,
      filteredOverdueTenants: filteredOverdue,
      myProperties: tenantProperties,
    };
  }, [user, maintenanceRequests, dict, overdueTenantsInit, propertiesInit, tenantsInit]);
  
  const handleAddRequest = async (newRequestData: any) => {
    if (!user) return;

    const triageResult = await triageMaintenanceRequest({
        title: newRequestData.issue,
        details: newRequestData.details,
    });

    const today = new Date();
    const formattedDate = today.getFullYear() + '-' + (today.getMonth() + 1).toString().padStart(2, '0') + '-' + today.getDate().toString().padStart(2, '0');
    
    const newRequest = {
        id: `maint-${maintenanceRequests.length + 1}`,
        tenantId: user.id,
        propertyId: newRequestData.propertyId,
        issue: newRequestData.issue,
        details: newRequestData.details,
        dateSubmitted: formattedDate,
        status: "New",
        priority: triageResult.priority, 
        category: triageResult.category,
        assignedWorkerId: null,
    };

    eventBus.emit('maintenance-request-added', newRequest);
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <PageHeader title={dict.dashboard.title} />
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
              {metric.change && (
                <p className="text-xs text-muted-foreground">
                  {metric.change}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
          {user.role === 'admin' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>{dict.dashboard.maintenanceOverview}</CardTitle>
                  <CardDescription>
                    {dict.dashboard.maintenanceDescription}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={maintenanceChartConfig}
                    className="aspect-video h-[250px] w-full"
                  >
                    <BarChart
                      accessibilityLayer
                      data={chartData.maintenance}
                      layout="horizontal"
                      margin={{ left: 10, right: 10 }}
                    >
                      <XAxis
                        dataKey="status"
                        type="category"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        tickFormatter={(value) => value}
                      />
                      <YAxis dataKey="requests" type="number" hide />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel />}
                      />
                      <Bar
                        dataKey="requests"
                        radius={5}
                        background={{ fill: 'hsl(var(--muted))', radius: 5 }}
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>{dict.dashboard.financialsTitle}</CardTitle>
                  <CardDescription>
                    {dict.dashboard.financialsDescription}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={financialChartConfig}
                    className="aspect-video h-[250px] w-full"
                  >
                    <BarChart
                      accessibilityLayer
                      data={chartData.financial}
                      margin={{ top: 20 }}
                    >
                      <XAxis
                        dataKey="name"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="dot" />}
                      />
                      <Bar
                        dataKey="amount"
                        radius={8}
                        background={{ fill: 'hsl(var(--muted))', radius: 8 }}
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          )}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                 <CardTitle>{dict.dashboard.recentMaintenance}</CardTitle>
                 <CardDescription>
                    {user.role === 'tenant'
                      ? dict.dashboard.recentMaintenanceDescriptionTenant
                      : dict.dashboard.recentMaintenanceDescriptionAdmin}
                  </CardDescription>
              </div>
               {user.role === 'tenant' && (
                    <AddTenantRequestDialog properties={myProperties} onAddRequest={handleAddRequest} />
                )}
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
                    const tenant = tenantsInit.find(
                      (t) => t.id === request.tenantId
                    );
                    const property = propertiesInit.find(
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
                            <ShadTooltip>
                              <TooltipTrigger asChild>
                                <Link
                                  href={`/${lang}/maintenance/${request.id}`}
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
                            </ShadTooltip>
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
              <CardTitle>{dict.dashboard.overduePayments}</CardTitle>
              <CardDescription>
                {dict.dashboard.overduePaymentsDescription}
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
