'use server';
/**
 * @fileOverview A Genkit flow for generating a logical sequence of steps from study material.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateOrderingStepsInputSchema = z.object({
  notebookContent: z.string().describe('The content of the notebook for reference.'),
  topic: z.string().optional().describe('An optional specific topic to generate steps for.'),
});
export type GenerateOrderingStepsInput = z.infer<typeof GenerateOrderingStepsInputSchema>;

const GenerateOrderingStepsOutputSchema = z.object({
  title: z.string().describe('The title of the ordering question (e.g., "Order the steps for...")'),
  steps: z.array(z.string()).describe('A list of steps in the correct order.'),
});
export type GenerateOrderingStepsOutput = z.infer<typeof GenerateOrderingStepsOutputSchema>;

export async function generateOrderingSteps(input: GenerateOrderingStepsInput): Promise<GenerateOrderingStepsOutput> {
  return generateOrderingStepsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateOrderingStepsPrompt',
  input: { schema: GenerateOrderingStepsInputSchema },
  output: { schema: GenerateOrderingStepsOutputSchema },
  prompt: `You are an expert academic tutor. Your task is to identify a logical sequence, process, or chronological set of events from the provided study material.

Notebook Content:
---
{{{notebookContent}}}
---

Rules:
- Generate a sequence of 4 to 6 steps.
- The 'title' should clearly state what the student needs to order.
- The 'steps' must be in the ABSOLUTE CORRECT order.
- Ensure the steps are distinct and follow a clear logical or chronological path found in the text.`,
});

const generateOrderingStepsFlow = ai.defineFlow(
  {
    name: 'generateOrderingStepsFlow',
    inputSchema: GenerateOrderingStepsInputSchema,
    outputSchema: GenerateOrderingStepsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) throw new Error('Could not generate ordering steps.');
    return output;
  }
);
