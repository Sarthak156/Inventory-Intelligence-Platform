from fastapi import APIRouter
import pandas as pd

router = APIRouter()

DATA_PATH = "data/transformed_data.csv"


@router.get("/forecast-demand")
def forecast_demand():

    # Load transformed dataset
    df = pd.read_csv(DATA_PATH)

    # Ensure numeric demand
    df["Demand"] = pd.to_numeric(
        df["Demand"],
        errors="coerce"
    ).fillna(0)

    # Aggregate monthly demand
    monthly = (
        df.groupby("Month")["Demand"]
        .sum()
        .reset_index()
    )

    # Parse dates correctly
    monthly["ParsedMonth"] = pd.to_datetime(
        monthly["Month"],
        format="%b-%Y",
        errors="coerce"
    )

    monthly = monthly.sort_values(
        "ParsedMonth"
    )

    # Moving Average Forecast
    monthly["Forecast"] = (
        monthly["Demand"]
        .rolling(window=3)
        .mean()
    )

    # Fill initial null forecasts
    monthly["Forecast"] = (
        monthly["Forecast"]
        .fillna(method="bfill")
    )

    # Clean output
    result = monthly[
        ["Month", "Demand", "Forecast"]
    ]

    return result.to_dict(
        orient="records"
    )