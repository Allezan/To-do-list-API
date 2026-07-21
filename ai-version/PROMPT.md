# Week 3 AI Rematch Prompt: SQLite Database Migration

## Prompt Sent to AI Assistant

```text
Migrate the Express To-Do List CRUD API from in-memory storage to a persistent SQLite database using `better-sqlite3`.

Requirements:
1. Create a `tasks.db` database file on startup.
2. Ensure a `tasks` table exists with columns: `id` (INTEGER PRIMARY KEY AUTOINCREMENT), `title` (TEXT NOT NULL), and `done` (INTEGER DEFAULT 0).
3. Seed 3 default tasks ONLY if the `tasks` table is currently empty (`SELECT COUNT(*) FROM tasks` returns 0).
4. Update all 5 core endpoints to execute SQL with parameterized queries (`?` placeholders):
   - GET /tasks: `SELECT * FROM tasks`
   - GET /tasks/:id: `SELECT * FROM tasks WHERE id = ?`. Return 404 with error JSON if not found.
   - POST /tasks: `INSERT INTO tasks (title, done) VALUES (?, 0)`. Validate non-empty title (return 400 Bad Request if missing/invalid). Return 201 Created with new task.
   - PUT /tasks/:id: `UPDATE tasks SET title = ?, done = ? WHERE id = ?`. Validate 400 for empty/invalid body, 404 for unknown ID. Return updated task.
   - DELETE /tasks/:id: `DELETE FROM tasks WHERE id = ?`. Return 204 No Content. Return 404 for unknown ID.
```
