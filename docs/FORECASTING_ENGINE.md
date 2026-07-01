# Forecasting Engine

**Inventory Intelligence Platform — Demand Forecasting System**

**Version:** 1.0.0  
**Last Updated:** July 2026

---

## Table of Contents

1. [Overview](#1-overview)
2. [Forecasting Workflow](#2-forecasting-workflow)
3. [Sparse Demand Handling](#3-sparse-demand-handling)
4. [Confidence Intervals](#4-confidence-intervals)
5. [Forecast Horizons](#5-forecast-horizons)
6. [Caching Approach](#6-caching-approach)
7. [Operational Forecasting Logic](#7-operational-forecasting-logic)

---

## 1. Overview

The Inventory Intelligence forecasting engine is a multi-strategy demand forecasting system designed for operational supply chain environments. It handles the full spectrum of demand patterns — from stable, high-volume SKUs to intermittent, sparse-demand parts.

### Key Capabilities

- **Multi-strategy forecasting:** Automatically selects the optimal strategy based on SKU demand characteristics
- **Sparse demand handling:** Specialized algorithms for intermittent demand patterns
- **Category-level fallback:** Uses HALB (category) aggregation when individual SKU data is insufficient
- **12-month forward projection:** Iterative moving average with demand spike modeling
- **Confidence scoring:** Transparent, volatility-adjusted confidence metrics per SKU
- **Amplitude safeguarding:** Prevents forecast explosion on sparse data

---

## 2. Forecasting Workflow

### 2.1 End-to-End Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                     FORECASTING PIPELINE                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. DATA LOADING                                                  │
│     ├── Load cached DataFrame (get_cached_df())                   │
│     ├── Filter by Part No (if specific SKU)                       │
│     └── Filter by Category (if HALB fallback)                     │
│                                                                  │
│  2. DEMAND AGGREGATION                                            │
│     ├── Group by MonthDT (datetime)                              │
│     ├── Sum demand values                                        │
│     └── Sort chronologically                                     │
│                                                                  │
│  3. SKU STATE CLASSIFICATION                                      │
│     ├── Calculate total months, non-zero months, sparsity        │
│     ├── Classify: ACTIVE | SPARSE | DORMANT | INACTIVE           │
│     └── Assign forecast source strategy                          │
│                                                                  │
│  4. FORECAST COMPUTATION                                          │
│     ├── Historical: 3-month rolling average                      │
│     ├── Non-sparse: Standard moving average                      │
│     ├── Sparse: Non-zero moving average                          │
│     └── Future: Iterative projection (1-12 months)               │
│                                                                  │
│  5. POST-PROCESSING                                               │
│     ├── Confidence score calculation                             │
│     ├── Amplitude capping                                        │
│     ├── NaN/Inf cleanup for JSON                                 │
│     └── Metadata attachment (source, state, confidence)          │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 Core Forecasting Function

```python
def calculate_forecast(monthly_demand):
    """
    Compute forecast for a given monthly demand series.
    
    Args:
        monthly_demand: DataFrame with MonthDT and Demand columns
    
    Returns:
        DataFrame with Month, Demand, Forecast, Is_Future columns
    """
    # 1. Detect sparsity
    total_months = len(monthly_demand)
    non_zero = (monthly_demand['Demand'] > 0).sum()
    is_sparse = (total_months > 0) and ((total_months - non_zero) / total_months > 0.5)
    
    # 2. Compute historical forecast
    if is_sparse:
        # Non-zero moving average (preserves demand spikes)
        shifted = monthly_demand['Demand'].shift(1)
        nz_ma = shifted[shifted > 0].rolling(window=3, min_periods=1).mean()
        monthly_demand['Forecast'] = nz_ma.ffill().fillna(0)
    else:
        # Standard 3-month rolling average
        monthly_demand['Forecast'] = monthly_demand['Demand'].shift(1).rolling(
            window=3, min_periods=1
        ).mean()
    
    # 3. Project future months
    last_date = monthly_demand['MonthDT'].max()
    future_dates = [last_date + relativedelta(months=i) for i in range(1, 13)]
    
    # 4. Generate future forecasts
    if is_sparse:
        future_forecasts = [monthly_demand['Forecast'].iloc[-1]] * 12
    else:
        current_window = monthly_demand['Demand'].dropna().tail(3).tolist()
        future_forecasts = []
        for _ in future_dates:
            next_val = sum(current_window) / len(current_window) if current_window else 0
            future_forecasts.append(next_val)
            # Slide window forward
            if len(current_window) >= 3:
                current_window.pop(0)
            current_window.append(next_val)
    
    # 5. Combine and format
    future_df = pd.DataFrame({
        'MonthDT': future_dates,
        'Demand': [np.nan] * 12,
        'Forecast': future_forecasts
    })
    
    combined = pd.concat([monthly_demand, future_df], ignore_index=True)
    combined['Is_Future'] = combined['Demand'].isna()
    combined['Month'] = combined['MonthDT'].dt.strftime('%b-%Y')
    
    return combined
```

---

## 3. Sparse Demand Handling

### 3.1 Sparsity Detection

```python
sparsity_ratio = (total_months - non_zero_months) / total_months
is_sparse = sparsity_ratio > 0.5
```

### 3.2 Sparse SKU Decision Logic

```
┌─────────────────────────────────────────────────────────────────┐
│                      SKU STATE CLASSIFIER                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Input: Monthly demand series for a single SKU                   │
│                                                                  │
│  total_demand = sum(all demand values)                           │
│  non_zero = count of months with demand > 0                     │
│  sparsity = (total - non_zero) / total                          │
│                                                                  │
│  if total_demand == 0:                                          │
│      → INACTIVE (No forecast possible)                          │
│                                                                  │
│  elif non_zero <= 2:                                            │
│      → DORMANT (Very low activity, low confidence)              │
│                                                                  │
│  elif sparsity > 0.7 or non_zero < 6:                          │
│      → SPARSE (Intermittent demand, category fallback)          │
│                                                                  │
│  else:                                                           │
│      → ACTIVE (Sufficient data for SKU-level forecast)          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Intermittent Demand Modeling

For SPARSE and DORMANT SKUs, the system uses a sophisticated intermittent demand model:

```python
# 1. Source fallback trend (HALB or Global)
fallback_forecast = calculate_forecast(fallback_monthly_data)
trend_multiplier = fallback_forecast / fallback_baseline

# 2. Preserve SKU historical scale
recent_baseline = mean of last 3 non-zero demand values
sku_max = max non-zero demand

# 3. Generate scaled forecast
raw_forecast = recent_baseline × trend_multiplier

# 4. Intermittent spike generation (future months only)
rng = RandomState(seed=hash(part_no))  # Reproducible per SKU
prob_demand = max(0.1, min(0.9, 1.0 - sparsity))

# Generate binary spike pattern
spike_mask = random_draws < prob_demand

# Volume-preserving scaling
spike_multiplier = 1.0 / prob_demand
forecast = raw_forecast × spike_mask × spike_multiplier

# 5. Amplitude safeguard
cap = max(sku_max × 1.5, baseline × 2.0)
forecast = clip(forecast, upper=cap)
```

### 3.4 Fallback Strategy Matrix

| SKU State | Primary Strategy | Fallback Strategy | Forecast Source Label |
|-----------|-----------------|-------------------|----------------------|
| ACTIVE | Part-level moving average | None | `PART_LEVEL` |
| SPARSE | Category-level (HALB) | Global aggregation | `HALB_FALLBACK` or `GLOBAL_FALLBACK` |
| DORMANT | Global fallback | None | `LOW_CONFIDENCE` |
| INACTIVE | Zero forecast | None | `NO_FORECAST` |

---

## 4. Confidence Intervals

### 4.1 Confidence Score Calculation

```python
def calculate_confidence_score(demand_series, sparsity_ratio, sku_state):
    """
    Calculate confidence score based on demand characteristics.
    
    Returns:
        confidence_level: str (HIGH | MEDIUM | LOW | NONE)
        confidence_score: int (0-99)
    """
    if sku_state == "INACTIVE":
        return "NONE", 0
    
    elif sku_state == "DORMANT":
        score = max(15, 35 - (sparsity_ratio * 20))
        return "LOW", score
    
    elif sku_state == "SPARSE":
        score = max(45, 75 - (sparsity_ratio * 30))
        return "MEDIUM", score
    
    else:  # ACTIVE
        # Coefficient of variation
        mean_val = np.mean(demand_series)
        std_val = np.std(demand_series)
        cv = std_val / mean_val if mean_val > 0 else 1.0
        
        score = 99 - (min(cv, 2.0) * 10) - (sparsity_ratio * 15)
        score = max(75, min(99, score))
        return "HIGH", score
```

### 4.2 Confidence Level Ranges

| Level | Score Range | Interpretation |
|-------|-------------|----------------|
| **HIGH** | 75-99 | Reliable forecast based on sufficient data history |
| **MEDIUM** | 45-74 | Moderate confidence, some data limitations or volatility |
| **LOW** | 15-44 | Low confidence, very sparse or highly volatile data |
| **NONE** | 0 | No forecast possible (inactive SKU) |

### 4.3 Export Confidence Intervals

For export, the system provides simple ±15% confidence bounds:

```python
confidence_lower = forecast_value × 0.85
confidence_upper = forecast_value × 1.15
```

These are flat bounds and will be replaced with statistically computed intervals in a future release.

---

## 5. Forecast Horizons

### 5.1 Horizon Options

| Horizon | Months Forward | Use Case |
|---------|---------------|----------|
| 1M | 1 | Short-term operational planning |
| 3M | 3 | Quarterly procurement planning |
| 6M | 6 | Medium-term capacity planning |
| 12M | 12 | Annual budget and strategic planning |

### 5.2 Projection Method

The 12-month forward projection uses an iterative moving average:

```python
# Seed with last 3 actual demand values
window = [d1, d2, d3]

for month in 1..12:
    forecast = mean(window)
    window.pop(0)      # Remove oldest
    window.append(forecast)  # Add prediction
```

This creates a natural decay toward the mean for stable SKUs, while intermittent SKUs use the non-zero baseline approach.

### 5.3 Horizon Impact on Confidence

| Horizon | Confidence Impact | Explanation |
|---------|------------------|-------------|
| 1-3 months | Full confidence | Short-term projections are most reliable |
| 4-6 months | Slight degradation | Uncertainty increases with time |
| 7-12 months | Moderate degradation | Longer horizons = more uncertainty |

---

## 6. Caching Approach

### 6.1 Forecast Cache Levels

```
Level 1: DataFrame Cache (Backend)
  ├── Stores the entire transformed dataset
  ├── Invalidated when data changes (mtime)
  ├── All forecasts computed from this cache
  └── Scope: Process lifetime

Level 2: Per-Request Cache (Within Request)
  ├── Risk data computed once per export
  ├── Shared across multiple parts in same export
  └── Scope: Single request

Level 3: No Per-SKU Cache (Future)
  ├── Pre-computed forecasts stored in Redis
  ├── Instant retrieval without computation
  └── Planned for Phase 1
```

### 6.2 Current Caching Strategy

```python
_cached_df = None
_cached_mtime = 0

def get_cached_df():
    """Returns cached DataFrame, reloading if file changed."""
    current_mtime = os.path.getmtime(DATA_FILE)
    if _cached_df is None or current_mtime > _cached_mtime:
        _cached_df = pd.read_csv(DATA_FILE, low_memory=False)
        _cached_mtime = current_mtime
    return _cached_df
```

---

## 7. Operational Forecasting Logic

### 7.1 Monthly Demand Aggregation

```python
def get_monthly_demand_df(part_no=None, category=None):
    """Aggregate demand by month with optional filtering."""
    df = get_cached_df()
    
    # Filter by part or category
    if part_no and part_no != "ALL_PARTS":
        df = df[df['Part No'] == part_no]
    elif category:
        cat_col = find_category_column(df)
        df = df[df[cat_col] == category]
    
    # Parse and aggregate
    df['MonthDT'] = pd.to_datetime(df['Month'], format='%b-%Y', errors='coerce')
    df.dropna(subset=['MonthDT'], inplace=True)
    
    monthly = df.groupby('MonthDT')['Demand'].sum().reset_index()
    monthly = monthly.sort_values('MonthDT')
    
    return monthly
```

### 7.2 SKU State Metadata

Each forecast response includes comprehensive metadata:

```json
{
  "items": [...],
  "source": "PART_LEVEL",
  "sku_state": "ACTIVE",
  "confidence": "HIGH",
  "sparsity": 0.12,
  "confidence_score": 87
}
```

| Field | Purpose | Consumer |
|-------|---------|----------|
| `source` | Identifies forecast methodology | Analytics, debugging |
| `sku_state` | SKU classification | UI display, filtering |
| `confidence` | Readable confidence level | User-facing display |
| `sparsity` | Demand density metric | Advanced analysis |
| `confidence_score` | Numeric confidence (0-99) | Sorting, filtering |

### 7.3 Edge Cases

| Edge Case | Handling |
|-----------|----------|
| **Empty dataset** | Returns empty items array with NONE metadata |
| **SKU with one month data** | Classified as DORMANT, uses global fallback |
| **SKU with all zeros** | Classified as INACTIVE, 0 forecast |
| **Missing category column** | Falls back to global aggregation |
| **Infinity in demand** | Replaced with NaN, then 0 |
| **Future dates in data** | Handled correctly; only truly future months flagged |

---

*End of Forecasting Engine Documentation*