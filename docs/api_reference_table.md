# API Reference Table — English Learning Platform

**Assignment 2 | Backend API (Node.js + Express, Mock Data)**

## Legend

- Highlighted rows (★NEW) = endpoints added beyond those defined in the original 'עבודה 2' document.
- Method colors: GET POST PUT PATCH DELETE
- All responses use the standard format: { success, data, error }. Authorization via x-user-role header (mock).
- Base URL: http://localhost:3000   |   Port: 3000   |   Content-Type: application/json

## 1. Auth & Users  /api/users

| Method | Endpoint | Purpose | Request Body | Success Response | Errors | Role | Route Params | Query Params | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| POST | /api/users/register | Register new user (student/teacher) | {firstName, lastName, email, password, userRole, sex} | 201 + {userId, firstName, lastName, userRole} | 400 missing fields, 409 email exists | Public | - | - | Creates User row. If teacher: also Teacher row. If student: redirects to onboarding |
| POST | /api/users/login ★NEW | Login and receive role-based session ★NEW | {email, password} ★NEW | 200 + {userId, userRole, token} ★NEW | 400 missing fields, 401 bad credentials ★NEW | Public ★NEW | - ★NEW | - ★NEW | Simulated via x-user-role header in this assignment ★NEW |
| GET | /api/users | List all users | - | 200 + [{userId, firstName, lastName, userRole, createDate}] | 403 not admin | Admin | - | role, search | Admin dashboard: browse all users |
| GET | /api/users/:id | Get single user profile | - | 200 + {userId, firstName, lastName, email, userRole, createDate, updateDate} | 404, 403 | Admin / self | id | - | Students & teachers can only see own profile |
| PUT | /api/users/:id | Update user profile | {firstName, lastName, userRole} | 200 + {userId} | 400, 404, 403 | Admin / self | id | - | - |
| DELETE | /api/users/:id | Delete / block user | - | 200 + {userId} | 404, 403 | Admin | id | - | Admin can remove misbehaving teachers or students |

## 2. Student Onboarding & Matching  /api/matching

| Method | Endpoint | Purpose | Request Body | Success Response | Errors | Role | Route Params | Query Params | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| POST | /api/matching/preferences | Save student preferences + get AI-matched teachers | {budget_max, learning_goal, onboarding_text, currentLevel} | 201 + [{teacherId, firstName, matchScore, rank, pricePerWeek, specialties}] | 400 missing fields, 403 | Student | - | - | Saves to Student_Preferences. Filters by budget & experience. Returns ranked list |
| GET | /api/matching/recommendations ★NEW | Re-fetch teacher recommendations ★NEW | - ★NEW | 200 + [{teacherId, matchScore, ...}] ★NEW | 403, 404 no prefs ★NEW | Student ★NEW | - ★NEW | - ★NEW | Uses saved preferences to regenerate list ★NEW |

## 3. Teacher-Student Relations  /api/relations

| Method | Endpoint | Purpose | Request Body | Success Response | Errors | Role | Route Params | Query Params | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| POST | /api/relations/request | Student sends connection request to teacher | {teacherId} | 201 + {relationId, status: 'pending'} | 400, 403, 409 already exists | Student | - | - | Creates Teacher_Student_Relation row with status=pending |
| GET | /api/relations/pending | Teacher views pending student requests | - | 200 + [{relationId, studentId, firstName, lastName, createdAt}] | 403 | Teacher | - | - | Used in teacher dashboard |
| PATCH | /api/relations/:id/status | Teacher approves or rejects student request | {status: 'active'\|'rejected'} | 200 + {relationId, status} | 400, 403, 404 | Teacher | id | - | Status: pending -> active \| rejected |
| GET | /api/relations/my-students ★NEW | Teacher views all their active students ★NEW | - ★NEW | 200 + [{studentId, firstName, lastName, currentLevel, lastActivityDate}] ★NEW | 403 ★NEW | Teacher ★NEW | - ★NEW | - ★NEW | Dashboard student list ★NEW |
| POST | /api/relations/my-teacher/review | Student rates & reviews their teacher | {rating, student_feedback} | 200 + {relationId} | 400, 403, 404 | Student | - | - | Updates rating + student_feedback in relation row |
| GET | /api/teachers/my-reviews ★NEW | Teacher views their reviews & avg rating ★NEW | - ★NEW | 200 + {avgRating, reviews: [{studentId, rating, feedback}]} ★NEW | 403 ★NEW | Teacher ★NEW | - ★NEW | - ★NEW | Teacher dashboard: 'My Rating' ★NEW |
| GET | /api/relations ★NEW | Admin views all relations ★NEW | - ★NEW | 200 + [{relationId, teacherId, studentId, status, createdAt}] ★NEW | 403 ★NEW | Admin ★NEW | - ★NEW | status ★NEW | Useful to detect long-pending requests ★NEW |

