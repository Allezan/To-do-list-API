# To-Do List RESTful CRUD API (SQLite Persistence Edition)

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-brightgreen)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-v4.21.2-blue)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-better--sqlite3-003B57?logo=sqlite)](https://www.sqlite.org/)
[![Swagger UI](https://img.shields.io/badge/Swagger_UI-v5-green)](http://localhost:3000/docs)
[![License](https://img.shields.io/badge/License-ISC-purple)](#)

A robust, database-backed RESTful To-Do List CRUD API built as part of the **FlyRank Backend Engineering Internship (Week 3 Assignment A2)**. 

This project upgrades our Week 2 in-memory API to store all tasks in a local **SQLite database (`tasks.db`)**. Endpoints and HTTP contracts remain **100% identical**, but data now **survives server restarts**.

---

## 🗄️ Why SQLite?

- **Zero Setup / Serverless**: SQLite runs in-process inside Node.js. No standalone database server (like Postgres or MySQL) needs to be installed or configured.
- **Single File Storage**: All data lives in a local file named `tasks.db` created automatically on first run.
- **Persistence Across Restarts**: Unlike in-memory arrays, tasks created, updated, or deleted persist permanently on disk.
- **Git Hygiene**: `tasks.db` is added to `.gitignore` so each clone starts fresh with automatic schema creation and 1-time seed data.

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- `npm` (comes with Node.js)

### Installation & Run Command (One-Liner)

```bash
npm install && npm start
```

On first startup, the server automatically creates `tasks.db`, initializes the `tasks` table, seeds 3 default tasks, and listens at `http://localhost:3000`.

---

## 📌 API Endpoints Reference

| Method | Endpoint | Description | Request Body | Response Status Codes |
|---|---|---|---|---|
| `GET` | `/` | API Metadata & Endpoint list | N/A | `200 OK` |
| `GET` | `/health` | Server health check status | N/A | `200 OK` |
| `GET` | `/tasks` | List tasks (supports `done`, `search`, `limit`, `offset`) | N/A | `200 OK` |
| `GET` | `/tasks/:id` | Get single task by ID | N/A | `200 OK`, `404 Not Found` |
| `POST` | `/tasks` | Create a new task | `{ "title": "Buy milk" }` | `201 Created`, `400 Bad Request` |
| `PUT` | `/tasks/:id` | Update task title and/or done status | `{ "title": "...", "done": true }` | `200 OK`, `400 Bad Request`, `404 Not Found` |
| `DELETE` | `/tasks/:id` | Remove task by ID | N/A | `204 No Content`, `404 Not Found` |
| `GET` | `/stats` | Task statistics (`SELECT COUNT(*)`) | N/A | `200 OK` |
| `POST` | `/reset` | Reset database table back to initial 3 seed items | N/A | `200 OK` |

---

## 🧪 Sample `curl -i` Execution & Persistence Check

### 1. Read All Tasks from SQLite (`GET /tasks`)
```bash
curl -i http://localhost:3000/tasks
```
**Response Output:**
```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

[
  { "id": 1, "title": "Learn Backend Engineering", "done": true },
  { "id": 2, "title": "Build CRUD API", "done": false },
  { "id": 3, "title": "Publish to GitHub", "done": false }
]
```

### 2. Insert Task into SQLite (`POST /tasks`)
```bash
curl -i -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Persistent SQLite Task"}'
```
**Response Output:**
```http
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8

{
  "id": 4,
  "title": "Persistent SQLite Task",
  "done": false
}
```

### 3. Verification of Data Persistence Across Restarts
1. Create a task via `POST /tasks` (returns ID `4`).
2. Stop the Node server (`Ctrl+C`).
3. Restart the server (`npm start`).
4. Execute `curl -i http://localhost:3000/tasks/4`.
5. **Result**: Task `4` is still returned with status `200 OK`! 🎉

---

## 📊 Stage 4: Manual SQL Query Exploration

Direct SQL queries were executed against `tasks.db` using SQLite prepared statements:

```sql
-- 1. List every task
SELECT * FROM tasks;
-- Returns rows: [{ id: 1, title: 'Learn Backend Engineering', done: 1 }, ...]

-- 2. Filter completed tasks
SELECT * FROM tasks WHERE done = 1;
-- Returns rows where completion status is 1 (true).

-- 3. Aggregate total count
SELECT COUNT(*) AS count FROM tasks;
-- Returns total row count: { count: 3 }
```

---

## 📖 Interactive Swagger UI Documentation

Swagger UI is served live at: **[http://localhost:3000/docs](http://localhost:3000/docs)**.

---

## 🤖 Stage 6: AI vs Me Comparison (Database Edition)

In Stage 6, we prompted an AI assistant to migrate the API to SQLite (`ai-version/server.js`) and compared it against our hand-built implementation using `git diff --no-index server.js ai-version/server.js`.

### 1. What did the AI do better?
- The AI wrote compact single-line database queries directly in the route handlers, making the initial file short.

### 2. What did it get wrong or quietly ignore?
- **SQL Injection Vulnerability**: In `GET /tasks/:id`, the AI concatenated user input directly into the SQL string:
  ```javascript
  // ❌ Dangerous AI code:
  db.prepare('SELECT * FROM tasks WHERE id = ' + req.params.id).get();
  ```
  Our hand-built version strictly uses **parameterized queries (`?`)**:
  ```javascript
  // ✅ Safe hand-built code:
  db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
  ```
- **Type Leaks (Integers vs Booleans)**: SQLite stores booleans as `0` or `1`. The AI returned raw `0`/`1` integers to API clients, breaking the original Week 2 API contract. Our version includes a `formatTask()` mapper converting `0`/`1` back to clean JavaScript `true`/`false` booleans.
- **Missing Transactions & WAL Mode**: The AI inserted seed rows individually without a transaction (`db.transaction()`) and did not enable WAL mode (`journal_mode = WAL`), leading to slower database performance under concurrent writes.

### 3. Key Takeaway
> *"Swapping the storage layer should be invisible to your API clients. Using parameterized queries guarantees database security while maintaining 100% backward compatibility."*
