import { INSIGHT_FIELDS } from "../utils/insightTemplates";

const API_ROOT = "https://generativelanguage.googleapis.com/v1beta/models";
const MODEL = import.meta.env.VITE_GEMINI_MODEL || "gemini-2.0-flash";
const TIMEOUT_MS = 8000;

const responseSchema = {
  type: "OBJECT",
  properties: Object.fromEntries(INSIGHT_FIELDS.map((field) => [field, { type: "STRING" }])),
  required: INSIGHT_FIELDS,
};

export async function requestGeminiInsights(data) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error("Gemini API key is not configured");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${API_ROOT}/${MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: "You are an enterprise inventory operations analyst. Be concise, analytical, specific to the supplied telemetry, and never conversational. Return only the requested JSON." }] },
        contents: [{ role: "user", parts: [{ text: `Generate operational inventory intelligence from this telemetry:\n${JSON.stringify(data)}` }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 450, responseMimeType: "application/json", responseSchema },
      }),
    });
    if (!response.ok) throw new Error(`Gemini request failed (${response.status})`);
    const payload = await response.json();
    const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Gemini returned an empty response");
    const parsed = JSON.parse(text);
    if (!INSIGHT_FIELDS.every((field) => typeof parsed[field] === "string" && parsed[field].trim())) {
      throw new Error("Gemini response did not match the insight contract");
    }
    return parsed;
  } finally {
    clearTimeout(timeout);
  }
}

