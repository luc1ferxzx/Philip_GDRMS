from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI()

frontend_path = os.path.join(os.path.dirname(__file__), "..", "philip-frontend")

# 1. Specifically handle the root URL first
@app.get("/")
async def read_index():
    return FileResponse(os.path.join(frontend_path, "index.html"))

# 2. Mount everything else to the root "/" 
# This must come AFTER the @app.get("/") route
app.mount("/", StaticFiles(directory=frontend_path), name="frontend")

