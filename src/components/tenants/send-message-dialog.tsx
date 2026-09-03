
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
import { Textarea } from "@/components/ui/textarea";
import { Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/use-translation";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";


export default function SendMessageDialog({ tenant }: { tenant: any }) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const { toast } = useToast();
  const { dict } = useTranslation();

  const handleSubmit = async () => {
    setSending(true);
    try {
      const res = await fetch(`/api/tenants/${tenant.id}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to send message");
      }

      toast({
        title: dict?.tenants?.messageSentTitle || "Message Sent!",
        description: (dict?.tenants?.messageSentDescription || "Your message has been sent to {name}.").replace("{name}", tenant.name),
      });

      setOpen(false);
      setSubject("");
      setMessage("");
    } catch (err: any) {
      toast({
        title: dict?.tenants?.messageSendFailed || "Failed to send message",
        description: err?.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Mail className="h-4 w-4" />
                    <span className="sr-only">{dict?.tenants?.sendMessage || "Send Message"}</span>
                </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
              <p>{dict?.tenants?.sendMessage || "Send Message"}</p>
          </TooltipContent>
      </Tooltip>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{dict?.tenants?.sendMessage || "Send Message"}</DialogTitle>
          <DialogDescription>
            {(dict?.tenants?.composeMessage || "Compose a message to {name}.").replace("{name}", tenant.name)}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="to" className="text-right">
              {dict?.tenants?.messageTo || "To"}
            </Label>
            <Input id="to" value={tenant.email} readOnly className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="subject" className="text-right">
              {dict?.tenants?.messageSubject || "Subject"}
            </Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="col-span-3"
              placeholder={dict?.tenants?.messageSubjectPlaceholder || "e.g., Rent Reminder"}
            />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="message" className="text-right pt-2">
              {dict?.tenants?.messageBody || "Message"}
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="col-span-3"
              rows={6}
              placeholder={dict?.tenants?.messageBodyPlaceholder || "Write your message here..."}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit} disabled={!subject || !message || sending}>
            {sending ? (dict?.tenants?.sending || "Sending...") : (dict?.tenants?.sendMessage || "Send Message")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
