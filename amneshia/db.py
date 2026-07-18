import os
import json
import uuid
import sqlite3
import chromadb
from datetime import datetime
from typing import List, Dict, Any, Optional

class AmneshiaDB:
    def __init__(self, db_dir: str = None):
        if db_dir is None:
            db_dir = os.path.expanduser("~/.amneshia")
        os.makedirs(db_dir, exist_ok=True)
        
        # SQLite untuk Exact Match dan Relational Data
        self.sqlite_path = os.path.join(db_dir, "memory.db")
        self._init_sqlite()
        
        # ChromaDB untuk RAG / Semantic Search
        self.chroma_client = chromadb.PersistentClient(path=os.path.join(db_dir, "chroma"))
        self.collection = self.chroma_client.get_or_create_collection(name="memories")

    def _init_sqlite(self):
        with sqlite3.connect(self.sqlite_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS memories (
                    id TEXT PRIMARY KEY,
                    type TEXT NOT NULL,
                    scope TEXT NOT NULL,
                    content TEXT NOT NULL,
                    tags TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    metadata TEXT
                )
            """)
            conn.execute("CREATE INDEX IF NOT EXISTS idx_type ON memories(type)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_scope ON memories(scope)")

    def add_memory(self, mem_type: str, scope: str, content: str, tags: List[str] = None, metadata: Dict[str, Any] = None) -> str:
        mem_id = str(uuid.uuid4())
        tags_json = json.dumps(tags or [])
        meta_json = json.dumps(metadata or {})
        
        # Simpan ke SQLite
        with sqlite3.connect(self.sqlite_path) as conn:
            conn.execute(
                "INSERT INTO memories (id, type, scope, content, tags, metadata) VALUES (?, ?, ?, ?, ?, ?)",
                (mem_id, mem_type, scope, content, tags_json, meta_json)
            )
        
        # Simpan ke ChromaDB untuk Semantic Search
        combined_text = f"Type: {mem_type}, Scope: {scope}. {content}"
        self.collection.add(
            documents=[combined_text],
            metadatas=[{"type": mem_type, "scope": scope, "tags": tags_json}],
            ids=[mem_id]
        )
        return mem_id

    def get_memory(self, mem_id: str) -> Optional[Dict[str, Any]]:
        with sqlite3.connect(self.sqlite_path) as conn:
            conn.row_factory = sqlite3.Row
            row = conn.execute("SELECT * FROM memories WHERE id = ?", (mem_id,)).fetchone()
            if row:
                return dict(row)
        return None

    def search_exact(self, query: str = "", scope: str = None, mem_type: str = None) -> List[Dict[str, Any]]:
        sql = "SELECT * FROM memories WHERE 1=1"
        params = []
        if query:
            sql += " AND content LIKE ?"
            params.append(f"%{query}%")
        if scope:
            sql += " AND scope = ?"
            params.append(scope)
        if mem_type:
            sql += " AND type = ?"
            params.append(mem_type)
            
        sql += " ORDER BY updated_at DESC"
        
        with sqlite3.connect(self.sqlite_path) as conn:
            conn.row_factory = sqlite3.Row
            rows = conn.execute(sql, params).fetchall()
            return [dict(row) for row in rows]

    def search_semantic(self, query: str, n_results: int = 5, where_filter: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """Mencari memori berdasarkan makna kalimat (RAG)."""
        results = self.collection.query(
            query_texts=[query],
            n_results=n_results,
            where=where_filter
        )
        
        # Ambil detail dari SQLite
        memories = []
        if results and results['ids'] and len(results['ids'][0]) > 0:
            for mem_id in results['ids'][0]:
                mem = self.get_memory(mem_id)
                if mem:
                    memories.append(mem)
        return memories

    def delete_memory(self, mem_id: str) -> bool:
        with sqlite3.connect(self.sqlite_path) as conn:
            cursor = conn.execute("DELETE FROM memories WHERE id = ?", (mem_id,))
            if cursor.rowcount > 0:
                self.collection.delete(ids=[mem_id])
                return True
        return False
