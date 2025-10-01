'use server';
/**
 * @fileOverview An AI agent for triaging maintenance requests.
 *
 * - triageMaintenanceRequest - A function that suggests a priority and category for a maintenance request.
 * - TriageMaintenanceRequestInput - The input type for the triageMaintenanceRequest function.
 * - TriageMaintenanceRequestOutput - The return type for the triageMaintenanceRequest function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TriageMaintenanceRequestInputSchema = z.object({
  title: z.string().describe('The title of the maintenance issue.'),
  details: z
    .string()
    .describe('A detailed description of the maintenance issue.'),
});
export type TriageMaintenanceRequestInput = z.infer<
  typeof TriageMaintenanceRequestInputSchema
>;

const TriageMaintenanceRequestOutputSchema = z.object({
  priority: z
    .enum(['Low', 'Medium', 'High'])
    .describe('The suggested priority of the request.'),
  category: z
    .string()
    .describe(
      'A suggested category for the request (e.g., Plumbing, Electrical, HVAC, Appliance, Structural).'
    ),
});
export type TriageMaintenanceRequestOutput = z.infer<
  typeof TriageMaintenanceRequestOutputSchema
>;

export async function triageMaintenanceRequest(
  input: TriageMaintenanceRequestInput
): Promise<TriageMaintenanceRequestOutput> {
  return triageMaintenanceRequestFlow(input);
}

const prompt = ai.definePrompt({
  name: 'triageMaintenanceRequestPrompt',
  input: {schema: TriageMaintenanceRequestInputSchema},
  output: {schema: TriageMaintenanceRequestOutputSchema},
  prompt: `You are an expert property manager responsible for triaging maintenance requests.

  Based on the title and description of the issue, determine a priority and a category for the request.

  Priority levels are:
  - Low: Minor issues, cosmetic repairs, non-urgent problems.
  - Medium: Issues that affect the quality of living but are not emergencies (e.g., broken appliance, slow drain).
  - High: Urgent issues that could cause property damage or pose a safety risk (e.g., major leak, no heat, electrical problems).

  Categories can include, but are not limited to: Plumbing, Electrical, HVAC, Appliance, Structural, Pest Control, Other.

  Issue Title: {{{title}}}
  Issue Details: {{{details}}}

  Analyze the request and provide the most appropriate priority and category.
  `,
});

const triageMaintenanceRequestFlow = ai.defineFlow(
  {
    name: 'triageMaintenanceRequestFlow',
    inputSchema: TriageMaintenanceRequestInputSchema,
    outputSchema: TriageMaintenanceRequestOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
