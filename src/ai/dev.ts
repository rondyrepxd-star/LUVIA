import { config } from 'dotenv';
config();

import '@/ai/flows/generate-quiz-flow.ts';
import '@/ai/flows/study-assistant-chat-flow.ts';
import '@/ai/flows/generate-question-options-flow.ts';
import '@/ai/flows/generate-hint-flow.ts';
import '@/ai/flows/generate-explanation-flow.ts';
import '@/ai/flows/generate-fill-blank-flow.ts';
import '@/ai/flows/generate-short-answer-answers-flow.ts';
import '@/ai/flows/generate-matching-pairs-flow.ts';
import '@/ai/flows/generate-ordering-steps-flow.ts';
import '@/ai/flows/generate-flashcards-flow.ts';
import '@/ai/flows/generate-image-flow.ts';
import '@/ai/flows/process-document-flow.ts';
