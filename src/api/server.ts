import express from 'express';
import cors from 'cors';
import { addMemory, searchMemories, updateMemory, deleteMemory, getMemory } from '../db/index.js';
import { triggerExport } from './exporter.js';

const app = express();
app.use(cors());
app.use(express.json());

// Get all memories or search
app.get('/api/memories', (req, res) => {
  const { query, scope, type } = req.query;
  const results = searchMemories(
    query as string, 
    scope as string, 
    type as string
  );
  res.json(results);
});

// Add a memory
app.post('/api/memories', async (req, res) => {
  const { type, scope, content, tags, metadata } = req.body;
  if (!type || !scope || !content) {
    return res.status(400).json({ error: 'type, scope, and content are required' });
  }

  const mem = addMemory(type, scope, content, tags, metadata);
  await triggerExport();
  res.json(mem);
});

// Update a memory
app.put('/api/memories/:id', async (req, res) => {
  const { content } = req.body;
  const mem = updateMemory(req.params.id, content);
  if (!mem) return res.status(404).json({ error: 'Memory not found' });
  
  await triggerExport();
  res.json(mem);
});

// Delete a memory
app.delete('/api/memories/:id', async (req, res) => {
  const success = deleteMemory(req.params.id);
  if (!success) return res.status(404).json({ error: 'Memory not found' });
  
  await triggerExport();
  res.json({ success: true });
});

// Trigger manual export
app.post('/api/export', async (req, res) => {
  try {
    await triggerExport();
    res.json({ success: true, message: 'Export completed successfully' });
  } catch (e: any) {
    res.status(500).json({ error: 'Export failed', details: e.message });
  }
});

export function runApiServer(port = 3456) {
  app.listen(port, () => {
    console.error(`Omni Memory API & Dashboard Backend running on http://localhost:${port}`);
  });
}