import pandas as pd
import numpy as np

def calculate_inventory_risk(df: pd.DataFrame):
    if df is None or df.empty:
        return []

    df_copy = df.copy()
    df_copy['Demand'] = pd.to_numeric(df_copy['Demand'], errors='coerce').fillna(0)

    results = []
    for part_no, group in df_copy.groupby('Part No'):
        demand = group['Demand'].values
        total_months = len(demand)

        if total_months == 0:
            continue

        mean_demand = np.mean(demand)
        std_demand = np.std(demand)

        # A. Volatility: std / mean
        volatility = (std_demand / mean_demand) if mean_demand > 0 else 0

        # B. Sparsity: zero_months / total_months
        zero_months = np.sum(demand == 0)
        sparsity = zero_months / total_months

        # C. Forecast Growth: future_avg / historical_avg
        # Using last 3 months as an operational proxy for future trajectory
        if total_months >= 3:
            future_avg_proxy = np.mean(demand[-3:])
        else:
            future_avg_proxy = mean_demand

        forecast_growth = (future_avg_proxy / mean_demand) if mean_demand > 0 else 1.0

        # Calculate Risk Score (Cap extremes to prevent distortion)
        volatility_capped = min(volatility, 2.0)
        forecast_growth_capped = min(forecast_growth, 2.0)

        risk_score = (volatility_capped * 0.4) + (sparsity * 0.3) + (forecast_growth_capped * 0.3)

        # D. Explainability Tags
        reasons = []
        if volatility > 1.0:
            reasons.append("HIGH VOLATILITY")
        if sparsity > 0.7:
            reasons.append("SPARSE DEMAND")
        if forecast_growth > 1.5:
            reasons.append("FORECAST SURGE")

        # Classification and Recommendation
        if risk_score >= 0.7:
            risk, recommendation = "HIGH", "Increase Safety Stock"
        elif risk_score >= 0.4:
            risk, recommendation = "MEDIUM", "Monitor Demand Closely"
        else:
            risk, recommendation = "LOW", "Maintain Current Levels"

        results.append({
            "Part No": str(part_no),
            "Risk": risk,
            "Volatility": round(volatility, 2),
            "Sparsity": round(sparsity, 2),
            "ForecastGrowth": round(forecast_growth, 2),
            "RiskScore": round(risk_score, 2),
            "Recommendation": recommendation,
            "Reasons": reasons
        })

    # Sort highest risk parts to the top
    results.sort(key=lambda x: x['RiskScore'], reverse=True)
    return results