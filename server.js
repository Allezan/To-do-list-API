const express = require('express');
const swaggerUi = require('swagger-ui-express');
const openapiSpec = require('./openapi.json');

const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Helper function to map SQLite integer (0/1) to JavaScript boolean (false/true)
const formatTask = (row) => row ? { ...row, done: Boolean(row.done) } : null;

// Serve Swagger UI documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));

// Root endpoint - API info
app.get('/', (req, res) => {
  res.json({
    name: "Task API",
    version: "1.0",
    endpoints: ["/tasks"]
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: "ok" });
});

// GET /tasks - Get all tasks with optional filtering, search, and pagination
app.get('/tasks', (req, res) => {
  let query = 'SELECT * FROM tasks';
  const params = [];
  const conditions = [];

  // Filtering by status: ?done=true or ?done=false
  if (req.query.done !== undefined) {
    const isDone = req.query.done.toLowerCase() === 'true' ? 1 : 0;
    conditions.push('done = ?');
    params.push(isDone);
  }

  // Search by title keyword: ?search=keyword
  if (req.query.search) {
    conditions.push('title LIKE ?');
    params.push(`%${req.query.search}%`);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY id ASC';

  // Pagination: ?limit=N&offset=N
  const offset = parseInt(req.query.offset, 10) || 0;
  const limit = parseInt(req.query.limit, 10);

  if (!isNaN(limit) && limit >= 0) {
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);
  } else if (offset > 0) {
    query += ' LIMIT -1 OFFSET ?';
    params.push(offset);
  }

  const rows = db.prepare(query).all(...params);
  res.json(rows.map(formatTask));
});

// GET /stats - Get task statistics summary
app.get('/stats', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) AS count FROM tasks').get().count;
  const done = db.prepare('SELECT COUNT(*) AS count FROM tasks WHERE done = 1').get().count;
  const open = total - done;

  res.json({
    total,
    done,
    open
  });
});

// POST /reset - Restore tasks to initial seed data
app.post('/reset', (req, res) => {
  const deleteStmt = db.prepare('DELETE FROM tasks');
  const insertStmt = db.prepare('INSERT INTO tasks (id, title, done) VALUES (?, ?, ?)');

  const resetTransaction = db.transaction(() => {
    deleteStmt.run();
    insertStmt.run(1, 'Learn Backend Engineering', 1);
    insertStmt.run(2, 'Build CRUD API', 0);
    insertStmt.run(3, 'Publish to GitHub', 0);
  });

  resetTransaction();

  const tasks = db.prepare('SELECT * FROM tasks ORDER BY id ASC').all();
  res.json({
    message: "Tasks successfully reset to initial seed data",
    tasks: tasks.map(formatTask)
  });
});

// GET /tasks/:id - Get a single task by ID
app.get('/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id, 10);
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);

  if (!row) {
    return res.status(404).json({ error: `Task ${taskId} not found` });
  }

  res.json(formatTask(row));
});

// POST /tasks - Create a new task
app.post('/tasks', (req, res) => {
  const { title } = req.body;

  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: "Title is required and cannot be empty" });
  }

  const cleanTitle = title.trim();
  const stmt = db.prepare('INSERT INTO tasks (title, done) VALUES (?, 0)');
  const info = stmt.run(cleanTitle);

  const newTask = {
    id: Number(info.lastInsertRowid),
    title: cleanTitle,
    done: false
  };

  res.status(201).json(newTask);
});

// PUT /tasks/:id - Update an existing task
app.put('/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id, 10);
  const taskIndex = tasks.findIndex(t => t.id === taskId);

  if (taskIndex === -1) {
    return res.status(404).json({ error: `Task ${taskId} not found` });
  }

  const { title, done } = req.body;

  if (title === undefined && done === undefined) {
    return res.status(400).json({ error: "At least title or done must be provided for update" });
  }

  if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
    return res.status(400).json({ error: "Title must be a non-empty string" });
  }

  if (done !== undefined && typeof done !== 'boolean') {
    return res.status(400).json({ error: "Done must be a boolean value (true or false)" });
  }

  if (title !== undefined) {
    tasks[taskIndex].title = title.trim();
  }
  if (done !== undefined) {
    tasks[taskIndex].done = done;
  }

  res.json(tasks[taskIndex]);
});

// DELETE /tasks/:id - Delete a task by ID
app.delete('/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id, 10);
  const taskIndex = tasks.findIndex(t => t.id === taskId);

  if (taskIndex === -1) {
    return res.status(404).json({ error: `Task ${taskId} not found` });
  }

  tasks.splice(taskIndex, 1);
  res.status(204).send();
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

module.exports = app;
