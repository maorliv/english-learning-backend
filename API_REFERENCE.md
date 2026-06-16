# API Reference

All endpoints are prefixed with `/api/` unless noted otherwise. Every request and response body is JSON. All responses use the same envelope:

```json
{ "success": true,  "data": { ... }, "error": null }
{ "success": false, "data": null,    "error": { "code": "...", "message": "...", "details": {} } }
```

**Auth headers** (all protected routes):

| Header | Value |
|---|---|
| `x-user-role` | `student` \| `teacher` \| `admin` |
| `x-user-id` | numeric user ID |

Roles: **S** = student only, **T** = teacher only, **A** = admin only, **S/T/A** = any authenticated role, **ST** = student or teacher, **TA** = teacher or admin.

---

## Health

### `GET /`

Public. Returns server status.

**Response:**

```json
{ "success": true, "data": { "status": "ok", "uptime": 42.3 }, "error": null }
```

---

## Auth

### `POST /api/auth/login`

Public. Authenticates a user.

**Request body:**

```json
{ "email": "dana.levi@example.com", "password": "1234" }
```

**Response (200):**

```json
{
  "data": {
    "userId": 1,
    "userRole": "student",
    "token": "mock-token-student-1"
  }
}
```

> The `token` is a display string only — no middleware validates it. Add `x-user-role` and `x-user-id` headers to all protected requests.

**Errors:** `400 VALIDATION_ERROR` (missing fields), `401 INVALID_CREDENTIALS`.

---

### `POST /api/auth/logout`

Public. Clears the session (no-op for header-based auth, always succeeds).

**Response (200):**

```json
{ "data": { "message": "Logged out successfully" } }
```

---

## Users

### `GET /api/users`

**A**. Returns all registered users.

**Response (200):** Array of user objects `{ userId, firstName, lastName, email, userRole, sex, createdAt }`.

---

### `GET /api/users/me`

**S/T/A**. Returns the profile of the authenticated user (by `x-user-id`).

**Response (200):** Single user object.

---

### `GET /api/users/:id`

**A or self** (student/teacher can read their own record). Returns one user by ID.

**Response (200):** Single user object.

**Errors:** `400 VALIDATION_ERROR` (non-numeric ID), `403 FORBIDDEN`, `404 USER_NOT_FOUND`.

---

### `POST /api/users/register`

Public. Creates a new account.

**Request body:**

```json
{
  "firstName": "Dana",
  "lastName": "Levi",
  "email": "dana@example.com",
  "password": "secret",
  "userRole": "student",
  "sex": "female"
}
```

**Response (201):**

```json
{ "data": { "userId": 4, "firstName": "Dana", "lastName": "Levi", "userRole": "student" } }
```

**Errors:** `400 VALIDATION_ERROR` (missing fields or invalid role), `409 EMAIL_ALREADY_EXISTS`.

---

### `PUT /api/users/:id`

**A or self**. Updates `firstName` and/or `lastName` only. Role changes are rejected.

**Request body:**

```json
{ "firstName": "Dani", "lastName": "Levy" }
```

**Response (200):** Updated user object.

**Errors:** `400 VALIDATION_ERROR`, `400 ROLE_CHANGE_NOT_ALLOWED`, `403 FORBIDDEN`, `404 USER_NOT_FOUND`.

---

### `DELETE /api/users/:id`

**A**. Deletes a user. Admin accounts cannot be deleted.

**Response (200):**

```json
{ "data": { "message": "User deleted successfully", "userId": 4 } }
```

**Errors:** `400 VALIDATION_ERROR`, `403 CANNOT_DELETE_ADMIN`, `404 USER_NOT_FOUND`.

---

## Teachers

### `GET /api/teachers`

**S or A**. Lists teacher profiles.

**Query params:**

| Param | Type | Description |
|---|---|---|
| `available` | boolean string | Filter to available teachers only |
| `maxPrice` | number | Filter by maximum weekly price |

**Response (200):** Array of teacher profiles.

---

### `GET /api/teachers/me`

**T**. Returns the teacher profile linked to the authenticated user.

**Response (200):** Single teacher profile.

---

### `GET /api/teachers/my-reviews`

**T**. Returns all reviews received by the authenticated teacher plus average rating.

**Response (200):**

