import pandas as pd
from fastapi import APIRouter, HTTPException
import os
from dateutil.relativedelta import relativedelta
import numpy as np

router = APIRouter()

DATA_FILE = "data/transformed_data.csv"

# --- In-Memory Cache ---
_cached_df = None
_cached_mtime = 0

def get_cached_df():
    global _cached_df, _cached_mtime
    if not os.path.exists(DATA_FILE):
        return None
        
    current_mtime = os.path.getmtime(DATA_FILE)
    # Reload if file was modified (e.g., new upload) or not loaded yet
    if _cached_df is None or current_mtime > _cached_mtime:
        _cached_df = pd.read_csv(DATA_FILE, low_memory=False)
        _cached_mtime = current_mtime
    return _cached_df

def get_monthly_demand_df(part_no: str = None):
    df = get_cached_df()
    if df is None or df.empty:
        return pd.DataFrame(columns=["Month", "Demand"])

    # Filter by specific part number if requested
    if part_no and part_no != "ALL_PARTS":
        df = df[df['Part No'].astype(str) == str(part_no)].copy()
    else:
        df = df.copy()
        
    df['Demand'] = pd.to_numeric(df['Demand'], errors='coerce').fillna(0)
    
    # Convert month to datetime for sorting, coercing errors to NaT
    df['MonthDT'] = pd.to_datetime(df['Month'], format='%b-%Y', errors='coerce')
    
    # Drop rows where month could not be parsed
    df.dropna(subset=['MonthDT'], inplace=True)

    # Aggregate demand by month
    monthly_demand = df.groupby('MonthDT')['Demand'].sum().reset_index()
    
    # Sort by date
    monthly_demand = monthly_demand.sort_values('MonthDT').reset_index(drop=True)
    
    return monthly_demand

@router.get("/monthly-demand")
@router.get("/monthly-demand/{part_no}")
async def get_monthly_demand(part_no: str = None):
    if not os.path.exists(DATA_FILE):
        return []

    monthly_demand = get_monthly_demand_df(part_no)

    if monthly_demand.empty:
        return []

    # Standard 3-month rolling average for a stable historical forecast
    monthly_demand['Forecast'] = monthly_demand['Demand'].shift(1).rolling(window=3, min_periods=1).mean()

    # ADVANCED: Project future months using iterative moving average
    last_date = monthly_demand['MonthDT'].max()
    future_dates = [last_date + relativedelta(months=i) for i in range(1, 13)]
    
    future_forecasts = []
    # Get the last 3 actual demands to seed the future predictions
    current_window = monthly_demand['Demand'].dropna().tail(3).tolist()
    
    for _ in future_dates:
        next_val = sum(current_window) / len(current_window) if current_window else 0
        future_forecasts.append(next_val)
        # Slide the window forward, using the prediction as the next input
        if len(current_window) >= 3:
            current_window.pop(0)
        current_window.append(next_val)
        
    future_df = pd.DataFrame({
        'MonthDT': future_dates,
        'Demand': [np.nan] * 12,
        'Forecast': future_forecasts
    })
    
    combined_df = pd.concat([monthly_demand, future_df], ignore_index=True)

    # Flag future months
    combined_df['Is_Future'] = combined_df['Demand'].isna()

    # Final formatting
    combined_df['Month'] = combined_df['MonthDT'].dt.strftime('%b-%Y')
    
    # Select columns for the final result
    result_df = combined_df[['Month', 'Demand', 'Forecast', 'Is_Future']].copy()

    # Fast vectorized replacement of Infs and NaNs to None for JSON compliance
    result_df = result_df.replace([np.inf, -np.inf], np.nan)
    result_df = result_df.astype(object).where(pd.notna(result_df), None)
    return result_df.to_dict(orient="records")


@router.get("/inventory")
async def get_inventory(page: int = 1, limit: int = 20, search: str = ""):
    df = get_cached_df()
    if df is None or df.empty:
        return {"items": [], "total": 0, "columns": []}
    try:
        if search:
            # Fast vectorized case-insensitive string matching across all columns
            mask = np.column_stack([
                df[col].astype(str).str.contains(search, case=False, na=False, regex=False) 
                for col in df.columns
            ]).any(axis=1)
            df = df[mask]
            
        total = len(df)
        start = (page - 1) * limit
        end = start + limit
        paginated_df = df.iloc[start:end].copy()
        
        # Fast vectorized replacement of Infs and NaNs to None for JSON compliance
        paginated_df = paginated_df.replace([np.inf, -np.inf], np.nan)
        paginated_df = paginated_df.astype(object).where(pd.notna(paginated_df), None)
        return {
            "items": paginated_df.to_dict(orient="records"),
            "total": total,
            "columns": df.columns.tolist()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/parts")
async def get_parts():
    """
    Retrieves a sorted list of unique part numbers from the transformed dataset.
    """
    df = get_cached_df()
    if df is None:
        return []
    try:
        parts = sorted(df["Part No"].dropna().unique().tolist())
        return parts
    except (KeyError, ValueError):
        # Gracefully handle if 'Part No' is missing or file is malformed
        return []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading parts: {str(e)}")