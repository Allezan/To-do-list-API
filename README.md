# To-Do List RESTful CRUD API (Containerized PostgreSQL Edition)

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-brightgreen)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-v4.21.2-blue)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-v16_Alpine-4169E1?logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose_v2-2496ED?logo=docker)](https://www.docker.com/)
[![Swagger UI](https://img.shields.io/badge/Swagger_UI-v5-green)](http://localhost:3000/docs)
[![License](https://img.shields.io/badge/License-ISC-purple)](#)

A production-ready, fully containerized RESTful To-Do List CRUD API built for the **FlyRank Backend Engineering Internship (Week 3 Assignment A3: Containerize your stack)**.

This project wraps our Express API and a real **PostgreSQL database** into isolated Docker containers orchestrated with Docker Compose. With a single command, the entire multi-container stack builds, connects, auto-seeds, and persists data across restarts using a named Docker volume (`taskdata`).

---

## 🏗️ Architecture & Features

- **Multi-Container Stack**: Node.js Express API (`api`) + PostgreSQL 16 Alpine (`db`).
- **One-Command Environment**: Run the whole stack with `docker compose up -d --build`.
- **Zero Credentials in Code**: Database connection secrets live in `.env` (git-ignored), while `.env.example` provides the committed template.
- **Service Dependency & Health Check**: The API container waits for Postgres to be fully operational via `pg_isready` health check.
- **Database Connection Pool**: Managed via `pg.Pool` with parameterized SQL queries (`$1`, `$2`).
- **Data Persistence**: Backed by a named Docker volume `taskdata` (`/var/lib/postgresql/data`).
- **Multi-Stage Dockerfile**: Reduces container footprint by separating build-time dependencies from production runtimes.
- **Interactive API Documentation**: Live Swagger UI served at `http://localhost:3000/docs`.

---

## 🚀 Quick Start (One Command)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

### 1. Clone & Setup Environment File
```bash
cp .env.example .env
```

### 2. Start the Entire Stack
```bash
docker compose up -d --build
```

The system will:
1. Pull `postgres:16-alpine` and initialize the database `tasks`.
2. Wait until PostgreSQL is healthy (`pg_isready`).
3. Build the Node.js Express multi-stage Docker image and start the server at `http://localhost:3000`.

---

## 📌 API Endpoints Reference

| Method | Endpoint | Description | Request Body | Response Status Codes |
|---|---|---|---|---|
| `GET` | `/` | API Metadata & Endpoint list | N/A | `200 OK` |
| `GET` | `/health` | Application & Database Health Check | N/A | `200 OK` (with `{ status: "ok", db: "ok" }`), `500` |
| `GET` | `/tasks` | List tasks (supports `done`, `search`, `limit`, `offset`) | N/A | `200 OK` |
| `GET` | `/tasks/:id` | Get single task by ID | N/A | `200 OK`, `404 Not Found` |
| `POST` | `/tasks` | Create a new task | `{ "title": "Buy milk" }` | `201 Created`, `400 Bad Request` |
| `PUT` | `/tasks/:id` | Update task title and/or done status | `{ "title": "...", "done": true }` | `200 OK`, `400 Bad Request`, `404 Not Found` |
| `DELETE` | `/tasks/:id` | Remove task by ID | N/A | `204 No Content`, `404 Not Found` |
| `GET` | `/stats` | Task statistics (`COUNT(*)` SQL aggregation) | N/A | `200 OK` |
| `POST` | `/reset` | Truncate and re-seed initial tasks | N/A | `200 OK` |

---

## 🧪 Sample `curl -i` Execution & Response Outputs

### 1. Enhanced Stack Health Check (`GET /health`)
```bash
curl -i http://localhost:3000/health
```
**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{
  "status": "ok",
  "db": "ok"
}
```

### 2. List Tasks (`GET /tasks`)
```bash
curl -i http://localhost:3000/tasks
```
**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

[
  { "id": 1, "title": "Learn Backend Engineering", "done": true },
  { "id": 2, "title": "Build CRUD API", "done": false },
  { "id": 3, "title": "Publish to GitHub", "done": false }
]
```

### 3. Create Task (`POST /tasks`)
```bash
curl -i -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Docker Compose Task"}'
```
**Response:**
```http
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8

{
  "id": 4,
  "title": "Docker Compose Task",
  "done": false
}
```

### 4. Delete Task (`DELETE /tasks/4`)
```bash
curl -i -X DELETE http://localhost:3000/tasks/4
```
**Response:**
```http
HTTP/1.1 204 No Content
```

---

## 🔍 Database Inspection inside Container

You can inspect the live PostgreSQL database inside the container using `psql`:

```bash
docker exec -it todo-api-stack-db-1 psql -U postgres -d tasks -c "\dt"
docker exec -it todo-api-stack-db-1 psql -U postgres -d tasks -c "SELECT * FROM tasks;"
```

---

## 📦 Container Optimization & Persistence Verification

### 1. Data Persistence Across `down` & `up`
- Create a task via `POST /tasks`.
- Run `docker compose down` (stops and removes containers and network).
- Run `docker compose up -d` (re-creates stack).
- Run `curl http://localhost:3000/tasks`.
- **Result**: The created task is still present because the named volume `taskdata` persists the PostgreSQL data directory `/var/lib/postgresql/data`.

### 2. Multi-Stage Build Optimization
- Stage 1 (`builder`): Installs production dependencies with `npm ci --only=production`.
- Stage 2 (`runner`): Copies compiled `node_modules` into a clean `node:18-alpine` runtime image, reducing deployment size and security attack surface.

---

## 🤖 Stage 6: AI vs Me Comparison (Containerization Edition)

In Stage 6, we prompted an AI assistant to containerize the Express API with PostgreSQL (`ai-version/server.js`) and compared it against our hand-built stack.

### 1. What did the AI do better?
- The AI wrote a very short `server.js` file by combining table initialization and route handlers into a single file.

### 2. What did it get wrong or ignore?
- **SQL Injection Vulnerability**: In `GET /tasks/:id`, the AI concatenated raw parameters into the SQL query:
  ```javascript
  // ❌ Dangerous AI code:
  client.query(`SELECT * FROM tasks WHERE id = ${req.params.id}`);
  ```
  Our implementation strictly uses **parameterized placeholders (`$1`)**:
  ```javascript
  // ✅ Safe hand-built code:
  db.query('SELECT * FROM tasks WHERE id = $1;', [taskId]);
  ```
- **Single Client vs Connection Pool**: The AI used `new Client()` instead of `new Pool()`. A single client cannot handle concurrent HTTP requests and crashes if the connection drops.
- **Incomplete Health Check**: The AI's `GET /health` returned `{ status: "ok" }` without pinging PostgreSQL (`SELECT 1`), defeating the purpose of a container stack health check.
- **Container Race Condition**: The AI did not include `pg_isready` healthcheck conditions in Docker Compose, causing the API container to crash repeatedly if it starts before Postgres is ready to accept socket connections.

### 3. Key Takeaway
> *"Containerization makes deployment reproducible across machines, but application resilience depends on proper connection pooling, parameterized queries, and database healthchecks."*
