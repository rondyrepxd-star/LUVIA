'use server';
/**
 * @fileOverview Un flujo de Genkit para generar explicaciones detalladas para preguntas basadas en notas.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateExplanationInputSchema = z.object({
  question: z.string().describe('La pregunta del quiz.'),
  correctAnswer: z.string().describe('La respuesta correcta.'),
  notebookContent: z.string().describe('El contenido del cuaderno para referencia.'),
});
export type GenerateExplanationInput = z.infer<typeof GenerateExplanationInputSchema>;

const GenerateExplanationOutputSchema = z.object({
  explanation: z.string().describe('La explicación detallada generada.'),
});
export type GenerateExplanationOutput = z.infer<typeof GenerateExplanationOutputSchema>;

export async function generateExplanation(input: GenerateExplanationInput): Promise<GenerateExplanationOutput> {
  return generateExplanationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateExplanationPrompt',
  input: { schema: GenerateExplanationInputSchema },
  output: { schema: GenerateExplanationOutputSchema },
  prompt: `Eres un asistente de estudio avanzado. Genera una explicación detallada de por qué "{{{correctAnswer}}}" es la respuesta correcta a la pregunta: "{{{question}}}".

Utiliza el siguiente contenido del cuaderno como base para tu explicación:
---
{{{notebookContent}}}
---

La explicación debe ser educativa, clara y mencionar conceptos específicos del contenido proporcionado.`,
});

const generateExplanationFlow = ai.defineFlow(
  {
    name: 'generateExplanationFlow',
    inputSchema: GenerateExplanationInputSchema,
    outputSchema: GenerateExplanationOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) throw new Error('No se pudo generar la explicación.');
    return output;
  }
);
