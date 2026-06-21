# Lingua -- English Learning Platform (Backend)

A RESTful backend API for **Lingua**, an English learning platform where students practice English through AI-powered conversations, track their progress, and connect with real teachers for feedback and guidance.

Built as **Assignment 4** for the "Internet Development Environments" course at Ben-Gurion University of the Negev.

**Tech stack:** Node.js, Express, MySQL, Prisma 5 ORM, Socket.IO, Google Gemini AI (gemini-2.5-flash)

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Environment Variables](#environment-variables)
4. [Database Setup](#database-setup)
5. [Prisma ORM Setup](#prisma-orm-setup)
6. [Running the Server](#running-the-server)
7. [Project Structure](#project-structure)
8. [Authentication](#authentication)
9. [Response Format](#response-format)
10. [API Endpoints](#api-endpoints)
11. [WebSocket Events (Socket.IO)](#websocket-events-socketio)
12. [AI Features (Google Gemini)](#ai-features-google-gemini)
13. [Seed Data for Testing](#seed-data-for-testing)
14. [Known Limitations](#known-limitations)

---

## Prerequisites

- **Node.js** 18 or higher
- **npm**
- **MySQL** 8.0 or higher (running locally or remotely)
- **Google Gemini API key** (free tier available at [Google AI Studio](https://aistudio.google.com/))

---

## Installation

```bash
cd english-learning-backend
npm install
```

This installs all dependencies including Express, Prisma, Socket.IO, and the Google Generative AI SDK.

---

## Environment Variables

Create a `.env` file in the `english-learning-backend` root directory:

```env
DATABASE_URL="mysql://root:password@localhost:3306/english_learning"
GEMINI_API_KEY="your-google-gemini-api-key-here"
```

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | MySQL connection string used by Prisma | `mysql://root:yourpassword@localhost:3306/english_learning` |
| `GEMINI_API_KEY` | API key for Google Gemini AI features | Obtain from [Google AI Studio](https://aistudio.google.com/) |

**Important:** Replace `root` and `password` in `DATABASE_URL` with your actual MySQL credentials. Make sure the MySQL server is running before proceeding.

---

## Database Setup

1. **Create the MySQL database** (if it does not exist yet):

   ```sql
   CREATE DATABASE english_learning;
   ```

   You can run this via the MySQL CLI (`mysql -u root -p`) or any database client (MySQL Workbench, DBeaver, etc.).

2. **Run Prisma migrations** to create all tables:

   ```bash
   npm run prisma:migrate
   ```

3. **Seed the database** with sample data (users, lessons, vocabulary, grammar rules, teachers, etc.):

   ```bash
   npm run prisma:seed
   ```

After seeding, the database contains ready-to-use students, teachers, lessons, and all related data so you can test the API immediately.

---

## Prisma ORM Setup

This project uses **Prisma 5** as its ORM. The schema is defined in `prisma/schema.prisma` and contains **17 models**:

| Model | Purpose |
|---|---|
| User | Student and admin accounts |
| Teacher | Teacher profiles linked to a User |
| Lesson | English lessons with scenes and difficulty levels |
| Vocabulary | Vocabulary items belonging to a lesson |
| GrammarRule | Grammar rules belonging to a lesson |
| WarmUpExercise | Practice exercises for grammar warm-ups |
| Conversation | AI conversation sessions between a student and the system |
| ConversationMessage | Individual messages within a conversation |
| ConversationReply | Teacher/student replies on completed conversations |
| TeacherReview | Scored teacher reviews on conversations |
| Progress | Student progress records per lesson |
| Assessment | AI-driven level assessment sessions |
| AssessmentMessage | Messages within an assessment session |
| Settings | Application-level settings |
| StudentPreferences | Student preferences for teacher matching |
| StudentTeacherRelation | Junction table: many-to-many between User and Teacher |
| StudentCompletedLesson | Junction table: many-to-many between User and Lesson |

**Key relationships:**

- **One-to-many:** User has many Conversations, Lesson has many Vocabulary items, Conversation has many Messages
- **Many-to-many:** User and Teacher (via StudentTeacherRelation), User and Lesson (via StudentCompletedLesson)

### Useful Prisma Commands

| Command | Description |
|---|---|
| `npm run prisma:migrate` | Apply all pending database migrations |
| `npm run prisma:seed` | Seed the database with sample data |
| `npm run prisma:studio` | Open Prisma Studio (visual database browser at http://localhost:5555) |

---

## Running the Server

**Development** (auto-restarts on file changes via nodemon):

```bash
npm run dev
```

**Production:**

```bash
npm start
```

The server starts on **port 3000**. Base URL: `http://localhost:3000`

A health check is available at `GET /`.

---

## Project Structure

```
english-learning-backend/
├── server.js            -- Entry point (Express + Socket.IO setup)
├── socket.js            -- WebSocket event handling
├── .env                 -- Environment variables (not committed)
├── prisma/
│   ├── schema.prisma    -- Database schema (17 models)
│   ├── client.js        -- Prisma client singleton
│   ├── seed.js          -- Database seeder
│   └── migrations/      -- Migration files
├── controllers/         -- Request handlers (one per resource)
├── services/            -- Business logic + Gemini AI integration
├── routes/              -- Express route definitions
├── middleware/           -- Authorization middleware
├── utils/               -- Response helpers, validators, error handling
└── models/data/         -- JSON seed data files
```

---

## Authentication

This project uses **header-based authentication** (no JWT). Include these headers on every protected request:

| Header | Description | Example |
|---|---|---|
| `x-user-id` | Numeric ID of the acting user | `1` |
| `x-user-role` | Role of the user: `student`, `teacher`, or `admin` | `student` |
| `Content-Type` | Required for POST/PUT requests | `application/json` |

**Example -- student request:**

```
x-user-role: student
x-user-id: 1
Content-Type: application/json
```

**Example -- admin request:**

```
x-user-role: admin
x-user-id: 3
Content-Type: application/json
```

Only 4 endpoints are public (no headers needed). All other 72 endpoints require the auth headers.

---

## Response Format

Every endpoint returns a consistent JSON envelope:

**Success:**

```json
{
  "success": true,
  "data": { },
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
    "details": { "missingFields": ["email"] }
  }
}
```

---

## API Endpoints

The API exposes **76 endpoints** across 13 route groups (4 public, 72 protected).

### Auth (`/api/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Log in with email and password |
| POST | `/api/auth/logout` | Public | Log out |

### Users (`/api/users`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/users` | Admin | List all users |
| POST | `/api/users/register` | Public | Register a new user |
| GET | `/api/users/me` | Authenticated | Get current user profile |
| GET | `/api/users/:id` | Admin / Self | Get user by ID |
| PUT | `/api/users/:id` | Admin / Self | Update user |
| DELETE | `/api/users/:id` | Admin | Delete user |

### Teachers (`/api/teachers`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/teachers` | Authenticated | List all teachers |
| GET | `/api/teachers/me` | Teacher | Get own teacher profile |
| GET | `/api/teachers/my-reviews` | Teacher | Get reviews received |
| GET | `/api/teachers/:id` | Authenticated | Get teacher by ID |
| PUT | `/api/teachers/:id` | Admin / Self | Update teacher profile |

### Lessons (`/api/lessons`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/lessons` | Authenticated | List all lessons |
| POST | `/api/lessons` | Admin | Create a lesson |
| GET | `/api/lessons/catalog` | Authenticated | Browse lesson catalog |
| GET | `/api/lessons/:id` | Authenticated | Get lesson by ID |
| PUT | `/api/lessons/:id` | Admin | Update a lesson |
| DELETE | `/api/lessons/:id` | Admin | Delete a lesson |
| GET | `/api/lessons/:id/grammar` | Authenticated | Get grammar rules for a lesson |
| GET | `/api/lessons/:id/grammar-warmup` | Authenticated | Get grammar warm-up exercises |
| GET | `/api/lessons/:id/vocab` | Authenticated | List vocabulary for a lesson |
| POST | `/api/lessons/:id/vocab` | Admin | Add vocabulary to a lesson |
| GET | `/api/lessons/:id/vocab/:vocabId` | Authenticated | Get a specific vocabulary item |
| PUT | `/api/lessons/:id/vocab/:vocabId` | Admin | Update a vocabulary item |
| DELETE | `/api/lessons/:id/vocab/:vocabId` | Admin | Delete a vocabulary item |
| GET | `/api/lessons/:id/vocab-warmup` | Authenticated | Get vocabulary warm-up exercises |

### Conversations (`/api/conversations`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/conversations` | Authenticated | List conversations |
| POST | `/api/conversations/start` | Student | Start a new AI conversation |
| GET | `/api/conversations/:id` | Authenticated | Get conversation by ID |
| POST | `/api/conversations/:id/message` | Student | Send a message in an AI conversation |
| POST | `/api/conversations/:id/reply` | Authenticated | Reply on a completed conversation |
| POST | `/api/conversations/:id/teacher-comment` | Teacher | Add a teacher comment/review |
| POST | `/api/conversations/:id/end` | Student | End and score a conversation |

### Relations (`/api/relations`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/relations` | Admin | List all relations |
| POST | `/api/relations/request` | Student | Send a connection request to a teacher |
| GET | `/api/relations/my-relations` | Authenticated | Get own relations |
| GET | `/api/relations/my-students` | Teacher | List connected students |
| GET | `/api/relations/my-teachers` | Student | List connected teachers |
| GET | `/api/relations/pending` | Teacher | List pending connection requests |
| POST | `/api/relations/my-teacher/review` | Student | Review a teacher |
| PATCH | `/api/relations/:id/status` | Teacher | Accept or reject a request |
| DELETE | `/api/relations/:id` | Authenticated | Remove a relation |

### Progress (`/api/progress`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/progress/chart` | Student | Get progress chart data |
| GET | `/api/progress/next-lesson` | Student | Get AI-recommended next lesson |
| GET | `/api/progress/stats` | Student | Get progress statistics |
| GET | `/api/progress/:studentId` | Teacher / Admin | Get a student's progress |

### Matching (`/api/matching`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/matching/preferences` | Student | Get own matching preferences |
| POST | `/api/matching/preferences` | Student | Set matching preferences |
| GET | `/api/matching/recommendations` | Student | Get AI-powered teacher recommendations |

### Assessment (`/api/assessment`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/assessment/start` | Student | Start a level assessment |
| POST | `/api/assessment/:id/message` | Student | Send a response during assessment |
| POST | `/api/assessment/:id/end` | Student | End assessment and get level result |

### Settings (`/api/settings`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/settings` | Admin | Get application settings |
| PUT | `/api/settings` | Admin | Update application settings |

### Grammar Rules (`/api/grammar-rules`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/grammar-rules` | Authenticated | List all grammar rules |
| POST | `/api/grammar-rules` | Admin | Create a grammar rule |
| GET | `/api/grammar-rules/:id` | Authenticated | Get grammar rule by ID |
| PUT | `/api/grammar-rules/:id` | Admin | Update a grammar rule |
| DELETE | `/api/grammar-rules/:id` | Admin | Delete a grammar rule |

### Students (`/api/students`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/students/:studentId/conversations` | Teacher | View a student's conversations |

### Warm-Up Exercises (`/api/warm-up-grammar`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/warm-up-grammar` | Authenticated | List all warm-up exercises |
| POST | `/api/warm-up-grammar` | Admin | Create a warm-up exercise |
| GET | `/api/warm-up-grammar/:id` | Authenticated | Get warm-up exercise by ID |
| PUT | `/api/warm-up-grammar/:id` | Admin | Update a warm-up exercise |
| DELETE | `/api/warm-up-grammar/:id` | Admin | Delete a warm-up exercise |

---

## WebSocket Events (Socket.IO)

The server uses **Socket.IO** for real-time communication. Connect to `http://localhost:3000` with a Socket.IO client.

### Server-Emitted Events

| Event | Payload | Description |
|---|---|---|
| `users:online-list` | Array of user IDs | Sent on connect: full list of currently online users |
| `user:online` | User ID | Broadcast when a user comes online |
| `user:offline` | User ID | Broadcast when a user goes offline |
| `conversation:new-reply` | Reply object | Someone replied in a conversation thread |
| `conversation:completed` | Conversation object | A student finished an AI conversation |
| `conversation:reviewed` | Review object | A teacher reviewed a conversation |
| `relation:accepted` | Relation object | A teacher accepted a student's connection request |
| `relation:requested` | Relation object | A student sent a connection request |
| `relation:removed` | Relation object | A connection was removed |

---

## AI Features (Google Gemini)

The backend integrates **Google Gemini 2.5 Flash** for four AI-powered features:

### 1. AI Conversation Partner

Students practice English by chatting with an AI conversation partner. The AI is given the lesson context (scene description, target vocabulary, grammar rules) and guides the student through a realistic dialogue. When the conversation ends, the AI scores the student on four criteria:

| Criterion | Weight |
|---|---|
| Vocabulary usage | 25 points |
| Grammar accuracy | 25 points |
| Communication clarity | 25 points |
| Engagement level | 25 points |

### 2. Level Assessment

An adaptive AI assessment that asks the student a series of questions to determine their English proficiency level. The AI adjusts question difficulty based on responses and classifies the student as **Beginner**, **Intermediate**, or **Advanced**. The result is saved to the student's profile automatically.

### 3. Lesson Recommendations

The AI analyzes the student's completed lessons, scores, and current level to recommend the best next lesson. Results are cached to avoid redundant API calls.

### 4. Teacher Matching

The AI scores all available teachers against the student's preferences (teaching style, specializations, price range, availability) in a single prompt. If the Gemini API is unavailable, the system falls back to a token-overlap scoring algorithm.

---

## Seed Data for Testing

After running `npm run prisma:seed`, the following test accounts are available:

| Role | Email | Password | User ID |
|---|---|---|---|
| Student | `dana.levi@example.com` | `1234` | `1` |
| Teacher | `omer.cohen@example.com` | `1234` | `2` |
| Admin | `maya.benami@example.com` | `1234` | `3` |

### Quick Smoke Test

1. **Health check:** `GET http://localhost:3000/`
2. **Login:** `POST /api/auth/login` with `{ "email": "dana.levi@example.com", "password": "1234" }`
3. **Browse lessons:** `GET /api/lessons` with headers `x-user-role: student`, `x-user-id: 1`
4. **Start a conversation:** `POST /api/conversations/start` with headers and body `{ "lessonId": 1 }`
5. **Browse teachers:** `GET /api/teachers` with headers `x-user-role: student`, `x-user-id: 1`

---

## Known Limitations

- **Gemini API rate limits:** The free tier allows approximately 20 requests per day. When the limit is exceeded, the server uses hardcoded fallback responses instead of live AI generation.
- **No JWT authentication:** The project uses simple header-based auth (`x-user-id`, `x-user-role`). There is no token validation or session management.
- **No password hashing:** Passwords are stored as plain text in the database. This is intentional for this educational project and should never be done in production.
- **No file upload support:** The API does not handle file uploads (e.g., profile pictures).
- **Data resets on re-seed:** Running `npm run prisma:seed` again will reset the database to its initial state, discarding any data created through the API.
