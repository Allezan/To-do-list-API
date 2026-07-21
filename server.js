const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

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

// GET /tasks - Get all tasks
app.get('/tasks', (req, res) => {
  res.json(tasks);
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

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

module.exports = app;
