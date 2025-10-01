'use server';
/**
 * @fileOverview An AI agent for answering tenant questions.
 *
 * - tenantChatbot - A function that answers common tenant questions.
 * - TenantChatbotInput - The input type for the tenantChatbot function.
 * - TenantChatbotOutput - The return type for the tenantChatbot function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TenantChatbotInputSchema = z.object({
  question: z.string().describe('The tenant\'s question.'),
});
export type TenantChatbotInput = z.infer<typeof TenantChatbotInputSchema>;

const TenantChatbotOutputSchema = z.object({
  answer: z
    .string()
    .describe('The answer to the tenant\'s question.'),
});
export type TenantChatbotOutput = z.infer<typeof TenantChatbotOutputSchema>;

export async function tenantChatbot(
  input: TenantChatbotInput
): Promise<TenantChatbotOutput> {
  return tenantChatbotFlow(input);
}

const prompt = ai.definePrompt({
  name: 'tenantChatbotPrompt',
  input: {schema: TenantChatbotInputSchema},
  output: {schema: TenantChatbotOutputSchema},
  prompt: `You are a friendly and helpful AI assistant for tenants of MiNi Property Management.

  Your goal is to answer tenant questions based on the following knowledge base. If the answer isn't in the knowledge base, politely say that you don't have that information and advise them to contact the property manager directly.

  **Knowledge Base:**

  *   **Rent Payment:** Rent is due on the 1st of every month. It can be paid online through the tenant portal. A late fee of $50 is applied after the 5th of the month.
  *   **Maintenance Requests:** Tenants should submit all maintenance requests through the "Maintenance" section of the tenant portal. For emergencies like a major leak or fire, they should call the emergency hotline at (555) 111-2222.
  *   **Quiet Hours:** Quiet hours are from 10:00 PM to 8:00 AM every day. Please be respectful of your neighbors.
  *   **Guests:** Guests are welcome. Any guest staying for more than 7 consecutive days must be approved by management.
  *   **Parking:** Each unit has one designated parking spot. Guest parking is available in the marked "Guest" spaces. Street parking is managed by the city.
  *   **Trash and Recycling:** Trash and recycling bins are located at the back of the property. Trash is collected on Tuesdays and Fridays. Recycling is collected on Tuesdays.
  *   **Contacting Management:** For non-urgent matters, you can send a message through the portal or call the office at (555) 333-4444 during business hours (9 AM - 5 PM, Mon-Fri).

  ---

  Tenant Question: {{{question}}}

  Now, provide a clear and concise answer.
  `,
});

const tenantChatbotFlow = ai.defineFlow(
  {
    name: 'tenantChatbotFlow',
    inputSchema: TenantChatbotInputSchema,
    outputSchema: TenantChatbotOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
