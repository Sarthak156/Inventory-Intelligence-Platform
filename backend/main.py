from fastapi import FastAPI

app = FastAPI(
    title="Inventory Intelligence Platform",
    version="1.0"
)

@app.get("/")
def home():
    return {"message": "Platform Running Successfully"}