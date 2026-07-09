import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";

export const gemini = new GoogleGenAI({
  apiKey: env.GEMINI_API_KEY,
});

export async function testGeminiConnection() {
  const response = await gemini.interactions.create({
    model: env.GEMINI_MODEL,
    input: "Reply with exactly: Gemini connected",
  });

  return response.output_text;
}