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
import { Pencil } from "lucide-react";
import { Property, workers as allWorkers } from "@/lib/data";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { apiSend } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/use-translation";

const TENANT_ID = process.env.NEXT_PUBLIC_DEMO_TENANT_ID ?? "";

type Worker = (typeof allWorkers)[0];

const editWorkerSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
});

type EditWorkerForm = z.infer<typeof editWorkerSchema>;

export default function EditWorkerDialog({
  worker,
  properties,
  onUpdateWorker,
}: {
  worker: Worker;
  properties: Property[];
  onUpdateWorker: (worker: any) => void;
}) {
  const { toast } = useToast();
  const { dict } = useTranslation();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<EditWorkerForm>({
    resolver: zodResolver(editWorkerSchema),
    values: { name: worker.name ?? "", email: worker.email ?? "" },
  });

  const handleSubmit = async (values: EditWorkerForm) => {
    setSubmitting(true);
    try {
      const { data: updated } = await apiSend<{ data: any }>(
        `/api/workers/${worker.id}`,
        "PUT",
        values,
        TENANT_ID
      );
      onUpdateWorker(updated);
      toast({ title: dict?.workers?.updated || "Worker updated" });
      setOpen(false);
    } catch (err: any) {
      toast({
        title: dict?.workers?.updateFailed || "Failed to update worker",
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
              <span className="sr-only">{dict?.workers?.editWorker || "Edit Worker"}</span>
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>{dict?.workers?.editWorker || "Edit Worker"}</p>
        </TooltipContent>
      </Tooltip>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{dict?.workers?.editWorker || "Edit Worker"}</DialogTitle>
          <DialogDescription>
            {(dict?.workers?.editWorkerDescription || "Update the details for {name}. Property assignments are managed from each property's page.").replace("{name}", worker.name)}
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