## 4. Lessons  /api/lessons

| Method | Endpoint | Purpose | Request Body | Success Response | Errors | Role | Route Params | Query Params | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GET | /api/lessons | List all lessons (filtered by student level) | - | 200 + [{lessonId, title, level, locked: bool}] | 403 | Student / Admin | - | level | Lessons outside student level are returned as locked=true |
| GET | /api/lessons/:id | Get full lesson detail (scene, aiRole, etc.) | - | 200 + {lessonId, title, scene, aiRole, level, grammarRuleId, vocabularyId} | 404, 403 | Student / Admin | id | - | - |
| POST | /api/lessons | Create a new lesson | {title, scene, aiRole, level, grammarRuleId, vocabularyId} | 201 + {lessonId} | 400, 403 | Admin | - | - | - |
| PUT | /api/lessons/:id | Full update of lesson | {title, scene, aiRole, level, grammarRuleId, vocabularyId} | 200 + {lessonId} | 400, 404, 403 | Admin | id | - | - |
| PATCH | /api/lessons/:id | Partial update of lesson | {any updatable field} | 200 + {lessonId} | 400, 404, 403 | Admin | id | - | Use for quick field updates |
| DELETE | /api/lessons/:id | Delete a lesson | - | 200 + {lessonId} | 404, 403 | Admin | id | - | - |

## 5. Grammar Rules  /api/grammar-rules

| Method | Endpoint | Purpose | Request Body | Success Response | Errors | Role | Route Params | Query Params | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GET | /api/grammar-rules | List all grammar rules | - | 200 + [{id, category, usage}] | 403 | Student / Admin | - | category | - |
| GET | /api/grammar-rules/:id | Get full grammar rule detail | - | 200 + {id, category, usage, forms, spellingRules, examples, keywords} | 404 | Student / Admin | id | - | - |
| POST | /api/grammar-rules | Create new grammar rule | {id, category, usage, forms, spellingRules, examples, keywords} | 201 + {grammarRuleId} | 400, 403 | Admin | - | - | - |
| PUT | /api/grammar-rules/:id | Full update of grammar rule | {category, usage, forms, spellingRules, examples, keywords} | 200 + {grammarRuleId} | 400, 404, 403 | Admin | id | - | - |
| PATCH | /api/grammar-rules/:id | Partial update of grammar rule | {any updatable field} | 200 + {grammarRuleId} | 400, 404, 403 | Admin | id | - | - |
| DELETE | /api/grammar-rules/:id | Delete grammar rule | - | 200 + {grammarRuleId} | 404, 403 | Admin | id | - | - |

## 6. Warmup - Grammar Exercises  /api/lessons/:id/grammar-warmup

| Method | Endpoint | Purpose | Request Body | Success Response | Errors | Role | Route Params | Query Params | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GET | /api/lessons/:id/grammar | Get grammar rule linked to this lesson | - | 200 + {grammarRuleId, category, usage, forms, spellingRules, examples} | 404, 403 | Student | id | - | - |
| GET | /api/lessons/:id/grammar-warmup | Get 5 random warmup questions for grammar rule | - | 200 + [{exerciseId, type, instruction, content, options, difficulty}] | 404, 403 | Student | id | difficulty | Questions randomly sampled from Warm-up_grammar table |
| POST | /api/warm-up-grammar ★NEW | Admin adds a new warmup exercise ★NEW | {grammarRuleId, lessonId, type, instruction, content, options, correctAnswer, difficulty} ★NEW | 201 + {exerciseId} ★NEW | 400, 403 ★NEW | Admin ★NEW | - ★NEW | - ★NEW | ★NEW |
| PUT | /api/warm-up-grammar/:id | Full update of warmup exercise | {type, instruction, content, options, correctAnswer, difficulty} | 200 + {exerciseId} | 400, 404, 403 | Admin | id | - | - |
| PATCH | /api/warm-up-grammar/:id | Partial update of warmup exercise | {any field} | 200 + {exerciseId} | 400, 404, 403 | Admin | id | - | - |
| DELETE | /api/warm-up-grammar/:id | Delete warmup exercise | - | 200 + {exerciseId} | 404, 403 | Admin | id | - | - |

## 7. Vocabulary  /api/lessons/:id/vocab

