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
  try {
    // Check if API key is available
    if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
      console.warn('No Gemini API key found, using fallback triage logic');
      return fallbackTriage(input);
    }
    
    return await triageMaintenanceRequestFlow(input);
  } catch (error) {
    console.warn('AI triage failed, using fallback logic:', error);
    return fallbackTriage(input);
  }
}

// Fallback logic when AI is not available
function fallbackTriage(input: TriageMaintenanceRequestInput): TriageMaintenanceRequestOutput {
  const title = input.title.toLowerCase();
  const details = input.details.toLowerCase();
  const combined = `${title} ${details}`;

  // Determine priority based on keywords
  let priority: 'Low' | 'Medium' | 'High' = 'Medium';
  
  // High priority keywords
  const highPriorityKeywords = [
    'emergency', 'urgent', 'flooding', 'flood', 'leak', 'major leak', 
    'no heat', 'no heating', 'no hot water', 'electrical', 'electricity',
    'gas', 'safety', 'dangerous', 'broken lock', 'security', 'fire',
    'smoke', 'sparking', 'water damage', 'burst pipe', 'no power'
  ];
  
  // Low priority keywords  
  const lowPriorityKeywords = [
    'cosmetic', 'paint', 'minor', 'small', 'touch up', 'aesthetic',
    'squeaky', 'loose', 'slow', 'sticky', 'maintenance'
  ];

  if (highPriorityKeywords.some(keyword => combined.includes(keyword))) {
    priority = 'High';
  } else if (lowPriorityKeywords.some(keyword => combined.includes(keyword))) {
    priority = 'Low';
  }

  // Determine category based on keywords
  let category = 'Other';
  
  if (combined.includes('water') || combined.includes('plumb') || combined.includes('drain') || 
      combined.includes('toilet') || combined.includes('sink') || combined.includes('pipe') ||
      combined.includes('faucet') || combined.includes('shower') || combined.includes('leak')) {
    category = 'Plumbing';
  } else if (combined.includes('electric') || combined.includes('power') || combined.includes('outlet') ||
             combined.includes('light') || combined.includes('wiring') || combined.includes('breaker')) {
    category = 'Electrical';
  } else if (combined.includes('heat') || combined.includes('hvac') || combined.includes('air') ||
             combined.includes('ac') || combined.includes('furnace') || combined.includes('thermostat') ||
             combined.includes('cooling') || combined.includes('ventilation')) {
    category = 'HVAC';
  } else if (combined.includes('appliance') || combined.includes('refrigerator') || combined.includes('stove') ||
             combined.includes('dishwasher') || combined.includes('washer') || combined.includes('dryer') ||
             combined.includes('oven') || combined.includes('microwave')) {
    category = 'Appliance';
  } else if (combined.includes('door') || combined.includes('window') || combined.includes('lock') ||
             combined.includes('roof') || combined.includes('wall') || combined.includes('floor') ||
             combined.includes('ceiling') || combined.includes('structural')) {
    category = 'Structural';
  } else if (combined.includes('pest') || combined.includes('bug') || combined.includes('mice') ||
             combined.includes('rat') || combined.includes('insect') || combined.includes('ant')) {
    category = 'Pest Control';
  }

  return { priority, category };
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
