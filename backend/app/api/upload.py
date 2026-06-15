from fastapi import APIRouter, UploadFile, File
import pandas as pd

router = APIRouter()

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):

    if file.filename.endswith(".csv"):
        df = pd.read_csv(file.file)

    else:
        df = pd.read_excel(file.file)

    return {
        "filename": file.filename,
        "columns": list(df.columns),
        "total_rows": len(df),
        "sample_data": df.head(5).to_dict(orient="records")
    }