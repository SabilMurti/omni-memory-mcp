const API_URL = 'http://localhost:3456/api';

async function fetchMemories(query = '', type = '') {
  const params = new URLSearchParams();
  if (query) params.append('query', query);
  if (type) params.append('type', type);
  
  const res = await fetch(`${API_URL}/memories?${params}`);
  const data = await res.json();
  renderMemories(data);
}

function renderMemories(memories: any[]) {
  const container = document.getElementById('memoryList')!;
  container.innerHTML = '';
  
  if (memories.length === 0) {
    container.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: 2rem;">No memories found.</div>';
    return;
  }

  memories.forEach(mem => {
    const div = document.createElement('div');
    div.className = 'memory-card';
    const date = new Date(mem.created_at).toLocaleDateString();
    
    div.innerHTML = `
      <div class="memory-header">
        <span class="memory-type">[${mem.type}]</span>
        <span class="memory-scope">Scope: ${mem.scope} | ${date}</span>
      </div>
      <div class="memory-content">${mem.content}</div>
      <button class="delete-btn" onclick="deleteMemory('${mem.id}')">Delete</button>
    `;
    container.appendChild(div);
  });
}

document.getElementById('addForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const type = (document.getElementById('type') as HTMLSelectElement).value;
  const scope = (document.getElementById('scope') as HTMLInputElement).value;
  const content = (document.getElementById('content') as HTMLTextAreaElement).value;
  
  const res = await fetch(`${API_URL}/memories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, scope, content })
  });
  
  if (res.ok) {
    (document.getElementById('content') as HTMLTextAreaElement).value = '';
    fetchMemories();
  } else {
    alert('Failed to save memory');
  }
});

(window as any).deleteMemory = async (id: string) => {
  if (!confirm('Are you sure you want to delete this memory?')) return;
  
  const res = await fetch(`${API_URL}/memories/${id}`, { method: 'DELETE' });
  if (res.ok) fetchMemories();
};

document.getElementById('searchInput')?.addEventListener('input', (e) => {
  const query = (e.target as HTMLInputElement).value;
  const type = (document.getElementById('filterType') as HTMLSelectElement).value;
  fetchMemories(query, type);
});

document.getElementById('filterType')?.addEventListener('change', (e) => {
  const type = (e.target as HTMLSelectElement).value;
  const query = (document.getElementById('searchInput') as HTMLInputElement).value;
  fetchMemories(query, type);
});

// Initial load
fetchMemories();