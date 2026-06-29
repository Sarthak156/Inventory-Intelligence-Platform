from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel
import os
import uuid
import numpy as np
import pandas as pd
import logging
import shutil
from app.utils.data_transformer import transform_dataset

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# --- Setup structured logging ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ProcessSheetRequest(BaseModel):
    file_id: str
    sheet_name: str


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    file_id = str(uuid.uuid4())
    file_extension = ".csv" if file.filename.endswith(".csv") else ".xlsx"
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}{file_extension}")
    logger.info(f"Upload received. Assigning file_id: {file_id} for filename: {file.filename}")

    try:
        # Stream file to disk to avoid loading all into memory
        logger.info(f"Streaming file to path: {file_path}")
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        logger.info(f"File streaming complete. Size: {os.path.getsize(file_path)} bytes.")

        def get_sheet_names(path, ext):
            """Wrapper for the blocking pandas call."""
            if ext == ".xlsx":
                logger.info("Reading Excel file to get sheet names...")
                excel_file = pd.ExcelFile(path)
                names = excel_file.sheet_names
                logger.info(f"Found sheets: {names}")
                return names
            return ["Default"]

        # Run the blocking I/O operation in a thread pool
        sheets = await run_in_threadpool(get_sheet_names, path=file_path, ext=file_extension)

        logger.info(f"Successfully processed upload for file_id: {file_id}. Returning sheets.")
        return {
            "file_id": file_id,
            "sheets": sheets
        }
    except Exception as e:
        logger.error(f"Error during file upload for file_id {file_id}: {e}", exc_info=True)
        # Cleanup partially uploaded file on error
        if os.path.exists(file_path):
            os.remove(file_path)
        return JSONResponse(
            status_code=500, 
            content={"detail": f"Error uploading file: {str(e)}"}
        )
    finally:
        # Ensure file object is closed
        file.file.close()

@router.post("/process-sheet")
async def process_sheet(request: ProcessSheetRequest):
    file_id = request.file_id
    sheet_name = request.sheet_name
    logger.info(f"Processing request for file_id: {file_id}, sheet: {sheet_name}")

    try:
        csv_path = os.path.join(UPLOAD_DIR, f"{file_id}.csv")
        excel_path = os.path.join(UPLOAD_DIR, f"{file_id}.xlsx")

        def read_data(c_path, e_path, s_name):
            """Wrapper for blocking pandas read operations."""
            if os.path.exists(c_path):
                logger.info(f"Reading CSV from {c_path}")
                return pd.read_csv(c_path, low_memory=False)
            elif os.path.exists(e_path):
                logger.info(f"Reading Excel sheet '{s_name}' from {e_path}")
                return pd.read_excel(e_path, sheet_name=s_name if s_name != "Default" else None)
            else:
                return None

        df = await run_in_threadpool(read_data, c_path=csv_path, e_path=excel_path, s_name=sheet_name)

        if df is None:
            logger.warning(f"File not found for file_id: {file_id}")
            raise HTTPException(status_code=404, detail="File not found. It may have expired or been deleted.")

        # Defensive check: ensure sheet is not empty
        if df.empty:
            logger.warning(f"Sheet '{sheet_name}' for file_id {file_id} is empty.")
            return JSONResponse(
                status_code=400,
                content={"detail": f"The selected sheet '{request.sheet_name}' is empty or invalid."}
            )
            
        # Clean and standardize column names (e.g., converts 'Part Number' to 'Part No')
        df.columns = [str(col).strip() for col in df.columns]
        df.rename(columns={"Part Number": "Part No", "SKU": "Part No", "Item": "Part No", "Part_No": "Part No", "Material": "Part No"}, inplace=True)
        
        # Guard against processing invalid sheets (like Summary or Instructions tabs)
        if "Part No" not in df.columns:
            logger.error(f"Sheet '{sheet_name}' for file_id {file_id} is missing 'Part No' column.")
            return JSONResponse(
                status_code=400,
                content={"detail": f"Invalid sheet: '{request.sheet_name}' is missing the required 'Part No' column."}
            )

        try:
            logger.info(f"Starting data transformation for file_id {file_id}.")
            transformed_df = transform_dataset(df)
            logger.info("Data transformation successful.")
        except Exception as e:
            logger.error(f"Data transformation failed for file_id {file_id}: {e}", exc_info=True)
            # This provides a more specific error if the data structure is wrong for the transformation
            raise HTTPException(
                status_code=400,
                detail=f"Data transformation failed. Ensure the sheet has a valid time-series format (e.g., monthly columns). Error: {e}"
            )

        os.makedirs("data", exist_ok=True)
        logger.info("Saving transformed data to data/transformed_data.csv")
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

        logger.info(f"Successfully processed sheet for file_id {file_id}. Returning metrics and preview.")
        return {
            "total_rows": len(transformed_df),
            "columns": list(transformed_df.columns),
            "total_parts": total_parts,
            "total_demand": total_demand,
            "sample_data": preview_records
        }
    except Exception as e:
        logger.error(f"An unhandled error occurred during sheet processing for file_id {file_id}: {e}", exc_info=True)
        return JSONResponse(
            status_code=500, 
            content={"detail": f"Error processing sheet: {str(e)}"}
        )