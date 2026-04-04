'use server';
/**
 * @fileOverview A high-performance Genkit flow for generating comprehensive study sets from notebook content.
 * 
 * This flow analyzes content to create a multiformat learning ecosystem including:
 * - Multiple Choice with plausible distractors
 * - Fill in the Blank with definitions
 * - Flashcards for core concepts
 * - Matching pairs for relationships
 * - Ordering for processes
 * - Reveal for hidden answers
 * - Smart metadata: Explanations, Hints, and Difficulty levels.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateQuizInputSchema = z.object({
  notebookContent: z.string().describe('The content of the user\'s notebook to transform into a study set.'),
  numberOfQuestions: z.number().int().min(1).max(30).describe('Total number of study items to generate.'),
  questionTypes: z.array(z.enum(['multiple_choice', 'true_false', 'fill_in_blank', 'short_answer', 'matching', 'ordering', 'flashcard', 'reveal'])).describe('Desired exercise formats.'),
  difficulty: z.enum(['easy', 'medium', 'hard', 'mixed']).describe('Target difficulty level.'),
  includeExplanations: z.boolean().default(true).describe('Generate rationales for answers.'),
  includeHints: z.boolean().default(true).describe('Generate subtle clues for each item.'),
});
export type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;

const QuizQuestionSchema = z.object({
  type: z.enum(['multiple_choice', 'true_false', 'fill_in_blank', 'short_answer', 'matching', 'ordering', 'flashcard', 'reveal']),
  question: z.string().optional().describe('Main text or instruction for the item.'),
  options: z.array(z.string()).optional().describe('Distractors for MCQ (exactly 4).'),
  correctAnswer: z.string().optional().describe('The primary solution.'),
  matchingPairs: z.array(z.object({
    prompt: z.string(),
    match: z.string()
  })).optional(),
  orderingSteps: z.array(z.string()).optional(),
  acceptableAnswers: z.array(z.string()).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).describe('Item difficulty.'),
  explanation: z.string().optional().describe('Rationale based on the notebook.'),
  hint: z.string().optional().describe('Subtle clue to guide the student.'),
  front: z.string().optional().describe('Front side of flashcard.'),
  back: z.string().optional().describe('Back side of flashcard.'),
  imageUrl: z.string().optional(),
  tags: z.array(z.string()).optional().describe('Relevant concept tags for this item.'),
  independentPreviewSeconds: z.number().optional().describe('Optional independent preview duration for Reveal questions.'),
  caseSensitive: z.boolean().optional(),
  originalIndex: z.number().optional().describe('Internal ID for editing during sessions.'),
  audioUrl: z.string().optional().describe('Optional data URI for an audio clue.'),
  variants: z.array(z.any()).optional().describe('Alternative versions of this question.'),
  variantSelectionMode: z.enum(['all', 'random_1', 'random_2']).optional().default('random_1').describe('Determines how many versions of this question appear in the quiz.'),
});

const GenerateQuizOutputSchema = z.object({
  quiz: z.array(QuizQuestionSchema),
});
export type GenerateQuizOutput = z.infer<typeof GenerateQuizOutputSchema>;

export async function generateQuizFromNotes(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
  return generateQuizFlow(input);
}

const generateQuizPrompt = ai.definePrompt({
  name: 'generateQuizPrompt',
  input: { schema: GenerateQuizInputSchema },
  output: { schema: GenerateQuizOutputSchema },
  prompt: `You are an elite academic architect. Transform the following notebook into a high-performance "Study Ecosystem".

NOTEBOOK CONTENT:
---
{{{notebookContent}}}
---

YOUR MISSION:
1. SCAN & ANALYZE: Identify core concepts, dates, formulas, and hierarchical relationships (e.g., "A is part of B").
2. BULK GENERATION: Create exactly {{numberOfQuestions}} items using a mix of these formats: {{#each questionTypes}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.
3. TARGET DIFFICULTY: {{{difficulty}}}.

STRICT COMPONENT RULES:
- Multiple Choice: 4 options, 1 correct. Distractors MUST be plausible and related to the text.
- Fill in the Blank: Use '__BLANK__' for the key technical term. Store the missing word in 'correctAnswer'.
- Flashcards: Concise concept on 'front', deep definition on 'back'.
- Matching: Relationships from the text in 'matchingPairs'.
- Ordering: Processes or sequences in 'orderingSteps'.
- Reveal: Use 'question' for the clue/term and 'correctAnswer' for the revealed detailed answer.

INTELLIGENT METADATA (MANDATORY):
{{#if includeExplanations}}- EXPLANATION: Provide the specific rationale based DIRECTLY on the notebook content.{{/if}}
{{#if includeHints}}- HINT: A subtle nudge that guides thinking without giving the answer.{{/if}}
- DIFFICULTY: Assign 'easy', 'medium', or 'hard' to each individual item based on conceptual complexity.
- TAGS: Generate 1-2 relevant keyword tags for each question based on its specific topic.

Output ONLY valid JSON following the schema.`,
});

const generateQuizFlow = ai.defineFlow(
  {
    name: 'generateQuizFlow',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: GenerateQuizOutputSchema,
  },
  async (input) => {
    let attempts = 0;
    const maxAttempts = 2;
    
    while (attempts < maxAttempts) {
      try {
        const { output } = await generateQuizPrompt(input);
        if (!output || !output.quiz || output.quiz.length === 0) {
          throw new Error('NO_CONCEPTS_FOUND');
        }
        return output;
      } catch (error: any) {
        attempts++;
        const isQuotaError = error.message?.includes('429') || error.message?.includes('quota');
        
        if (attempts < maxAttempts && isQuotaError) {
          // Wait 4 seconds before retrying to allow quota window to reset
          await new Promise(resolve => setTimeout(resolve, 4000));
          continue;
        }
        
        if (error.message === 'NO_CONCEPTS_FOUND') {
          throw new Error('Luvia was unable to identify sufficient concepts for a study set. Try adding more detail to your notes.');
        }

        if (isQuotaError) {
          throw new Error('AI_QUOTA_EXCEEDED: The study assistant is currently receiving too many requests. Please wait a moment and try again.');
        }

        throw error;
      }
    }
    throw new Error('Unexpected error during study set generation.');
  }
);
