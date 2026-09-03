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
import { usePathname, useRouter } from 'next/navigation';
import AddTenantRequestDialog from "@/components/maintenance/add-tenant-request-dialog";
import { triageMaintenanceRequest } from "@/ai/flows/triage-maintenance-request";
import eventBus from "@/lib/events";
import { useTranslation } from "@/hooks/use-translation";

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

// Table row component
const MaintenanceTableRow = ({ request }: { request: any }) => {
  const { dict } = useTranslation();
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
          {request.priority === "High"
            ? (dict?.common?.high || "High")
            : request.priority === "Medium"
            ? (dict?.common?.medium || "Medium")
            : request.priority === "Low"
            ? (dict?.common?.low || "Low")
            : request.priority}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge className={getStatusClasses(request.status)}>
          {request.status === "New"
            ? (dict?.common?.new || "New")
            : request.status === "In Progress"
            ? (dict?.common?.inProgress || "In Progress")
            : request.status === "Completed"
            ? (dict?.common?.completed || "Completed")
            : request.status}
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
          <span className="text-sm text-muted-foreground">{dict?.common?.unassigned || "Unassigned"}</span>
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
              <p>{dict?.common?.viewDetails || "View Details"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>
    </AnimatedTableRow>
  );
};

// Main table component with pagination
const MaintenanceTable = ({
  requests,
  showLimit = false,
  onShowAll
}: {
  requests: any[];
  showLimit?: boolean;
  onShowAll?: () => void;
}) => {
  const { dict } = useTranslation();
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
              {(dict?.maintenance?.showAll || "Show All ({count})").replace("{count}", String(requests.length))}
            </Button>
          </div>
        )}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{dict?.maintenance?.table?.issue || "Issue"}</TableHead>
                <TableHead>{dict?.maintenance?.table?.property || "Property"}</TableHead>
                <TableHead>{dict?.maintenance?.table?.priority || "Priority"}</TableHead>
                <TableHead>{dict?.maintenance?.table?.status || "Status"}</TableHead>
                <TableHead>{dict?.maintenance?.table?.submitted || "Submitted"}</TableHead>
                <TableHead>{dict?.common?.assignedTo || "Worker"}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    {dict?.maintenance?.noRequestsFound || "No maintenance requests found."}
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
            <span className="text-sm text-muted-foreground">{dict?.maintenance?.show || dict?.common?.show || "Show:"}</span>
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
            <span className="text-sm text-muted-foreground">{dict?.maintenance?.perPage || dict?.common?.perPage || "per page"}</span>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                {dict?.common?.previous || "Previous"}
              </Button>
              <span className="text-sm text-muted-foreground">
                {(dict?.common?.page || "Page")} {currentPage} {(dict?.common?.of || "of")} {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                {dict?.common?.next || "Next"}
              </Button>
            </div>
          )}
        </div>
      )}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{dict?.maintenance?.table?.issue || "Issue"}</TableHead>
              <TableHead>{dict?.maintenance?.table?.property || "Property"}</TableHead>
              <TableHead>{dict?.maintenance?.table?.priority || "Priority"}</TableHead>
              <TableHead>{dict?.maintenance?.table?.status || "Status"}</TableHead>
              <TableHead>{dict?.maintenance?.table?.submitted || "Submitted"}</TableHead>
              <TableHead>{dict?.common?.assignedTo || "Worker"}</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  {dict?.maintenance?.noRequestsFound || "No maintenance requests found."}
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
            {dict?.common?.previous || "Previous"}
          </Button>
          <span className="text-sm text-muted-foreground">
            {(dict?.common?.page || "Page")} {currentPage} {(dict?.common?.of || "of")} {totalPages} ({requests.length} total)
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            {dict?.common?.next || "Next"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default function MaintenancePage() {
  const { user } = useCurrentUser();
  const { dict } = useTranslation();
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

  // Load maintenance requests from API
  useEffect(() => {
    let alive = true;
    const abortController = new AbortController();
    
    (async () => {
      try {
        setRequestsLoading(true);
        
        // Build API URL with role-based filtering parameters
        const maintenanceUrl = effectiveUser 
          ? `/api/maintenance-requests?userRole=${effectiveUser.role}&userId=${effectiveUser.id}`
          : "/api/maintenance-requests";
          
        const requestsRes = await apiGet<{ data: any[] }>(maintenanceUrl);
        
        if (!alive) return;
        
        console.log('📊 Fetched maintenance requests:', {
          count: requestsRes.data?.length || 0,
          userRole: effectiveUser?.role,
          userId: effectiveUser?.id,
          requests: requestsRes.data?.map(r => ({
            id: r.id,
            tenantId: r.tenantId,
            assignedWorkerId: r.assignedWorkerId,
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
  }, [TENANT_ID, effectiveUser]);

  // Since we're now filtering on the backend, just use the data directly
  const myRequests = useMemo(() => {
    return maintenanceRequests; // Backend already filters based on user role
  }, [maintenanceRequests]);

  const newRequests = myRequests.filter((r) => r.status === "New");
  const inProgressRequests = myRequests.filter(
    (r) => r.status === "In Progress"
  );
  const completedRequests = myRequests.filter(
    (r) => r.status === "Completed"
  );

  const handleAddRequest = async (requestData: any) => {
    try {
      // Add to current maintenance requests state
      setMaintenanceRequests(prev => [requestData, ...prev]);
    } catch (error) {
      console.error('Error adding maintenance request:', error);
    }
  };

  if (!effectiveUser) {
    return null; // Loading state
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={effectiveUser.role === 'tenant' ? (dict?.maintenance?.myTitle || "My Maintenance Requests") : (dict?.maintenance?.title || "Maintenance Requests")}
        description={effectiveUser.role === 'tenant' ? (dict?.maintenance?.tenantDescription || "Track and manage your maintenance requests.") : (dict?.maintenance?.adminDescription || "Manage all maintenance requests in the system.")}
      >
        {effectiveUser.role === 'tenant' && (
          <AddTenantRequestDialog properties={[]} onAddRequest={handleAddRequest} />
        )}
      </PageHeader>
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">{dict?.maintenance?.all || "All"}</TabsTrigger>
          <TabsTrigger value="new">{dict?.common?.new || "New"}</TabsTrigger>
          <TabsTrigger value="in-progress">{dict?.common?.inProgress || "In Progress"}</TabsTrigger>
          <TabsTrigger value="completed">{dict?.common?.completed || "Completed"}</TabsTrigger>
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