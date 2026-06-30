import pandas as pd
from fastapi import APIRouter, HTTPException, Body
from fastapi.responses import StreamingResponse
import os
from dateutil.relativedelta import relativedelta
import numpy as np
from typing import List, Union
from io import BytesIO
from datetime import datetime
import logging
import tempfile

router = APIRouter()

DATA_FILE = "data/transformed_data.csv"

# --- In-Memory Cache ---
_cached_df = None
_cached_mtime = 0

logger = logging.getLogger(__name__)

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

def get_monthly_demand_df(part_no: str = None, category: str = None):
    df = get_cached_df()
    if df is None or df.empty:
        return pd.DataFrame(columns=["Month", "Demand"])

    # Filter by specific part number if requested
    if part_no and part_no != "ALL_PARTS":
        df = df[df['Part No'].astype(str) == str(part_no)].copy()
    elif category:
        cat_col = next((c for c in df.columns if str(c).lower() in ['category', 'halb']), None)
        if cat_col:
            df = df[df[cat_col].astype(str) == str(category)].copy()
        else:
            df = df.copy()
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

def calculate_forecast(monthly_demand):
    if monthly_demand.empty:
        return pd.DataFrame(columns=['MonthDT', 'Demand', 'Forecast', 'Is_Future', 'Month'])

    total_months = len(monthly_demand)
    non_zero = (monthly_demand['Demand'] > 0).sum()
    is_sparse = (total_months > 0) and ((total_months - non_zero) / total_months > 0.5)

    if is_sparse:
        # Non-zero moving average to prevent flattening intermittent demand spikes
        shifted_demand = monthly_demand['Demand'].shift(1)
        nz_ma = shifted_demand[shifted_demand > 0].rolling(window=3, min_periods=1).mean()
        monthly_demand['Forecast'] = nz_ma
        monthly_demand['Forecast'] = monthly_demand['Forecast'].ffill().fillna(0)
    else:
        # Standard 3-month rolling average for a stable historical forecast
        monthly_demand['Forecast'] = monthly_demand['Demand'].shift(1).rolling(window=3, min_periods=1).mean()

    # ADVANCED: Project future months using iterative moving average
    last_date = monthly_demand['MonthDT'].max()
    future_dates = [last_date + relativedelta(months=i) for i in range(1, 13)]
    
    future_forecasts = []
    
    if is_sparse:
        last_nz_forecast = monthly_demand['Forecast'].iloc[-1] if not monthly_demand.empty else 0
        future_forecasts = [last_nz_forecast] * 12
    else:
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
    return combined_df

