'use server';
/**
 * @fileOverview An AI assistant flow for chatting about study material.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const StudyAssistantChatInputSchema = z.object({
  chatMessage: z.string().describe("The user's question or query about the study material."),
  studyMaterial: z.string().optional().describe("The study material relevant to the chat."),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })).optional().describe("Prior messages in the active session for memory context.")
});
export type StudyAssistantChatInput = z.infer<typeof StudyAssistantChatInputSchema>;

export type StudyAssistantChatOutput = {
  response: string;
};

export async function studyAssistantChat(
  input: StudyAssistantChatInput
): Promise<StudyAssistantChatOutput> {
  try {
    const studyContext = input.studyMaterial && input.studyMaterial.trim().length > 0
      ? `\n\nStudy Material provided (use as context):\n${input.studyMaterial.substring(0, 4000)}`
      : '';

    // Build conversation turns as a single prompt string for maximum compatibility
    let conversationHistory = '';
    if (input.history && input.history.length > 0) {
      const relevantHistory = input.history.slice(-10); // last 10 messages max
      for (const msg of relevantHistory) {
        if (msg.role === 'user') {
          conversationHistory += `\nUser: ${msg.content}`;
        } else {
          conversationHistory += `\nLuvia: ${msg.content}`;
        }
      }
    }

    const fullPrompt = `You are Luvia, an intelligent and friendly AI study assistant. Help students understand their study material with clear, concise, and helpful answers. Be conversational and warm.

If the user asks to generate questions or create a quiz, provide a text example but remind them to use the Quiz tab for an interactive experience.${studyContext}${conversationHistory}

User: ${input.chatMessage}
Luvia:`;

    const result = await ai.generate(fullPrompt);

    const text = result.text?.trim();
    if (!text) {
      throw new Error('Got empty response from Luvia AI.');
    }

    return { response: text };
  } catch (error: any) {
    console.error('[studyAssistantChat] Error:', error?.message || error);
    if (error.message?.includes('429') || error.message?.toLowerCase().includes('quota')) {
      throw new Error('QUOTA: The AI is currently busy. Please wait a moment and try again.');
    }
    throw error;
  }
}
