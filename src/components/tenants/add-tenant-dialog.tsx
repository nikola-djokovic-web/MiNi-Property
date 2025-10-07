"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiSend } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const TENANT_ID = process.env.NEXT_PUBLIC_DEMO_TENANT_ID ?? "";

console.log("TENANT_ID in add-tenant-dialog:", TENANT_ID); // Debug log

import { PlusCircle } from "lucide-react";

export default function AddTenantDialog({
  properties,
  onAddTenant,
}: {
  properties: any[];
  onAddTenant: (tenant: any) => void;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setEmailError(null);
    
    // Validation
    if (!name.trim()) {
      setEmailError("Name is required");
      return;
    }
    if (!email.trim()) {
      setEmailError("Email is required");
      return;
    }
    if (!propertyId) {
      setEmailError("Property assignment is required");
      return;
    }

    setSubmitting(true);
    try {
      console.log("About to send API request with TENANT_ID:", TENANT_ID);
      const { data: newTenant } = await apiSend<{ data: any }>(
        "/api/tenants",
        "POST",
        {
          name,
          email,
          propertyId,
        },
        TENANT_ID
      );
      console.log("Inviting tenant:", newTenant);
      
      // Find the assigned property for display
      const assignedProperty = properties.find(p => p.id === propertyId);

      await onAddTenant(newTenant);
      
      toast({
        title: "Tenant Invited Successfully",
        description: `Invitation sent to ${email} for ${assignedProperty?.title || 'the selected property'}.`,
        variant: "default",
        className: "bg-green-50 border-green-200 text-green-900",
      });
      
      setOpen(false);
      // Reset form
      setName("");
      setEmail("");
      setPropertyId("");
    } catch (err: any) {
      const msg = err?.message || "Failed to invite tenant";
      setEmailError(msg);
      toast({
        title: "Invitation Failed",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Tenant
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite New Tenant</DialogTitle>
          <DialogDescription>
            Enter the tenant's details and assign them to a property. They will receive an invitation email to complete their registration.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="e.g. John Doe"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              aria-invalid={!!emailError}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(null);
              }}
              className="col-span-3"
              placeholder="e.g. john@example.com"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="property" className="text-right">
              Property
            </Label>
            <Select value={propertyId} onValueChange={setPropertyId} required>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Assign to property" />
              </SelectTrigger>
              <SelectContent>
                {properties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title || p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {emailError && (
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-4 text-sm text-destructive text-center">
                {emailError}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Sending Invite..." : "Send Invitation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