```json
{
  "data": {
    "averageRating": 4.5,
    "reviews": [
      { "studentId": 1, "rating": 5, "student_feedback": "Great!", "createdAt": "..." }
    ]
  }
}
```

---

### `GET /api/teachers/:id`

**S, A, or self (T)**. Returns one teacher profile by `teacherId`.

**Response (200):** Single teacher profile.

**Errors:** `404 TEACHER_NOT_FOUND`.

---

### `PUT /api/teachers/:id`

**A or self (T)**. Updates the teacher's own profile.

**Request body (all fields optional):**

```json
{
  "experience": 5,
  "pricePerWeek": 120,
  "specialties": ["Grammar", "Conversation"],
  "available": true,
  "feedbackFrequency": "weekly",
  "bio": "Experienced teacher...",
  "teachingLevels": ["Beginner", "Intermediate"],
  "availability": ["Monday", "Wednesday"],
  "onlineOnly": false
}
```

**Response (200):** Updated teacher profile.

**Errors:** `400 VALIDATION_ERROR`, `403 FORBIDDEN`, `404 TEACHER_NOT_FOUND`.

---

## Lessons

### `GET /api/lessons`

**S/T/A**. Lists lessons.

**Query params:**

| Param | Type | Description |
|---|---|---|
| `level` | string | Filter by level (`Beginner`, `Intermediate`, `Advanced`) |

**Response (200):** Array of lesson objects.

---

### `GET /api/lessons/catalog`

**S**. Returns the lesson catalog with lock and completion status for the authenticated student. Cumulative access: students can access their level and all levels below it.

**Response (200):**

```json
{
  "data": [
    {
      "lessonId": 1,
      "title": "At the Coffee Shop",
      "level": "Beginner",
      "scene": "Ordering coffee",
      "aiRole": "Barista",
      "isLocked": false,
      "isCompleted": true
    }
  ]
}
```

---

### `GET /api/lessons/:id`

**S/T/A**. Returns one lesson by ID.

**Response (200):** Single lesson object.

**Errors:** `404 LESSON_NOT_FOUND`.

---

### `GET /api/lessons/:id/grammar`

**S or A**. Returns the grammar rule linked to the lesson.

**Response (200):** Grammar rule object.

**Errors:** `404 LESSON_NOT_FOUND`, `404 GRAMMAR_RULE_NOT_FOUND`.

---

### `GET /api/lessons/:id/grammar-warmup`

**S**. Returns warm-up exercises for the lesson's grammar rule.

**Query params:**

| Param | Type | Description |
|---|---|---|
| `difficulty` | string | Filter exercises by difficulty (`BEGINNER`, `INTERMEDIATE`, `ADVANCED`) |

**Response (200):** Array of warm-up exercise objects.

---

### `GET /api/lessons/:id/vocab-warmup`

**S or A**. Returns vocabulary warm-up data for the lesson.

**Response (200):** Vocab warm-up object with words, translations, and exercises.

---

### `GET /api/lessons/:id/vocab`

**S or A**. Lists all vocabulary items for the lesson.

**Response (200):** Array of vocab items.

---

### `GET /api/lessons/:id/vocab/:vocabId`

**S or A**. Returns a single vocabulary item.

**Response (200):** Single vocab item `{ vocabId, word, translation, example, definition, completeSentence }`.

**Errors:** `404 LESSON_NOT_FOUND`, `404 VOCAB_NOT_FOUND`.

---

### `POST /api/lessons`

**A**. Creates a new lesson.

**Request body:**

```json
{
  "title": "At the Airport",
  "scene": "Checking in for a flight",
  "aiRole": "Check-in agent",
  "level": "Intermediate",
  "grammarRuleId": "present_perfect",
  "vocabularyId": null
}
```

**Response (201):** Created lesson object.

**Errors:** `400 VALIDATION_ERROR`.

---

### `POST /api/lessons/:id/vocab`

**A**. Adds a vocabulary item to the lesson.

**Request body:**

```json
{
  "word": "departure",
  "translation": "יציאה",
  "example": "The departure is at 10 AM.",
  "definition": "The act of leaving a place",
  "completeSentence": "We need to hurry to the departure gate."
}
```

**Response (201):** Created vocab item.

**Errors:** `400 VALIDATION_ERROR`, `404 LESSON_NOT_FOUND`.

---

### `PUT /api/lessons/:id`

**A**. Updates a lesson.

