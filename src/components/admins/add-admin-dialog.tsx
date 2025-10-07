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
import { apiSend } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle } from "lucide-react";

const TENANT_ID = process.env.NEXT_PUBLIC_DEMO_TENANT_ID ?? "";

export default function AddAdminDialog({
  onAddAdmin,
}: {
  onAddAdmin: (admin: any) => void;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
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

    setSubmitting(true);
    try {
      console.log("About to send admin invitation with TENANT_ID:", TENANT_ID);
      const { data: newAdmin } = await apiSend<{ data: any }>(
        "/api/admins",
        "POST",
        {
          name,
          email,
        },
        TENANT_ID
      );

      console.log("Inviting admin:", newAdmin);
      
      await onAddAdmin(newAdmin);
      
      toast({
        title: "Administrator Invited Successfully",
        description: `Invitation sent to ${email}.`,
        variant: "default",
        className: "bg-green-50 border-green-200 text-green-900",
      });
      
      setOpen(false);
      // Reset form
      setName("");
      setEmail("");
    } catch (err: any) {
      const msg = err?.message || "Failed to invite administrator";
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
          Add Administrator
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite New Administrator</DialogTitle>
          <DialogDescription>
            Enter the administrator's details. They will receive an invitation email to complete their registration.
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
              placeholder="Full name"
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
              placeholder="admin@example.com"
            />
          </div>
          {emailError && (
            <p className="text-sm text-destructive">{emailError}</p>
          )}
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Sending..." : "Send Invitation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}