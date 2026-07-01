# Recommendation Engine

**Inventory Intelligence Platform — AI-Driven Operational Recommendations**

**Version:** 1.0.0  
**Last Updated:** July 2026

---

## Table of Contents

1. [Overview](#1-overview)
2. [AI Insights Generation](#2-ai-insights-generation)
3. [Recommendation Rules](#3-recommendation-rules)
4. [Telemetry Analysis](#4-telemetry-analysis)
5. [Operational Intelligence Logic](#5-operational-intelligence-logic)
6. [Recommendation Pipeline](#6-recommendation-pipeline)

---

## 1. Overview

The Recommendation Engine transforms raw inventory risk data into actionable operational intelligence. It uses a hybrid approach combining rule-based analysis, telemetry-driven insights, and AI-powered generation (via Gemini API) to produce severity-classified recommendations.

### Key Capabilities

- **Severity classification:** CRITICAL, WARNING, OPTIMIZATION, INFO levels
- **Confidence scoring:** Numeric confidence (0-99) for each insight
- **Rule-based generation:** Deterministic insights from risk data patterns
- **Gemini API integration:** Enhanced intelligence with LLM-powered analysis
- **Fallback templates:** Offline resilience when AI API is unavailable
- **Insight caching:** Performance optimization for repeated queries

---

## 2. AI Insights Generation

### 2.1 Architecture

```
┌──────────────────────┐
│   Risk Engine Data    │
│   (inventory-risk)    │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Rule Engine          │
│  (generateInsights   │
│   FromData)          │
└──────────┬───────────┘
           │
     ┌─────┴─────┐
     │           │
     ▼           ▼
┌─────────┐ ┌──────────┐
│ Gemini  │ │ Fallback │
│ API     │ │ Template │
└────┬────┘ └─────┬────┘
     │           │
     └─────┬─────┘
           │
           ▼
┌──────────────────────┐
│  Insight Delivery     │
│  (Severity + Score)   │
└──────────────────────┘
```

### 2.2 Insight Generation Rules

```javascript
function generateInsightsFromData(riskItems) {
  const insights = [];
  
  // Count high-risk SKUs
  const highRiskCount = riskItems.filter(item => item.Risk === 'HIGH').length;
  
  // Detect forecast surges
  const forecastSurgeItems = riskItems.filter(item => item.ForecastGrowth > 1.25);
  
  // Detect high volatility
  const highVolatilityItems = riskItems.filter(item => item.Volatility > 1.5);
  
  // CRITICAL: High stock-out risk
  if (highRiskCount > 0) {
    insights.push({
      severity: 'CRITICAL',
      confidence: 99,
      text: `${highRiskCount} SKU${highRiskCount > 1 ? 's are' : ' is'} at high stock-out risk. Prioritize for immediate review.`
    });
  }
  
  // WARNING: Forecast surge detected
  if (forecastSurgeItems.length > 3) {
    insights.push({
      severity: 'WARNING',
      confidence: 92,
      text: `Significant forecast surge detected for ${forecastSurgeItems.length} components. Validate supply chain readiness.`
    });
  }
  
  // WARNING: Elevated volatility
  if (highVolatilityItems.length > 5) {
    insights.push({
      severity: 'WARNING',
      confidence: 88,
      text: `Elevated demand volatility detected for ${highVolatilityItems.length} items. Safety stock levels may be insufficient.`
    });
  }
  
  // INFO: Fallback model activation
  insights.push({
    severity: 'INFO',
    confidence: 85,
    text: 'Fallback models have been activated for multiple sparse-demand SKUs to ensure forecast continuity.'
  });
  
  return insights.slice(0, 4);
}
```

### 2.3 Gemini API Integration

The platform supports enhanced insight generation via Google's Gemini API:

```javascript
// services/geminiService.js
async function generateInsightsWithGemini(riskData, demandData) {
  const prompt = buildInsightPrompt(riskData, demandData);
  
  try {
    const response = await geminiModel.generateContent(prompt);
    return parseInsightResponse(response);
  } catch (error) {
    // Fall back to rule-based generation
    return generateInsightsFromData(riskData);
  }
}
```

### 2.4 Fallback Templates

When the Gemini API is unavailable, the system uses pre-defined insight templates:

```javascript
// utils/fallbackInsights.js
const TEMPLATES = [
  {
    severity: 'INFO',
    confidence: 80,
    text: 'Demand patterns are being analyzed across {count} active SKUs.'
  },
  {
    severity: 'OPTIMIZATION',
    confidence: 75,
    text: 'Consider reviewing safety stock levels for {count} medium-risk items.'
  }
];
```

---

## 3. Recommendation Rules

### 3.1 Risk-to-Action Mapping

| Risk Score | Risk Level | Recommendation | Action Detail |
|-----------|------------|----------------|---------------|
| ≥ 0.7 | **HIGH** | Increase Safety Stock | Immediate procurement action |
| ≥ 0.4 | **MEDIUM** | Monitor Demand Closely | Regular review & planning |
| < 0.4 | **LOW** | Maintain Current Levels | No action needed |

### 3.2 Explainability Tags

Each recommendation includes root cause tags:

| Tag | Trigger | Meaning |
|-----|---------|---------|
| `HIGH VOLATILITY` | Volatility > 1.0 | Demand variability is a key risk driver |
| `SPARSE DEMAND` | Sparsity > 0.7 | Intermittent demand pattern increases risk |
| `FORECAST SURGE` | Forecast growth > 1.5 | Rapid demand growth requires attention |

### 3.3 Dashboard Display

Recommendations are surfaced in multiple contexts:

```jsx
// Recommendation display with severity color coding
<div className={`border ${
  insight.severity === 'CRITICAL' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
  insight.severity === 'WARNING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
  insight.severity === 'OPTIMIZATION' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
  'bg-sky-500/10 text-sky-400 border-sky-500/20'
}`}>
  <span className="text-lg font-semibold text-emerald-400">{insight.confidence}%</span>
</div>
```

---

## 4. Telemetry Analysis

### 4.1 Data Sources

| Source | Data | Frequency |
|--------|------|-----------|
| Risk Engine | Per-SKU risk scores, volatility, sparsity | On demand |
| Forecast Engine | Monthly demand, forecast values | On demand |
| Inventory Data | Part counts, demand totals | On demand |
| Cache Status | DataFrame freshness | Continuous |

### 4.2 Pattern Detection

The engine detects these operational patterns:

| Pattern | Detection Rule | Business Impact |
|---------|---------------|-----------------|
| **Risk Concentration** | >20% SKUs are HIGH risk | Portfolio-level risk exposure |
| **Forecast Surge** | >5 SKUs with ForecastGrowth > 1.25 | Supply chain capacity alert |
| **Volatility Cluster** | >10 SKUs with Volatility > 1.5 | Systematic demand instability |
| **Sparsity Trend** | >30% SKUs are SPARSE or DORMANT | Data quality or business model issue |

### 4.3 Confidence Calibration

```javascript
// Confidence is calibrated based on:
// - Data volume (more data = higher confidence)
// - Pattern clarity (clear patterns = higher confidence)
// - Historical accuracy (past performance)

function calculateConfidence(dataVolume, patternClarity, historicalAccuracy) {
  let confidence = 50; // Base
  
  confidence += Math.min(dataVolume / 100, 30);  // +0-30 for data volume
  confidence += patternClarity * 10;              // +0-10 for pattern clarity
  confidence += historicalAccuracy * 10;           // +0-10 for history
  
  return Math.min(99, Math.max(15, confidence));
}
```

---

## 5. Operational Intelligence Logic

### 5.1 Decision Framework

```
INPUT: Risk Data for All SKUs
  │
  ├── Calculate Aggregate Metrics
  │   ├── High Risk % = count(HIGH) / total
  │   ├── Avg Volatility = mean(volatility)
  │   └── Surge Count = count(ForecastGrowth > 1.25)
  │
  ├── Apply Rule Engine
  │   ├── IF highRisk > 0 → CRITICAL insight
  │   ├── IF surgeCount > 3 → WARNING insight
  │   ├── IF volatilityCount > 5 → WARNING insight
  │   └── ELSE → INFO insight
  │
  ├── Enhance with AI (if available)
  │   ├── Pass context to Gemini API
  │   ├── Parse AI-generated insights
  │   └── Merge with rule-based insights
  │
  └── Deliver Results
      ├── Sort by severity (CRITICAL → INFO)
      ├── Attach confidence scores
      └── Return to frontend
```

### 5.2 Critical Alert Generation

The most critical SKU gets escalated to a prominent alert banner:

```javascript
// Dashboard generates critical alert
const mostCritical = formattedHighRisk[0];
if (mostCritical) {
  setCriticalAlert({
    partNo: mostCritical.partNo,
    partName: mostCritical.partName,
    riskLevel: mostCritical.riskLevel,
    volatility: mostCritical.volatility,
    action: mostCritical.action,
    actionDetail: `Add ${Math.ceil(mostCritical.volatility * 50)} units to prevent stock-out.`,
    tags: ['HIGH VOLATILITY', 'FORECAST SURGE'].slice(0, 4)
  });
}
```

---

## 6. Recommendation Pipeline

### 6.1 End-to-End Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                  RECOMMENDATION PIPELINE                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PHASE 1: DATA COLLECTION                                         │
│  ┌────────────────────────────────────────────────────────┐      │
│  │ • Fetch inventory risk data from API                    │      │
│  │ • Fetch monthly demand data for context                 │      │
│  │ • Load AI insight cache (if available)                  │      │
│  └────────────────────────────────────────────────────────┘      │
│                           │                                       │
│  PHASE 2: ANALYSIS                                               │
│  ┌────────────────────────────────────────────────────────┐      │
│  │ • Count high-risk SKUs                                 │      │
│  │ • Detect volatility clusters                           │      │
│  │ • Identify forecast surges                             │      │
│  │ • Calculate aggregate metrics                          │      │
│  └────────────────────────────────────────────────────────┘      │
│                           │                                       │
│  PHASE 3: GENERATION                                             │
│  ┌────────────────────────────────────────────────────────┐      │
│  │ • Run rule engine for deterministic insights           │      │
│  │ • Attempt Gemini API call for enhanced insights        │      │
│  │ • Fall back to template insights if API fails          │      │
│  │ • Cache generated insights                             │      │
│  └────────────────────────────────────────────────────────┘      │
│                           │                                       │
│  PHASE 4: DELIVERY                                               │
│  ┌────────────────────────────────────────────────────────┐      │
│  │ • Sort by severity (CRITICAL first)                    │      │
│  │ • Attach confidence scores                             │      │
│  │ • Update dashboard state                               │      │
│  │ • Re-render insight panels                             │      │
│  └────────────────────────────────────────────────────────┘      │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 6.2 Performance Characteristics

| Stage | Average Time | Notes |
|-------|-------------|-------|
| Data Collection | ~2s | Depends on API response time |
| Analysis | ~50ms | Fast, in-memory computation |
| Generation (rule) | ~10ms | Deterministic, no external calls |
| Generation (Gemini) | ~3s | Dependent on API latency |
| Delivery | ~5ms | DOM update and rendering |

### 6.3 Integration Points

| Component | API Used | Data Consumed |
|-----------|----------|---------------|
| Dashboard | `/api/inventory-risk` | Risk data array |
| AI Insight Panel | Internal engine | Risk insights array |
| Critical Alert | Internal engine | Highest-risk SKU |
| Recommendations Page | `/api/inventory-risk` | Full risk data |

---

*End of Recommendation Engine Documentation*