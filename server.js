const express = require('express');
const swaggerUi = require('swagger-ui-express');
const openapiSpec = require('./openapi.json');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Serve Swagger UI documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));

// In-memory database of tasks
let initialTasks = [
  { id: 1, title: "Learn Backend Engineering", done: true },
  { id: 2, title: "Build CRUD API", done: false },
  { id: 3, title: "Publish to GitHub", done: false }
];
let tasks = [...initialTasks];

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
  let result = [...tasks];

  // Filtering by status: ?done=true or ?done=false
  if (req.query.done !== undefined) {
    const isDone = req.query.done.toLowerCase() === 'true';
    result = result.filter(t => t.done === isDone);
  }

  // Search by title keyword: ?search=keyword
  if (req.query.search) {
    const searchTerm = req.query.search.toLowerCase();
    result = result.filter(t => t.title.toLowerCase().includes(searchTerm));
  }

  // Pagination: ?limit=N&offset=N
  const offset = parseInt(req.query.offset, 10) || 0;
  const limit = parseInt(req.query.limit, 10);

  if (!isNaN(limit) && limit >= 0) {
    result = result.slice(offset, offset + limit);
  } else if (offset > 0) {
    result = result.slice(offset);
  }

  res.json(result);
});

// GET /stats - Get task statistics summary
app.get('/stats', (req, res) => {
  const total = tasks.length;
  const done = tasks.filter(t => t.done).length;
  const open = total - done;

  res.json({
    total,
    done,
    open
  });
});

// POST /reset - Restore tasks to initial seed data
app.post('/reset', (req, res) => {
  tasks = [
    { id: 1, title: "Learn Backend Engineering", done: true },
    { id: 2, title: "Build CRUD API", done: false },
    { id: 3, title: "Publish to GitHub", done: false }
  ];

  res.json({
    message: "Tasks successfully reset to initial seed data",
    tasks
  });
});

// GET /tasks/:id - Get a single task by ID
app.get('/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id, 10);
  const task = tasks.find(t => t.id === taskId);

  if (!task) {
    return res.status(404).json({ error: `Task ${taskId} not found` });
  }

  res.json(task);
});

// POST /tasks - Create a new task
app.post('/tasks', (req, res) => {
  const { title } = req.body;

  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: "Title is required and cannot be empty" });
  }

  const nextId = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1;
  const newTask = {
    id: nextId,
    title: title.trim(),
    done: false
  };

  tasks.push(newTask);
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
