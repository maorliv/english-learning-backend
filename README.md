# English Learning Backend

This project is a mock backend for an English learning platform built with Node.js and Express. Data is loaded from JSON files under `models/data` and then mutated in memory while the server is running.

## Requirements

- Node.js 18+ recommended
- npm

## Install Dependencies

```bash
npm install
```

## Start The Server

Use either of these commands from the project root:

```bash
npm start
```

or

```bash
node index.js
```

Notes:

- The package script `npm start` runs `node index.js`.
- There is no `server.js` file in this project.

## Port And Base URL

- Port: `3000`
- Base URL: `http://localhost:3000`
- API base path: `/`
- Resource endpoints are mounted under `/api/...`
- Health check endpoint: `GET /`

Example full URLs:

- `http://localhost:3000/`
- `http://localhost:3000/api/users/login`
- `http://localhost:3000/api/lessons/101/vocab-warmup`

## How To Test The API

You can test the API with Postman, Thunder Client, Insomnia, or `curl.exe` in Windows PowerShell.

### Common Headers

Most protected routes expect mock authorization headers:

- `x-user-role`: `student`, `teacher`, or `admin`
- `x-user-id`: numeric user id for the acting user on routes that need ownership checks
- `Content-Type: application/json` for POST, PUT, and PATCH requests

Example headers for a student request:

```http
x-user-role: student
x-user-id: 1
Content-Type: application/json
```

Example headers for an admin request:

```http
x-user-role: admin
x-user-id: 3
Content-Type: application/json
```

### Suggested Smoke Test Order

1. `GET /` to confirm the server is running.
2. `POST /api/users/login` to simulate authentication.
3. `GET /api/lessons` with `x-user-role: student`.
4. `GET /api/teachers` with `x-user-role: student`.
5. `POST /api/conversations/start` with `x-user-role: student` and a valid `lessonId`.

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

Every endpoint returns the same envelope:

Successful response:

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

Error response:

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

- This backend uses mock JSON seed data. It does not use a real database.
- Data changes are stored in memory for the running Node process. They are not persisted back to the JSON files.
- Most numeric ids are generated as `max(existingId) + 1` inside the relevant model.
- Grammar rule ids are string ids supplied by the client, for example `present_simple`.
- Authentication is mocked through request headers. The `token` returned by login is informational and is not verified by middleware.
- Some routes support self-access by comparing `x-user-id` to the resource owner id.
- Teacher-only conversation views are filtered by teacher-student relations data.
- The API currently mounts the health route at `/`, so the API base path for the whole app is `/`.

## Seed Users For Quick Testing

These seeded users are available in `models/data/users.json`:

- Student: email `dana.levi@example.com`, password `1234`, user id `1`
- Teacher: email `omer.cohen@example.com`, password `1234`, user id `2`
- Admin: email `maya.benami@example.com`, password `1234`, user id `3`

## API Reference

The full endpoint-by-endpoint API reference is in [API_REFERENCE.md](./API_REFERENCE.md).