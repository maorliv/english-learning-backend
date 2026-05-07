# Assignment 2 — Backend API

**Node.js + Express, Mock Data**

In this assignment you will build the backend API skeleton for your final project using **Node.js + Express**.

At this stage you will **not** connect to MySQL or any real database. Instead, your API will return mock data from a JSON file or from hardcoded arrays/objects with in-memory changes.

Your goal is to finish with a backend that:

- starts and runs locally;
- exposes a clear REST API for your project;
- accepts JSON input and returns JSON output;
- includes basic validation and error handling;
- can be tested easily via an exported Postman collection.

---

## Learning Goals

- Create an Express server with a clean project structure.
- Separate routes, controllers, and mock data.
- Design REST endpoints for a project-specific domain.
- Work with route params, query params, and JSON request bodies.
- Return consistent JSON responses and correct HTTP status codes.
- Validate input and handle errors cleanly.
- Provide documentation and a Postman collection so others can test your API quickly.

---

## Technical Requirements

- **Runtime:** Node.js
- **Framework:** Express
- **Data:** JSON file or mock data only, in-memory. No database connections.
- **Input/Output:** JSON for request bodies and JSON for responses.
- **Port:** `3000` by default.
- **Base URL:** `http://localhost:3000`

For each resource, implement at least CRUD-style endpoints.

---

## Middleware

### Authorization / Role-Check

Implement a reusable middleware that enforces role-based access control on protected routes.

The middleware should check the role of the current user and allow access only if that role is permitted for the requested action.

For this assignment, you may simulate authentication in a simple way, for example by reading a user role from a request header such as:

```http
x-user-role
```

No real login system is required.

Your middleware should:

- read the current user's role from the request;
- compare it against the roles allowed for the route;
- allow the request to continue if access is permitted;
- return an authorization error if access is denied.

Example use cases:

- only admin users can delete records;
- only admin and manager users can update records;
- regular user may only access and update their own data.

If authorization fails, return:

- status `403 Forbidden`;
- a JSON response in the required error format.

Example error response:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to perform this action.",
    "details": {}
  }
}
```

---

### Logger

Implement a reusable logger middleware that records basic information about every incoming request.

The logger should run automatically for all routes and print request details to the server console.

At minimum, the logger should record:

- HTTP method;
- requested URL or route path;
- date and time of the request;
- response status code.

You may also include additional useful information such as:

- query parameters;
- request body;
- time taken to complete the request.

The goal of this middleware is to help you monitor API activity and debug your server while developing and testing.

It should be implemented separately from the route handlers and applied globally in the Express app.

---

## Users Management

A user record includes these fields:

```json
{
  "userId": "numeric",
  "firstName": "string",
  "lastName": "string",
  "createDate": "datetime",
  "updateDate": "datetime",
  "userRole": "string"
}
```

The users API supports these requests:

| Method | Endpoint | Description | Response |
|---|---|---|---|
| GET | `/users` | Returns all users | `200` + all users array |
| GET | `/users/:id` | Returns one user | `200` + user or `404` |
| POST | `/users` | Creates a user. Body: `{ firstName, lastName, userRole }` | `201` + `userId` |
| PUT | `/users/:id` | Updates a user. Body: `{ firstName, lastName, userRole }` | `200` + `userId` |
| DELETE | `/users/:id` | Removes a user | `200` + `userId` |

---

## Resource A

For another resource in your project, implement these endpoints:

| Method | Endpoint | Description |
|---|---|---|
| GET | `/<resourceA>` | List items |
| GET | `/<resourceA>/:id` | Get one item by id |
| POST | `/<resourceA>` | Create a new item |
| PUT | `/<resourceA>/:id` | Update an item |
| DELETE | `/<resourceA>/:id` | Delete an item |

---

## Mock Data Requirements

Use a mock dataset that matches your project.

You can store it as:

- an array of objects in a `.js` module; or
- a `.json` file loaded into memory at startup.

Your mock data must include:

- IDs, numeric or string, for each item;
- enough sample items to test list/get/update/delete behavior.

It is OK if data resets when the server restarts, because this assignment uses in-memory data only.

---

## API Behavior Requirements

### 1. Request Parsing

- Your server must accept JSON bodies using Express middleware.
- For routes that accept a body, such as `POST` and `PUT`, validate required fields.

---

### 2. Response Format — Required

All responses must be JSON and follow one of these formats.

#### Success Response

```json
{
  "success": true,
  "data": "<object or array>",
  "error": null
}
```

#### Error Response

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "SOME_ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

Notes:

- `data` must be `null` on errors.
- `error.details` can be an empty object or include helpful info, for example which field is missing.

---

### 3. Status Codes — Required

Use appropriate HTTP status codes:

| Status Code | Meaning | When to Use |
|---|---|---|
| `200 OK` | Successful request | Successful `GET`, update, or delete |
| `201 Created` | Resource created | Successful `POST` that creates a new item |
| `400 Bad Request` | Client error | Validation errors or missing required fields |
| `404 Not Found` | Resource not found | Item id does not exist |
| `500 Internal Server Error` | Server error | Unexpected errors, should be rare |

---

### 4. Validation Rules — Required

You must validate, at minimum:

- id param exists and is valid in routes that use `/:id`;
- required fields exist in `POST` and update requests.

If validation fails, return:

- status `400`;
- the required error response format;
- a helpful message and details.

---

## Required Project Structure

```text
project/
  server.js              # or app.js — Express app setup and middleware
  routes/                # route definitions using Express Router
  controllers/           # request handlers / logic
  models/                # mock data modules/files
  docs/                  # documentation + exported Postman collection
  middleware/            # middleware handlers / logic
