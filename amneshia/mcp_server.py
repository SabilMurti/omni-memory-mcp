import json
import logging
from mcp.server.fastmcp import FastMCP
from .db import AmneshiaDB
from .exporter import export_to_hermes

# Setup logger for MCP so it doesn't pollute stdout (which is used for MCP comms)
logging.basicConfig(level=logging.ERROR)

db = AmneshiaDB()

# Buat MCP Server (nama "Amneshia")
mcp = FastMCP("Amneshia")

@mcp.tool()
def add_memory(mem_type: str, scope: str, content: str, tags: list[str] = None) -> str:
    """
    Menambahkan memori baru ke Amneshia Database.
    
    Args:
        mem_type: 'user', 'preference', 'project', atau 'workflow'
        scope: ruang lingkup, misalnya 'global', 'pormulir', dll.
        content: Isi memori yang ingin disimpan
        tags: List tag tambahan opsional
    """
    mem_id = db.add_memory(mem_type=mem_type, scope=scope, content=content, tags=tags)
    export_to_hermes()
    return f"Memory added successfully with ID: {mem_id}"

@mcp.tool()
def search_exact(query: str = "", scope: str = "", mem_type: str = "") -> str:
    """
    Mencari memori berdasarkan kecocokan string persis (SQL LIKE).
    """
    results = db.search_exact(query=query, scope=scope if scope else None, mem_type=mem_type if mem_type else None)
    return json.dumps([dict(r) for r in results], indent=2)

@mcp.tool()
def search_semantic(query: str, n_results: int = 5) -> str:
    """
    Mencari memori berdasarkan kemiripan makna kalimat menggunakan RAG (Vector Database).
    Gunakan ini ketika user bertanya dengan bahasa natural.
    """
    results = db.search_semantic(query=query, n_results=n_results)
    return json.dumps([dict(r) for r in results], indent=2)

def run_mcp_server():
    """Menjalankan stdio MCP server."""
    mcp.run(transport='stdio')