**Request body:** Same fields as POST (all optional).

**Response (200):** Updated lesson object.

**Errors:** `400 VALIDATION_ERROR`, `404 LESSON_NOT_FOUND`.

---

### `PUT /api/lessons/:id/vocab/:vocabId`

**A**. Updates a vocabulary item.

**Request body:** Any subset of `{ word, translation, example, definition, completeSentence }`.

**Response (200):** Updated vocab item.

**Errors:** `400 VALIDATION_ERROR`, `404 LESSON_NOT_FOUND`, `404 VOCAB_NOT_FOUND`.

---

### `DELETE /api/lessons/:id`

**A**. Deletes a lesson.

**Response (200):**

```json
{ "data": { "message": "Lesson deleted", "lessonId": 1 } }
```

**Errors:** `404 LESSON_NOT_FOUND`.

---

### `DELETE /api/lessons/:id/vocab/:vocabId`

**A**. Deletes a vocabulary item from a lesson.

**Response (200):** Confirmation message.

**Errors:** `404 LESSON_NOT_FOUND`, `404 VOCAB_NOT_FOUND`.

---

## Grammar Rules

### `GET /api/grammar-rules`

**S or A**. Lists all grammar rules.

**Response (200):** Array of grammar rule objects.

---

### `GET /api/grammar-rules/:id`

**S or A**. Returns one grammar rule. Note: IDs are strings (e.g. `"present_simple"`).

**Response (200):** Single grammar rule `{ id, category, usage, forms, spellingRules, examples }`.

**Errors:** `404 GRAMMAR_RULE_NOT_FOUND`.

---

### `POST /api/grammar-rules`

**A**. Creates a grammar rule.

**Request body:**

```json
{
  "id": "present_simple",
  "category": "Tenses",
  "usage": "Habitual actions and general truths",
  "forms": { "affirmative": "I/You/We/They + V, He/She/It + V+s" },
  "spellingRules": ["Add -es after s, sh, ch, x, o"],
  "examples": ["She works every day.", "Water boils at 100°C."]
}
```

**Response (201):** Created grammar rule.

**Errors:** `400 VALIDATION_ERROR`.

---

### `PUT /api/grammar-rules/:id`

**A**. Updates a grammar rule. Body: any subset of POST fields.

**Response (200):** Updated grammar rule.

**Errors:** `404 GRAMMAR_RULE_NOT_FOUND`.

---

### `DELETE /api/grammar-rules/:id`

**A**. Deletes a grammar rule.

**Response (200):** Confirmation message.

**Errors:** `404 GRAMMAR_RULE_NOT_FOUND`.

---

## Warm-Up Grammar Exercises

All routes under `/api/warm-up-grammar` require **admin** role.

### `GET /api/warm-up-grammar`

**A**. Lists all warm-up exercises.

**Response (200):** Array of exercise objects.

---

### `GET /api/warm-up-grammar/:id`

**A**. Returns one exercise.

**Response (200):** Single exercise object.

**Errors:** `404 EXERCISE_NOT_FOUND`.

---

### `POST /api/warm-up-grammar`

**A**. Creates a warm-up exercise.

**Request body:**

```json
{
  "grammarRuleId": "present_simple",
  "lessonId": 0,
  "type": "multiple_choice",
  "instruction": "Choose the correct form",
  "content": "She ___ to school every day.",
  "options": ["go", "goes", "going", "gone"],
  "correctAnswer": "goes",
  "difficulty": "BEGINNER"
}
```

> `lessonId: 0` is used for exercises not tied to a specific lesson (grammar warm-up pool).

**Response (201):** Created exercise object.

**Errors:** `400 VALIDATION_ERROR`.

---

### `PUT /api/warm-up-grammar/:id`

**A**. Updates an exercise. Body: any subset of POST fields.

**Response (200):** Updated exercise.

**Errors:** `404 EXERCISE_NOT_FOUND`.

---

### `DELETE /api/warm-up-grammar/:id`

**A**. Deletes an exercise.

**Response (200):** Confirmation message.

**Errors:** `404 EXERCISE_NOT_FOUND`.

---

## Conversations

### `GET /api/conversations`

**T or A**. Lists conversations. Teachers see only conversations for their own active students.

**Query params:**

| Param | Type | Description |
|---|---|---|
| `status` | string | `active` or `completed` |
| `studentId` | number | Filter by student (teachers: must be their own student) |
| `lessonId` | number | Filter by lesson |

