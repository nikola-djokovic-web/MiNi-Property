"use client";

import { useState } from "react";
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
import { apiSend } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle } from "lucide-react";

const TENANT_ID = process.env.NEXT_PUBLIC_DEMO_TENANT_ID ?? "";

const addTenantSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
  propertyId: z.string().min(1, "Property assignment is required"),
});

type AddTenantForm = z.infer<typeof addTenantSchema>;

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

  const form = useForm<AddTenantForm>({
    resolver: zodResolver(addTenantSchema),
    defaultValues: { name: "", email: "", propertyId: "" },
  });

  const handleSubmit = async (values: AddTenantForm) => {
    setSubmitting(true);
    try {
      const { data: newTenant } = await apiSend<{ data: any }>(
        "/api/tenants",
        "POST",
        values,
        TENANT_ID
      );

      const assignedProperty = properties.find((p) => p.id === values.propertyId);

      await onAddTenant(newTenant);

      toast({
        title: "Tenant Invited Successfully",
        description: `Invitation sent to ${values.email} for ${assignedProperty?.title || "the selected property"}.`,
        variant: "default",
        className: "bg-green-50 border-green-200 text-green-900",
      });

      setOpen(false);
      form.reset();
    } catch (err: any) {
      const msg = err?.message || "Failed to invite tenant";
      form.setError("root", { message: msg });
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
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) form.reset();
      }}
    >
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                  <FormLabel className="text-right">Name</FormLabel>
                  <div className="col-span-3">
                    <FormControl>
                      <Input placeholder="e.g. John Doe" {...field} />
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
                  <FormLabel className="text-right">Email</FormLabel>
                  <div className="col-span-3">
                    <FormControl>
                      <Input type="email" placeholder="e.g. john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="propertyId"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                  <FormLabel className="text-right">Property</FormLabel>
                  <div className="col-span-3">
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Assign to property" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {properties.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.title || p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            {form.formState.errors.root && (
              <div className="col-span-4 text-sm text-destructive text-center">
                {form.formState.errors.root.message}
              </div>
            )}
            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Sending Invite..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
