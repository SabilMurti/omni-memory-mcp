import Database from 'better-sqlite3';
import { join } from 'path';
import { homedir } from 'os';
import { mkdirSync, existsSync } from 'fs';

// Tentukan lokasi database
const OMNI_DIR = join(homedir(), '.omni-memory');
if (!existsSync(OMNI_DIR)) {
  mkdirSync(OMNI_DIR, { recursive: true });
}
const DB_PATH = join(OMNI_DIR, 'memory.db');

const db = new Database(DB_PATH);

// Skema Database
db.exec(`
  CREATE TABLE IF NOT EXISTS memories (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,          -- 'user', 'project', 'workflow', 'preference'
    scope TEXT NOT NULL,         -- 'global', 'pormulir', 'klore-noir', dll.
    content TEXT NOT NULL,       -- Isi memori
    tags TEXT,                   -- JSON array of strings
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT                -- JSON object for extra data (source, confidence, dll)
  );

  CREATE INDEX IF NOT EXISTS idx_memories_type ON memories(type);
  CREATE INDEX IF NOT EXISTS idx_memories_scope ON memories(scope);
`);

export interface Memory {
  id: string;
  type: string;
  scope: string;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function addMemory(
  type: string,
  scope: string,
  content: string,
  tags: string[] = [],
  metadata: Record<string, any> = {}
): Memory {
  const id = generateId();
  const stmt = db.prepare(`
    INSERT INTO memories (id, type, scope, content, tags, metadata)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    id,
    type,
    scope,
    content,
    JSON.stringify(tags),
    JSON.stringify(metadata)
  );

  return getMemory(id)!;
}

export function getMemory(id: string): Memory | undefined {
  const row = db.prepare('SELECT * FROM memories WHERE id = ?').get(id) as any;
  if (!row) return undefined;
  
  return {
    ...row,
    tags: JSON.parse(row.tags || '[]'),
    metadata: JSON.parse(row.metadata || '{}')
  };
}

export function searchMemories(query: string = '', scope?: string, type?: string): Memory[] {
  let sql = 'SELECT * FROM memories WHERE 1=1';
  const params: any[] = [];

  if (query) {
    sql += ' AND content LIKE ?';
    params.push(`%${query}%`);
  }
  if (scope) {
    sql += ' AND scope = ?';
    params.push(scope);
  }
  if (type) {
    sql += ' AND type = ?';
    params.push(type);
  }

  sql += ' ORDER BY updated_at DESC';

  const rows = db.prepare(sql).all(...params) as any[];
  
  return rows.map(row => ({
    ...row,
    tags: JSON.parse(row.tags || '[]'),
    metadata: JSON.parse(row.metadata || '{}')
  }));
}

export function updateMemory(id: string, content: string): Memory | undefined {
  const stmt = db.prepare(`
    UPDATE memories 
    SET content = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  const info = stmt.run(content, id);
  if (info.changes === 0) return undefined;
  return getMemory(id);
}

export function deleteMemory(id: string): boolean {
  const stmt = db.prepare('DELETE FROM memories WHERE id = ?');
  const info = stmt.run(id);
  return info.changes > 0;
}

export default db;