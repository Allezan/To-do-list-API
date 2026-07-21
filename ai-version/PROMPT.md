# Stage 7 AI Rematch Prompt

## Original Prompt Sent to AI Assistant

```text
Build a RESTful To-Do List API using Node.js and Express.

Requirements:
1. Keep all data in an in-memory array of task objects pre-filled with 3 default items ({ id: 1, title: "Learn Backend Engineering", done: true }, { id: 2, title: "Build CRUD API", done: false }, { id: 3, title: "Publish to GitHub", done: false }).
2. Implement the following 5 core endpoints:
   - GET /: Returns JSON { "name": "Task API", "version": "1.0", "endpoints": ["/tasks"] }
   - GET /health: Returns JSON { "status": "ok" }
   - GET /tasks: Returns array of all tasks
   - GET /tasks/:id: Returns single task by ID. If not found, return HTTP status 404 with JSON { "error": "Task <id> not found" }
   - POST /tasks: Accepts { "title": "..." }. Validates that title is non-empty string; if missing/invalid, return HTTP status 400 with error JSON. Generates next ID, defaults done=false, returns 201 Created with new task.
   - PUT /tasks/:id: Updates title and/or done. If ID not found -> 404. If payload empty/invalid -> 400. Returns updated task with status 200.
   - DELETE /tasks/:id: Deletes task by ID. Returns status 204 No Content with empty body. If ID not found -> 404.
3. Serve Swagger UI documentation at /docs using swagger-ui-express.
```
