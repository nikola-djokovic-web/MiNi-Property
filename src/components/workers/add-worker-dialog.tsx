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
import { PlusCircle } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";

const addWorkerSchema = z.object({
  name: z.string().trim().optional(),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
});

type AddWorkerForm = z.infer<typeof addWorkerSchema>;

export default function AddWorkerDialog({
  onAddWorker,
}: {
  onAddWorker: (worker: { name?: string; email: string }) => void | Promise<void>;
}) {
  const { dict } = useTranslation();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<AddWorkerForm>({
    resolver: zodResolver(addWorkerSchema),
    defaultValues: { name: "", email: "" },
  });

  const handleSubmit = async (values: AddWorkerForm) => {
    setSubmitting(true);
    try {
      await onAddWorker({ name: values.name?.trim() || undefined, email: values.email.trim().toLowerCase() });
      setOpen(false);
      form.reset();
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
          {dict?.workers?.addWorker || "Add Worker"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" title="Add worker">
        <DialogHeader>
          <DialogTitle>{dict?.workers?.newWorker || "Add New Worker"}</DialogTitle>
          <DialogDescription>
            {dict?.workers?.newWorkerDescription || "Enter the worker's name (optional) and email. They'll finish registration and set their password."}
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
                      <Input placeholder="e.g. Bob the Builder" autoComplete="name" {...field} />
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
                      <Input type="email" placeholder="e.g. worker@example.com" autoComplete="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {dict?.common?.cancel || "Cancel"}
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (dict?.workers?.inviting || "Inviting...") : (dict?.workers?.inviteWorker || "Invite Worker")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
