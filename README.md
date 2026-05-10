# English Learning Backend

A RESTful backend for an English learning platform built with Node.js and Express. Students can browse lessons, practise with an AI conversation partner, track their progress over time, and get matched with a real teacher based on their learning goals and budget. Teachers can manage their student relationships, review completed conversations, and leave scored feedback. Admins have full access to all resources.

The project is entirely self-contained — no database setup required. All data lives in JSON files that are loaded into memory at startup, so anyone can clone the repo, run two commands, and have a fully working API.

**What makes this backend well-structured:**

- **Role-based access control** on every protected route, enforced through a single reusable `authorize` middleware. Three roles — `student`, `teacher`, `admin` — with self-access exceptions where appropriate.
- **Consistent response envelope** across all endpoints: every response, success or error, uses the same JSON shape, making client-side handling predictable.
- **Realistic domain model** covering lessons, vocabulary, grammar rules, warm-up exercises, teacher matching, conversation scoring, and teacher-student relations — not just a simple CRUD example.
- **Zero infrastructure dependencies** — no database, no environment variables, no Docker. Runs with `npm install` + `npm start`.

---

## Requirements

- Node.js 18+ recommended
- npm

## Install Dependencies

```bash
npm install
```

## Start The Server

```bash
npm start
```

or equivalently:

```bash
node server.js
```

> Note: the entry point is `server.js`.

## Port And Base URL

| Setting | Value |
|---|---|
| Port | `3000` |
| Base URL | `http://localhost:3000` |
| API base path | `/` |
| Resource endpoints | mounted under `/api/...` |
| Health check | `GET /` |

Example full URLs:

```
http://localhost:3000/
http://localhost:3000/api/users/login
http://localhost:3000/api/lessons
http://localhost:3000/api/lessons/101/vocab-warmup
http://localhost:3000/api/conversations/start
```

## How To Test The API

You can use Postman, Thunder Client, Insomnia, or `curl.exe` in Windows PowerShell.

### Authentication Headers

Authentication is mocked via custom request headers — there is no real JWT flow. Add these headers to every protected request:

| Header | Value |
|---|---|
| `x-user-role` | `student`, `teacher`, or `admin` |
| `x-user-id` | numeric ID of the acting user |
| `Content-Type` | `application/json` (for POST, PUT, PATCH) |

Example — student request:

```http
x-user-role: student
x-user-id: 1
Content-Type: application/json
```

Example — admin request:

```http
x-user-role: admin
x-user-id: 3
Content-Type: application/json
```

### Suggested Smoke Test Order

1. `GET /` — confirm the server is running.
2. `POST /api/users/login` — simulate login and get a token back.
3. `GET /api/lessons` with `x-user-role: student` — browse available lessons.
4. `GET /api/teachers` with `x-user-role: student` — browse available teachers.
5. `POST /api/conversations/start` with `x-user-role: student` and a valid `lessonId` — start a practice conversation.

### Example Requests

Health check:

```bash
curl.exe "http://localhost:3000/"
```

Login:

```bash
curl.exe -X POST "http://localhost:3000/api/users/login" `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"dana.levi@example.com\",\"password\":\"1234\"}'
```

Get lessons as a student:

```bash
curl.exe "http://localhost:3000/api/lessons" `
  -H "x-user-role: student" `
  -H "x-user-id: 1"
```

Start a conversation:

```bash
curl.exe -X POST "http://localhost:3000/api/conversations/start" `
  -H "Content-Type: application/json" `
  -H "x-user-role: student" `
  -H "x-user-id: 1" `
  -d '{\"lessonId\":101}'
```

## Response Format

Every endpoint — success or error — returns the same envelope:

**Success:**

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

**Error:**

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Missing required fields",
    "details": {
      "missingFields": ["email"]
    }
  }
}
```

## Assumptions And Implementation Notes

- **No database.** All data is seeded from JSON files under `models/data/`. Changes are held in memory only and reset when the server restarts.
- **Numeric IDs** are auto-generated as `max(existingId) + 1` inside each model. They are not UUIDs and not guaranteed to be stable across restarts.
- **Grammar rule IDs** are strings supplied by the client (e.g. `"present-simple"`), not auto-incremented numbers.
- **Authentication is simulated.** The `token` value returned by `POST /api/users/login` is a plain string for display purposes only. No middleware validates it. Access is controlled entirely by the `x-user-role` and `x-user-id` request headers.
- **Self-access** is supported on select routes: a user can access their own resource even without the admin role, determined by comparing `x-user-id` to the resource owner's ID.
- **Teacher profile ownership** is resolved via a `getOwnerId` lookup that maps a `teacherId` to the linked `userId`, so the `x-user-id` header (which carries a user ID) can be compared correctly.
- **Teacher conversation views** are scoped to the teacher's active students, determined from the relations data.

## Seed Users For Quick Testing

These users are pre-loaded in `models/data/users.json`:

| Role | Email | Password | User ID |
|---|---|---|---|
| Student | `dana.levi@example.com` | `1234` | `1` |
| Teacher | `omer.cohen@example.com` | `1234` | `2` |
| Admin | `maya.benami@example.com` | `1234` | `3` |

## API Reference

The full endpoint-by-endpoint API reference is in [API_REFERENCE.md](./API_REFERENCE.md).