# Omni Memory MCP

A unified "Single Source of Truth" memory system for AI Agents (Hermes, Oh My Pi, Antigravity IDE, Claude Desktop, etc.).

## Features
- **Centralized Database**: Uses `better-sqlite3` for fast, local, and structured storage.
- **MCP Server**: Provides `add_memory` and `search_memories` tools via `stdio`.
- **API Server**: REST API for external integrations.
- **Web Dashboard**: Clean local UI (built with Vite + TS) to manage your memories.
- **Auto-Exporter**: Automatically exports structured Markdown (`USER.md` and `MEMORY.md`) to `~/.hermes/memories/` every time a memory is added or modified.

## Installation

```bash
git clone https://github.com/SabilMurti/omni-memory-mcp.git
cd omni-memory-mcp
npm install
npm run build
```

## Usage

### 1. Run MCP and API Server
```bash
npm start
```
This will start the stdio MCP server AND run the Express API backend on port `3456`.

### 2. Run the Dashboard
In a separate terminal:
```bash
npm run dev:dashboard
```
Open `http://localhost:5173` to view the UI.

### 3. Connect to Hermes Agent
Add this to your `~/.hermes/config.yaml`:
```yaml
mcp_servers:
  omni_memory:
    command: "node"
    args: ["/path/to/omni-memory-mcp/dist/index.js"]
```

## Structure
- `src/db/` - SQLite database and schema.
- `src/mcp/` - Model Context Protocol tool definitions.
- `src/api/` - Express REST server and Markdown Exporter.
- `src/dashboard/` - Vite frontend logic.

---
Built by Sabil Murti (Murtix) / AI Integrator