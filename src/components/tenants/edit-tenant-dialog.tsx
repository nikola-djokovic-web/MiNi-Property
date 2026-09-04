"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil } from "lucide-react";
import { Property } from "@/lib/data";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { apiSend } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/use-translation";

const TENANT_ID = process.env.NEXT_PUBLIC_DEMO_TENANT_ID ?? "";

const editTenantSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
  profileImage: z.string().trim().max(10_000_000).optional(),
  companyName: z.string().trim().max(200).optional(),
  companyLogo: z.string().trim().max(10_000_000).optional(),
  propertyId: z.string().optional(),
});

type EditTenantForm = z.infer<typeof editTenantSchema>;

export default function EditTenantDialog({
  tenant,
  properties,
  onUpdateTenant,
}: {
  tenant: any;
  properties: Property[];
  onUpdateTenant: (tenant: any) => void;
}) {
  const { toast } = useToast();
  const { dict } = useTranslation();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [availableProperties, setAvailableProperties] = useState<Property[]>(properties);

  useEffect(() => {
    setAvailableProperties(properties);
  }, [properties]);

  useEffect(() => {
    if (!open || availableProperties.length > 0) return;
    fetch("/api/properties?page=1&pageSize=100", { cache: "no-store" })
      .then((response) => response.json())
      .then((result) => setAvailableProperties(result.data ?? []))
      .catch((error) => console.error("Failed to load properties:", error));
  }, [open, availableProperties.length]);

  const form = useForm<EditTenantForm>({
    resolver: zodResolver(editTenantSchema),
    values: {
      name: tenant.name ?? "",
      email: tenant.email ?? "",
      profileImage: tenant.profileImage ?? "",
      companyName: tenant.companyName ?? "",
      companyLogo: tenant.companyLogo ?? "",
      propertyId: tenant.propertyId ?? "",
    },
  });

  const handleSubmit = async (values: EditTenantForm) => {
    setSubmitting(true);
    try {
      const { data: updated } = await apiSend<{ data: any }>(
        `/api/tenants/${tenant.id}`,
        "PUT",
        values,
        TENANT_ID
      );
      onUpdateTenant(updated);
      toast({ title: dict?.tenants?.updated || "Tenant updated" });
      setOpen(false);
    } catch (err: any) {
      toast({
        title: dict?.tenants?.updateFailed || "Failed to update tenant",
        description: err?.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Pencil className="h-4 w-4" />
              <span className="sr-only">{dict?.tenants?.editTenant || "Edit Tenant"}</span>
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>{dict?.tenants?.editTenant || "Edit Tenant"}</p>
        </TooltipContent>
      </Tooltip>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{dict?.tenants?.editTenant || "Edit Tenant"}</DialogTitle>
          <DialogDescription>
            {(dict?.tenants?.editDescription || "Update the details for {name}. Click save when you're done.").replace("{name}", tenant.name)}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                  <FormLabel className="text-right">{dict?.common?.name || "Name"}</FormLabel>
                  <div className="col-span-3">
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                  <FormLabel className="text-right">{dict?.common?.email || "Email"}</FormLabel>
                  <div className="col-span-3">
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="profileImage"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                  <FormLabel className="text-right">Profile image</FormLabel>
                  <div className="col-span-3"><FormControl><Input placeholder="Image URL" {...field} /></FormControl><FormMessage /></div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                  <FormLabel className="text-right">Company</FormLabel>
                  <div className="col-span-3"><FormControl><Input {...field} /></FormControl><FormMessage /></div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="companyLogo"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                  <FormLabel className="text-right">Company logo</FormLabel>
                  <div className="col-span-3"><FormControl><Input placeholder="Logo URL" {...field} /></FormControl><FormMessage /></div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="propertyId"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                  <FormLabel className="text-right">{dict?.common?.property || "Property"}</FormLabel>
                  <div className="col-span-3">
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a property" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableProperties.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.title || p.name || "Untitled property"}
                          </SelectItem>
                        ))}
                        {availableProperties.length === 0 && (
                          <SelectItem value="no-properties" disabled>No properties available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting ? (dict?.common?.saving || "Saving...") : (dict?.common?.saveChanges || "Save Changes")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
