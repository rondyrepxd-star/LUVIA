'use server';
/**
 * @fileOverview A Genkit flow for generating matching pairs from study material.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateMatchingPairsInputSchema = z.object({
  notebookContent: z.string().describe('The content of the notebook for reference.'),
});
export type GenerateMatchingPairsInput = z.infer<typeof GenerateMatchingPairsInputSchema>;

const GenerateMatchingPairsOutputSchema = z.object({
  pairs: z.array(z.object({
    prompt: z.string().describe('The concept or term.'),
    match: z.string().describe('The matching definition or description.')
  })).describe('A list of matching pairs.'),
});
export type GenerateMatchingPairsOutput = z.infer<typeof GenerateMatchingPairsOutputSchema>;

export async function generateMatchingPairs(input: GenerateMatchingPairsInput): Promise<GenerateMatchingPairsOutput> {
  return generateMatchingPairsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMatchingPairsPrompt',
  input: { schema: GenerateMatchingPairsInputSchema },
  output: { schema: GenerateMatchingPairsOutputSchema },
  prompt: `You are an expert academic assistant. Your task is to extract at least 5 key concepts and their corresponding definitions or related facts from the following study material to create a matching question.

Notebook Content:
---
{{{notebookContent}}}
---

Rules:
- Each pair must be distinct and factually accurate based on the text.
- Prompts should be concise (1-3 words).
- Matches should be clear and definitive descriptions.`,
});

const generateMatchingPairsFlow = ai.defineFlow(
  {
    name: 'generateMatchingPairsFlow',
    inputSchema: GenerateMatchingPairsInputSchema,
    outputSchema: GenerateMatchingPairsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) throw new Error('Could not generate matching pairs.');
    return output;
  }
);