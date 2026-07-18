import os
import sqlite3
from typing import List, Dict

def export_to_hermes():
    db_path = os.path.expanduser("~/.amneshia/memory.db")
    if not os.path.exists(db_path):
        return

    hermes_dir = os.path.expanduser("~/.hermes/memories")
    os.makedirs(hermes_dir, exist_ok=True)

    with sqlite3.connect(db_path) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute("SELECT * FROM memories ORDER BY created_at ASC").fetchall()

    user_memories = []
    sys_memories = []

    for row in rows:
        mem_type = row['type']
        content = f"- **[{row['scope'].upper()}]**: {row['content']}\n"
        if mem_type in ['user', 'preference', 'story']:
            user_memories.append(content)
        elif mem_type in ['workflow', 'project', 'skill']:
            sys_memories.append(content)

    user_md = "# User Profile / Global Preferences\n\n" + "".join(user_memories)
    sys_md = "# System & Working Memory\n\n" + "".join(sys_memories)

    with open(os.path.join(hermes_dir, "USER.md"), "w") as f:
        f.write(user_md)
        
    with open(os.path.join(hermes_dir, "MEMORY.md"), "w") as f:
        f.write(sys_md)
