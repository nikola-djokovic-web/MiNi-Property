
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle } from "lucide-react";
import { Property } from "@/lib/data";

export default function AddTenantRequestDialog({
  properties,
  onAddRequest,
}: {
  properties: Property[];
  onAddRequest: (newRequest: any) => void;
}) {
  const [open, setOpen] = useState(false);
  const [issue, setIssue] = useState("");
  const [priority, setPriority] = useState("Low");
  const [propertyId, setPropertyId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (properties.length === 1 && !propertyId) {
        setPropertyId(properties[0].id);
    }
  }, [properties, propertyId]);


  const handleSubmit = () => {
    if (!propertyId) {
        // Maybe show a toast or error message
        return;
    }
    onAddRequest({
      propertyId,
      issue,
      priority,
    });
    setOpen(false);
    setIssue("");
    setPriority("Low");
    if (properties.length > 1) {
        setPropertyId(undefined);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Request
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Maintenance Request</DialogTitle>
          <DialogDescription>
            Describe the issue you're experiencing.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {properties.length > 1 && (
             <div className="space-y-2">
                <Label htmlFor="property">Property</Label>
                 <Select value={propertyId} onValueChange={setPropertyId}>
                    <SelectTrigger id="property">
                        <SelectValue placeholder="Select a property" />
                    </SelectTrigger>
                    <SelectContent>
                        {properties.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
             </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="issue">Issue</Label>
            <Textarea
              id="issue"
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              placeholder="e.g., The kitchen sink is leaking."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger id="priority">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!propertyId || !issue}>Submit Request</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
