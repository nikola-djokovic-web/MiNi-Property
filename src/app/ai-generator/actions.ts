"use server";

import {
  generateOptimizedListing,
  GenerateOptimizedListingInput,
  GenerateOptimizedListingOutput,
} from "@/ai/flows/generate-optimized-property-listing";

export type AIFormState = {
  data: GenerateOptimizedListingOutput | null;
  error: string | null;
};

export async function generateListingAction(
  prevState: AIFormState,
  formData: FormData
): Promise<AIFormState> {
  const input: GenerateOptimizedListingInput = {
    propertyDescription: formData.get("propertyDescription") as string,
    propertyType: formData.get("propertyType") as string,
    location: formData.get("location") as string,
    amenities: formData.get("amenities") as string,
    targetTenant: formData.get("targetTenant") as string,
  };

  try {
    const result = await generateOptimizedListing(input);
    return { data: result, error: null };
  } catch (e: any) {
    const errorMessage = e.message || "An unexpected error occurred.";
    return { data: null, error: errorMessage };
  }
}
