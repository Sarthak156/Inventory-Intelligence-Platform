export const INSIGHT_FIELDS = [
  "summary",
  "recommendation",
  "riskExplanation",
  "confidenceCommentary",
];

export const confidenceLabel = (value) => {
  if (typeof value === "number") {
    if (value >= 75) return "HIGH";
    if (value >= 45) return "MEDIUM";
    return "LOW";
  }
  return String(value || "MEDIUM").toUpperCase();
};

export const asPercent = (value) => `${Math.round((Number(value) || 0) * 100)}%`;

