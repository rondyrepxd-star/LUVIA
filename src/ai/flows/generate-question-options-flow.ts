'use server';
/**
 * @fileOverview Un flujo de Genkit para generar opciones y distractores dinámicos.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateQuestionOptionsInputSchema = z.object({
  question: z.string().describe('La pregunta formulada por el usuario.'),
  existingCorrectAnswer: z.string().optional().describe('La respuesta correcta opcional proporcionada por el usuario.'),
  numberOfOptions: z.number().int().min(2).max(10).describe('El número total de opciones a generar.'),
});
export type GenerateQuestionOptionsInput = z.infer<typeof GenerateQuestionOptionsInputSchema>;

const GenerateQuestionOptionsOutputSchema = z.object({
  options: z.array(z.string()).describe('Un array de opciones, incluyendo la respuesta correcta.'),
  correctAnswer: z.string().describe('La respuesta correcta entre las opciones.'),
});
export type GenerateQuestionOptionsOutput = z.infer<typeof GenerateQuestionOptionsOutputSchema>;

export async function generateQuestionOptions(input: GenerateQuestionOptionsInput): Promise<GenerateQuestionOptionsOutput> {
  return generateQuestionOptionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateQuestionOptionsPrompt',
  input: { schema: GenerateQuestionOptionsInputSchema },
  output: { schema: GenerateQuestionOptionsOutputSchema },
  prompt: `Analiza esta pregunta: {{{question}}}. 
{{#if existingCorrectAnswer}}
El usuario ha marcado esta respuesta como correcta: {{{existingCorrectAnswer}}}.
{{/if}}
Genera un objeto JSON con exactamente {{{numberOfOptions}}} opciones. Una de ellas debe ser la respuesta correcta y las demás deben ser distractores plausibles.
Si el usuario ya dio la respuesta correcta, úsala obligatoriamente.`,
});

const generateQuestionOptionsFlow = ai.defineFlow(
  {
    name: 'generateQuestionOptionsFlow',
    inputSchema: GenerateQuestionOptionsInputSchema,
    outputSchema: GenerateQuestionOptionsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('No se pudo generar las opciones.');
    }
    return output;
  }
);
