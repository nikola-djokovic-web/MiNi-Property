

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
import { PlusCircle } from "lucide-react";
import { User } from "@/hooks/use-current-user";
import { Input } from "../ui/input";

type Worker = {
    id: string;
    name: string;
}

export default function AddRequestDialog({
  propertyId,
  tenants,
  workers,
  currentUser,
  onAddRequest,
}: {
  propertyId: string;
  tenants: { id: string; name: string }[];
  workers: Worker[];
  currentUser: User;
  onAddRequest: (newRequest: any) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [issue, setIssue] = useState("");
  const [details, setDetails] = useState("");
  const [tenantId, setTenantId] = useState<string | undefined>(undefined);
  const [assignedWorkerId, setAssignedWorkerId] = useState<string | null>(null);
  const [assignToSelf, setAssignToSelf] = useState(true);

  useEffect(() => {
    // Reset state when dialog opens or user changes
    if (open) {
        setIssue("");
        setDetails("");
        setAssignedWorkerId(null);
        setAssignToSelf(true);
        if (currentUser.role === 'tenant') {
            setTenantId(currentUser.id);
        } else {
            setTenantId(tenants.length > 0 ? tenants[0].id : undefined);
        }
    }
  }, [currentUser, open, tenants]);


  const handleSubmit = async () => {
    if (!tenantId || !issue) return;

    let finalAssignedWorkerId = null;

    if (currentUser.role === 'admin') {
        finalAssignedWorkerId = assignedWorkerId;
    } else if (currentUser.role === 'worker' && assignToSelf) {
        finalAssignedWorkerId = currentUser.id;
    }


    await onAddRequest({
      propertyId,
      tenantId,
      issue,
      details,
      assignedWorkerId: finalAssignedWorkerId,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Request
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Maintenance Request</DialogTitle>
          <DialogDescription>
            Fill out the details for the new maintenance request.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
           {currentUser.role !== 'tenant' && (
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
          <div className="space-y-2">
            <Label htmlFor="issue">Issue</Label>
            <Input
              id="issue"
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              placeholder="e.g., Leaky kitchen faucet"
            />
          </div>
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

          {currentUser.role === 'admin' && (
             <div className="space-y-2">
                <Label htmlFor="assign-worker">Assign Worker (Optional)</Label>
                 <Select value={assignedWorkerId || "unassigned"} onValueChange={(value) => setAssignedWorkerId(value === "unassigned" ? null : value)}>
                    <SelectTrigger id="assign-worker">
                        <SelectValue placeholder="Select a worker" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {workers.map(w => (
                            <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
             </div>
          )}

          {currentUser.role === 'worker' && (
              <div className="flex items-center space-x-2">
                  <Checkbox id="assign-to-self" checked={assignToSelf} onCheckedChange={(checked) => setAssignToSelf(!!checked)} />
                  <Label htmlFor="assign-to-self">Assign to myself</Label>
              </div>
          )}

        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!tenantId || !issue}>Submit Request</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
