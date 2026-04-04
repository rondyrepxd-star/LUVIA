'use server';
/**
 * @fileOverview A Genkit flow for generating primary and alternative answers for a short answer question.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateShortAnswerAnswersInputSchema = z.object({
  question: z.string().describe('The question for the short answer quiz.'),
  notebookContent: z.string().describe('The content of the notebook for reference.'),
});
export type GenerateShortAnswerAnswersInput = z.infer<typeof GenerateShortAnswerAnswersInputSchema>;

const GenerateShortAnswerAnswersOutputSchema = z.object({
  primaryAnswer: z.string().describe('The primary correct answer.'),
  alternatives: z.array(z.string()).describe('A list of acceptable alternative answers or synonyms.'),
  caseSensitive: z.boolean().describe('Whether the comparison should be case sensitive.'),
});
export type GenerateShortAnswerAnswersOutput = z.infer<typeof GenerateShortAnswerAnswersOutputSchema>;

export async function generateShortAnswerAnswers(input: GenerateShortAnswerAnswersInput): Promise<GenerateShortAnswerAnswersOutput> {
  return generateShortAnswerAnswersFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateShortAnswerAnswersPrompt',
  input: { schema: GenerateShortAnswerAnswersInputSchema },
  output: { schema: GenerateShortAnswerAnswersOutputSchema },
  prompt: `You are an expert academic tutor. Given the following question and context, determine the most accurate short answer (one or two words) and provide at least 2 alternative variations that a student might reasonably use.

Question: {{{question}}}

Notebook Content:
---
{{{notebookContent}}}
---

Rules:
- Primary answer should be the most standard one.
- Alternatives should cover synonyms or different naming conventions.
- Set caseSensitive to true only if the answer is a case-specific technical term or acronym.`,
});

const generateShortAnswerAnswersFlow = ai.defineFlow(
  {
    name: 'generateShortAnswerAnswersFlow',
    inputSchema: GenerateShortAnswerAnswersInputSchema,
    outputSchema: GenerateShortAnswerAnswersOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) throw new Error('Could not generate short answer answers.');
    return output;
  }
);
