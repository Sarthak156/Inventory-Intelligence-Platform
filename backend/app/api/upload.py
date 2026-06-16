from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import os
import pandas as pd
from app.utils.data_transformer import transform_dataset

router = APIRouter()


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        if file.filename.endswith(".csv"):
            df = pd.read_csv(file.file)
        else:
            df = pd.read_excel(file.file)

        transformed_df = transform_dataset(df)
        os.makedirs("data", exist_ok=True)
        transformed_df.to_csv(
            "data/transformed_data.csv",
            index=False
        )

        return {
            "total_rows": len(transformed_df),
            "columns": list(transformed_df.columns),
            "total_parts": int(transformed_df["Part No"].nunique()),
            "total_demand": float(transformed_df["Demand"].sum()),
            "sample_data": transformed_df.head(20).to_dict(orient="records")
        }
    except Exception as e:
        return JSONResponse(
            status_code=500, 
            content={"detail": f"Error processing file: {str(e)}"}
        )