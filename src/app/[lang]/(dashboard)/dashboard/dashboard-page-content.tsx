"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Eye, Users, Home, TrendingUp, DollarSign } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import PageHeader from "@/components/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AddTenantRequestDialog from "@/components/maintenance/add-tenant-request-dialog";
import { BarChart, Bar, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Tooltip as ShadTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface DashboardPageContentProps {
  lang: string;
  chartData?: any;
  maintenanceChartConfig?: any;
  financialChartConfig?: any;
  tenantsInit: Array<any>;
  propertiesInit: Array<any>;
  maintenanceRequestsInit: Array<any>;
  overdueTenantsInit?: Array<any>;
  rentPaymentsInit?: Array<any>;
}

export default function DashboardPageContent({
  lang,
  chartData: passedChartData,
  maintenanceChartConfig: passedMaintenanceChartConfig,
  financialChartConfig: passedFinancialChartConfig,
  tenantsInit,
  propertiesInit,
  maintenanceRequestsInit,
  ...otherProps
}: DashboardPageContentProps) {
  const { user } = useCurrentUser();
  const [maintenanceRequests, setMaintenanceRequests] = useState(maintenanceRequestsInit);
  const [properties, setProperties] = useState(propertiesInit);
  const [tenants, setTenants] = useState(tenantsInit);
  const [isLoading, setIsLoading] = useState(false);

  // Safely extract lang with fallback
  const safeLang = lang || 'en';

  // Determine effective user with better debugging
  const effectiveUser = user;
  
  console.log('🔍 Dashboard user context:', {
    user: effectiveUser,
    role: effectiveUser?.role,
    id: effectiveUser?.id,
    isAuthenticated: !!effectiveUser
  });

  // If no initial data, fetch client-side
  useEffect(() => {
    if (maintenanceRequestsInit.length === 0 || propertiesInit.length === 0 || tenantsInit.length === 0) {
      console.log('🔄 Dashboard client-side fallback - fetching data...');
      setIsLoading(true);
      
      const TENANT_ID = process.env.NEXT_PUBLIC_DEMO_TENANT_ID ?? "";
      
      const fetchData = async () => {
        try {
          // Build API URLs with role-based filtering parameters
          const maintenanceUrl = effectiveUser 
            ? `/api/maintenance-requests?userRole=${effectiveUser.role}&userId=${effectiveUser.id}`
            : "/api/maintenance-requests";
          const propertiesUrl = effectiveUser 
            ? `/api/properties?userRole=${effectiveUser.role}&userId=${effectiveUser.id}`
            : "/api/properties";
          
          const [maintenanceRes, propertiesRes, tenantsRes] = await Promise.all([
            fetch(maintenanceUrl, {
              headers: { "x-tenant-id": TENANT_ID },
            }).then(res => res.json()),
            fetch(propertiesUrl, {
              headers: { "x-tenant-id": TENANT_ID },
            }).then(res => res.json()),
            fetch('/api/tenants', {
              headers: { "x-tenant-id": TENANT_ID },
            }).then(res => res.json()),
          ]);
          
          console.log('✅ Dashboard client-side data fetched:', {
            maintenanceRequests: (maintenanceRes.data || []).length,
            properties: (propertiesRes.data || []).length,
            tenants: (tenantsRes.data || []).length,
            userRole: effectiveUser?.role,
            userId: effectiveUser?.id
          });
          
          setMaintenanceRequests(maintenanceRes.data || []);
          setProperties(propertiesRes.data || []);
          setTenants(tenantsRes.data || []);
        } catch (error) {
          console.error('❌ Dashboard client-side fetch failed:', error);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchData();
    }
  }, [maintenanceRequestsInit.length, propertiesInit.length, tenantsInit.length, effectiveUser]);
  
  console.log('📋 Raw maintenance requests:', {
    total: maintenanceRequests.length,
    sample: maintenanceRequests.slice(0, 3).map(r => ({ 
      id: r.id, 
      issue: r.issue, 
      status: r.status,
      tenantId: r.tenantId 
    }))
  });

  // Since we're now filtering on the backend, just use the data directly with limit
  const filteredMaintenanceRequests = maintenanceRequests.slice(0, 5); // Show only first 5 requests

  console.log('📊 Final Dashboard maintenance requests:', {
    totalAvailable: maintenanceRequests.length,
    filteredCount: filteredMaintenanceRequests.length,
    userRole: effectiveUser?.role || 'NO_USER',
    userId: effectiveUser?.id || 'NO_ID',
    finalRequests: filteredMaintenanceRequests.map(r => ({ 
      id: r.id, 
      issue: r.issue,
      status: r.status
    }))
  });

  // Since we're now filtering on the backend, just use the data directly
  const myProperties = properties;

  // Calculate key metrics using dynamic data
  const totalProperties = properties.length;
  const totalTenants = tenants.length;
  const occupiedProperties = properties.filter(p => p.tenantId).length;
  const occupancyRate = totalProperties > 0 ? Math.round((occupiedProperties / totalProperties) * 100) : 0;
  const totalRent = properties.reduce((sum, property) => sum + (property.rent || 0), 0);

  const keyMetrics = [
    {
      title: dict.dashboard.totalProperties,
      value: totalProperties.toString(),
      icon: <Home className="h-4 w-4 text-muted-foreground" />,
      change: "+2.1% from last month",
    },
    {
      title: dict.dashboard.totalTenants,
      value: totalTenants.toString(),
      icon: <Users className="h-4 w-4 text-muted-foreground" />,
      change: "+4.3% from last month",
    },
    {
      title: dict.dashboard.occupancyRate,
      value: `${occupancyRate}%`,
      icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />,
      change: "+1.2% from last month",
    },
    {
      title: dict.dashboard.monthlyRent,
      value: `$${totalRent.toLocaleString()}`,
      icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
      change: "+5.4% from last month",
    },
  ];

  // Use passed chart data and configs, with fallbacks
  const chartData = passedChartData || {
    maintenance: [
      { status: "Open", requests: maintenanceRequests.filter(r => r.status === "Open").length, fill: "var(--color-new)" },
      { status: "In Progress", requests: maintenanceRequests.filter(r => r.status === "In Progress").length, fill: "var(--color-inProgress)" },
      { status: "Completed", requests: maintenanceRequests.filter(r => r.status === "Completed").length, fill: "var(--color-completed)" },
    ],
    financial: [
      { name: "Jan", amount: 4000, fill: "var(--color-paid)" },
      { name: "Feb", amount: 3000, fill: "var(--color-paid)" },
      { name: "Mar", amount: 5000, fill: "var(--color-paid)" },
      { name: "Apr", amount: 4500, fill: "var(--color-paid)" },
      { name: "May", amount: 6000, fill: "var(--color-paid)" },
      { name: "Jun", amount: 5500, fill: "var(--color-paid)" },
    ],
  };

  const maintenanceChartConfig = passedMaintenanceChartConfig || {
    requests: {
      label: "Requests",
    },
    new: {
      label: "New",
      color: "hsl(var(--chart-1))",
    },
    inProgress: {
      label: "In Progress", 
      color: "hsl(var(--chart-2))",
    },
    completed: {
      label: "Completed",
      color: "hsl(var(--chart-3))",
    },
  };

  const financialChartConfig = passedFinancialChartConfig || {
    amount: {
      label: "Amount",
    },
    paid: {
      label: "Paid",
      color: "hsl(var(--chart-2))",
    },
    overdue: {
      label: "Overdue",
      color: "hsl(var(--chart-5))",
    },
  };

  // Mock overdue tenants data
  const filteredOverdueTenants = [
    { id: "1", name: "John Doe", property: "Sunset Apartments", amount: "$1,200" },
    { id: "2", name: "Jane Smith", property: "Ocean View", amount: "$850" },
  ];

  const getStatusClasses = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "In Progress":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "Completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const handleAddRequest = async (requestData: any) => {
    try {
      const response = await fetch('/api/maintenance-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error('Failed to create maintenance request');
      }

      const newRequest = await response.json();
      setMaintenanceRequests(prev => [newRequest, ...prev]);
    } catch (error) {
      console.error('Dashboard error creating maintenance request:', error);
      throw error;
    }
  };

  // For debugging: Don't block on user, show data anyway
  // if (!effectiveUser) {
  //   console.log('⚠️ No user context found, showing loading state');
  //   return (
  //     <div className="flex items-center justify-center p-8">
  //       <div className="text-center">
  //         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
  //         <p className="text-muted-foreground">Loading user context...</p>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="space-y-6">
      <PageHeader title={dict.dashboard.title} />
      
      {/* Metrics Cards */}
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
                <p className="text-xs text-muted-foreground">{metric.change}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid - Maintenance Requests First */}
      <div className="grid gap-4 md:gap-8 lg:grid-cols-4">
        {/* Recent Maintenance Requests - Takes 3/4 width for full table display */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{dict.dashboard.recentMaintenance}</CardTitle>
              <CardDescription>
                {effectiveUser?.role === "tenant"
                  ? dict.dashboard.recentMaintenanceDescriptionTenant
                  : dict.dashboard.recentMaintenanceDescriptionAdmin}
              </CardDescription>
            </div>
            {effectiveUser?.role === "tenant" && (
              <AddTenantRequestDialog
                properties={myProperties}
                onAddRequest={handleAddRequest}
              />
            )}
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {effectiveUser?.role !== "tenant" && <TableHead>Tenant</TableHead>}
                  <TableHead>Issue</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell 
                      colSpan={effectiveUser?.role !== "tenant" ? 4 : 3} 
                      className="text-center py-8 text-muted-foreground"
                    >
                      Loading maintenance requests...
                    </TableCell>
                  </TableRow>
                ) : filteredMaintenanceRequests.length === 0 ? (
                  <TableRow>
                    <TableCell 
                      colSpan={effectiveUser?.role !== "tenant" ? 4 : 3} 
                      className="text-center py-8 text-muted-foreground"
                    >
                      No maintenance requests found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMaintenanceRequests.map((request) => {
                  const property = properties.find(
                    (p) => p.id === request.propertyId
                  );
                  return (
                    <TableRow key={request.id}>
                      {effectiveUser?.role !== "tenant" && (
                        <TableCell>
                          <div className="font-medium">
                            {request.tenant?.name === 'Demo Co' ? 'Test Tenant' : `Resident of ${request.tenant?.name || 'Unknown Property'}`}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {property?.title || property?.name}
                          </div>
                        </TableCell>
                      )}
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
                                href={`/${safeLang}/maintenance/${request.id}`}
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
                          </ShadTooltip>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  );
                })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Overdue Payments Sidebar - Takes 1/4 width */}
        {effectiveUser?.role === "admin" && (
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
                      alt={tenant?.name ?? "Tenant"}
                    />
                    <AvatarFallback>{tenant?.name?.charAt(0) ?? "?"}</AvatarFallback>
                  </Avatar>
                  <div className="grid gap-1">
                    <p className="text-sm font-medium leading-none">
                      {tenant.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {tenant.property}
                    </p>
                  </div>
                  <div className="ml-auto font-medium text-destructive">
                    {tenant.amount}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Charts Section - Full width below for admin */}
      {effectiveUser?.role === "admin" && (
        <div className="grid gap-4 sm:grid-cols-2 mt-6">
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
                    background={{ fill: "hsl(var(--muted))", radius: 5 }}
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
                    background={{ fill: "hsl(var(--muted))", radius: 8 }}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function useTranslation(): { dict: any } {
  const dict = {
    dashboard: {
      title: "Dashboard",
      totalProperties: "Total Properties",
      totalTenants: "Total Tenants",
      occupancyRate: "Occupancy Rate",
      monthlyRent: "Monthly Rent",
      maintenanceOverview: "Maintenance Overview",
      maintenanceDescription: "Overview of maintenance requests.",
      financialsTitle: "Financial Overview",
      financialsDescription: "Overview of financial performance.",
      recentMaintenance: "Recent Maintenance Requests",
      recentMaintenanceDescriptionTenant: "Your recent maintenance requests.",
      recentMaintenanceDescriptionAdmin: "Recent maintenance requests overview.",
      overduePayments: "Overdue Payments",
      overduePaymentsDescription: "List of tenants with overdue payments.",
    },
  };

  return { dict };
}

const { dict } = useTranslation();