| Method | Endpoint | Purpose | Request Body | Success Response | Errors | Role | Route Params | Query Params | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GET | /api/lessons/:id/vocab | Get all vocabulary words for a lesson | - | 200 + [{vocabularyId, word, translation, example, definition, completeSentence}] | 404, 403 | Student | id | - | Used for vocab list & flashcard views |
| GET | /api/lessons/:id/vocab/:vocabId | Get a single word as flashcard | - | 200 + {vocabularyId, word, translation, example, definition} | 404, 403 | Student | id, vocabId | - | - |
| GET | /api/lessons/:id/vocab-warmup | Generate warmup (complete-sentence + matching) | - | 200 + {completeSentence: [...], matching: [{word, definition}]} | 404, 403 | Student | id | - | Dynamically built from lesson vocab; distractors = other lesson words |
| POST | /api/lessons/:id/vocab ★NEW | Admin adds a word to a lesson ★NEW | {word, translation, example, definition, completeSentence} ★NEW | 201 + {vocabularyId} ★NEW | 400, 403 ★NEW | Admin ★NEW | id ★NEW | - ★NEW | ★NEW |
| PUT | /api/lessons/:id/vocab/:vocabId ★NEW | Admin updates a word ★NEW | {word, translation, example, definition, completeSentence} ★NEW | 200 + {vocabularyId} ★NEW | 400, 404, 403 ★NEW | Admin ★NEW | id, vocabId ★NEW | - ★NEW | ★NEW |
| DELETE | /api/lessons/:id/vocab/:vocabId ★NEW | Admin deletes a word ★NEW | - ★NEW | 200 + {vocabularyId} ★NEW | 404, 403 ★NEW | Admin ★NEW | id, vocabId ★NEW | - ★NEW | ★NEW |

## 8. Conversations  /api/conversations

| Method | Endpoint | Purpose | Request Body | Success Response | Errors | Role | Route Params | Query Params | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| POST | /api/conversations/start | Start a new AI conversation for a lesson | {lessonId} | 201 + {conversationId, messages: [], unusedVocab: [...]} | 400, 403, 400 warmup not done | Student | - | - | Only allowed if warmup completed. Initializes with AI prompt (scene + grammar + vocab) |
| POST | /api/conversations/:id/message | Send a student message & get AI reply | {content} | 200 + {reply, unusedVocab: [...], usedWords: [...]} | 400, 404, 403 | Student | id | - | Backend checks which vocab words appear in student message and returns updated unused list |
| POST | /api/conversations/:id/end | End conversation, receive AI score & feedback | - | 200 + {aiScore, aiFeedback, conversationId} | 404, 403 | Student | id | - | Status -> completed. Triggers progress update |
| GET | /api/conversations/:id | Get full conversation (messages + scores) | - | 200 + {conversationId, messages, aiScore, teacherScore, teacherComment, status} | 404, 403 | Student / Teacher / Admin | id | - | Used for teacher review and student progress view |
| POST | /api/conversations/:id/teacher-comment | Teacher adds score and feedback | {teacherScore, teacherComment} | 200 + {conversationId} | 400, 404, 403 | Teacher | id | - | Sets isReviewedByTeacher=true, triggers progress recalculation |
| POST | /api/conversations/:id/reply | Student or teacher adds follow-up message | {role: 'student'\|'teacher', content} | 200 + {conversationId, reply} | 400, 404, 403 | Student / Teacher | id | - | Appends to comments thread; does not mix with AI roleplay messages |
| GET | /api/conversations ★NEW | Admin/Teacher lists conversations ★NEW | - ★NEW | 200 + [{conversationId, studentId, lessonId, status, aiScore, isReviewedByTeacher}] ★NEW | 403 ★NEW | Admin / Teacher ★NEW | - ★NEW | status, studentId, lessonId ★NEW | Teacher sees only own students. Admin sees all ★NEW |

## 9. Progress  /api/progress

| Method | Endpoint | Purpose | Request Body | Success Response | Errors | Role | Route Params | Query Params | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GET | /api/progress/stats | Get student KPIs (completed, success, avg) | - | 200 + {currentLevel, completedLessonsCount, successedLessonsCount, overallAverage, lastActivityDate} | 403 | Student | - | - | - |
| GET | /api/progress/chart | Get last 5 scores for trend chart | - | 200 + [{conversationId, lessonTitle, aiScore, teacherScore, date}] | 403 | Student | - | - | Used to render score trend graph |
| GET | /api/progress/skills | Get AI-generated skills radar / weak points | - | 200 + {skillsRadar: string} | 403 | Student | - | - | - |
| GET | /api/progress/next-lesson | Get recommended next lesson based on goal & level | - | 200 + {lessonId, title, reason} | 403 | Student | - | - | Uses learning_goal + currentLevel from Student_Preferences |
| GET | /api/progress/:studentId ★NEW | Teacher / admin views a specific student's progress ★NEW | - ★NEW | 200 + {currentLevel, completedLessonsCount, successedLessonsCount, overallAverage, skillsRadar} ★NEW | 403, 404 ★NEW | Teacher / Admin ★NEW | studentId ★NEW | - ★NEW | Teacher restricted to own students ★NEW |