**Response (200):** Array of conversation summary objects.

**Errors:** `400 VALIDATION_ERROR` (invalid status or ID), `403 FORBIDDEN` (teacher filtering another teacher's student).

---

### `GET /api/conversations/:id`

**S/T/A**. Returns full conversation details including all messages, AI score, teacher reviews, and comment thread.

**Response (200):**

```json
{
  "data": {
    "conversationId": 1,
    "messages": [
      { "role": "assistant", "content": "Hi! Let's practise.", "createdAt": "..." },
      { "role": "student", "content": "Hello!", "createdAt": "..." }
    ],
    "aiScore": 80,
    "teacherReviews": [
      {
        "teacherId": 1,
        "userId": 2,
        "teacherName": "Omer Cohen",
        "teacherScore": 85,
        "teacherComment": "Good use of vocabulary!",
        "reviewedAt": "..."
      }
    ],
    "status": "completed",
    "replies": []
  }
}
```

**Errors:** `404 CONVERSATION_NOT_FOUND`.

---

### `POST /api/conversations/start`

**S**. Starts a new conversation for the authenticated student on the given lesson. Fetches the lesson's grammar rule and vocabulary to store as AI context. Returns an opening message when AI is configured; otherwise returns an empty `messages` array and the frontend renders a hardcoded greeting.

**Request body:**

```json
{ "lessonId": 1 }
```

**Response (201):**

```json
{
  "data": {
    "conversationId": 5,
    "messages": [],
    "unusedVocab": ["departure", "baggage", "terminal"]
  }
}
```

**Errors:** `400 VALIDATION_ERROR`, `404 LESSON_NOT_FOUND`.

---

### `POST /api/conversations/:id/message`

**S**. Sends a student message. Tracks vocabulary usage. Returns an AI reply (real or fallback) and the updated unused vocab list.

**Request body:**

```json
{ "content": "I would like to check in my baggage please." }
```

**Response (200):**

```json
{
  "data": {
    "reply": "Of course! How many bags do you have?",
    "unusedVocab": ["departure", "terminal"],
    "usedWords": ["baggage"]
  }
}
```

**Errors:** `400 VALIDATION_ERROR`, `404 CONVERSATION_NOT_FOUND`.

---

### `POST /api/conversations/:id/end`

**S**. Ends the conversation, scores it with AI (or fallback: 60 + used vocab count × 10, capped at 100), and marks it completed.

**Response (200):**

```json
{
  "data": {
    "conversationId": 5,
    "aiScore": 80,
    "aiFeedback": null
  }
}
```

**Errors:** `400 VALIDATION_ERROR`, `404 CONVERSATION_NOT_FOUND`.

---

### `POST /api/conversations/:id/teacher-comment`

**T**. Adds teacher score and written feedback to a conversation. Marks it reviewed by teacher.

**Request body:**

```json
{ "teacherScore": 85, "teacherComment": "Excellent vocabulary usage!" }
```

**Response (200):** Updated review record.

**Errors:** `400 VALIDATION_ERROR`, `404 CONVERSATION_NOT_FOUND`, `404 TEACHER_NOT_FOUND`.

---

### `POST /api/conversations/:id/reply`

**S or T**. Adds a message to the conversation's comment thread (separate from the lesson messages; used for discussion after the lesson ends).

**Request body:**

```json
{ "role": "student", "content": "Thank you for the feedback!" }
```

**Response (200):** Updated comment thread.

**Errors:** `400 VALIDATION_ERROR` (invalid role), `404 CONVERSATION_NOT_FOUND`.

---

## Students

### `GET /api/students/:studentId/conversations`

**T or A**. Lists conversation summaries for a specific student. Teachers may only view their own active students.

**Response (200):**

```json
{
  "data": [
    {
      "conversationId": 1,
      "lessonId": 2,
      "lessonTitle": "At the Coffee Shop",
      "status": "completed",
      "aiScore": 75,
      "teacherReviews": [],
      "isReviewedByTeacher": false,
      "createdAt": "..."
    }
  ]
}
```

**Errors:** `400 VALIDATION_ERROR`, `403 FORBIDDEN`, `404 TEACHER_NOT_FOUND`.

---

## Relations (Teacher–Student Connections)

### `GET /api/relations`

**A**. Lists all relations.

**Query params:**

| Param | Type | Description |
|---|---|---|
| `status` | string | `pending`, `active`, or `rejected` |

**Response (200):** Array of relation objects.

---

### `GET /api/relations/my-relations`

**S**. Returns all relations (any status) for the authenticated student.

**Response (200):** Array of relation objects including teacher details.

---

### `GET /api/relations/my-students`

**T**. Returns active students for the authenticated teacher.

**Response (200):** Array of student profile objects.

---

### `GET /api/relations/my-teachers`

**S**. Returns active teachers for the authenticated student.

**Response (200):** Array of teacher profile objects.

---

### `GET /api/relations/pending`

**T**. Returns pending connection requests directed to the authenticated teacher.

**Response (200):** Array of pending relation objects.

---

### `POST /api/relations/request`

**S**. Sends a connection request to a teacher.

**Request body:**

```json
{ "teacherId": 1 }
```

**Response (201):**

```json
{
  "data": {
    "relationId": 3,
    "studentId": 1,
    "teacherId": 1,
    "status": "pending",
    "createdAt": "..."
  }
}
```

**Errors:** `400 VALIDATION_ERROR`, `404 TEACHER_NOT_FOUND`, `409 RELATION_ALREADY_EXISTS`.

---

### `POST /api/relations/my-teacher/review`

**S**. Submits a rating and written review for a teacher the student has an active relation with.

**Request body:**

```json
{
  "relationId": 3,
  "rating": 5,
  "student_feedback": "Very helpful and patient teacher!"
}
```

**Response (200):** Created review object.

**Errors:** `400 VALIDATION_ERROR`, `403 FORBIDDEN` (relation does not belong to student or is not active), `404 RELATION_NOT_FOUND`.

---

### `PATCH /api/relations/:id/status`

**T**. Updates the status of a pending relation request. Teachers can only update requests directed to them.

**Request body:**

```json
{ "status": "active" }
```

Valid values: `"active"`, `"rejected"`.

**Response (200):** Updated relation object.

**Errors:** `400 VALIDATION_ERROR`, `403 FORBIDDEN`, `404 RELATION_NOT_FOUND`.

---

### `DELETE /api/relations/:id`

**S**. Removes a relation. Students can only delete their own relations.

**Response (200):** Confirmation message.

**Errors:** `403 FORBIDDEN`, `404 RELATION_NOT_FOUND`.

---

## Teacher Matching

### `POST /api/matching/preferences`

**S**. Saves the student's matching preferences and returns a ranked list of teacher recommendations. Scoring uses the Gemini AI when configured; falls back to a mock ranking by price and availability.

**Request body:**

```json
{
  "budget_max": 150,
  "learning_goal": "Improve business English",
  "onboarding_text": "I need to present to international clients",
  "currentLevel": "Intermediate",
  "availability": ["Monday", "Thursday"],
  "teacherGender": "any",
  "mainGoal": "speaking",
  "onlineOnly": false
}
```

**Response (200):**

```json
{
  "data": [
    {
      "teacherId": 1,
      "firstName": "Omer",
      "lastName": "Cohen",
      "pricePerWeek": 120,
      "specialties": ["Grammar", "Business English"],
      "averageRating": 4.5,
      "matchScore": 0.92,
      "matchReason": "Specialises in business English at your price range"
    }
  ]
}
```

**Errors:** `400 VALIDATION_ERROR`.

---

### `GET /api/matching/recommendations`

**S**. Re-fetches teacher recommendations using the student's last saved preferences. Returns 404 if no preferences have been saved yet.

**Response (200):** Same format as `POST /api/matching/preferences`.

**Errors:** `404 PREFERENCES_NOT_FOUND`.

---

## Progress

### `GET /api/progress/chart`

**S**. Returns the authenticated student's score history for charting.

**Response (200):**

```json
{
  "data": [
    { "lessonId": 1, "lessonTitle": "At the Coffee Shop", "aiScore": 80, "completedAt": "..." }
  ]
}
```

---

### `GET /api/progress/next-lesson`

**S**. Returns an AI-recommended next lesson for the student. Uses Gemini when configured; falls back to selecting the highest-scoring incomplete lesson at the student's level.

**Response (200):**

```json
{
  "data": {
    "lessonId": 2,
    "title": "At the Airport",
    "level": "Beginner",
    "reason": "You've mastered the coffee shop vocab — try this travel scenario next."
  }
}
```

---

### `GET /api/progress/stats`

**S**. Returns aggregate statistics for the authenticated student.

**Response (200):**

```json
{
  "data": {
    "completedLessons": 3,
    "averageScore": 78,
    "currentLevel": "Intermediate",
    "totalLessons": 10
  }
}
```

---

### `GET /api/progress/:studentId`

**T or A**. Returns the progress record for a specific student.

**Response (200):** Student progress object including level, completed lessons, and scores.

**Errors:** `400 VALIDATION_ERROR`, `404 PROGRESS_NOT_FOUND`.

---

## Assessment

### `POST /api/assessment/start`

**S**. Begins a new AI level assessment session for the authenticated student. Returns the session ID and the first AI prompt message.

**Response (201):**

```json
{
  "data": {
    "assessmentId": 1,
    "status": "active",
    "messages": [
      { "role": "assistant", "content": "Hello! Let's find out your English level. Can you tell me about yourself?" }
    ]
  }
}
```

---

### `POST /api/assessment/:id/message`

**S**. Sends a student message and receives the next AI follow-up question. Returns 400 if the assessment is already completed.

**Request body:**

```json
{ "content": "I have been studying English for three years." }
```

**Response (200):**

```json
{ "data": { "reply": "Great! Can you describe a recent challenge you faced in English?" } }
```

**Errors:** `400 VALIDATION_ERROR`, `400 ASSESSMENT_ALREADY_COMPLETED`, `404 ASSESSMENT_NOT_FOUND`.

---

### `POST /api/assessment/:id/end`

**S**. Ends the assessment. Classifies the student's English level from the conversation (using Gemini when configured; falls back to `Beginner`). Writes the detected level to the student's progress record.

**Response (200):**

```json
{
  "data": {
    "assessmentId": 1,
    "detectedLevel": "Intermediate",
    "message": "Your English level has been assessed as Intermediate. Your profile has been updated."
  }
}
```

**Errors:** `400 ASSESSMENT_ALREADY_COMPLETED`, `404 ASSESSMENT_NOT_FOUND`, `404 PROGRESS_NOT_FOUND`.

---

## Settings

### `GET /api/settings`

**S/T/A**. Returns the settings for the authenticated user.

**Response (200):**

```json
{
  "data": {
    "userId": 1,
    "notifications": true,
    "language": "en",
    "theme": "light"
  }
}
```

---

### `PUT /api/settings`

**S/T/A**. Updates settings for the authenticated user.

**Request body:** Any subset of the settings fields (e.g. `{ "theme": "dark" }`).

**Response (200):** Updated settings object.

**Errors:** `400 VALIDATION_ERROR`.

---

## Error Codes Reference

| Code | HTTP | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Missing or invalid request field |
| `INVALID_CREDENTIALS` | 401 | Wrong email or password |
| `FORBIDDEN` | 403 | Authenticated but insufficient permission |
| `CANNOT_DELETE_ADMIN` | 403 | Attempt to delete an admin account |
| `ROLE_CHANGE_NOT_ALLOWED` | 400 | Attempt to change a user's role via PUT |
| `USER_NOT_FOUND` | 404 | No user with the given ID |
| `TEACHER_NOT_FOUND` | 404 | No teacher profile with the given ID |
| `LESSON_NOT_FOUND` | 404 | No lesson with the given ID |
| `GRAMMAR_RULE_NOT_FOUND` | 404 | No grammar rule with the given ID |
| `VOCAB_NOT_FOUND` | 404 | No vocab item with the given ID |
| `CONVERSATION_NOT_FOUND` | 404 | No conversation with the given ID |
| `ASSESSMENT_NOT_FOUND` | 404 | No assessment session with the given ID |
| `ASSESSMENT_ALREADY_COMPLETED` | 400 | Assessment session has already ended |
| `PROGRESS_NOT_FOUND` | 404 | No progress record for the given student |
| `PREFERENCES_NOT_FOUND` | 404 | No matching preferences saved for this student |
| `RELATION_NOT_FOUND` | 404 | No relation with the given ID |
| `RELATION_ALREADY_EXISTS` | 409 | Student already has a relation with this teacher |
| `EMAIL_ALREADY_EXISTS` | 409 | Email address is already registered |
