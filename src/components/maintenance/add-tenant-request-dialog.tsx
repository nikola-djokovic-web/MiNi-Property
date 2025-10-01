
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
import { PlusCircle, AlertTriangle, Loader2, Sparkles } from "lucide-react";
import { Property } from "@/lib/data";
import { Input } from "../ui/input";
import { useToast } from "@/hooks/use-toast";


const requestTemplates = [
    {
        value: "leaky-faucet",
        label: "Leaky Faucet",
        template: "Location of faucet (e.g., kitchen, bathroom sink, shower):\n\nIs it hot or cold water, or both?:\n\nIs it a constant drip or only when in use?:\n\nAny other details:",
    },
    {
        value: "clogged-drain",
        label: "Clogged Drain",
        template: "Location of drain (e.g., kitchen sink, shower, toilet):\n\nIs it completely clogged or slow draining?:\n\nHave you tried any remedies yourself?:\n\nAny other details:",
    },
    {
        value: "appliance-issue",
        label: "Appliance Issue",
        template: "Which appliance is having a problem (e.g., refrigerator, oven, dishwasher)?:\n\nWhat is the specific issue? (e.g., not turning on, making strange noises, not cooling):\n\nHave you tried troubleshooting (e.g., power cycling)?:\n\nAny other details:",
    },
    {
        value: "no-hot-water",
        label: "No Hot Water",
        template: "Is there no hot water anywhere in the unit, or just at a specific faucet?:\n\nIs the water cold, or just lukewarm?:\n\nAny other details:",
    }
]


export default function AddTenantRequestDialog({
  properties,
  onAddRequest,
}: {
  properties: Property[];
  onAddRequest: (newRequest: any) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [issue, setIssue] = useState("");
  const [details, setDetails] = useState("");
  const [propertyId, setPropertyId] = useState<string | undefined>(undefined);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
        setIssue("");
        setDetails("");
        if (properties.length === 1 && !propertyId) {
            setPropertyId(properties[0].id);
        } else if (properties.length > 1) {
            setPropertyId(undefined);
        }
    }
  }, [open, properties, propertyId]);


  const handleTemplateChange = (templateValue: string) => {
    const selectedTemplate = requestTemplates.find(t => t.value === templateValue);
    if (selectedTemplate) {
        setDetails(selectedTemplate.template);
    }
  }


  const handleSubmit = async () => {
    if (!propertyId || !issue) {
        return;
    }
    setIsSubmitting(true);
    try {
        await onAddRequest({
          propertyId,
          issue, // This will be the title
          details,
        });
        toast({
            title: "Request Submitted!",
            description: "We've received your request and will triage it shortly.",
        });
        setOpen(false);
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Submission Failed",
            description: "Could not submit your request. Please try again.",
        });
    } finally {
        setIsSubmitting(false);
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
            Describe the issue you're experiencing. Our AI will automatically suggest a priority for you.
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
            <Label htmlFor="issue">Issue Title</Label>
            <Input
              id="issue"
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              placeholder="e.g., Leaky kitchen faucet"
            />
          </div>

          <div className="space-y-2">
             <Label htmlFor="template-select">Use a template (optional)</Label>
             <Select onValueChange={handleTemplateChange}>
                <SelectTrigger id="template-select">
                    <SelectValue placeholder="Select a template..." />
                </SelectTrigger>
                <SelectContent>
                    {requestTemplates.map(template => (
                        <SelectItem key={template.value} value={template.value}>
                            {template.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="details">Details</Label>
            <Textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Please provide as much detail as possible about the issue."
              rows={6}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!propertyId || !issue || isSubmitting}>
             {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
             ) : (
                <Sparkles className="mr-2 h-4 w-4" />
             )}
            Submit and Triage
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