@router.get("/monthly-demand")
@router.get("/monthly-demand/{part_no}")
async def get_monthly_demand(part_no: str = None):
    if not os.path.exists(DATA_FILE):
        return {"items": [], "source": "NONE", "sku_state": "NONE", "confidence": "NONE", "sparsity": 0}

    part_monthly = get_monthly_demand_df(part_no=part_no)

    if part_monthly.empty:
        return {"items": [], "source": "NONE", "sku_state": "NONE", "confidence": "NONE", "sparsity": 0}
        
    total_months = len(part_monthly)
    non_zero = (part_monthly['Demand'] > 0).sum()
    sparsity_ratio = float((total_months - non_zero) / total_months) if total_months > 0 else 1.0

    if not part_no or part_no == "ALL_PARTS":
        sku_state = "GLOBAL"
        forecast_source = "GLOBAL_AGGREGATED"
        confidence = "HIGH"
        confidence_score = 95
        combined_df = calculate_forecast(part_monthly)
    else:
        total_demand = part_monthly['Demand'].sum()
        
        # STEP 1: Classify SKU Behavior
        if total_demand == 0:
            sku_state = "INACTIVE"
            forecast_source = "NO_FORECAST"
            confidence = "NONE"
            confidence_score = 0
        elif non_zero <= 2:
            sku_state = "DORMANT"
            forecast_source = "LOW_CONFIDENCE"
            confidence = "LOW"
            confidence_score = max(15, int(35 - (sparsity_ratio * 20)))
        elif sparsity_ratio > 0.7 or non_zero < 6:
            sku_state = "SPARSE"
            forecast_source = "HALB_FALLBACK" # Intent; might fall back to global
            confidence = "MEDIUM"
            confidence_score = max(45, int(75 - (sparsity_ratio * 30)))
        else:
            sku_state = "ACTIVE"
            forecast_source = "PART_LEVEL"
            confidence = "HIGH"
            
            # Calculate a stable score based on variance (Volatility)
            demand_vals = part_monthly['Demand'].values
            mean_val = np.mean(demand_vals)
            std_val = np.std(demand_vals)
            cv = (std_val / mean_val) if mean_val > 0 else 1.0
            
            # Start at 99%, penalize for volatility and sparsity
            calculated_score = int(99 - (min(cv, 2.0) * 10) - (sparsity_ratio * 15))
            confidence_score = max(75, min(99, calculated_score))

        # STEP 2: Choose Forecasting Strategy
        if forecast_source == "NO_FORECAST":
            combined_df = calculate_forecast(part_monthly)
            combined_df['Forecast'] = 0
        elif forecast_source == "PART_LEVEL":
            combined_df = calculate_forecast(part_monthly)
        else:
            # Sparse / Dormant fallback logic
            df = get_cached_df()
            cat_col = next((c for c in df.columns if str(c).lower() in ['category', 'halb']), None)
            category_name = None
            if cat_col is not None:
                part_rows = df[df['Part No'].astype(str) == str(part_no)]
                if not part_rows.empty:
                    category_name = part_rows.iloc[0][cat_col]
            
            actual_fallback = "GLOBAL_FALLBACK"
            fallback_monthly = get_monthly_demand_df(part_no="ALL_PARTS")

            # Enforce HALB-first: only use if category data is actually sufficient
            if category_name and str(category_name).strip() != 'nan':
                halb_monthly = get_monthly_demand_df(category=category_name)
                if not halb_monthly.empty and halb_monthly['Demand'].sum() > 0:
                    actual_fallback = "HALB_FALLBACK"
                    fallback_monthly = halb_monthly
            
            if sku_state == "SPARSE":
                forecast_source = actual_fallback
                
            fallback_forecasted = calculate_forecast(fallback_monthly)
            
            # 1. Base structure for the part
            combined_df = calculate_forecast(part_monthly)
            
            # Match fallback trend to combined_df
            fallback_forecasted_sub = fallback_forecasted[['MonthDT', 'Forecast']].rename(columns={'Forecast': 'Fallback_Forecast'})
            combined_df = combined_df.merge(fallback_forecasted_sub, on='MonthDT', how='left')
            
            # 2. Extract Fallback Trend Direction (Slope multiplier instead of raw amplitude)
            fallback_hist = fallback_monthly['Demand'].tail(6)
            fallback_baseline = fallback_hist.mean() if not fallback_hist.empty and fallback_hist.mean() > 0 else 1.0
            trend_multiplier = (combined_df['Fallback_Forecast'] / fallback_baseline).fillna(1.0).clip(lower=0.5, upper=2.0)
            
            # 3. Preserve SKU Historical Scale
            non_zero_demand = part_monthly[part_monthly['Demand'] > 0]['Demand']
            recent_sparse_baseline = non_zero_demand.tail(3).mean() if not non_zero_demand.empty else 0
            sku_max = non_zero_demand.max() if not non_zero_demand.empty else 0
            
            # 4. Generate Scaled Sparse Forecast (Baseline * Trend Direction)
            raw_scaled_forecast = recent_sparse_baseline * trend_multiplier
            
            # 5. Intermittent Demand Behavior (Future Only)
            is_future_mask = combined_df['Is_Future']
            num_future = is_future_mask.sum()
            
            if num_future > 0:
                # Seed with part_no to ensure identical random curves on page refresh
                seed_val = sum(ord(c) for c in str(part_no)) if part_no else 42
                rng = np.random.RandomState(seed_val % 10000)
                
                # Probability of a demand spike (min 10%, max 90%)
                prob_demand = max(0.1, min(0.9, 1.0 - sparsity_ratio))
                
                random_draws = rng.uniform(0, 1, size=num_future)
                intermittent_mask = (random_draws < prob_demand).astype(float)
                
                # Ensure at least one spike to avoid a completely dead future
                if intermittent_mask.sum() == 0:
                    intermittent_mask[rng.randint(0, num_future)] = 1.0
                
                # Volume preserving spike scaling (maintains mathematical expectation under the curve)
                spike_multiplier = 1.0 / prob_demand
                future_forecasts = raw_scaled_forecast[is_future_mask] * intermittent_mask * spike_multiplier
                
                # 6. Amplitude Safeguard (Never allow forecast to explode past historical scale constraints)
                forecast_cap = max(sku_max * 1.5, recent_sparse_baseline * 2.0)
                if forecast_cap == 0:
                    forecast_cap = 1.0
                    
                future_forecasts = future_forecasts.clip(upper=forecast_cap)
                combined_df.loc[is_future_mask, 'Forecast'] = future_forecasts
                
            # Cap historical forecast as well to avoid misleading visuals
            hist_cap = max(sku_max * 1.5, recent_sparse_baseline * 2.0)
            combined_df.loc[~is_future_mask, 'Forecast'] = combined_df.loc[~is_future_mask, 'Forecast'].clip(upper=hist_cap)

            combined_df = combined_df.drop(columns=['Fallback_Forecast'])
    
    # Select columns for the final result
    result_df = combined_df[['Month', 'Demand', 'Forecast', 'Is_Future']].copy()

    # Round forecast to nearest integer
    result_df['Forecast'] = result_df['Forecast'].round()

    # Fast vectorized replacement of Infs and NaNs to None for JSON compliance
    result_df = result_df.replace([np.inf, -np.inf], np.nan)
    result_df = result_df.astype(object).where(pd.notna(result_df), None)
    
    return {
        "items": result_df.to_dict(orient="records"),
        "source": forecast_source,
        "sku_state": sku_state,
        "confidence": confidence,
        "sparsity": round(sparsity_ratio, 2),
        "confidence_score": confidence_score
    }


