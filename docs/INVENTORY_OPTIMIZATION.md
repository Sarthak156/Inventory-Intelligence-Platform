# Inventory Optimization

**Inventory Intelligence Platform — Risk Assessment & Optimization Engine**

**Version:** 1.0.0  
**Last Updated:** July 2026

---

## Table of Contents

1. [Overview](#1-overview)
2. [Inventory Scoring](#2-inventory-scoring)
3. [Risk Classification](#3-risk-classification)
4. [Stockout Prediction](#4-stockout-prediction)
5. [Prioritization Logic](#5-prioritization-logic)
6. [Operational Metrics](#6-operational-metrics)
7. [Optimization Workflow](#7-optimization-workflow)

---

## 1. Overview

The Inventory Optimization engine provides real-time risk assessment and actionable recommendations for every SKU in the inventory. It uses a multi-dimensional scoring model that evaluates volatility, demand sparsity, and forecast growth to classify risk and recommend operational actions.

### Key Capabilities

- **Composite risk scoring:** Weighted multi-factor risk assessment
- **SKU behavior classification:** 5-state model (Stable, Volatile, Sparse, Dormant, Surging)
- **Explainable risk tagging:** Root cause identification with human-readable tags
- **Actionable recommendations:** Specific operational guidance per SKU
- **Demand trend analysis:** UP/DOWN/STABLE classification with growth metrics

---

## 2. Inventory Scoring

### 2.1 Risk Score Formula

```python
risk_score = (volatility_capped × 0.4) + (sparsity × 0.3) + (forecast_growth_capped × 0.3)

Where:
  volatility_capped = min(volatility, 2.0)
  forecast_growth_capped = min(forecast_growth, 2.0)
```

### 2.2 Score Components

| Component | Weight | Formula | Range | Description |
|-----------|--------|---------|-------|-------------|
| **Volatility** | 0.4 | `std(demand) / mean(demand)` | 0-2+ | Demand variability (capped at 2.0) |
| **Sparsity** | 0.3 | `zero_months / total_months` | 0-1 | Proportion of zero-demand periods |
| **Forecast Growth** | 0.3 | `recent_avg / historical_avg` | 0-2+ | Recent demand trend (capped at 2.0) |

### 2.3 Calculation Details

```python
def calculate_inventory_risk(df):
    results = []
    
    for part_no, group in df.groupby('Part No'):
        demand = group['Demand'].values
        total_months = len(demand)
        
        if total_months == 0:
            continue
        
        # A. Volatility: Coefficient of variation
        mean_demand = np.mean(demand)
        std_demand = np.std(demand)
        volatility = (std_demand / mean_demand) if mean_demand > 0 else 0
        
        # B. Sparsity: Zero-demand ratio
        zero_months = np.sum(demand == 0)
        sparsity = zero_months / total_months
        
        # C. Forecast Growth: Recent vs historical
        if total_months >= 3:
            future_avg_proxy = np.mean(demand[-3:])
        else:
            future_avg_proxy = mean_demand
        forecast_growth = (future_avg_proxy / mean_demand) if mean_demand > 0 else 1.0
        
        # Composite score
        volatility_capped = min(volatility, 2.0)
        forecast_growth_capped = min(forecast_growth, 2.0)
        
        risk_score = (volatility_capped * 0.4) + (sparsity * 0.3) + (forecast_growth_capped * 0.3)
        
        results.append({
            "Part No": part_no,
            "Volatility": round(volatility, 2),
            "Sparsity": round(sparsity, 2),
            "ForecastGrowth": round(forecast_growth, 2),
            "RiskScore": round(risk_score, 2),
            ...
        })
    
    # Sort by risk score descending
    results.sort(key=lambda x: x['RiskScore'], reverse=True)
    return results
```

---

## 3. Risk Classification

### 3.1 Risk Levels

| Risk Score | Level | Color | Action Required |
|-----------|-------|-------|-----------------|
| ≥ 0.7 | **HIGH** | 🔴 Red | Immediate attention required |
| ≥ 0.4 | **MEDIUM** | 🟡 Amber | Monitor and plan mitigation |
| < 0.4 | **LOW** | 🟢 Green | Maintain current strategy |

### 3.2 SKU Behavior States

| State | Description | Typical Characteristics |
|-------|-------------|------------------------|
| **Stable** | Consistent demand with low variability | Low volatility, low sparsity, steady trend |
| **Volatile** | High demand variability | High volatility (≥1.0), unpredictable patterns |
| **Sparse** | Intermittent demand with many zero periods | High sparsity (>0.5), occasional spikes |
| **Dormant** | Very low or no activity | Near-zero demand, ≤2 non-zero months |
| **Surging** | Rapid demand growth | High forecast growth (>1.5), upward trend |

### 3.3 State Classification Logic

```python
def classify_sku_state(sparsity, total_months, zero_months, forecast_growth, volatility):
    if sparsity > 0.8 or (total_months - zero_months) <= 2:
        return "Dormant"
    elif sparsity > 0.5:
        return "Sparse"
    elif forecast_growth > 1.5:
        return "Surging"
    elif volatility > 1.0:
        return "Volatile"
    else:
        return "Stable"
```

### 3.4 Risk Distribution Dashboard

The dashboard visualizes risk distribution across the entire inventory:

```
Risk Distribution (Example):
  HIGH:    97 SKUs  (5%)
  MEDIUM: 250 SKUs  (12.5%)
  LOW:   1653 SKUs  (82.5%)
  ─────────────────────
  Total: 2000 SKUs
```

---

## 4. Stockout Prediction

### 4.1 Stockout ETA Calculation

The system provides an estimated time-to-stockout based on risk score:

```python
def estimate_stockout_eta(risk_score):
    """
    Estimate days until potential stockout.
    
    Higher risk scores = shorter ETA.
    """
    # Base: 2 days minimum, scales with risk
    eta_days = max(2, int((1 - risk_score) * 30))
    return f"{eta_days} days"
```

### 4.2 Lead Time Impact

Lead time impact is derived from volatility:

```python
def calculate_lead_time_impact(volatility):
    """
    Calculate additional lead time days due to volatility.
    """
    impact_days = int(volatility * 3) + 4
    return impact_days
```

### 4.3 Safety Stock Recommendation

```python
def recommend_safety_stock(volatility, risk_score):
    """
    Recommend additional safety stock units.
    """
    additional_units = int(volatility * 50)
    return f"Add {additional_units} units to prevent stock-out."
```

---

## 5. Prioritization Logic

### 5.1 SKU Priority Matrix

```
                    LOW SPARSITY ←→ HIGH SPARSITY
                    ┌─────────────────────────────┐
           LOW      │  Monitor    │   Investigate  │
         VOLATILITY │  (Low Risk) │  (Medium Risk) │
                    ├─────────────┼────────────────┤
           HIGH     │  Immediate  │  Critical      │
         VOLATILITY │  Action     │  Intervention  │
                    │  (High Risk)│  (High Risk)   │
                    └─────────────────────────────┘
```

### 5.2 Sorting and Filtering

Results are sorted by risk score descending, ensuring the most critical SKUs appear first:

```python
results.sort(key=lambda x: x['RiskScore'], reverse=True)
```

### 5.3 Dashboard Prioritization

The dashboard surfaces:
1. **Critical Alert:** Single highest-risk SKU with animated banner
2. **High-Risk Table:** Top 5 high-risk SKUs with detailed metrics
3. **Risk Distribution:** Pie chart showing overall risk landscape
4. **AI Insights:** Generated insights based on risk patterns

---

## 6. Operational Metrics

### 6.1 Key Metrics

| Metric | Formula | Purpose |
|--------|---------|---------|
| **Active SKUs** | Count of unique Part No | Total inventory scope |
| **High-Risk SKUs** | Count where Risk = HIGH | Risk concentration |
| **Stock-Out Risk** | Mean risk score across all SKUs | Overall inventory health |
| **Demand Volatility** | Mean volatility across all SKUs | Demand stability |
| **Forecast Accuracy** | Model confidence score | Forecast reliability |
| **Inventory Turnover** | Derived metric | Inventory efficiency |

### 6.2 Inventory Health Distribution

```
Inventory Health (Example):
  Healthy:  1203 SKUs (60%)  ━━━━━━━━━━━━━━━━━━━━━━━━
  Monitor:   450 SKUs (22.5%) ━━━━━━━━━
  At Risk:   250 SKUs (12.5%) ━━━━━
  Critical:   97 SKUs (5%)    ━━
```

### 6.3 Demand Trend Analysis

| Trend | Condition | Implication |
|-------|-----------|-------------|
| **UP** | Forecast growth > 1.1 | Increasing demand, may need more stock |
| **DOWN** | Forecast growth < 0.9 | Decreasing demand, may reduce stock |
| **STABLE** | 0.9 ≤ growth ≤ 1.1 | Consistent demand, maintain levels |

---

## 7. Optimization Workflow

### 7.1 End-to-End Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                    INVENTORY OPTIMIZATION PIPELINE                │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. DATA LOADING                                                  │
│     ├── Load transformed dataset from cache                      │
│     └── Ensure Demand column is numeric                          │
│                                                                  │
│  2. PER-SKU ANALYSIS                                              │
│     ├── Group by Part No                                         │
│     └── For each SKU:                                            │
│         ├── Calculate volatility (std/mean)                      │
│         ├── Calculate sparsity (zeros/total)                     │
│         ├── Calculate forecast growth (recent/historical)        │
│         └── Compute composite risk score                         │
│                                                                  │
│  3. CLASSIFICATION                                                │
│     ├── Assign risk level (HIGH/MEDIUM/LOW)                      │
│     ├── Classify SKU state (Stable/Volatile/Sparse/Dormant/Surging)│
│     ├── Determine demand trend (UP/DOWN/STABLE)                  │
│     └── Generate explainability tags                             │
│                                                                  │
│  4. RECOMMENDATION                                                │
│     ├── Map risk level to action                                 │
│     ├── Calculate safety stock suggestion                        │
│     └── Generate recommendation text                             │
│                                                                  │
│  5. OUTPUT                                                        │
│     ├── Sort by risk score descending                            │
│     ├── Format for JSON (NaN → null)                             │
│     └── Return to API consumer                                   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 7.2 Integration Points

| Component | Integration | Data Flow |
|-----------|-------------|-----------|
| **Dashboard** | GET /api/inventory-risk | Risk data for KPIs, charts, alerts |
| **Risks Page** | GET /api/inventory-risk | Detailed risk table and filters |
| **Export** | POST /api/export-forecast | Risk metadata in export files |
| **AI Insights** | Frontend utility | Risk data drives insight generation |

### 7.3 Performance Characteristics

| Dataset Size | Computation Time | Memory Usage |
|-------------|-----------------|--------------|
| 100 SKUs × 12 months | ~200ms | ~50MB |
| 500 SKUs × 24 months | ~1s | ~150MB |
| 1000 SKUs × 36 months | ~2s | ~250MB |
| 5000 SKUs × 24 months | ~10s | ~500MB |

---

*End of Inventory Optimization Documentation*