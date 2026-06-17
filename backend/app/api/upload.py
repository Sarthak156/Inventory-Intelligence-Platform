from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import os
import uuid
import numpy as np
import pandas as pd
from app.utils.data_transformer import transform_dataset

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class ProcessSheetRequest(BaseModel):
    file_id: str
    sheet_name: str


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        file_id = str(uuid.uuid4())
        file_extension = ".csv" if file.filename.endswith(".csv") else ".xlsx"
        file_path = os.path.join(UPLOAD_DIR, f"{file_id}{file_extension}")

        with open(file_path, "wb") as f:
            f.write(await file.read())

        sheets = []
        if file_extension == ".xlsx":
            excel_file = pd.ExcelFile(file_path)
            sheets = excel_file.sheet_names
        else:
            sheets = ["Default"]

        return {
            "file_id": file_id,
            "sheets": sheets
        }
    except Exception as e:
        return JSONResponse(
            status_code=500, 
            content={"detail": f"Error uploading file: {str(e)}"}
        )

@router.post("/process-sheet")
async def process_sheet(request: ProcessSheetRequest):
    try:
        csv_path = os.path.join(UPLOAD_DIR, f"{request.file_id}.csv")
        excel_path = os.path.join(UPLOAD_DIR, f"{request.file_id}.xlsx")

        if os.path.exists(csv_path):
            df = pd.read_csv(csv_path, low_memory=False)
        elif os.path.exists(excel_path):
            if request.sheet_name and request.sheet_name != "Default":
                df = pd.read_excel(excel_path, sheet_name=request.sheet_name)
            else:
                df = pd.read_excel(excel_path)
        else:
            return JSONResponse(status_code=404, content={"detail": "File not found"})

        # Defensive check: ensure sheet is not empty
        if df.empty:
            return JSONResponse(
                status_code=400,
                content={"detail": f"The selected sheet '{request.sheet_name}' is empty."}
            )
            
        # Clean and standardize column names (e.g., converts 'Part Number' to 'Part No')
        df.columns = [str(col).strip() for col in df.columns]
        df.rename(columns={"Part Number": "Part No", "SKU": "Part No", "Item": "Part No", "Part_No": "Part No"}, inplace=True)
        
        # Guard against processing invalid sheets (like Summary or Instructions tabs)
        if "Part No" not in df.columns:
            return JSONResponse(
                status_code=400,
                content={"detail": f"Invalid sheet: '{request.sheet_name}' is missing the required 'Part No' column."}
            )

        try:
            transformed_df = transform_dataset(df)
        except Exception as e:
            # This provides a more specific error if the data structure is wrong for the transformation
            raise HTTPException(
                status_code=400,
                detail=f"Data transformation failed. Ensure the sheet has a valid time-series format (e.g., monthly columns). Error: {e}"
            )

        os.makedirs("data", exist_ok=True)
        transformed_df.to_csv(
            "data/transformed_data.csv",
            index=False
        )
        
        # Safely extract metrics to avoid KeyError if dataset columns vary
        total_parts = int(transformed_df["Part No"].nunique()) if "Part No" in transformed_df.columns else 0
        
        total_demand = 0.0
        if "Demand" in transformed_df.columns:
            demand_sum = transformed_df["Demand"].sum()
            total_demand = float(demand_sum) if pd.notna(demand_sum) else 0.0
            
        # Clean data for strict JSON compliance (prevents Axios errors)
        preview_df = transformed_df.head(20).copy()
        
        preview_df = preview_df.replace([np.inf, -np.inf], np.nan)
        preview_df = preview_df.astype(object).where(pd.notna(preview_df), None)
        preview_records = preview_df.to_dict(orient="records")

        return {
            "total_rows": len(transformed_df),
            "columns": list(transformed_df.columns),
            "total_parts": total_parts,
            "total_demand": total_demand,
            "sample_data": preview_records
        }
    except Exception as e:
        return JSONResponse(
            status_code=500, 
            content={"detail": f"Error processing sheet: {str(e)}"}
        )