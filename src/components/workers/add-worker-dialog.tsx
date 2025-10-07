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
import { PlusCircle } from "lucide-react";

export default function AddWorkerDialog({
  onAddWorker,
}: {
  onAddWorker: (worker: { name?: string; email: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const emailValid = email.trim().length > 0 && /.+@.+\..+/.test(email);

  const handleSubmit = () => {
    if (!emailValid) return;
    onAddWorker({ name: name.trim() || undefined, email: email.trim().toLowerCase() });
    setOpen(false);
    // Reset form
    setName("");
    setEmail("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Worker
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" title="Add worker">
        <DialogHeader>
          <DialogTitle>Add New Worker</DialogTitle>
          <DialogDescription>
            Enter the worker's name (optional) and email. They'll finish registration and set their password.
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
              placeholder="e.g. Bob the Builder"
              autoComplete="name"
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
              onChange={(e) => setEmail(e.target.value)}
              className="col-span-3"
              placeholder="e.g. worker@example.com"
              autoComplete="email"
              required
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={!emailValid}>
            Invite Worker
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
