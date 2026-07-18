import { runMcpServer } from './mcp/index.js';
import { runApiServer } from './api/server.js';

const mode = process.argv[2] || 'mcp';

if (mode === 'api') {
  runApiServer();
} else {
  // Default: jalan sebagai MCP Server via stdio
  // Kita spawn API server di background agar dashboard tetap jalan
  runApiServer(3456);
  runMcpServer().catch(console.error);
}