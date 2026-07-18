import os
import sqlite3
from typing import List, Dict

def export_to_markdowns():
    """Mengekspor memori ke target (dengan nama file kustom) berdasarkan konfigurasi export_targets."""
    db_path = os.path.expanduser("~/.amneshia/memory.db")
    if not os.path.exists(db_path):
        return

    with sqlite3.connect(db_path) as conn:
        conn.row_factory = sqlite3.Row
        memories = conn.execute("SELECT * FROM memories ORDER BY created_at ASC").fetchall()
        targets = conn.execute("SELECT * FROM export_targets").fetchall()

    if not targets:
        return

    user_memories = []
    sys_memories = []

    for row in memories:
        mem_type = row['type']
        content = f"- **[{row['scope'].upper()}]**: {row['content']}\n"
        if mem_type in ['user', 'preference', 'story']:
            user_memories.append(content)
        else:
            sys_memories.append(content)

    user_md = "# User Profile / Global Preferences\n\n" + "".join(user_memories)
    sys_md = "# System & Working Memory\n\n" + "".join(sys_memories)

    for target in targets:
        path_input = os.path.expanduser(target["path"])
        
        # Logic: 
        # 1. Jika path berakhiran '.md' (misal: /project/GEMINI.md), maka gabungkan user & sys memory ke 1 file itu saja.
        # 2. Jika path adalah direktori (misal: ~/.hermes/memories), maka pisah jadi USER.md dan MEMORY.md seperti biasa.
        
        try:
            if path_input.lower().endswith(".md"):
                os.makedirs(os.path.dirname(os.path.abspath(path_input)), exist_ok=True)
                with open(path_input, "w") as f:
                    f.write(user_md + "\n\n---\n\n" + sys_md)
            else:
                os.makedirs(path_input, exist_ok=True)
                with open(os.path.join(path_input, "USER.md"), "w") as f:
                    f.write(user_md)
                with open(os.path.join(path_input, "MEMORY.md"), "w") as f:
                    f.write(sys_md)
        except Exception as e:
            print(f"Failed to export to {target['name']} ({path_input}): {e}")