import pandas as pd

def transform_dataset(df):

    month_columns = [
        col for col in df.columns
        if col not in ["Part No", "Total_Demand"]
    ]

    df_long = df.melt(
        id_vars=["Part No"],
        value_vars=month_columns,
        var_name="Month",
        value_name="Demand"
    )

    df_long["Demand"] = (
        df_long["Demand"]
        .fillna(0)
    )

    df_long["Month"] = pd.to_datetime(
        df_long["Month"],
        format="mixed",
        errors="coerce"
    )

    df_long["Month"] = (
        df_long["Month"]
        .dt.strftime("%b-%Y")
    )

    return df_long