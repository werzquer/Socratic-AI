import { GoogleGenAI } from "@google/genai";

export const SYSTEM_PROMPT = `Ты — Socratic AI, интеллектуальный ментор по программированию.`;

export function getAiClient(): GoogleGenAI {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY_MISSING');
  }
  return new GoogleGenAI({ apiKey: key });
}
