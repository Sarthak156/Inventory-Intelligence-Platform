import pandas as pd

def transform_dataset(df):

    # 1. Check if the dataset is already in long format
    if "Month" in df.columns and "Demand" in df.columns:
        df_long = df.copy()
    else:
        # 2. Otherwise, assume wide format and gather month columns
        # Exclude common descriptive columns so they aren't parsed as dates
        exclude_cols_lower = [
            "part no", "total_demand", "total demand", "total",
            "part description", "description", "desc", "item description",
            "category", "name", "sku"
        ]

        month_columns = [
            col for col in df.columns
            if str(col).lower().strip() not in exclude_cols_lower
            and not str(col).lower().startswith("unnamed")
        ]

        df_long = df.melt(
            id_vars=["Part No"],
            value_vars=month_columns,
            var_name="Month",
            value_name="Demand"
        )

    # Force Demand to be numeric, turning text/errors into 0
    df_long["Demand"] = pd.to_numeric(df_long["Demand"], errors="coerce").fillna(0)

    # Try to parse the Month column as datetime
    parsed_months = pd.to_datetime(
        df_long["Month"],
        format="mixed",
        errors="coerce"
    )

    # If it parses successfully, format it as 'Jan-2024'
    # If it fails (NaT), keep the original raw text so it doesn't become completely blank
    df_long["Month"] = parsed_months.dt.strftime("%b-%Y").fillna(df_long["Month"])

    return df_long