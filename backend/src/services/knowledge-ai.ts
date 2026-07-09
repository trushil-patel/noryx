import { gemini } from "./gemini.js";
import { env } from "../config/env.js";

export type GeneratedKnowledgeMetadata = {
  title: string;
  summary: string;
  key_takeaways: string[];
  why_it_matters: string;
  tags: string[];
};

function extractJson(text: string) {
  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(cleaned);
}

export async function generateKnowledgeMetadata(url: string) {
    const prompt = `
You are Memora AI.

Your job is to create accurate metadata for a saved URL.

URL:
${url}

Important accuracy rules:
- Do NOT guess the topic if the URL does not clearly reveal it.
- Do NOT invent frameworks, lessons, authors, summaries, or fake content.
- If the URL title/topic is unclear, say that the content needs processing.
- If only the domain is clear, use the domain/platform in the title.
- Prefer safe generic metadata over wrong specific metadata.
- For government/exam/official websites, be especially conservative.
- If the URL appears related to GPSC, Gujarat Public Service Commission, exams, government notifications, recruitment, syllabus, or results, classify it as exam/government content.
- Never call unrelated content a productivity framework.

Return ONLY valid JSON in this exact shape:
{
  "title": "accurate title based only on URL evidence",
  "summary": "accurate 1-2 sentence summary. If URL content is unclear, say the saved link needs content extraction before a detailed summary can be generated.",
  "key_takeaways": [
    "safe takeaway based on visible URL/domain only",
    "safe takeaway based on visible URL/domain only",
    "safe takeaway based on visible URL/domain only"
  ],
  "why_it_matters": "why this saved link may be useful, without inventing details",
  "tags": ["tag1", "tag2", "tag3"]
}

Rules:
- Do not include markdown.
- Do not include explanations.
- Keep title under 80 characters.
- Keep tags lowercase.
- Tags must be accurate and conservative.
`;

  const response = await gemini.models.generateContent({
    model: env.GEMINI_MODEL,
    contents: prompt,
  });

  const text = response.text;

  if (!text) {
    throw new Error("Gemini returned empty response");
  }

  const parsed = extractJson(text) as GeneratedKnowledgeMetadata;

  return {
    title: parsed.title,
    summary: parsed.summary,
    key_takeaways: parsed.key_takeaways,
    why_it_matters: parsed.why_it_matters,
    tags: parsed.tags,
  };
}