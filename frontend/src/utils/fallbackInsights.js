import { confidenceLabel, asPercent } from "./insightTemplates";

const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

export function normalizeInsightData(data = {}) {
  return {
    scope: data.scope || "inventory",
    partNo: data.partNo || data["Part No"] || null,
    riskLevel: String(data.riskLevel || data.Risk || "LOW").toUpperCase(),
    volatility: number(data.volatility ?? data.Volatility),
    sparsity: number(data.sparsity ?? data.Sparsity),
    forecastGrowth: number(data.forecastGrowth ?? data.ForecastGrowth, 1),
    confidence: confidenceLabel(data.confidence ?? data.Confidence ?? data.confidenceScore),
    confidenceScore: number(data.confidenceScore, 0),
    demandState: String(data.demandState || data.State || data.skuState || "Stable"),
    forecastSource: String(data.forecastSource || data.ForecastStatus || data.source || "PART_LEVEL"),
    totalSkus: number(data.totalSkus),
    highRiskCount: number(data.highRiskCount),
    volatileCount: number(data.volatileCount),
    sparseCount: number(data.sparseCount),
    demandGrowthPercent: number(data.demandGrowthPercent),
    optimizationReadiness: number(data.optimizationReadiness),
  };
}

export function generateFallbackInsights(rawData = {}) {
  const d = normalizeInsightData(rawData);
  const identity = d.partNo ? `SKU ${d.partNo}` : "Monitored inventory";
  const fallbackActive = d.forecastSource.includes("FALLBACK");
  const highSparsity = d.sparsity > 0.5 || /sparse|dormant/i.test(d.demandState);
  const highVolatility = d.volatility > 1 || /volatile/i.test(d.demandState);
  const accelerating = d.forecastGrowth > 1.15 || d.demandGrowthPercent > 15 || /surging/i.test(d.demandState);
  const contracting = d.forecastGrowth < 0.85 || d.demandGrowthPercent < -15;

  let summary = `${identity} remains within stable operational parameters.`;
  if (d.totalSkus) {
    summary = `${d.highRiskCount} of ${d.totalSkus} SKUs require elevated monitoring; ${d.volatileCount} currently exhibit demand instability.`;
  } else if (highVolatility && highSparsity) {
    summary = `${identity} exhibits elevated volatility within an intermittent demand profile.`;
  } else if (highVolatility) {
    summary = `Elevated demand instability detected for ${identity}.`;
  } else if (highSparsity) {
    summary = `Sparse-demand behavior identified for ${identity}.`;
  } else if (accelerating) {
    summary = `Demand acceleration is emerging for ${identity}.`;
  } else if (contracting) {
    summary = `Demand contraction is emerging for ${identity}.`;
  }

  let recommendation = "Maintain current inventory policy and continue cycle-based monitoring.";
  if (d.riskLevel === "HIGH" || (highVolatility && accelerating)) {
    recommendation = "Review safety stock and replenishment thresholds before the next ordering cycle.";
  } else if (highSparsity) {
    recommendation = "Use conservative replenishment controls and validate demand before committing additional stock.";
  } else if (accelerating) {
    recommendation = "Validate supply coverage and prepare a measured inventory increase for the projected demand uplift.";
  } else if (contracting) {
    recommendation = "Moderate replenishment to limit excess exposure while the declining trajectory persists.";
  }

  const riskExplanation = d.highRiskCount
    ? `${d.highRiskCount} high-risk and ${d.sparseCount} sparse-demand SKUs are driving the current surveillance posture.`
    : d.riskLevel === "HIGH"
      ? `Risk is elevated by ${highVolatility ? "demand volatility" : "inventory telemetry"}${highSparsity ? " and sparse consumption history" : ""}.`
      : `Risk remains ${d.riskLevel.toLowerCase()}, with no combination of monitored factors currently breaching critical thresholds.`;

  const scoreText = d.confidenceScore ? ` (${Math.round(d.confidenceScore)}%)` : "";
  const confidenceCommentary = fallbackActive
    ? `${d.confidence}${scoreText} confidence. ${d.forecastSource.replaceAll("_", " ")} is active to preserve continuity across sparse history.`
    : `${d.confidence}${scoreText} confidence based on observed demand density and forecast stability.`;

  return {
    summary,
    recommendation,
    riskExplanation,
    confidenceCommentary,
    source: "fallback",
    briefing: [
      d.totalSkus ? `${d.highRiskCount} SKUs require active monitoring.` : summary,
      d.sparseCount ? `${d.sparseCount} SKUs exhibit sparse-demand behavior.` : highSparsity ? "Sparse-demand controls remain active." : "Demand density remains operationally sufficient.",
      d.demandGrowthPercent ? `Demand trajectory is ${d.demandGrowthPercent >= 0 ? "up" : "down"} ${Math.abs(d.demandGrowthPercent).toFixed(1)}% versus baseline.` : "Demand trajectory remains within the current baseline.",
      d.optimizationReadiness ? `Optimization readiness is ${Math.round(d.optimizationReadiness)}%.` : `Forecast confidence is ${d.confidence.toLowerCase()}${d.sparsity ? ` at ${asPercent(1 - d.sparsity)} demand density` : ""}.`,
    ],
  };
}

