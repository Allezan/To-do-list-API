const express = require('express');
const Database = require('better-sqlite3');

const app = express();
app.use(express.json());

const db = new Database('ai_tasks.db');

// AI generated table initialization (without transaction or WAL mode)
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    done INTEGER DEFAULT 0
  );
`);

// AI seed check (simple row count check)
const count = db.prepare('SELECT COUNT(*) as c FROM tasks').get().c;
if (count === 0) {
  db.prepare('INSERT INTO tasks (title, done) VALUES ("Learn Backend Engineering", 1)').run();
  db.prepare('INSERT INTO tasks (title, done) VALUES ("Build CRUD API", 0)').run();
  db.prepare('INSERT INTO tasks (title, done) VALUES ("Publish to GitHub", 0)').run();
}

app.get('/tasks', (req, res) => {
  const tasks = db.prepare('SELECT * FROM tasks').all();
  res.json(tasks);
});

app.get('/tasks/:id', (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ' + req.params.id).get(); // AI flaw: String concatenation vulnerability!
  if (!task) return res.status(404).json({ error: "Task not found" });
  res.json(task);
});

app.post('/tasks', (req, res) => {
  if (!req.body.title) return res.status(400).json({ error: "Title required" });
  const info = db.prepare('INSERT INTO tasks (title, done) VALUES (?, 0)').run(req.body.title);
  res.status(201).json({ id: info.lastInsertRowid, title: req.body.title, done: 0 });
});

app.put('/tasks/:id', (req, res) => {
  db.prepare('UPDATE tasks SET title = ?, done = ? WHERE id = ?').run(req.body.title, req.body.done ? 1 : 0, req.params.id);
  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  res.json(updated);
});

app.delete('/tasks/:id', (req, res) => {
  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

if (require.main === module) {
  app.listen(3001, () => console.log('AI SQLite API listening on port 3001'));
}

module.exports = app;
