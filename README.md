# English Learning Backend

A RESTful backend for the Lingua English learning platform built with Node.js and Express. Students can browse lessons, practise with an AI conversation partner, track their progress over time, and get matched with a real teacher based on their learning goals and budget. Teachers can manage their student relationships, review completed conversations, and leave scored feedback. Admins have full access to all resources.

The project is entirely self-contained — no database setup required. All data lives in JSON files that are loaded into memory at startup, so anyone can clone the repo, run two commands, and have a fully working API.

---

## What makes this backend well-structured

- **Role-based access control** on every protected route, enforced through a single reusable `authorize` middleware. Three roles — `student`, `teacher`, `admin` — with self-access exceptions where appropriate.
- **Consistent response envelope** across all endpoints: every response, success or error, uses the same JSON shape, making client-side handling predictable.
- **Service layer** (`services/`) separates AI orchestration from data storage. All Gemini API integrations are routed through `services/gemini.service.js` with graceful fallbacks, so the app runs fully without any API keys configured.
- **Realistic domain model** covering lessons, vocabulary, grammar rules, warm-up exercises, teacher matching, conversation scoring, AI level assessment, and teacher-student relations.
- **Zero infrastructure dependencies** — no database, no environment variables required, no Docker. Runs with `npm install` + `npm start`.

---

## Requirements

- Node.js 18+ recommended
- npm

---

## Install Dependencies

```bash
npm install
```

## Start the Server

```bash
npm start
```

or equivalently:

```bash
node server.js
```

> The entry point is `server.js`.

---

## Port and Base URL

| Setting | Value |
|---|---|
| Port | `3000` |
| Base URL | `http://localhost:3000` |
| API prefix | `/api/...` |
| Health check | `GET /` |
| CORS origin | `http://localhost:5173` |

---

## How to Test the API

You can use Postman, Thunder Client, Insomnia, or `curl.exe` in Windows PowerShell.

### Authentication Headers

Authentication is simulated via custom request headers — there is no real JWT validation on the server. Add these headers to every protected request:

| Header | Value |
|---|---|
| `x-user-role` | `student`, `teacher`, or `admin` |
| `x-user-id` | numeric ID of the acting user |
| `Content-Type` | `application/json` (for POST and PUT requests) |

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

> The `POST /api/auth/login` endpoint returns a `token` field, but no middleware validates it. Access is controlled entirely by the `x-user-role` and `x-user-id` headers.

### Suggested Smoke Test Order

1. `GET /` — confirm the server is running
2. `POST /api/auth/login` — simulate login
3. `GET /api/lessons` with student headers — browse available lessons
4. `GET /api/teachers` with student headers — browse available teachers
5. `POST /api/conversations/start` with student headers and a valid `lessonId` — start a practice conversation

### Example Requests

Health check:

```bash
curl.exe "http://localhost:3000/"
```

Login:

```bash
curl.exe -X POST "http://localhost:3000/api/auth/login" `
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
  -d '{\"lessonId\":1}'
```

---

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

---

## Project Structure

```
server.js               Entry point — creates the Express app and mounts all routes
routes/                 One file per resource (e.g. lessons.routes.js)
controllers/            Request handling and validation logic
models/                 In-memory data operations (read/write to the store)
services/               AI orchestration layer
  gemini.service.js     Single boundary for all Gemini API calls (stubs returning null until configured)
  conversation.service.js   Lesson conversation turns and scoring
  assessment.service.js     Level assessment message handling and classification
  matching.service.js       Teacher recommendation orchestration
  progress.service.js       Next-lesson recommendation logic
middleware/             authorize, errorHandler, logger, notFound
utils/                  response helpers, validators, httpError factory
data/                   JSON seed files loaded at startup (users, lessons, teachers, etc.)
```

---

## Assumptions and Implementation Notes

- **No database.** All data is seeded from JSON files under `models/data/`. Changes are held in memory only and reset when the server restarts.
- **Numeric IDs** are auto-generated as `max(existingId) + 1` inside each model. They are not UUIDs and not guaranteed to be stable across restarts.
- **Grammar rule IDs** are strings supplied by the client (e.g. `"present_simple"`), not auto-incremented numbers.
- **Authentication is simulated.** The `token` returned by `POST /api/auth/login` is a plain string for display purposes only. Access is controlled by `x-user-role` and `x-user-id` headers.
- **Self-access** is supported on select routes: a user can access their own resource even without the admin role, determined by comparing `x-user-id` to the resource owner's ID.
- **Role changes are not permitted.** `PUT /api/users/:id` accepts only `firstName` and `lastName`. Any attempt to change a user's role is rejected with 400.
- **Admin accounts cannot be deleted.** `DELETE /api/users/:id` returns 403 if the target user is an admin.
- **AI features fall back gracefully.** All AI calls go through `services/gemini.service.js`. When the Gemini API is not configured (functions return `null`), every feature falls back to a mock implementation so the full app remains functional.
- **Teacher profile ownership** is resolved via a `getOwnerId` lookup that maps a `teacherId` to the linked `userId`, so the `x-user-id` header (which carries a user ID) can be compared correctly for self-access checks.
- **Cumulative lesson access.** Students can access lessons at their own level and all levels below it (Beginner ⊂ Intermediate ⊂ Advanced).

---

## Seed Users for Quick Testing

These users are pre-loaded in `models/data/users.json`:

| Role | Email | Password | User ID |
|---|---|---|---|
| Student | `dana.levi@example.com` | `1234` | `1` |
| Teacher | `omer.cohen@example.com` | `1234` | `2` |
| Admin | `maya.benami@example.com` | `1234` | `3` |

---

## API Reference

The full endpoint-by-endpoint API reference is in [API_REFERENCE.md](./API_REFERENCE.md).
