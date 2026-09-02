'use server';
/**
 * @fileOverview An AI agent for generating optimized property listing descriptions and titles.
 *
 * - generateOptimizedListing - A function that generates optimized property listing descriptions and titles.
 * - GenerateOptimizedListingInput - The input type for the generateOptimizedListing function.
 * - GenerateOptimizedListingOutput - The return type for the generateOptimizedListing function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { enforceAiRateLimit } from '@/lib/ai-rate-limit';

const GenerateOptimizedListingInputSchema = z.object({
  propertyDescription: z
    .string().trim().min(1).max(4_000)
    .describe('A detailed description of the property.'),
  propertyType: z.string().trim().min(1).max(100).describe('The type of property (e.g., apartment, house, condo).'),
  location: z.string().trim().min(1).max(200).describe('The location of the property.'),
  amenities: z.string().trim().min(1).max(1_000).describe('A list of amenities offered by the property.'),
  targetTenant: z.string().trim().min(1).max(300).describe('The ideal tenant for this property.'),
});
export type GenerateOptimizedListingInput = z.infer<
  typeof GenerateOptimizedListingInputSchema
>;

const GenerateOptimizedListingOutputSchema = z.object({
  optimizedTitle: z.string().describe('An optimized title for the property listing.'),
  optimizedDescription: z
    .string()
    .describe('An optimized description for the property listing.'),
});
export type GenerateOptimizedListingOutput = z.infer<
  typeof GenerateOptimizedListingOutputSchema
>;

export async function generateOptimizedListing(
  input: GenerateOptimizedListingInput
): Promise<GenerateOptimizedListingOutput> {
  await enforceAiRateLimit();
  return generateOptimizedListingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateOptimizedListingPrompt',
  input: {schema: GenerateOptimizedListingInputSchema},
  output: {schema: GenerateOptimizedListingOutputSchema},
  prompt: `You are an expert real estate marketing copywriter.

  Based on the following information about a property, generate an optimized title and description designed to maximize tenant interest and visibility.

  Property Type: {{{propertyType}}}
  Location: {{{location}}}
  Description: {{{propertyDescription}}}
  Amenities: {{{amenities}}}
  Target Tenant: {{{targetTenant}}}

  Focus on highlighting the most attractive features and benefits for the target tenant. Write in a clear, concise, and engaging style.
  `,
});

const generateOptimizedListingFlow = ai.defineFlow(
  {
    name: 'generateOptimizedListingFlow',
    inputSchema: GenerateOptimizedListingInputSchema,
    outputSchema: GenerateOptimizedListingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
