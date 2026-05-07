# טבלת השלמה — API Reference
**English Learning Platform | Assignment 2 | Supplementary Endpoints**

טבלה זו מכילה את ה-endpoints שהומלצו להוספה על ידי מודל שפה חיצוני, לאחר בחינה וסינון. כל שורה כוללת עמודת "החלטה" המסבירה אם ה-endpoint התקבל, נדחה, או התקבל בשינוי.

## Legend — עמודת החלטה
- ✔ מוסיף  — ההמלצה מתקבלת במלואה ומתווספת לטבלה הראשית.
- ~ מוסיף + הערה  — ההמלצה מתקבלת אך עם הסתייגות / גישה חלופית מוצעת ב-Notes.
- ✘ לא מוסיף  — Dashboard summary endpoints (teachers/dashboard, admin/dashboard) לא נכללו — הם composite endpoints שהפרונט יכול לבנות מ-calls קיימים, ומוסיפים מורכבות מיותרת לעבודה 2.

> Base URL: http://localhost:3000   |   Port: 3000   |   Role header: x-user-role   |   Content-Type: application/json

## 1. בדיקת שרת — Health Check

| Method | Endpoint | Purpose | Request Body | Success Response | Errors | Role | Route Params | Query Params | Notes | החלטה |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GET | / | Verify server is running | - | 200 + {message: 'Server is running', timestamp} | 500 | Public | - | - | First test in Postman. Also useful for deployment checks. | ✔ מוסיף |

## 2. Teacher כ-Resource עצמאי  /api/teachers

| Method | Endpoint | Purpose | Request Body | Success Response | Errors | Role | Route Params | Query Params | Notes | החלטה |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GET | /api/teachers | List all available teachers | - | 200 + [{teacherId, firstName, lastName, rank, pricePerWeek, specialties, available, experience}] | 403 | Student / Admin | - | available, specialty, maxPrice | Used for matching page & browsing. Filter by available=true for active search. | ✔ מוסיף |
| GET | /api/teachers/:id | Get full teacher profile | - | 200 + {teacherId, userId, firstName, lastName, rank, pricePerWeek, specialties, available, experience, feedback} | 404, 403 | Student / Teacher / Admin | id | - | Student views before choosing. Teacher views own profile. | ✔ מוסיף |
| PUT | /api/teachers/:id | Full update of teacher profile | {experience, pricePerWeek, specialties, available, feedback} | 200 + {teacherId} | 400, 404, 403 | Teacher (own) / Admin | id | - | Teacher updates own profile. Admin can toggle available field. | ✔ מוסיף |
| PATCH | /api/teachers/:id | Partial update of teacher profile | {any updatable field} | 200 + {teacherId} | 400, 404, 403 | Teacher (own) / Admin | id | - | Lightweight update — e.g., admin flips available=false only. | ✔ מוסיף |

## 3. Warmup Completion Flag  /api/lessons/:id/warmup/complete

| Method | Endpoint | Purpose | Request Body | Success Response | Errors | Role | Route Params | Query Params | Notes | החלטה |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| POST | /api/lessons/:id/warmup/complete | Mark lesson warmups as completed for this student | {grammarCompleted: true, vocabCompleted: true} | 200 + {lessonId, warmupCompleted: true} | 400, 403, 404 | Student | id | - | Sets an in-memory flag per (userId, lessonId). POST /conversations/start checks this flag before allowing chat. Alternative: embed the check inside /conversations/start — both valid. | ~ מוסיף + הערה |

## 4. שיחות לפי תלמיד ספציפי  /api/students/:studentId/conversations

| Method | Endpoint | Purpose | Request Body | Success Response | Errors | Role | Route Params | Query Params | Notes | החלטה |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GET | /api/students/:studentId/conversations | List all conversations of a specific student | - | 200 + [{conversationId, lessonId, lessonTitle, status, aiScore, teacherScore, isReviewedByTeacher, createdAt}] | 403, 404 | Teacher / Admin | studentId | status | Teacher restricted to own students only. More intuitive than GET /api/conversations?studentId=... for teacher flow. | ✔ מוסיף |

## 5. השלמת CRUD — Warmup Grammar  /api/warm-up-grammar/:id

| Method | Endpoint | Purpose | Request Body | Success Response | Errors | Role | Route Params | Query Params | Notes | החלטה |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GET | /api/warm-up-grammar/:id | Get a single grammar warmup exercise by ID | - | 200 + {exerciseId, grammarRuleId, lessonId, type, instruction, content, options, correctAnswer, difficulty} | 404, 403 | Admin / Student | id | - | Completes full CRUD for warmup exercises. Admin uses for editing; student could use for review. | ✔ מוסיף |
