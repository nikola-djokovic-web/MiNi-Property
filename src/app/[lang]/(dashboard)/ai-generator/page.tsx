

"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  generateListingAction,
  AIFormState,
} from "./actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import PageHeader from "@/components/page-header";
import { Loader2, Sparkles, Copy, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/use-translation";

function SubmitButton() {
  const { pending } = useFormStatus();
  const { dict } = useTranslation();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="mr-2 h-4 w-4" />
      )}
      {dict?.ai?.generator?.generate || "Generate Listing"}
    </Button>
  );
}

function CopyButton({ textToCopy }: { textToCopy: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="ghost" size="icon" onClick={handleCopy}>
      {copied ? (
        <Check className="h-4 w-4 text-accent" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );
}

export default function AIGeneratorPage() {
  const initialState: AIFormState = { data: null, error: null };
  const [state, formAction] = useActionState(generateListingAction, initialState);
  const { toast } = useToast();
  const { dict } = useTranslation();

  useEffect(() => {
    if (state.error) {
      toast({
        variant: "destructive",
        title: dict?.ai?.generator?.generationFailed || "Generation Failed",
        description: state.error,
      });
    }
  }, [state.error, toast]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={dict?.ai?.generator?.title || "AI Listing Generator"}
        description={dict?.ai?.generator?.description || "Generate an optimized property listing description with AI."}
      />
      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <form action={formAction}>
            <CardHeader>
              <CardTitle>{dict?.ai?.generator?.propertyDetails || "Property Details"}</CardTitle>
              <CardDescription>
                {dict?.ai?.generator?.propertyDetailsDescription || "Provide the details of your property to generate an optimized listing."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="propertyDescription">
                  {dict?.ai?.generator?.propertyDescriptionLabel || "Property Description"}
                </Label>
                <Textarea
                  id="propertyDescription"
                  name="propertyDescription"
                  placeholder={dict?.ai?.generator?.propertyDescriptionPlaceholder || "e.g., A bright and airy 2-bedroom apartment with stunning city views..."}
                  required
                  rows={5}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="propertyType">{dict?.ai?.generator?.propertyTypeLabel || "Property Type"}</Label>
                  <Input
                    id="propertyType"
                    name="propertyType"
                    placeholder={dict?.ai?.generator?.propertyTypePlaceholder || "e.g., Apartment, House"}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">{dict?.ai?.generator?.locationLabel || "Location"}</Label>
                  <Input
                    id="location"
                    name="location"
                    placeholder={dict?.ai?.generator?.locationPlaceholder || "e.g., Downtown, Suburb"}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amenities">{dict?.ai?.generator?.amenitiesLabel || "Amenities"}</Label>
                <Input
                  id="amenities"
                  name="amenities"
                  placeholder={dict?.ai?.generator?.amenitiesPlaceholder || "e.g., Pool, Gym, In-unit laundry"}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetTenant">{dict?.ai?.generator?.targetTenantLabel || "Target Tenant"}</Label>
                <Input
                  id="targetTenant"
                  name="targetTenant"
                  placeholder={dict?.ai?.generator?.targetTenantPlaceholder || "e.g., Young professionals, Families"}
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <SubmitButton />
            </CardFooter>
          </form>
        </Card>

        <div className="space-y-6">
          <Card className="flex-1">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{dict?.ai?.generator?.optimizedTitle || "Optimized Title"}</CardTitle>
                <CardDescription>
                  {dict?.ai?.generator?.optimizedTitleDescription || "A catchy title to grab attention."}
                </CardDescription>
              </div>
              {state.data?.optimizedTitle && (
                <CopyButton textToCopy={state.data.optimizedTitle} />
              )}
            </CardHeader>
            <CardContent>
              {state.data?.optimizedTitle ? (
                <p className="font-headline text-lg">
                  {state.data.optimizedTitle}
                </p>
              ) : (
                <p className="text-muted-foreground">
                  {dict?.ai?.generator?.titlePlaceholderText || "Your generated title will appear here..."}
                </p>
              )}
            </CardContent>
          </Card>
          <Card className="flex-1">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{dict?.ai?.generator?.optimizedDescriptionTitle || "Optimized Description"}</CardTitle>
                <CardDescription>
                  {dict?.ai?.generator?.optimizedDescriptionSubtitle || "A compelling description to attract tenants."}
                </CardDescription>
              </div>
              {state.data?.optimizedDescription && (
                <CopyButton textToCopy={state.data.optimizedDescription} />
              )}
            </CardHeader>
            <CardContent>
              {state.data?.optimizedDescription ? (
                <p className="whitespace-pre-wrap">
                  {state.data.optimizedDescription}
                </p>
              ) : (
                <p className="text-muted-foreground">
                  {dict?.ai?.generator?.descriptionPlaceholderText || "Your generated description will appear here..."}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