```

---

## Documentation Requirements

Create a `README.md` file that explains how to run and test your backend.

It must include:

- how to install dependencies: `npm install`;
- how to start the server: `npm start` or `node server.js`;
- the port and base URL;
- the API base path: `/`;
- any assumptions, for example how IDs are generated.

Also submit an API reference section, either in the README or in a separate doc, that lists:

- all endpoints;
- method + path;
- expected query parameters, if any;
- request body format for `POST` and `PUT`;
- example success response JSON;
- example error response JSON.

Tip: Write your documentation so that a classmate can test your API without asking you questions.

---

## Postman Requirements

You must submit an exported Postman collection `.json` that includes every endpoint you implemented.

Your collection must:

- use the correct HTTP methods;
- include request bodies where relevant;
- include path params and query params where relevant;
- use clear request names;
- be organized in folders, recommended by resource;
- work against `http://localhost:3000` after the instructor runs your server.

Additionally, include screenshots showing successful calls in Postman:

- at least 1 successful request per resource;
- at least 1 example error, for example validation error or not-found.

---

## What You Must Submit

Submit a zip containing:

- backend source code — your Express project;
- `README.md` — run + test instructions + API documentation;
- Postman collection file `.json`;
- screenshots of Postman tests.

---

## Examples — Adapt to Your Project

The examples below are examples only. Your resource names and fields will differ.

### Example Endpoints

```http
GET /tasks
GET /tasks?status=done
GET /tasks/3
POST /tasks
PUT /tasks/3
DELETE /tasks/3
GET /users/1/tasks
```

### Example POST Body

```json
{
  "title": "Finish Assignment 2",
  "status": "open"
}
```

### Example Success Response

```json
{
  "success": true,
  "data": {
    "id": 3,
    "title": "Finish Assignment 2",
    "status": "open"
  },
  "error": null
}
```

### Example Validation Error Response

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Missing required field: title",
    "details": {
      "field": "title"
    }
  }
}
```

---

## Summary

By the end of this assignment, you should have a working backend API with mock data that your future frontend can call.

In the next stage, you will replace mock data with a real database, but your routes and API contract should remain mostly the same.
