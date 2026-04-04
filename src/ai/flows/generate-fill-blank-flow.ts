'use server';
/**
 * @fileOverview Un flujo de Genkit para generar oraciones con espacios en blanco basados en notas con un protocolo técnico obligatorio.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateFillBlankInputSchema = z.object({
  notebookContent: z.string().describe('El contenido del cuaderno para referencia.'),
});
export type GenerateFillBlankInput = z.infer<typeof GenerateFillBlankInputSchema>;

const GenerateFillBlankOutputSchema = z.object({
  question_text: z.string().describe('La oración generada con el marcador __BLANK__ donde debe ir el espacio.'),
  answers: z.array(z.string()).describe('Las respuestas correctas para cada espacio __BLANK__ detectado.'),
  hint: z.string().describe('Una pista sutil para ayudar al estudiante.'),
  explanation: z.string().describe('Una explicación detallada de por qué la respuesta es correcta.'),
});
export type GenerateFillBlankOutput = z.infer<typeof GenerateFillBlankOutputSchema>;

export async function generateFillBlank(input: GenerateFillBlankInput): Promise<GenerateFillBlankOutput> {
  return generateFillBlankFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateFillBlankPrompt',
  input: { schema: GenerateFillBlankInputSchema },
  output: { schema: GenerateFillBlankOutputSchema },
  prompt: `Actúa como un generador de exámenes profesional. Tu tarea es crear una pregunta de tipo 'Fill in the Blank' basada en este texto:

---
{{{notebookContent}}}
---

Protocolo Técnico Obligatorio:
1. Analizar el contexto: Lee el contenido del cuaderno proporcionado.
2. Seleccionar una idea: Elige una frase clave que defina un concepto fundamental.
3. Insertar el marcador: Sustituye la palabra o concepto clave ÚNICAMENTE por la cadena __BLANK__. No uses guiones bajos sueltos ni corchetes. Solo __BLANK__.
4. Extraer la solución: Guarda la palabra exacta que eliminaste.
5. Generar metadatos: Crea una pista (hint) sutil y una explicación detallada del concepto.

Responde ÚNICAMENTE en el formato JSON especificado por el esquema de salida para que mi sistema lo procese correctamente.

Prohibido:
- No pongas la respuesta dentro de la oración.
- No generes más de un hueco (__BLANK__).
- No añadas texto extra fuera del JSON.`,
});

const generateFillBlankFlow = ai.defineFlow(
  {
    name: 'generateFillBlankFlow',
    inputSchema: GenerateFillBlankInputSchema,
    outputSchema: GenerateFillBlankOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) throw new Error('No se pudo generar la pregunta de completar espacios.');
    return output;
  }
);
