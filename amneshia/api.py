from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os

from .db import AmneshiaDB
from .exporter import export_to_hermes

app = FastAPI(title="Amneshia API", description="Single Source of Truth Memory Hub")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

db = AmneshiaDB()

class MemoryInput(BaseModel):
    type: str
    scope: str
    content: str
    tags: Optional[List[str]] = []
    metadata: Optional[Dict[str, Any]] = {}

@app.post("/api/memories")
def api_add_memory(mem: MemoryInput):
    mem_id = db.add_memory(mem.type, mem.scope, mem.content, mem.tags, mem.metadata)
    export_to_hermes()
    return {"id": mem_id, "status": "success"}

@app.get("/api/memories/exact")
def api_search_exact(query: str = "", scope: str = None, type: str = None):
    return db.search_exact(query, scope, type)

@app.get("/api/memories/semantic")
def api_search_semantic(query: str, n_results: int = 5):
    return db.search_semantic(query, n_results)

@app.delete("/api/memories/{mem_id}")
def api_delete_memory(mem_id: str):
    if db.delete_memory(mem_id):
        export_to_hermes()
        return {"status": "success"}
    raise HTTPException(status_code=404, detail="Memory not found")

@app.post("/api/export")
def api_export_manual():
    export_to_hermes()
    return {"status": "success"}

# Serve Frontend static build
dashboard_path = os.path.join(os.getcwd(), "dist-dashboard")
if os.path.exists(dashboard_path):
    app.mount("/", StaticFiles(directory=dashboard_path, html=True), name="dashboard")

def run_api_server():
    import uvicorn
    print("\n🚀 Amneshia API & Dashboard running at: http://localhost:3456\n")
    uvicorn.run(app, host="0.0.0.0", port=3456, log_level="error")
