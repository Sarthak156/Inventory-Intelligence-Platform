from fastapi import APIRouter
import pandas as pd
import numpy as np
import os

router = APIRouter()

DATA_PATH = "data/transformed_data.csv"


@router.get("/inventory")
def get_inventory():
    if not os.path.exists(DATA_PATH):
        return []
        
    df = pd.read_csv(DATA_PATH, low_memory=False)
    df = df.replace([np.inf, -np.inf], np.nan).fillna("")
    return df.to_dict(orient="records")


@router.get("/monthly-demand")
def get_monthly_demand():
    if not os.path.exists(DATA_PATH):
        return []

    df = pd.read_csv(DATA_PATH, low_memory=False)

    monthly = (
        df.groupby("Month")["Demand"]
        .sum()
        .reset_index()
    )

    monthly = monthly.sort_values("Month")

    return monthly.to_dict(orient="records")