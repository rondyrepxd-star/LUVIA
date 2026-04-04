'use server';
/**
 * @fileOverview A Genkit flow for generating a set of flashcards from notebook content.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateFlashcardsInputSchema = z.object({
  notebookContent: z.string().describe('The content of the notebook.'),
  count: z.number().int().min(1).max(20).default(5),
});
export type GenerateFlashcardsInput = z.infer<typeof GenerateFlashcardsInputSchema>;

const FlashcardSchema = z.object({
  front: z.string().describe('The concept or question on the front.'),
  back: z.string().describe('The definition or answer on the back.'),
  imagePrompt: z.string().optional().describe('A prompt for generating a visual aid image.'),
});

const GenerateFlashcardsOutputSchema = z.object({
  flashcards: z.array(FlashcardSchema),
});
export type GenerateFlashcardsOutput = z.infer<typeof GenerateFlashcardsOutputSchema>;

export async function generateFlashcards(input: GenerateFlashcardsInput): Promise<GenerateFlashcardsOutput> {
  return generateFlashcardsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateFlashcardsPrompt',
  input: { schema: GenerateFlashcardsInputSchema },
  output: { schema: GenerateFlashcardsOutputSchema },
  prompt: `You are an expert academic tutor. Create {{count}} high-quality flashcards based on the following notes.
  
  Notes:
  ---
  {{notebookContent}}
  ---

  Rules:
  - Each 'front' should be a concise term or question.
  - Each 'back' should be a very concise definition or explanation, strictly between 5 and 10 words.
  - Provide a short 'imagePrompt' (2-5 words) that describes a visual representation of the concept.`,
});

const generateFlashcardsFlow = ai.defineFlow(
  {
    name: 'generateFlashcardsFlow',
    inputSchema: GenerateFlashcardsInputSchema,
    outputSchema: GenerateFlashcardsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) throw new Error('Could not generate flashcards.');
    return output;
  }
);
