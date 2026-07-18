# Amneshia

The ultimate "Single Source of Truth" memory system and RAG Hub for AI Agents (Hermes, Claude Desktop, Antigravity IDE, etc.).

## Features
- **Semantic RAG Search**: Powered by ChromaDB & Local Embeddings to understand *meaning*, not just exact words.
- **Structured SQLite Core**: Rock-solid, local database for exact-match retrieval.
- **First-Class MCP Server**: Connect to any MCP-compatible agent instantly via `stdio`.
- **FastAPI Backend**: Built-in REST API for external/web integrations.
- **Auto-Exporter**: Synchronizes memories directly to Hermes (`USER.md` and `MEMORY.md`) in real-time.

## Installation (using `uv`)
```bash
uv tool install .
```

## Running the Server
```bash
# Run as MCP Server (for Claude Desktop / Hermes / OMP)
amneshia mcp

# Run as API Server (REST API)
amneshia api
```

## Usage in Hermes Agent
Add to your `~/.hermes/config.yaml`:
```yaml
mcp_servers:
  amneshia:
    command: "amneshia"
    args: ["mcp"]
```