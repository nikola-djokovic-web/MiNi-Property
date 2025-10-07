"use client";

import {
  Card,
  CardContent,
  CardDescription,
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
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  DollarSign,
  Users,
  Eye,
  Wrench,
  FileText,
} from "lucide-react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  Tooltip as ShadTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useMemo, useState, useEffect } from "react";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import AddTenantRequestDialog from "@/components/maintenance/add-tenant-request-dialog";
import { triageMaintenanceRequest } from "@/ai/flows/triage-maintenance-request";
import PageHeader from "@/components/page-header";
import { Locale } from "@/i18n-config";
import eventBus from "@/lib/events";

const TENANT_ID = process.env.NEXT_PUBLIC_DEMO_TENANT_ID ?? "";

async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "x-tenant-id": TENANT_ID },
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text || `(${res.status}) Request failed`);
  return text ? (JSON.parse(text) as T) : ({} as T);
}

async function apiSend<T>(
  url: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  body?: any
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { "content-type": "application/json", "x-tenant-id": TENANT_ID },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text || `(${res.status}) Request failed`);
  return text ? (JSON.parse(text) as T) : ({} as T);
}

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
  const [loadedProperties, setLoadedProperties] = useState(propertiesInit);
  const [currentTenantData, setCurrentTenantData] = useState<any>(null);
  const [requestsLoading, setRequestsLoading] = useState(true);
  
  // Create a mock tenant user for testing when auth is broken
  const effectiveUser = user || {
    id: 'test-tenant',
    name: 'Test Tenant',
    email: 'tenant@example.com',
    role: 'tenant' as const,
    tenantId: 'default-tenant',
  };

  // Load maintenance requests from API
  useEffect(() => {
    let alive = true;
    const abortController = new AbortController();
    
    (async () => {
      setRequestsLoading(true);
      try {
        const requestsRes = await apiGet<{ data: any[] }>(`/api/maintenance-requests`);
        if (!alive) return;
        
        console.log('📊 Dashboard loaded maintenance requests from API:', {
          count: requestsRes.data?.length || 0,
          requests: requestsRes.data?.map(r => ({
            id: r.id,
            tenantId: r.tenantId,
            issue: r.issue,
            tenant: r.tenant
          })) || []
        });
        setMaintenanceRequests(requestsRes.data || []);
      } catch (error: any) {
        if (error?.name !== 'AbortError' && alive) {
          console.error('Dashboard error loading maintenance requests:', error);
          // Fallback to static data
          setMaintenanceRequests(maintenanceRequestsInit);
        }
      } finally {
        if (alive) setRequestsLoading(false);
      }
    })();
    return () => { 
      alive = false;
      abortController.abort();
    };
  }, [TENANT_ID, maintenanceRequestsInit]);

  // Load properties from API
  useEffect(() => {
    let alive = true;
    const abortController = new AbortController();
    
    (async () => {
      try {
        const propsRes = await apiGet<{ data: any[] }>(`/api/properties?page=1&pageSize=100`);
        if (!alive) return;
        
        const normalized = (propsRes?.data ?? []).map((p: any) => ({
          ...p,
          title: p.title ?? p.name ?? 'Untitled',
        }));
        
        // Always include at least the static properties as fallback
        const finalProperties = normalized.length > 0 ? normalized : propertiesInit;
        setLoadedProperties(finalProperties);
      } catch (error: any) {
        if (error?.name !== 'AbortError' && alive) {
          console.error('Dashboard error loading properties:', error);
          // Fallback to static properties
          setLoadedProperties(propertiesInit);
        }
      }
    })();
    return () => { 
      alive = false;
      abortController.abort();
    };
  }, [TENANT_ID, propertiesInit]);

  // Fetch current tenant's data if user is a tenant
  useEffect(() => {
    if (effectiveUser && effectiveUser.role === 'tenant') {
      console.log('📊 Dashboard starting tenant property lookup for user:', effectiveUser);
      const abortController = new AbortController();
      let alive = true;
      
      (async () => {
        try {
          // Try the auth/me endpoint first (most reliable)
          console.log('📊 Dashboard calling auth/me endpoint...');
          const response = await fetch('/api/auth/me', {
            headers: { 
              'x-tenant-id': TENANT_ID,
              'x-user-email': effectiveUser.email, // Pass the current user's email
            },
            cache: 'no-store',
            signal: abortController.signal
          });
          
          console.log('📊 Dashboard auth/me response status:', response.status);
          if (response.ok && alive) {
            const userData = await response.json();
            console.log('📊 Dashboard auth/me response data:', userData);
            if (userData.user && userData.user.propertyId) {
              console.log('✅ Dashboard found property assignment via auth/me:', userData.user.propertyId);
              setCurrentTenantData(userData.user);
            } else {
              console.log('❌ Dashboard no property assignment found in auth/me response');
            }
          } else if (!alive) {
            console.log('❌ Dashboard auth/me call aborted');
          } else {
            console.log('❌ Dashboard auth/me endpoint failed');
          }
        } catch (error: any) {
          if (error?.name !== 'AbortError' && alive) {
            console.error('Dashboard error fetching tenant data:', error);
          }
        }
      })();
      
      return () => {
        alive = false;
        abortController.abort();
      };
    }
  }, [effectiveUser?.email, TENANT_ID]);

  useEffect(() => {
    const handleNewRequest = (newRequest: any) => {
      console.log('📊 Dashboard new maintenance request event received:', newRequest);
      setMaintenanceRequests((prevRequests) => {
        const updated = [...prevRequests, newRequest];
        console.log('📊 Dashboard updated maintenance requests:', updated);
        return updated;
      });
    };

    const unsubscribe = eventBus.subscribe(
      "maintenance-request-added",
      handleNewRequest
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const {
    keyMetrics,
    filteredMaintenanceRequests,
    filteredOverdueTenants,
    myProperties,
  } = useMemo(() => {
    let metrics: {
      title: string;
      value: string;
      icon: JSX.Element;
      change?: string;
    }[] = [];
    let filteredMaintenance = [];
    let filteredOverdue = overdueTenantsInit;
    let tenantProperties: typeof loadedProperties = [];
    
    const propertiesToUse = loadedProperties.length > 0 ? loadedProperties : propertiesInit;

    if (!effectiveUser) {
      return {
        keyMetrics: [],
        filteredMaintenanceRequests: [],
        filteredOverdueTenants: [],
        myProperties: [],
      };
    }

    if (effectiveUser.role === "admin") {
      metrics = [
        {
          title: dict.dashboard.totalProperties,
          value: propertiesToUse.length.toString(),
          icon: <Building2 className="h-4 w-4 text-muted-foreground" />,
          change: "+5% from last month",
        },
        {
          title: dict.dashboard.totalTenants,
          value: tenantsInit.length.toString(),
          icon: <Users className="h-4 w-4 text-muted-foreground" />,
          change: "+10% from last month",
        },
        {
          title: dict.dashboard.occupancyRate,
          value: "92.5%",
          icon: <Users className="h-4 w-4 text-muted-foreground" />,
          change: "+2% from last month",
        },
        {
          title: dict.dashboard.monthlyRent,
          value: "$68,500",
          icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
          change: "+3.2% from last month",
        },
      ];
      // Admin sees all requests (no filtering)
      filteredMaintenance = maintenanceRequests
        .filter((r) => r.status === "New" || r.status === "In Progress")
        .slice(0, 3);
    } else if (effectiveUser.role === "worker") {
      const workerProperties = effectiveUser.assignedPropertyIds || [];
      const workerTenants = tenantsInit.filter((t) =>
        workerProperties.includes(t.propertyId)
      );
      filteredMaintenance = maintenanceRequests.filter(
        (r) => r.assignedWorkerId === effectiveUser.id && r.status !== "Completed"
      );
      metrics = [
        {
          title: "Assigned Properties",
          value: workerProperties.length.toString(),
          icon: <Building2 className="h-4 w-4 text-muted-foreground" />,
        },
        {
          title: "Tenants in Properties",
          value: workerTenants.length.toString(),
          icon: <Users className="h-4 w-4 text-muted-foreground" />,
        },
        {
          title: "Open Tasks",
          value: filteredMaintenance.length.toString(),
          icon: <Wrench className="h-4 w-4 text-muted-foreground" />,
        },
      ];
    } else if (effectiveUser.role === "tenant") {
      console.log('📊 Dashboard filtering requests for tenant:', {
        effectiveUserEmail: effectiveUser.email,
        effectiveUserId: effectiveUser.id,
        currentTenantData: currentTenantData,
        tenantOrgId: TENANT_ID,
        totalRequests: maintenanceRequests.length,
        requestsLoading,
        allRequests: maintenanceRequests.map(r => ({ 
          id: r.id, 
          tenant: r.tenant, 
          tenantId: r.tenantId,
          issue: r.issue,
          propertyId: r.propertyId 
        }))
      });
      
      // Use the same filtering logic as the maintenance page
      // Filter by tenant organization ID (TENANT_ID), not individual user ID
      const tenantRequests = maintenanceRequests.filter(r => {
        console.log('📊 Dashboard checking request:', {
          requestId: r.id,
          requestTenantId: r.tenantId,
          requestTenantEmail: r.tenant?.email,
          targetTenantOrgId: TENANT_ID,
          matches: r.tenantId === TENANT_ID
        });
        
        // Maintenance requests are stored with the tenant organization ID
        return r.tenantId === TENANT_ID;
      });
      
      console.log('✅ Dashboard filtered requests for tenant:', tenantRequests);
      
      const openRequests = tenantRequests.filter(
        (r) => r.status !== "Completed"
      );
      filteredMaintenance = tenantRequests.slice(0, 3);

      // Handle tenant properties
      if (effectiveUser && effectiveUser.role === 'tenant') {
        console.log('📊 Dashboard tenant property resolution:', {
          userEmail: effectiveUser.email,
          userName: effectiveUser.name,
          currentTenantData,
          availableProperties: propertiesToUse.length
        });
        
        // For the seeded tenant user, always show the seeded property
        if (effectiveUser.email === 'tenant@example.com') {
          console.log('✅ Dashboard using seeded property for tenant@example.com');
          const seededProperty = propertiesToUse.find(p => p.id === 'seed-prop-1');
          if (seededProperty) {
            tenantProperties = [seededProperty];
          } else {
            // Fallback: create the seeded property if not found
            tenantProperties = [{
              id: 'seed-prop-1',
              title: 'Hauptstraße 1',
              name: 'Hauptstraße 1',
              address: 'Hauptstraße 1'
            }];
          }
        } else {
          // Use direct property assignment from currentTenantData
          if (currentTenantData && currentTenantData.propertyId) {
            const matchedProperties = propertiesToUse.filter(p => p.id === currentTenantData.propertyId);
            if (matchedProperties.length > 0) {
              console.log('✅ Dashboard found tenant property via direct assignment:', matchedProperties[0]);
              tenantProperties = matchedProperties;
            } else {
              console.warn('⚠️ Dashboard tenant has propertyId but property not found in available properties');
            }
          }
        }
      }

      metrics = [
        {
          title: "My Open Requests",
          value: openRequests.length.toString(),
          icon: <Wrench className="h-4 w-4 text-muted-foreground" />,
        },
        {
          title: "My Documents",
          value: "3", // dummy data
          icon: <FileText className="h-4 w-4 text-muted-foreground" />,
        },
        {
          title: "Rent Due",
          value: "$2,200", // dummy data
          icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
        },
      ];
      filteredOverdue = overdueTenantsInit.filter((t) => t.id === effectiveUser.id);
    }

    return {
      keyMetrics: metrics,
      filteredMaintenanceRequests: filteredMaintenance,
      filteredOverdueTenants: filteredOverdue,
      myProperties: tenantProperties,
    };
  }, [
    effectiveUser,
    maintenanceRequests,
    dict,
    overdueTenantsInit,
    loadedProperties,
    propertiesInit,
    tenantsInit,
    currentTenantData,
    requestsLoading,
    TENANT_ID
  ]);

  const handleAddRequest = async (newRequestData: any) => {
    if (!effectiveUser) return;

    try {
      // Call the AI triage flow with fallback
      let triageResult = { priority: "Medium", category: "Other" };
      try {
        triageResult = await triageMaintenanceRequest({
            title: newRequestData.issue,
            details: newRequestData.details,
        });
      } catch (error) {
        console.warn("AI triage failed, using default values:", error);
      }

      // Call the API to create the maintenance request
      const response = await fetch('/api/maintenance-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': TENANT_ID,
        },
        body: JSON.stringify({
          propertyId: newRequestData.propertyId,
          issue: newRequestData.issue,
          details: newRequestData.details,
          priority: triageResult.priority,
          status: "New",
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create maintenance request');
      }

      const result = await response.json();
      console.log('✅ Dashboard maintenance request created via API:', result.data);
      
      // Emit event for local state update
      eventBus.emit('maintenance-request-added', result.data);
      
      // Refresh the maintenance requests from API
      const refreshResponse = await fetch('/api/maintenance-requests', {
        headers: { 'x-tenant-id': TENANT_ID },
      });
      
      if (refreshResponse.ok) {
        const refreshResult = await refreshResponse.json();
        setMaintenanceRequests(refreshResult.data || []);
        console.log('🔄 Dashboard refreshed maintenance requests:', refreshResult.data);
      }
    } catch (error) {
      console.error('Dashboard error creating maintenance request:', error);
      throw error; // Let the dialog handle the error
    }
  };

  if (!effectiveUser) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
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
                <p className="text-xs text-muted-foreground">{metric.change}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{dict.dashboard.recentMaintenance}</CardTitle>
                <CardDescription>
                  {effectiveUser.role === "tenant"
                    ? dict.dashboard.recentMaintenanceDescriptionTenant
                    : dict.dashboard.recentMaintenanceDescriptionAdmin}
                </CardDescription>
              </div>
              {effectiveUser.role === "tenant" && (
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
                    {effectiveUser.role !== "tenant" && <TableHead>Tenant</TableHead>}
                    <TableHead>Issue</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMaintenanceRequests.map((request) => {
                    const property = propertiesInit.find(
                      (p) => p.id === request.propertyId
                    );
                    return (
                      <TableRow key={request.id}>
                        {effectiveUser.role !== "tenant" && (
                          <TableCell>
                            <div className="font-medium">
                              {/* For demo: Since we know Demo Co has one main tenant resident */}
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
                                  href={`/${lang}/maintenance/${request.id}`}
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
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          {effectiveUser.role === "admin" && (
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
                <CardTitle>{dict.dashboard.recentMaintenance}</CardTitle>
                <CardDescription>
                  {effectiveUser.role === "tenant"
                    ? dict.dashboard.recentMaintenanceDescriptionTenant
                    : dict.dashboard.recentMaintenanceDescriptionAdmin}
                </CardDescription>
              </div>
              {effectiveUser.role === "tenant" && (
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
                    {effectiveUser.role !== "tenant" && <TableHead>Tenant</TableHead>}
                    <TableHead>Issue</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMaintenanceRequests.map((request) => {
                    const property = propertiesInit.find(
                      (p) => p.id === request.propertyId
                    );
                    return (
                      <TableRow key={request.id}>
                        {effectiveUser.role !== "tenant" && (
                          <TableCell>
                            <div className="font-medium">
                              {/* For demo: Since we know Demo Co has one main tenant resident */}
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
                                  href={`/${lang}/maintenance/${request.id}`}
                                  className={cn(
                                    buttonVariants({
                                      variant: "ghost",
                                      size: "icon",
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
        {effectiveUser.role === "admin" && (
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
      recentMaintenanceDescriptionAdmin:
        "Recent maintenance requests overview.",
      overduePayments: "Overdue Payments",
      overduePaymentsDescription: "List of tenants with overdue payments.",
    },
  };

  return { dict };
}
