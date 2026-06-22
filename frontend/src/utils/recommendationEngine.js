const categoryFor = (item) => {
  if (item.Risk === "HIGH") return "RISK";
  if (item.Sparsity > 0.5) return "SPARSE DEMAND";
  if (item.ForecastGrowth > 1.15 || item.ForecastGrowth < 0.85) return "FORECAST";
  if (item.Volatility > 0.8) return "MONITORING";
  return item.State === "Stable" ? "OPTIMIZATION" : "INVENTORY";
};

const severityFor = (item) => {
  if (item.Risk === "HIGH" || item.ForecastGrowth > 1.5) return "HIGH";
  if (item.Risk === "MEDIUM" || item.Confidence !== "HIGH") return "MEDIUM";
  return "LOW";
};

const confidenceScore = (item) => {
  const base = item.Confidence === "HIGH" ? 91 : item.Confidence === "MEDIUM" ? 74 : 52;
  return Math.max(35, Math.min(98, Math.round(base - Math.min(item.Volatility || 0, 2) * 4)));
};

const actionFor = (item) => {
  if (item.ForecastGrowth > 1.5) return ["Prepare supply coverage for accelerating demand", "Validate lead time and raise replenishment readiness before the next planning cycle."];
  if (item.Sparsity > 0.5) return ["Apply conservative controls to sparse demand", "Use smaller replenishment increments and require demand confirmation before committing inventory."];
  if (item.Volatility > 1) return ["Increase operational monitoring frequency", "Shorten the review cadence and reassess safety stock against the latest demand variance."];
  if (item.Confidence === "LOW") return ["Escalate forecast for manual validation", "Review lifecycle status and demand history before authorizing automated replenishment."];
  if (item.Risk === "HIGH") return ["Recalibrate safety stock exposure", "Review replenishment thresholds and supplier coverage for this high-risk item."];
  return ["Maintain policy with active surveillance", "Retain the current inventory policy and validate performance during the next review cycle."];
};

export function buildRecommendations(items = [], analyzedAt = new Date()) {
  return items.map((item, index) => {
    const [title, strategicAction] = actionFor(item);
    const tags = [
      ...(item.Reasons || []),
      item.State ? String(item.State).toUpperCase() : null,
      item.DemandTrend ? `${item.DemandTrend} TREND` : null,
    ].filter(Boolean).slice(0, 3);
    return {
      id: `${item["Part No"]}-${index}`,
      partNo: item["Part No"],
      severity: severityFor(item),
      category: categoryFor(item),
      title,
      reasoning: `${item.State} demand state detected with volatility ${item.Volatility}, sparsity ${item.Sparsity}, and forecast growth ${item.ForecastGrowth}x.`,
      strategicAction,
      confidence: confidenceScore(item),
      timestamp: analyzedAt.toISOString(),
      tags,
      metrics: item,
    };
  }).sort((a, b) => {
    const rank = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    return rank[b.severity] - rank[a.severity] || b.metrics.RiskScore - a.metrics.RiskScore;
  });
}

export const RECOMMENDATION_CATEGORIES = ["ALL", "FORECAST", "INVENTORY", "RISK", "SPARSE DEMAND", "OPTIMIZATION", "MONITORING"];

