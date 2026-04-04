'use server';
/**
 * @fileOverview Un flujo de Genkit para generar pistas sutiles para preguntas.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateHintInputSchema = z.object({
  question: z.string().describe('La pregunta del quiz.'),
  correctAnswer: z.string().describe('La respuesta correcta.'),
});
export type GenerateHintInput = z.infer<typeof GenerateHintInputSchema>;

const GenerateHintOutputSchema = z.object({
  hint: z.string().describe('La pista sutil generada.'),
});
export type GenerateHintOutput = z.infer<typeof GenerateHintOutputSchema>;

export async function generateHint(input: GenerateHintInput): Promise<GenerateHintOutput> {
  return generateHintFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateHintPrompt',
  input: { schema: GenerateHintInputSchema },
  output: { schema: GenerateHintOutputSchema },
  prompt: `Actúa como un tutor experto. Tu tarea es generar una pista sutil para la siguiente pregunta: "{{{question}}}".
La respuesta correcta es "{{{correctAnswer}}}".

Reglas:
- No reveles la respuesta.
- La pista debe ayudar al estudiante a razonar o recordar un concepto clave.
- Sé breve y motivador.`,
});

const generateHintFlow = ai.defineFlow(
  {
    name: 'generateHintFlow',
    inputSchema: GenerateHintInputSchema,
    outputSchema: GenerateHintOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) throw new Error('No se pudo generar la pista.');
    return output;
  }
);
