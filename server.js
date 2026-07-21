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

// Health check endpoint (includes DB health check)
app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1;');
    res.json({ status: "ok", db: "ok" });
  } catch (err) {
    res.status(500).json({ status: "error", db: err.message });
  }
});

// GET /tasks - Get all tasks with optional filtering, search, and pagination
app.get('/tasks', async (req, res) => {
  try {
    let query = 'SELECT * FROM tasks';
    const params = [];
    const conditions = [];

    // Filtering by status: ?done=true or ?done=false
    if (req.query.done !== undefined) {
      const isDone = req.query.done.toLowerCase() === 'true';
      params.push(isDone);
      conditions.push(`done = $${params.length}`);
    }

    // Search by title keyword: ?search=keyword
    if (req.query.search) {
      params.push(`%${req.query.search}%`);
      conditions.push(`title ILIKE $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY id ASC';

    // Pagination: ?limit=N&offset=N
    const offset = parseInt(req.query.offset, 10) || 0;
    const limit = parseInt(req.query.limit, 10);

    if (!isNaN(limit) && limit >= 0) {
      params.push(limit);
      query += ` LIMIT $${params.length}`;
      params.push(offset);
      query += ` OFFSET $${params.length}`;
    } else if (offset > 0) {
      params.push(offset);
      query += ` OFFSET $${params.length}`;
    }

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /stats - Get task statistics summary
app.get('/stats', async (req, res) => {
  try {
    const totalRes = await db.query('SELECT COUNT(*) FROM tasks;');
    const doneRes = await db.query('SELECT COUNT(*) FROM tasks WHERE done = TRUE;');

    const total = parseInt(totalRes.rows[0].count, 10);
    const done = parseInt(doneRes.rows[0].count, 10);
    const open = total - done;

    res.json({ total, done, open });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /reset - Restore tasks to initial seed data
app.post('/reset', async (req, res) => {
  try {
    await db.query('TRUNCATE TABLE tasks RESTART IDENTITY;');
    await db.query(`
      INSERT INTO tasks (id, title, done) VALUES
      (1, 'Learn Backend Engineering', TRUE),
      (2, 'Build CRUD API', FALSE),
      (3, 'Publish to GitHub', FALSE);
    `);

    const result = await db.query('SELECT * FROM tasks ORDER BY id ASC;');
    res.json({
      message: "Tasks successfully reset to initial seed data",
      tasks: result.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /tasks/:id - Get a single task by ID
app.get('/tasks/:id', async (req, res) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    const result = await db.query('SELECT * FROM tasks WHERE id = $1;', [taskId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: `Task ${taskId} not found` });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
  const existingTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);

  if (!existingTask) {
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

  const newTitle = title !== undefined ? title.trim() : existingTask.title;
  const newDone = done !== undefined ? (done ? 1 : 0) : existingTask.done;

  db.prepare('UPDATE tasks SET title = ?, done = ? WHERE id = ?').run(newTitle, newDone, taskId);

  const updatedRow = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
  res.json(formatTask(updatedRow));
});

// DELETE /tasks/:id - Delete a task by ID
app.delete('/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id, 10);
  const info = db.prepare('DELETE FROM tasks WHERE id = ?').run(taskId);

  if (info.changes === 0) {
    return res.status(404).json({ error: `Task ${taskId} not found` });
  }

  res.status(204).send();
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

module.exports = app;
