'use server';
/**
 * @fileOverview Un flujo de Genkit para procesar y organizar estéticamente el contenido de documentos importados.
 *
 * - processDocument - Función que organiza el texto plano en un formato de cuaderno profesional.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ProcessDocumentInputSchema = z.object({
  rawText: z.string().describe('El texto extraído del documento original.'),
});
export type ProcessDocumentInput = z.infer<typeof ProcessDocumentInputSchema>;

const ProcessDocumentOutputSchema = z.object({
  title: z.string().describe('Un título optimizado para la nota.'),
  formattedHtml: z.string().describe('El contenido organizado en HTML con tablas, emojis y secciones.'),
});
export type ProcessDocumentOutput = z.infer<typeof ProcessDocumentOutputSchema>;

export async function processDocument(input: ProcessDocumentInput): Promise<ProcessDocumentOutput> {
  return processDocumentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'processDocumentPrompt',
  input: { schema: ProcessDocumentInputSchema },
  output: { schema: ProcessDocumentOutputSchema },
  prompt: `Eres un arquitecto de contenidos de élite. Tu misión es transformar este texto desorganizado en un cuaderno de estudio de alto rendimiento.

CONTENIDO ORIGINAL:
---
{{{rawText}}}
---

REGLAS CRÍTICAS DE DISEÑO:
1. IDIOMA OBLIGATORIO: Debes responder EXACTAMENTE en el mismo idioma en el que está escrito el contenido original (si el texto está en inglés, los títulos y tablas deben estar en inglés; si está en español, en español).
2. ESTRUCTURA: Divide el contenido en secciones lógicas usando H1, H2 y H3.
3. ESTÉTICA PROFESIONAL: Inserta emojis pertinentes al inicio de cada título principal (ej: 📚, 🔬, ⚖️).
4. TABLAS INTELIGENTES: Si detectas comparaciones, listas de precios, cronologías o datos tabulares, genéralos usando <table class="table-cards"> para un diseño moderno de tarjetas.
5. PUNTOS CLAVE: Organiza las ideas secundarias en listas de viñetas elegantes.
6. ENFASIS DE TÉRMINOS: Identifica términos clave, conceptos o definiciones técnicas (especialmente aquellos seguidos de dos puntos, por ejemplo: 'LAND:', 'PROCESO:', 'CONCEPTO:'). Aplica a estos términos (solo la palabra o frase corta del término) un color morado vibrante usando <span style="color: #a855f7; font-weight: bold;">TÉRMINO</span>.
7. FORMATO: Usa negritas para énfasis adicional y separa los bloques con <hr class="my-8 border-white/5" />.
8. PROHIBICIÓN: NO utilices la clase "notame-highlight" ni crees anotaciones automáticas. El usuario añadirá sus propias notas manualmente después.

Tu objetivo es que el resultado parezca un resumen profesional de alta gama, visualmente atractivo y fácil de estudiar.

Responde únicamente con el JSON que contiene el título y el HTML formateado.`,
});

const processDocumentFlow = ai.defineFlow(
  {
    name: 'processDocumentFlow',
    inputSchema: ProcessDocumentInputSchema,
    outputSchema: ProcessDocumentOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) throw new Error('No se pudo procesar el documento.');
    return output;
  }
);
