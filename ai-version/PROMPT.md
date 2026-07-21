# Assignment A3 AI Rematch Prompt: Containerize Your Stack (PostgreSQL & Docker Compose)

## Prompt Sent to AI Assistant

```text
Containerize the Express To-Do List CRUD API with a PostgreSQL database using Docker and Docker Compose.

Requirements:
1. Create a `compose.yaml` defining two services: `api` (the Node.js app) and `db` (the official `postgres:16-alpine` image).
2. Store database credentials in a git-ignored `.env` file (e.g. `DATABASE_URL=postgres://postgres:dev@db:5432/tasks`), and provide a `.env.example` file.
3. Attach a named Docker volume (`taskdata`) to the PostgreSQL service so data persists across `docker compose down` and `up`.
4. Add a healthcheck (`pg_isready`) to the `db` service and use `depends_on: db: condition: service_healthy` for the `api` service.
5. In Node.js, connect to PostgreSQL using `pg` (node-postgres). Auto-create the `tasks` table if it doesn't exist and seed 3 default tasks if the table is empty.
6. Support all 5 core endpoints (`GET /tasks`, `GET /tasks/:id`, `POST /tasks`, `PUT /tasks/:id`, `DELETE /tasks/:id`) and `GET /health` using parameterized SQL queries (`$1` placeholders).
```
