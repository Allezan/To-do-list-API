require('dotenv').config();
const express = require('express');
const { Client } = require('pg');

const app = express();
app.use(express.json());

// AI Flaw 1: Using single Client connection instead of connection Pool (crashes on reconnect / high concurrency)
// AI Flaw 2: Hardcoded connection string fallback to localhost instead of container service name 'db'
const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:dev@localhost:5432/tasks'
});

async function init() {
  await client.connect();
  await client.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title TEXT,
      done BOOLEAN DEFAULT FALSE
    );
  `);
  
  const count = await client.query('SELECT COUNT(*) FROM tasks');
  if (parseInt(count.rows[0].count) === 0) {
    // AI Flaw 3: Non-parameterized seed string
    await client.query("INSERT INTO tasks (title, done) VALUES ('Learn Backend', true), ('Build API', false), ('Publish', false)");
  }
}

init().catch(console.error);

app.get('/health', async (req, res) => {
  res.json({ status: "ok" }); // AI Flaw 4: Health check doesn't ping DB
});

app.get('/tasks', async (req, res) => {
  const result = await client.query('SELECT * FROM tasks');
  res.json(result.rows);
});

app.get('/tasks/:id', async (req, res) => {
  const result = await client.query(`SELECT * FROM tasks WHERE id = ${req.params.id}`); // AI Flaw 5: SQL Injection vulnerability!
  if (result.rows.length === 0) return res.status(404).json({ error: "Task not found" });
  res.json(result.rows[0]);
});

app.post('/tasks', async (req, res) => {
  if (!req.body.title) return res.status(400).json({ error: "Title is required" });
  const result = await client.query('INSERT INTO tasks (title, done) VALUES ($1, false) RETURNING *', [req.body.title]);
  res.status(201).json(result.rows[0]);
});

app.put('/tasks/:id', async (req, res) => {
  const result = await client.query('UPDATE tasks SET title = $1, done = $2 WHERE id = $3 RETURNING *', [req.body.title, req.body.done, req.params.id]);
  if (result.rows.length === 0) return res.status(404).json({ error: "Task not found" });
  res.json(result.rows[0]);
});

app.delete('/tasks/:id', async (req, res) => {
  const result = await client.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
  if (result.rowCount === 0) return res.status(404).json({ error: "Task not found" });
  res.status(204).send();
});

if (require.main === module) {
  app.listen(3000, () => console.log('AI Express Postgres running on port 3000'));
}

module.exports = app;
