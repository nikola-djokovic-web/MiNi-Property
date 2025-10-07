"use client";

import { useState, useEffect } from "react";
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
import { Calendar as CalendarIcon, Pencil } from "lucide-react";
import { Property } from "@/lib/data";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

export default function EditTenantDialog({
  tenant,
  properties,
  onUpdateTenant,
}: {
  tenant: any;
  properties: Property[];
  onUpdateTenant: (tenant: any) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(tenant.name);
  const [email, setEmail] = useState(tenant.email);
  const [phone, setPhone] = useState(tenant.phone);
  const [propertyId, setPropertyId] = useState(tenant.propertyId);
  const [leaseEndDate, setLeaseEndDate] = useState<Date | undefined>(
    tenant.leaseEndDate ? parseISO(tenant.leaseEndDate) : undefined
  );
  const [rent, setRent] = useState(
    tenant?.rent != null ? String(tenant.rent) : ""
  );
  const [status, setStatus] = useState(tenant.status);

  useEffect(() => {
    if (open) {
      setName(tenant.name);
      setEmail(tenant.email);
      setPhone(tenant.phone);
      setPropertyId(tenant.propertyId);
      setLeaseEndDate(
        tenant.leaseEndDate ? parseISO(tenant.leaseEndDate) : undefined
      );
      setRent(tenant?.rent != null ? String(tenant.rent) : "");
      setStatus(tenant.status);
    }
  }, [open, tenant]);

  const handleSubmit = () => {
    const updatedTenant = {
      ...tenant,
      name,
      email,
      phone,
      propertyId,
      leaseEndDate: leaseEndDate ? format(leaseEndDate, "yyyy-MM-dd") : "",
      rent: parseInt(rent) || 0,
      status,
    };
    onUpdateTenant(updatedTenant);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit Tenant</span>
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Edit Tenant</p>
        </TooltipContent>
      </Tooltip>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Tenant</DialogTitle>
          <DialogDescription>
            Update the details for {tenant.name}. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={name ?? ""}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email ?? ""}
              onChange={(e) => setEmail(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">
              Phone
            </Label>
            <Input
              id="phone"
              type="tel"
              value={phone ?? ""}
              onChange={(e) => setPhone(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="property" className="text-right">
              Property
            </Label>
            <Select value={propertyId} onValueChange={setPropertyId}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a property" />
              </SelectTrigger>
              <SelectContent>
                {properties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="rent" className="text-right">
              Rent
            </Label>
            <Input
              id="rent"
              type="number"
              value={rent ?? ""}
              onChange={(e) => setRent(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="lease-end" className="text-right">
              Lease End
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "col-span-3 justify-start text-left font-normal",
                    !leaseEndDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {leaseEndDate ? (
                    format(leaseEndDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={leaseEndDate}
                  onSelect={setLeaseEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Status
            </Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="New">New</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Moving Out">Moving Out</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
