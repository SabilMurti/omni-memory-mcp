import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { searchMemories, Memory } from '../db/index.js';

function formatMemoryBlock(mem: Memory): string {
  const date = new Date(mem.created_at).toISOString().split('T')[0];
  const typeLabel = mem.type.toUpperCase();
  return `[${date}] [${typeLabel}] ${mem.content}`;
}

export async function triggerExport() {
  const HERMES_DIR = join(homedir(), '.hermes');
  const MEMORIES_DIR = join(HERMES_DIR, 'memories');
  
  if (!existsSync(HERMES_DIR)) return;
  if (!existsSync(MEMORIES_DIR)) {
    mkdirSync(MEMORIES_DIR, { recursive: true });
  }

  // Ambil semua memory
  const allMemories = searchMemories();

  // Pisahkan berdasarkan kategori untuk Hermes
  const userMemories = allMemories.filter(m => ['user', 'story', 'preference'].includes(m.type));
  const sysMemories = allMemories.filter(m => ['workflow', 'project', 'skill'].includes(m.type));

  // USER.md
  let userMd = '# User Profile / Global Preferences\n\n';
  userMemories.forEach(m => {
    userMd += `- **[${m.scope.toUpperCase()}]**: ${m.content}\n`;
  });
  writeFileSync(join(MEMORIES_DIR, 'USER.md'), userMd);

  // MEMORY.md
  let sysMd = '# System & Working Memory\n\n';
  sysMemories.forEach(m => {
    sysMd += `- **[${m.scope.toUpperCase()}]**: ${m.content}\n`;
  });
  writeFileSync(join(MEMORIES_DIR, 'MEMORY.md'), sysMd);

  console.error("Exported to Hermes Markdown successfully.");
}