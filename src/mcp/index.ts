import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { addMemory, searchMemories, updateMemory, deleteMemory } from "../db/index.js";
import { triggerExport } from "../api/exporter.js";

const server = new Server(
  {
    name: "omni-memory-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "add_memory",
        description: "Add a new memory to the Omni Memory system.",
        inputSchema: {
          type: "object",
          properties: {
            type: { type: "string", description: "Type of memory (user, project, workflow, preference)", enum: ["user", "project", "workflow", "preference"] },
            scope: { type: "string", description: "Scope (e.g., global, pormulir, klore-noir)" },
            content: { type: "string", description: "The actual memory content" },
            tags: { type: "array", items: { type: "string" }, description: "Optional tags" }
          },
          required: ["type", "scope", "content"],
        },
      },
      {
        name: "search_memories",
        description: "Search existing memories.",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search keyword in content" },
            scope: { type: "string", description: "Filter by scope" },
            type: { type: "string", description: "Filter by type" }
          },
        },
      }
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "add_memory": {
      const { type, scope, content, tags } = request.params.arguments as any;
      const mem = addMemory(type, scope, content, tags || []);
      
      // Auto-export after adding memory
      try {
        await triggerExport();
      } catch (e) {
        console.error("Export failed:", e);
      }

      return {
        content: [{ type: "text", text: `Memory added successfully with ID: ${mem.id}` }],
      };
    }
    case "search_memories": {
      const { query, scope, type } = request.params.arguments as any;
      const results = searchMemories(query, scope, type);
      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
      };
    }
    default:
      throw new Error("Unknown tool");
  }
});

export async function runMcpServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Omni Memory MCP Server running on stdio");
}