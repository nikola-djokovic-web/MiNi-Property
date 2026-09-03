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
import { apiSend } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";

const TENANT_ID = process.env.NEXT_PUBLIC_DEMO_TENANT_ID ?? "";

const addAdminSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
});

type AddAdminForm = z.infer<typeof addAdminSchema>;

export default function AddAdminDialog({
  onAddAdmin,
}: {
  onAddAdmin: (admin: any) => void;
}) {
  const { toast } = useToast();
  const { dict } = useTranslation();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<AddAdminForm>({
    resolver: zodResolver(addAdminSchema),
    defaultValues: { name: "", email: "" },
  });

  const handleSubmit = async (values: AddAdminForm) => {
    setSubmitting(true);
    try {
      const { data: newAdmin } = await apiSend<{ data: any }>(
        "/api/admins",
        "POST",
        values,
        TENANT_ID
      );

      await onAddAdmin(newAdmin);

      toast({
        title: dict?.settings?.admins?.invitedSuccessTitle || "Administrator Invited Successfully",
        description: (dict?.settings?.admins?.invitedSuccessDescription || "Invitation sent to {email}.").replace("{email}", values.email),
        variant: "default",
        className: "bg-green-50 border-green-200 text-green-900",
      });

      setOpen(false);
      form.reset();
    } catch (err: any) {
      const msg = err?.message || (dict?.settings?.admins?.inviteFailedDescription || "Failed to invite administrator");
      form.setError("root", { message: msg });
      toast({
        title: dict?.tenants?.invitationFailed || "Invitation Failed",
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
          {dict?.settings?.admins?.addAdmin || "Add Administrator"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{dict?.settings?.admins?.newAdmin || "Invite New Administrator"}</DialogTitle>
          <DialogDescription>
            {dict?.settings?.admins?.newAdminDescription || "Enter the administrator's details. They will receive an invitation email to complete their registration."}
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
                      <Input placeholder={dict?.settings?.admins?.namePlaceholder || "Full name"} {...field} />
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
                      <Input type="email" placeholder={dict?.settings?.admins?.emailPlaceholder || "admin@example.com"} {...field} />
                    </FormControl>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            {form.formState.errors.root && (
              <p className="text-sm text-destructive text-center">{form.formState.errors.root.message}</p>
            )}
            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting ? (dict?.tenants?.sendingInvite || "Sending Invite...") : (dict?.tenants?.sendInvitation || "Send Invitation")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
