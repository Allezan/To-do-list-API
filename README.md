# To-Do List RESTful CRUD API

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-brightgreen)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-v4.21.2-blue)](https://expressjs.com/)
[![OpenAPI](https://img.shields.io/badge/Swagger_UI-v5-green)](http://localhost:3000/docs)
[![License](https://img.shields.io/badge/License-ISC-purple)](#)

A robust, lightweight, in-memory RESTful To-Do List CRUD API built as part of the **FlyRank Backend Engineering Internship (Week 2 Assignment A1)**.

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- `npm` (comes with Node.js)

### Installation & Run Command (One-Liner)

```bash
npm install && npm start
```

The server will start listening at `http://localhost:3000`.

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
| `GET` | `/stats` | Task statistics (total, done, open counts) | N/A | `200 OK` |
| `POST` | `/reset` | Reset task store back to initial 3 seed items | N/A | `200 OK` |

---

## 🧪 Sample `curl -i` Execution & Responses

### 1. Root API Info (`GET /`)
```bash
curl -i http://localhost:3000/
```
**Response Output:**
```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{
  "name": "Task API",
  "version": "1.0",
  "endpoints": ["/tasks"]
}
```

### 2. Health Check (`GET /health`)
```bash
curl -i http://localhost:3000/health
```
**Response Output:**
```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{
  "status": "ok"
}
```

### 3. List All Tasks (`GET /tasks`)
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

### 4. Create New Task with Validation (`POST /tasks`)
```bash
curl -i -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Buy milk"}'
```
**Response Output:**
```http
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8

{
  "id": 4,
  "title": "Buy milk",
  "done": false
}
```

**Invalid Request Validation (`POST /tasks` with empty body):**
```bash
curl -i -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{}'
```
**Response Output:**
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json; charset=utf-8

{
  "error": "Title is required and cannot be empty"
}
```

### 5. Update Task (`PUT /tasks/4`)
```bash
curl -i -X PUT http://localhost:3000/tasks/4 \
  -H "Content-Type: application/json" \
  -d '{"done": true}'
```
**Response Output:**
```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{
  "id": 4,
  "title": "Buy milk",
  "done": true
}
```

### 6. Delete Task (`DELETE /tasks/4`)
```bash
curl -i -X DELETE http://localhost:3000/tasks/4
```
**Response Output:**
```http
HTTP/1.1 204 No Content
```

### 7. Task Statistics (`GET /stats`)
```bash
curl -i http://localhost:3000/stats
```
**Response Output:**
```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{
  "total": 3,
  "done": 1,
  "open": 2
}
```

---

## 📊 Stage 4: Manual SQL Exploration

Direct SQL queries were executed against `tasks.db` to verify single-source-of-truth consistency:

```sql
-- 1. List every task
SELECT * FROM tasks;
-- Returns 3 rows: [{ id: 1, title: 'Master SQLite Backend', done: 1 }, ...]

-- 2. Filter completed tasks
SELECT * FROM tasks WHERE done = 1;
-- Returns rows where completion status is 1 (true).

-- 3. Aggregate total count
SELECT COUNT(*) AS count FROM tasks;
-- Returns total row count: { count: 3 }
```

> **Observation**: Changes made directly in SQLite reflect instantly in the API responses without restarting the server because both DB tools and Express read from the exact same `tasks.db` file.

---

## 📖 Interactive Swagger UI Documentation

Swagger UI is served directly at: **[http://localhost:3000/docs](http://localhost:3000/docs)**.

It provides visual documentation built from `openapi.json` and allows executing the full CRUD lifecycle interactively using the **"Try it out"** button.

---

## 🤖 Stage 7: AI vs Me Comparison

In Stage 7, we performed an AI rematch experiment by prompting an AI assistant to build the same API in quarantine (`ai-version/server.js`) and comparing the outputs using `git diff --no-index server.js ai-version/server.js`.

### 1. What did the AI do better?
- The AI wrote concise, single-line route handlers that made the code file shorter (~60 lines vs ~130 lines). Its code structure was straightforward to read for standard happy-path scenarios.

### 2. What did it get wrong or quietly ignore from the prompt?
- **ID Collisions on Delete**: The AI generated new IDs using `tasks.length + 1`. If task `id: 1` was deleted, the list length dropped to 2, causing the next created task to be assigned `id: 3`, which collided with the existing task 3.
- **Incomplete Payload Validation**: The AI checked `if (!req.body.title)` on POST, but allowed empty whitespace strings (`"   "`). On `PUT`, it quietly ignored empty payloads `{}` and returned status `200` without making changes instead of returning HTTP `400 Bad Request`.
- **Empty Swagger Specification**: The AI imported `swagger-ui-express` but provided an empty `paths: {}` object, resulting in an unpopulated Swagger UI page.

### 3. What did the prompt forget to specify & what did the AI decide?
- The initial prompt didn't explicitly mandate handling edge cases like whitespace trimming or ID recalculations after deletion. The AI silently chose the simplest array index approach, demonstrating why precise backend specifications are necessary.

### 4. Rematch Lesson
> *"An AI's output is exactly as good as your specification — and you can only judge it because you built the system by hand first."*

---

## 🔬 The Mortality Experiment

When you add or modify tasks via `POST /tasks` or `DELETE /tasks/:id` and then restart the server (`Ctrl+C` followed by `npm start`), all newly added tasks vanish and deleted tasks reappear.

**Why does this happen?**  
Because data lives purely in server **RAM (in-memory)** as JavaScript variables. When the Node process terminates, the memory space allocated to the application is completely freed by the OS. Upon restart, Node executes `server.js` from top to bottom, re-initializing the `tasks` array with default seed data. This observation highlights the exact reason persistent database storage (PostgreSQL / MySQL) is introduced in Week 3.
