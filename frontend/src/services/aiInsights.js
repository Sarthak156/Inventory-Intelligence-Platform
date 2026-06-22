import { requestGeminiInsights } from "./geminiService";
import { generateFallbackInsights, normalizeInsightData } from "../utils/fallbackInsights";

export async function generateAIInsights(data) {
  const normalized = normalizeInsightData(data);
  const fallback = generateFallbackInsights(normalized);
  try {
    const enhanced = await requestGeminiInsights(normalized);
    return { ...fallback, ...enhanced, source: "gemini" };
  } catch (error) {
    console.info("AI intelligence fallback active:", error.message);
    return fallback;
  }
}