@router.get("/inventory/filters")
async def get_inventory_filters():
    df = get_cached_df()
    if df is None or df.empty or 'Month' not in df.columns:
        return {"months": [], "years": []}
    try:
        # Extract all valid parsed month strings
        valid_months = df['Month'].dropna().astype(str)
        valid_months = valid_months[valid_months.str.contains('-')]
        if valid_months.empty:
            return {"months": [], "years": []}
            
        month_year = valid_months.str.split('-', n=1, expand=True)
        unique_months = month_year[0].unique().tolist()
        unique_years = month_year[1].unique().tolist()
        
        # Sort chronologically
        month_order = {m: i for i, m in enumerate(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'])}
        months = sorted(unique_months, key=lambda x: month_order.get(x[:3], 99))
        years = sorted(unique_years, reverse=True)
        
        return {"months": months, "years": years}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/inventory")
async def get_inventory(page: int = 1, limit: int = 20, search: str = "", month: str = "", year: str = ""):
    df = get_cached_df()
    if df is None or df.empty:
        return {"items": [], "total": 0, "columns": []}
    try:
        df = df.copy()
        
        # Apply Month/Year Slicers
        if 'Month' in df.columns:
            if month and year:
                df = df[df['Month'].astype(str) == f"{month}-{year}"]
            elif month:
                df = df[df['Month'].astype(str).str.startswith(f"{month}-")]
            elif year:
                df = df[df['Month'].astype(str).str.endswith(f"-{year}")]

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

@router.get("/inventory-risk")
async def get_inventory_risk():
    from app.services.risk_engine import calculate_inventory_risk
    df = get_cached_df()
    if df is None or df.empty:
        return []
    try:
        risk_data = calculate_inventory_risk(df)
        return risk_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/export-forecast")
async def export_forecast(
    parts: List[str] = Body(..., embed=True),
    horizon: int = Body(..., embed=True),
    format: str = Body(..., embed=True)
):
    """
    Generates and streams a forecast export file (CSV or Excel) using a memory-efficient approach.
    """
    MAX_EXPORT_ROWS = 50000
    logger.info(f"Export requested. Format: {format}, Horizon: {horizon}, Parts requested: {len(parts)}")

    from app.services.risk_engine import calculate_inventory_risk

    df = get_cached_df()
    if df is None or df.empty:
        raise HTTPException(status_code=404, detail="No data available to export.")

    part_list = parts
    if "ALL_PARTS" in parts:
        part_list = sorted(df["Part No"].dropna().unique().tolist())
    
    logger.info(f"Processing export for {len(part_list)} parts.")

    try:
        risk_data = calculate_inventory_risk(df)
        risk_df = pd.DataFrame(risk_data).set_index('Part No')
    except Exception as e:
        logger.warning(f"Could not calculate risk data for export, proceeding without it. Error: {e}")
        risk_df = pd.DataFrame(columns=['Risk', 'DemandTrend']).set_index('Part No')

    async def data_generator():
        total_rows = 0
        # CSV Header
        if format == 'csv':
            header = "Part Number,Part Name,Forecast Month,Forecast Value,Confidence Lower,Confidence Upper,Risk Level,Demand Trend,Forecast Generated Date\n"
            yield header.encode('utf-8')

        for i, part_no in enumerate(part_list):
            if total_rows >= MAX_EXPORT_ROWS:
                logger.warning(f"Export limit of {MAX_EXPORT_ROWS} rows reached. Stopping export.")
                if format == 'csv':
                    yield f"\nNOTE: Export truncated at {MAX_EXPORT_ROWS} rows.".encode('utf-8')
                break
            
            if (i + 1) % 100 == 0:
                logger.info(f"Processed {i+1}/{len(part_list)} parts for export...")

            demand_details = await get_monthly_demand(part_no)
            if not demand_details or not demand_details.get("items"):
                continue

            part_forecast = pd.DataFrame(demand_details["items"])
            future_forecast = part_forecast[part_forecast['Is_Future'] == True].head(horizon)

            if future_forecast.empty:
                continue

            risk_info = risk_df.loc[part_no] if part_no in risk_df.index else {}
            
            for _, row in future_forecast.iterrows():
                if total_rows >= MAX_EXPORT_ROWS: break
                
                forecast_val = row['Forecast']
                data_row = {
                    "Part Number": part_no,
                    "Part Name": risk_info.get('Part Name', 'N/A'),
                    "Forecast Month": row['Month'],
                    "Forecast Value": forecast_val,
                    "Confidence Lower": round(forecast_val * 0.85) if forecast_val is not None else '',
                    "Confidence Upper": round(forecast_val * 1.15) if forecast_val is not None else '',
                    "Risk Level": risk_info.get('Risk', 'UNKNOWN'),
                    "Demand Trend": risk_info.get('DemandTrend', 'FLAT'),
                    "Forecast Generated Date": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                }
                
                if format == 'csv':
                    csv_row = ",".join([f'"{v}"' for v in data_row.values()]) + "\n"
                    yield csv_row.encode('utf-8')
                else: # for excel
                    yield data_row
                
                total_rows += 1
        logger.info(f"Export generation complete. Total rows: {total_rows}")

    if format == 'xlsx':
        async def excel_stream_generator():
            with tempfile.NamedTemporaryFile(delete=True, suffix=".xlsx", mode='w+b') as tmp:
                logger.info(f"Using temporary file for Excel export: {tmp.name}")
                workbook = pd.ExcelWriter(tmp, engine='xlsxwriter')
                worksheet = workbook.book.add_worksheet('Forecast_Data')
                
                # Add a bold format for the header.
                header_format = workbook.book.add_format({'bold': True})
                headers = ["Part Number", "Part Name", "Forecast Month", "Forecast Value", "Confidence Lower", "Confidence Upper", "Risk Level", "Demand Trend", "Forecast Generated Date"]
                for col_num, value in enumerate(headers):
                    worksheet.write(0, col_num, value, header_format)

                row_num = 1
                async for data_row in data_generator():
                    for col_num, value in enumerate(data_row.values()):
                        worksheet.write(row_num, col_num, value)
                    row_num += 1
                
                if row_num > MAX_EXPORT_ROWS:
                    worksheet.write(row_num, 0, f"NOTE: Export truncated at {MAX_EXPORT_ROWS} rows.")

                workbook.close()
                
                tmp.seek(0)
                while chunk := tmp.read(65536):
                    yield chunk
            logger.info("Finished streaming temporary Excel file and cleaned up.")

        filename = f"forecast_export_{datetime.now().strftime('%Y%m%d')}.xlsx"
        headers = {"Content-Disposition": f"attachment; filename={filename}"}
        return StreamingResponse(excel_stream_generator(), media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers=headers)

    elif format == 'csv':
        filename = f"forecast_export_{datetime.now().strftime('%Y%m%d')}.csv"
        headers = {"Content-Disposition": f"attachment; filename={filename}"}
        return StreamingResponse(data_generator(), media_type="text/csv", headers=headers)

    else:
        raise HTTPException(status_code=400, detail="Invalid export format specified.")