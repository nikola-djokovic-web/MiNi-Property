
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
import { useTranslation } from "@/hooks/use-translation";

const requestTemplateDefs = [
    {
        value: "leaky-faucet",
        key: "leakyFaucet" as const,
        fallbackLabel: "Leaky Faucet",
        fallbackTemplate: "Location of faucet (e.g., kitchen, bathroom sink, shower):\n\nIs it hot or cold water, or both?:\n\nIs it a constant drip or only when in use?:\n\nAny other details:",
    },
    {
        value: "clogged-drain",
        key: "cloggedDrain" as const,
        fallbackLabel: "Clogged Drain",
        fallbackTemplate: "Location of drain (e.g., kitchen sink, shower, toilet):\n\nIs it completely clogged or slow draining?:\n\nHave you tried any remedies yourself?:\n\nAny other details:",
    },
    {
        value: "appliance-issue",
        key: "applianceIssue" as const,
        fallbackLabel: "Appliance Issue",
        fallbackTemplate: "Which appliance is having a problem (e.g., refrigerator, oven, dishwasher)?:\n\nWhat is the specific issue? (e.g., not turning on, making strange noises, not cooling):\n\nHave you tried troubleshooting (e.g., power cycling)?:\n\nAny other details:",
    },
    {
        value: "no-hot-water",
        key: "noHotWater" as const,
        fallbackLabel: "No Hot Water",
        fallbackTemplate: "Is there no hot water anywhere in the unit, or just at a specific faucet?:\n\nIs the water cold, or just lukewarm?:\n\nAny other details:",
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
  const { dict } = useTranslation();

  const requestTemplates = requestTemplateDefs.map((t) => ({
    value: t.value,
    label: dict?.maintenance?.templates?.[t.key]?.label || t.fallbackLabel,
    template: dict?.maintenance?.templates?.[t.key]?.template || t.fallbackTemplate,
  }));

  useEffect(() => {
    if (open) {
        setIssue("");
        setDetails("");
        // Auto-select property if there's only one
        if (properties.length === 1) {
            setPropertyId(properties[0].id);
        } else {
            setPropertyId(undefined);
        }
    }
  }, [open, properties]);


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
            title: dict?.maintenance?.requestSubmitted || "Request Submitted!",
            description: dict?.maintenance?.requestSubmittedDescription || "We've received your request and will triage it shortly.",
        });
        setOpen(false);
    } catch (error) {
        toast({
            variant: "destructive",
            title: dict?.maintenance?.submissionFailed || "Submission Failed",
            description: dict?.maintenance?.submissionFailedDescription || "Could not submit your request. Please try again.",
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
          {dict?.maintenance?.newRequest || "New Request"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dict?.maintenance?.newMaintenanceRequestTitle || "New Maintenance Request"}</DialogTitle>
          <DialogDescription>
            {dict?.maintenance?.newTenantRequestDescription || "Describe the issue you're experiencing. Our AI will automatically suggest a priority for you."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {properties.length === 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                {dict?.maintenance?.noPropertiesAvailable || "No properties are available for maintenance requests. Please contact your administrator."}
              </p>
            </div>
          )}
          {properties.length > 1 && (
             <div className="space-y-2">
                <Label htmlFor="property">{dict?.common?.property || "Property"}</Label>
                 <Select value={propertyId} onValueChange={setPropertyId}>
                    <SelectTrigger id="property">
                        <SelectValue placeholder={dict?.maintenance?.selectPropertyPlaceholder || "Select a property"} />
                    </SelectTrigger>
                    <SelectContent>
                        {properties.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
             </div>
          )}
          {properties.length === 1 && (
            <div className="space-y-2">
              <Label>{dict?.common?.property || "Property"}</Label>
              <div className="p-2 bg-muted rounded-md text-sm">
                {properties[0].title}
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="issue">{dict?.maintenance?.issueTitle || "Issue Title"}</Label>
            <Input
              id="issue"
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              placeholder={dict?.maintenance?.issuePlaceholder || "e.g., Leaky kitchen faucet"}
            />
          </div>

          <div className="space-y-2">
             <Label htmlFor="template-select">{dict?.maintenance?.templateLabel || "Use a template (optional)"}</Label>
             <Select onValueChange={handleTemplateChange}>
                <SelectTrigger id="template-select">
                    <SelectValue placeholder={dict?.maintenance?.templatePlaceholder || "Select a template..."} />
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
            <Label htmlFor="details">{dict?.maintenance?.details || "Details"}</Label>
            <Textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder={dict?.maintenance?.detailsPlaceholderTenant || "Please provide as much detail as possible about the issue."}
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
            {dict?.maintenance?.submitAndTriage || "Submit and Triage"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
