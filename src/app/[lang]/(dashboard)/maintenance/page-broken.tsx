

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
import { AnimatedTableRow } from "@/components/ui/animated-table-row";
import { AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
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
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCurrentUser } from "@/hooks/use-current-user";
import { useMemo, useState, useEffect } from 'react';

const TENANT_ID = process.env.NEXT_PUBLIC_DEMO_TENANT_ID ?? "";

async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "x-tenant-id": TENANT_ID },
    cache: "no-store",
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(
      res.status === 404
        ? `Not found: ${url}`
        : `API error ${res.status}: ${msg}`
    );
  }
  return res.json();
}
import { usePathname, useRouter } from 'next/navigation';
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
  showLimit = false,
  onShowAll
}: {
  requests: any[];
  showLimit?: boolean;
  onShowAll?: () => void;
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    // Load persisted choice from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('maintenance-table-items-per-page');
      return saved ? parseInt(saved) : 10;
    }
    return 10;
  });

  // Persist itemsPerPage choice
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('maintenance-table-items-per-page', itemsPerPage.toString());
    }
  }, [itemsPerPage]);

  // If showLimit is true, just show first 5 (for dashboard-style display)
  if (showLimit) {
    const displayRequests = requests.slice(0, 5);
    
    return (
      <div className="space-y-4">
        {requests.length > 5 && (
          <div className="flex justify-end">
            <Button variant="outline" onClick={onShowAll}>
              Show All ({requests.length})
            </Button>
          </div>
        )}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Issue</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Worker</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No maintenance requests found.
                  </TableCell>
                </TableRow>
              ) : (
                displayRequests.map((request) => (
                  <MaintenanceTableRow key={request.id} request={request} />
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    );
  }

  // Full pagination for main maintenance page
  const totalPages = Math.ceil(requests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRequests = requests.slice(startIndex, endIndex);

  // Reset to page 1 when itemsPerPage changes
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  // Reset to page 1 when requests change significantly
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="space-y-4">
      {/* Pagination controls - top */}
      {requests.length > 5 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Show:</span>
            <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(parseInt(value))}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">per page</span>
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Issue</TableHead>
              <TableHead>Property</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Worker</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No maintenance requests found.
                </TableCell>
              </TableRow>
            ) : (
              currentRequests.map((request) => (
                <MaintenanceTableRow key={request.id} request={request} />
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination controls - bottom */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages} ({requests.length} total)
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

// Separate component for table rows to keep the main component cleaner
const MaintenanceTableRow = ({ request }: { request: any }) => {
                <AnimatedTableRow key={request.id}>
                  <TableCell className="font-medium">{request.issue}</TableCell>
                  <TableCell>{request.property?.name || request.propertyName}</TableCell>
                  <TableCell>
                    <Badge
                      className={cn(
                        "border-0 text-white",
                        request.priority === "High"
                          ? "bg-red-600"
                          : request.priority === "Medium"
                          ? "bg-yellow-600"
                          : "bg-green-600"
                      )}
                    >
                      {request.priority === "High" && "⚠ "}
                      {request.priority || "Low"} Priority
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={cn(
                        "border-0 text-white",
                        request.status === "New"
                          ? "bg-gray-600"
                          : request.status === "In Progress"
                          ? "bg-blue-600"
                          : "bg-green-600"
                      )}
                    >
                      {request.status || "New"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {request.createdAt
                      ? new Date(request.createdAt).toLocaleDateString('de-DE')
                      : request.dateSubmitted
                      ? new Date(request.dateSubmitted).toLocaleDateString('de-DE')
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {request.assignedWorker
                      ? request.assignedWorker.name
                      : "Unassigned"}
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            href={`/maintenance/${request.id}`}
                            className={cn(
                              buttonVariants({ variant: "ghost", size: "sm" })
                            )}
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>View Details</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                </AnimatedTableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

// Separate component for table rows to keep the main component cleaner
const MaintenanceTableRow = ({ request }: { request: any }) => {
  return (
    <AnimatedTableRow>
      <TableCell className="font-medium">{request.issue}</TableCell>
      <TableCell>{request.property?.name || request.propertyName}</TableCell>
      <TableCell>
        <Badge
          className={cn(
            "border-0 text-white",
            request.priority === "High"
              ? "bg-red-600"
              : request.priority === "Medium"
              ? "bg-yellow-600"
              : "bg-green-600"
          )}
        >
          {request.priority}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge className={getStatusClasses(request.status)}>
          {request.status}
        </Badge>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {request.dateSubmitted
          ? new Date(request.dateSubmitted).toLocaleDateString()
          : "N/A"}
      </TableCell>
      <TableCell>
        {request.assignedWorker ? (
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-600">
              {request.assignedWorker.name?.charAt(0) || "W"}
            </div>
            <span className="text-sm">{request.assignedWorker.name}</span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">Unassigned</span>
        )}
      </TableCell>
      <TableCell>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href={`/maintenance/${request.id}`}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" })
                )}
              >
                <Eye className="h-4 w-4" />
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>View Details</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>
    </AnimatedTableRow>
  );
};

export default function MaintenancePage() {
  const { user } = useCurrentUser();
  const [maintenanceRequests, setMaintenanceRequests] = useState<any[]>([]);
  const [currentTenantData, setCurrentTenantData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [loadedProperties, setLoadedProperties] = useState<any[]>([]);
  const [showAllRequests, setShowAllRequests] = useState(false);
  
  const pathname = usePathname();
  const router = useRouter();
  
  // Create a mock tenant user for testing when auth is broken
  const effectiveUser = user || {
    id: 'test-tenant',
    name: 'Test Tenant',
    email: 'tenant@example.com',
    role: 'tenant' as const,
    tenantId: 'default-tenant',
  };

  // Determine if we should show limited results
  const isLimitedView = (effectiveUser?.role === 'tenant' || effectiveUser?.role === 'worker') && !showAllRequests;
  
  const handleShowAll = () => {
    setShowAllRequests(true);
  };

  console.log('🔍 Maintenance page - current user:', user);
  console.log('🔍 Maintenance page - effective user:', effectiveUser);

  // API helper functions
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

    // Load maintenance requests from API
  useEffect(() => {
    let alive = true;
    const abortController = new AbortController();
    
    (async () => {
      setRequestsLoading(true);
      try {
        const requestsRes = await apiGet<{ data: any[] }>(`/api/maintenance-requests`);
        if (!alive) return;
        
        console.log('🛠️ Loaded maintenance requests from API:', {
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
          console.error('Error loading maintenance requests:', error);
          // Set empty array as fallback instead of static data
          setMaintenanceRequests([]);
        }
      } finally {
        if (alive) setRequestsLoading(false);
      }
    })();
    return () => { 
      alive = false;
      abortController.abort();
    };
  }, [TENANT_ID]); // Only depend on TENANT_ID

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
        const finalProperties = normalized.length > 0 ? normalized : [];
        setLoadedProperties(finalProperties);
      } catch (error: any) {
        if (error?.name !== 'AbortError' && alive) {
          console.error('Error loading properties:', error);
          // Fallback to static properties
          setLoadedProperties([]);
        }
      }
    })();
    return () => { 
      alive = false;
      abortController.abort();
    };
  }, [TENANT_ID]); // Only depend on TENANT_ID

    // Fetch current tenant's data if user is a tenant
  useEffect(() => {
    if (effectiveUser && effectiveUser.role === 'tenant') {
      console.log('🔍 Starting tenant property lookup for user:', effectiveUser);
      const abortController = new AbortController();
      let alive = true;
      
      (async () => {
        setLoading(true);
        try {
          // Try the auth/me endpoint first (most reliable)
          console.log('📞 Calling auth/me endpoint...');
          const response = await fetch('/api/auth/me', {
            headers: { 
              'x-tenant-id': TENANT_ID,
              'x-user-email': effectiveUser.email, // Pass the current user's email
            },
            cache: 'no-store',
            signal: abortController.signal
          });
          
          console.log('📞 Auth/me response status:', response.status);
          if (response.ok && alive) {
            const userData = await response.json();
            console.log('📞 Auth/me response data:', userData);
            if (userData.user && userData.user.propertyId) {
              console.log('✅ Found property assignment via auth/me:', userData.user.propertyId);
              setCurrentTenantData(userData.user);
            } else {
              console.log('❌ No property assignment found in auth/me response');
            }
          } else if (!alive) {
            console.log('❌ Auth/me call aborted');
          } else {
            console.log('❌ Auth/me endpoint failed');
          }
        } catch (error: any) {
          if (error?.name !== 'AbortError' && alive) {
            console.error('Error fetching tenant data:', error);
          }
        } finally {
          if (alive) setLoading(false);
        }
      })();
      
      return () => {
        alive = false;
        abortController.abort();
      };
    }
  }, [effectiveUser?.email, TENANT_ID]); // Only depend on email and TENANT_ID

  // Listen for new maintenance requests
  useEffect(() => {
    const handleNewRequest = (newRequest: any) => {
        console.log('🆕 New maintenance request event received:', newRequest);
        setMaintenanceRequests((prevRequests) => {
          const updated = [...prevRequests, newRequest];
          console.log('🆕 Updated maintenance requests:', updated);
          return updated;
        });
        // Also update the global mock data for prototype consistency
        // Add to current maintenance requests state
        setMaintenanceRequests(prev => [newRequest, ...prev]);
    };

    const unsubscribe = eventBus.subscribe('maintenance-request-added', handleNewRequest);

    return () => {
        unsubscribe();
    };
  }, []); // No dependencies needed for event listener


    const myRequests = useMemo(() => {
    // Don't filter if requests are still loading or no requests available
    if (requestsLoading || maintenanceRequests.length === 0) {
      console.log('🔄 Requests still loading or empty, skipping filter:', { requestsLoading, count: maintenanceRequests.length });
      return [];
    }
    
    console.log('🔍 Starting request filtering for:', {
      effectiveUser,
      totalRequests: maintenanceRequests.length,
      currentTenantData
    });
    
    if (effectiveUser && effectiveUser.role === 'tenant') {
      console.log('📊 Filtering requests for tenant:', {
        effectiveUserEmail: effectiveUser.email,
        effectiveUserId: effectiveUser.id,
        currentTenantData: currentTenantData,
        tenantOrgId: TENANT_ID,
        totalRequests: maintenanceRequests.length,
        allRequests: maintenanceRequests.map(r => ({ 
          id: r.id, 
          tenant: r.tenant, 
          tenantId: r.tenantId,
          issue: r.issue,
          propertyId: r.propertyId 
        }))
      });
      
      // The key insight: maintenance requests are created with the Tenant ORG ID (TENANT_ID)
      // not individual user IDs. So we filter by the organization tenant ID.
      const targetTenantOrgId = TENANT_ID;
      
      console.log('🎯 Target tenant organization ID for filtering:', targetTenantOrgId);
      
      const filteredRequests = maintenanceRequests.filter(r => {
        console.log('🔍 Checking request:', {
          requestId: r.id,
          requestTenantId: r.tenantId,
          requestTenantEmail: r.tenant?.email,
          targetTenantOrgId,
          matches: r.tenantId === targetTenantOrgId
        });
        
        // Maintenance requests are stored with the tenant organization ID
        // All users in the same tenant organization should see the same requests
        return r.tenantId === targetTenantOrgId;
      });
      
      console.log('✅ Filtered requests for tenant:', filteredRequests);
      return filteredRequests;
    }
    
    // Admin and worker users see all requests
    console.log('👑 Admin/Worker user - showing all requests:', maintenanceRequests);
    return maintenanceRequests;
  }, [effectiveUser, maintenanceRequests, currentTenantData, requestsLoading]);
  
  const myProperties = useMemo(() => {
    const propertiesToUse = loadedProperties.length > 0 ? loadedProperties : [];
    
    if (effectiveUser && effectiveUser.role === 'tenant') {
      console.log('🔍 Tenant property resolution:', {
        userEmail: effectiveUser.email,
        userName: effectiveUser.name,
        currentTenantData,
        availableProperties: propertiesToUse.length
      });
      
      // For the seeded tenant user, always show the seeded property
      if (effectiveUser.email === 'tenant@example.com') {
        console.log('✅ Using seeded property for tenant@example.com');
        const seededProperty = propertiesToUse.find((p: any) => p.id === 'seed-prop-1');
        if (seededProperty) {
          return [seededProperty];
        }
        // Fallback: create the seeded property if not found
        return [{
          id: 'seed-prop-1',
          title: 'Hauptstraße 1',
          name: 'Hauptstraße 1',
          address: 'Hauptstraße 1'
        }];
      }
      
      // Use direct property assignment from currentTenantData
      if (currentTenantData && currentTenantData.propertyId) {
        const matchedProperties = propertiesToUse.filter((p: any) => p.id === currentTenantData.propertyId);
        if (matchedProperties.length > 0) {
          console.log('✅ Found tenant property via direct assignment:', matchedProperties[0]);
          return matchedProperties;
        } else {
          console.warn('⚠️ Tenant has propertyId but property not found in available properties');
        }
      }
      
      // If no property assignment found, show helpful message
      console.warn('⚠️ No property assignment found for tenant');
      return [];
    }
    
    // For non-tenant users, return all properties
    if (effectiveUser && effectiveUser.role !== 'tenant') {
      return propertiesToUse;
    }
    return [];
  }, [effectiveUser, currentTenantData, loadedProperties]);

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
      console.log('✅ Maintenance request created via API:', result.data);
      
      // Emit event for local state update
      eventBus.emit('maintenance-request-added', result.data);
      
      // Refresh the maintenance requests from API
      const refreshResponse = await fetch('/api/maintenance-requests', {
        headers: { 'x-tenant-id': TENANT_ID },
      });
      
      if (refreshResponse.ok) {
        const refreshResult = await refreshResponse.json();
        setMaintenanceRequests(refreshResult.data || []);
        console.log('🔄 Refreshed maintenance requests:', refreshResult.data);
      }
    } catch (error) {
      console.error('Error creating maintenance request:', error);
      throw error; // Let the dialog handle the error
    }
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

  if (!effectiveUser) {
    return null; // Loading state
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={effectiveUser.role === 'tenant' ? "My Maintenance Requests" : "Maintenance Requests"}
        description={effectiveUser.role === 'tenant' ? "Track and manage your maintenance requests." : "Manage all maintenance requests in the system."}
      >
        {effectiveUser.role === 'tenant' && (
          <AddTenantRequestDialog properties={myProperties} onAddRequest={handleAddRequest} />
        )}
      </PageHeader>
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="new">New</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          <MaintenanceTable 
            requests={myRequests} 
            showLimit={isLimitedView}
            onShowAll={handleShowAll}
          />
        </TabsContent>
        <TabsContent value="new" className="mt-4">
          <MaintenanceTable 
            requests={newRequests} 
            showLimit={isLimitedView}
            onShowAll={handleShowAll}
          />
        </TabsContent>
        <TabsContent value="in-progress" className="mt-4">
          <MaintenanceTable 
            requests={inProgressRequests} 
            showLimit={isLimitedView}
            onShowAll={handleShowAll}
          />
        </TabsContent>
        <TabsContent value="completed" className="mt-4">
          <MaintenanceTable 
            requests={completedRequests} 
            showLimit={isLimitedView}
            onShowAll={handleShowAll}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
