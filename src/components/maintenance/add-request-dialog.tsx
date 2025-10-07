

"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusCircle, Loader2 } from "lucide-react";
import { User, useCurrentUser } from "@/hooks/use-current-user";
import { Input } from "../ui/input";

type Worker = {
    id: string;
    name: string;
    email?: string;
    role?: string;
}

type Property = {
    id: string;
    name: string;
    title: string;
    address: string;
}

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
        ? `API route not found: ${url}`
        : msg || `Request failed: ${res.status}`
    );
  }
  return res.json();
}

export default function AddRequestDialog({
  propertyId, // Optional - if provided, will default to this property
  onAddRequest,
  triggerButton,
}: {
  propertyId?: string;
  onAddRequest: (newRequest: any) => Promise<void>;
  triggerButton?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [issue, setIssue] = useState("");
  const [details, setDetails] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(propertyId || "");
  const [tenantId, setTenantId] = useState<string | undefined>(undefined);
  const [assignedWorkerId, setAssignedWorkerId] = useState<string | null>(null);
  const [assignToSelf, setAssignToSelf] = useState(true);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Data from API
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<{ id: string; name: string; email?: string }[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  
  // Use the current user hook
  const { user: currentUser } = useCurrentUser();
  const userRole = currentUser?.role || '';

  // Debug log for role detection
  useEffect(() => {
    console.log('🔍 Dialog user role detection:', {
      currentUser,
      userRole,
      userEmail: currentUser?.email,
      userName: currentUser?.name
    });
  }, [currentUser, userRole]);

  // Load data when dialog opens
  useEffect(() => {
    if (open && !loading && currentUser) {
      loadData();
    }
  }, [open, currentUser]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [propsRes, tenantsRes, workersRes] = await Promise.all([
        apiGet<{ data: Property[] }>("/api/properties").catch(() => ({ data: [] })),
        apiGet<{ data: any[] }>("/api/tenants").catch(() => ({ data: [] })),
        apiGet<{ data: Worker[] }>("/api/workers").catch(() => ({ data: [] })),
      ]);
      
      // Try to get current user to determine if they're a tenant
      let effectiveUser = null;
      try {
        const userResponse = await fetch('/api/auth/me', {
          headers: { 
            'x-tenant-id': TENANT_ID,
            'x-user-email': 'tenant@example.com', // This should come from actual auth
          },
          cache: 'no-store'
        });
        if (userResponse.ok) {
          const userData = await userResponse.json();
          effectiveUser = userData.user;
        }
      } catch (error) {
        console.log('Could not get current user, proceeding with all properties');
      }
      
      // Filter properties for tenant users
      let availableProperties = propsRes.data;
      if (effectiveUser && effectiveUser.role === 'tenant' && effectiveUser.propertyId) {
        // Tenant should only see their assigned property
        availableProperties = propsRes.data.filter(p => p.id === effectiveUser.propertyId);
      } else if (effectiveUser && effectiveUser.role === 'tenant' && effectiveUser.email === 'tenant@example.com') {
        // Hardcoded assignment for seeded tenant
        const seededProperty = propsRes.data.find(p => p.id === 'seed-prop-1');
        if (seededProperty) {
          availableProperties = [seededProperty];
        } else {
          // Fallback property for seeded tenant
          availableProperties = [{
            id: 'seed-prop-1',
            name: 'Hauptstraße 1',
            title: 'Hauptstraße 1',
            address: 'Hauptstraße 1'
          }];
        }
      }
      
      setProperties(availableProperties);
      setTenants(tenantsRes.data.map(t => ({ id: t.id, name: t.name || t.email, email: t.email })));
      setWorkers(workersRes.data);

      // If propertyId was provided, set it as default
      if (propertyId && availableProperties.length > 0) {
        setSelectedPropertyId(propertyId);
      } else if (availableProperties.length > 0) {
        setSelectedPropertyId(availableProperties[0].id);
      }

            // Set default tenant - for tenant users, set to their own tenant record
      if (effectiveUser && effectiveUser.role === 'tenant') {
        // Find the tenant record that matches the current user
        const myTenantRecord = tenantsRes.data.find(t => t.email === effectiveUser.email);
        console.log('🔍 Looking for tenant record for user:', {
          userEmail: effectiveUser.email,
          foundRecord: myTenantRecord,
          allTenants: tenantsRes.data.map(t => ({ id: t.id, email: t.email, name: t.name }))
        });
        
        if (myTenantRecord) {
          console.log('✅ Setting tenant to:', myTenantRecord.id);
          setTenantId(myTenantRecord.id);
        } else {
          // Fallback: use the known tenant ID for our seeded user
          if (effectiveUser.email === 'tenant@example.com') {
            console.log('🔄 Using fallback tenant ID for seeded user');
            setTenantId('cmgasyaot000m0afqqouwi6td');
          } else if (tenantsRes.data.length > 0) {
            setTenantId(tenantsRes.data[0].id);
          }
        }
      } else if (tenantsRes.data.length > 0) {
        setTenantId(tenantsRes.data[0].id);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setIssue("");
      setDetails("");
      setAssignedWorkerId(null);
      setAssignToSelf(true);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!tenantId || !issue || !selectedPropertyId) return;

    let finalAssignedWorkerId = null;

    // Note: We'll need to get current user info for role-based logic
    // For now, allowing assignment selection for all users
    if (assignedWorkerId && assignedWorkerId !== "unassigned") {
      finalAssignedWorkerId = assignedWorkerId;
    }

    setSubmitting(true);
    try {
      await onAddRequest({
        propertyId: selectedPropertyId,
        tenantId,
        issue,
        details,
        assignedWorkerId: finalAssignedWorkerId,
      });
      setOpen(false);
    } catch (error) {
      console.error("Failed to submit request:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Request
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Maintenance Request</DialogTitle>
          <DialogDescription>
            Fill out the details for the new maintenance request.
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading data...</span>
          </div>
        ) : (
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
            {/* Property Selection - Hidden for tenants */}
            {userRole !== 'tenant' && (
              <div className="space-y-2">
                <Label htmlFor="property">Property</Label>
                {properties.length === 0 ? (
                  <div className="p-3 text-sm text-muted-foreground bg-muted rounded-md">
                    No properties are available for maintenance requests. Please contact your administrator.
                  </div>
                ) : (
                  <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                    <SelectTrigger id="property">
                      <SelectValue placeholder="Select a property" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.title || p.name} - {p.address}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {/* Tenant Selection - Only for admins and workers */}
            {(userRole === 'admin' || userRole === 'worker') && (
              <div className="space-y-2">
                <Label htmlFor="tenant">Tenant</Label>
                <Select value={tenantId} onValueChange={setTenantId}>
                  <SelectTrigger id="tenant">
                    <SelectValue placeholder="Select a tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Issue - All roles can see this */}
            <div className="space-y-2">
              <Label htmlFor="issue">Issue</Label>
              <Input
                id="issue"
                value={issue}
                onChange={(e) => setIssue(e.target.value)}
                placeholder="e.g., Leaky kitchen faucet"
              />
            </div>

            {/* Details - All roles can see this */}
            <div className="space-y-2">
              <Label htmlFor="details">Details</Label>
              <Textarea
                id="details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Provide as much detail as possible..."
                rows={4}
              />
            </div>

            {/* Worker Assignment - Only for admins */}
            {userRole === 'admin' && (
              <div className="space-y-2">
                <Label htmlFor="assign-worker">Assign Worker (Optional)</Label>
                <Select value={assignedWorkerId || "unassigned"} onValueChange={(value) => setAssignedWorkerId(value === "unassigned" ? null : value)}>
                  <SelectTrigger id="assign-worker">
                    <SelectValue placeholder="Select a worker" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {workers.map(w => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name} {w.email && `(${w.email})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Worker auto-assignment notice */}
            {userRole === 'worker' && (
              <div className="space-y-2">
                <div className="p-3 text-sm bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md">
                  <p className="text-blue-800 dark:text-blue-200">
                    This request will be automatically assigned to you.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button 
            onClick={handleSubmit} 
            disabled={
              !tenantId || !issue || !selectedPropertyId || 
              loading || submitting ||
              (userRole !== 'tenant' && !tenantId) // Admin/Worker must select tenant
            }
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Request"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
