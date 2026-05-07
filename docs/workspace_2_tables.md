# סביבות עבודה 2 - טבלאות וזרימות מערכת

> קובץ Markdown מסודר מתוך מסמך הטבלאות המקורי.  
> המטרה: לשמור את מבנה הישויות, השדות, הדוגמאות וה־flows בצורה קריאה וברורה לשימוש בפרויקט וב־Copilot.

---

## 1. Users

בטבלת `Users` השדה `role` יכול לקבל אחד מהערכים הבאים:

- `student`
- `teacher`
- `admin`

| Field | Type / Example | Description |
|---|---|---|
| `userID` | `0` | מזהה משתמש |
| `firstName` | `Israel` | שם פרטי |
| `lastName` | `Israeli` | שם משפחה |
| `email` | `israel@example.com` | אימייל |
| `password` | `1234` | סיסמה, בשלב mock בלבד |
| `role` | `student` / `teacher` / `admin` | תפקיד המשתמש במערכת |
| `createDate` | `2024-05-01T10:00:00Z` | תאריך יצירת המשתמש |
| `sex` | `male` | מין המשתמש |

### Example

```json
{
  "userID": 0,
  "firstName": "Israel",
  "lastName": "Israeli",
  "email": "israel@example.com",
  "password": "1234",
  "role": "student",
  "createDate": "2024-05-01T10:00:00Z",
  "sex": "male"
}
```

---

## 2. Teacher

טבלת `Teacher` מייצגת את הפרופיל המקצועי של מורה במערכת.

### Field notes

- `rank` - דירוג המורה בקרב הסטודנטים. דירוג מ־0 עד 4, כאשר 4 הוא הדירוג הגבוה ביותר.
- `feedback` - סוג/תדירות משוב, למשל: `quick`, `weekly`, `daily`.
- `specialties` - תחומי התמחות כ־Array/JSON, למשל: `Interview Prep`, `Grammar`, `Tech English`.
- `available` - האם המורה זמין כרגע לקלוט סטודנטים חדשים.

| Field | Type / Example | Description |
|---|---|---|
| `teacherID` | `2` | מזהה מורה |
| `userID` | `432` | מזהה המשתמש המקושר בטבלת Users |
| `experience` | `5 years in Tech English` | ניסיון המורה |
| `updateDate` | `2024-04-15T09:00:00Z` | תאריך עדכון אחרון |
| `rank` | `4` | דירוג מ־0 עד 4 |
| `pricePerWeek` | `1$` | מחיר שבועי |
| `feedback` | `weekly` | סוג/תדירות משוב |
| `specialties` | `["Grammar"]` | תחומי התמחות |
| `available` | `true` | האם זמין לקבל תלמידים |

### Example

```json
{
  "teacherID": 2,
  "userID": 432,
  "experience": "5 years in Tech English",
  "updateDate": "2024-04-15T09:00:00Z",
  "rank": 4,
  "pricePerWeek": "1$",
  "feedback": "weekly",
  "specialties": ["Grammar"],
  "available": true
}
```

---

## 3. Lesson

טבלת `Lessons` היא הלב של המערכת. כל שיעור כולל מזהה, כותרת, תיאור סצנה, תפקיד שה־AI מגלם בשיחה, רמת שיעור, וקישור לחוק דקדוקי.

### Relationships

- לכל שיעור יש חוק דקדוקי אחד שמשויך אליו.
- חוק דקדוקי אחד יכול להופיע בכמה שיעורים.
- טבלת `Lessons` תכיל `Foreign Key` לטבלת `Grammar_Rules`.
- שיעור אחד מכיל סט שאלות חימום, למשל 5 שאלות חימום.
- קשר: `Lesson (1) ↔ Warmup (N)`.

| Field | Type / Example | Description |
|---|---|---|
| `lessonID` | `101` | מזהה שיעור |
| `vocabularyID` | `3` | מזהה אוצר מילים משויך |
| `title` | `The Technical Interview` | כותרת השיעור |
| `scene` | `You are applying for an IT position...` | תיאור הסצנה |
| `aiRole` | `Technical Team Lead` | תפקיד ה־AI בשיחה |
| `grammarRuleID` | `present_simple` | החוק הדקדוקי המשויך |
| `level` | `Intermediate` | רמת השיעור |

### Example

```json
{
  "lessonID": 101,
  "vocabularyID": 3,
  "title": "The Technical Interview",
  "scene": "You are applying for an IT position. Brian, the team leader, is asking about your routine.",
  "aiRole": "Technical Team Lead",
  "grammarRuleID": "present_simple",
  "level": "Intermediate"
}
```

---

## 4. Grammar Rule

טבלת `Grammar_Rules` מייצגת חוק דקדוקי במערכת.

### Field notes

- `id` - מזהה החוק. לדוגמה: `Present Simple`, `Relative Clauses`, `Gerunds`.
- `category` - קטגוריה כללית, למשל `Tenses`.
- `usage` - תיאור קצר של מתי משתמשים בחוק.
- `forms` - אובייקט שיכול להכיל מבנים שונים:
  - עבור זמנים: `positive`, `negative`, `question`.
  - עבור חוקים שאינם זמנים, כמו Passive: מבנה כללי אחד, למשל `be + past participle`.
- `spellingRules` - חוקים לשינויי איות, למשל הוספת `s`, `ed`, `ing`, או טיפול ב־Irregular verbs.
- `examples` - רשימת משפטים שמדגימים את החוק.
- `warmup` / `exerciseID` - קישור לתרגול חימום מתאים.

| Field | Type / Example | Description |
|---|---|---|
| `id` | `Present_Simple` | מזהה החוק |
| `category` | `Tenses` | קטגוריה |
| `usage` | `To talk about regular actions, facts, and general truths.` | שימוש |
| `forms` | Object | מבנים דקדוקיים |
| `keywords` | Array | מילות מפתח נפוצות |
| `spellingRules` | String | חוקי איות |
| `examples` | Array | דוגמאות |
| `exerciseID` | `300` | מזהה תרגיל חימום |

### Example

```json
{
  "id": "Present_Simple",
  "category": "Tenses",
  "usage": "To talk about regular actions, facts, and general truths.",
  "forms": {
    "general_formula": "Subject + Verb",
    "positive": "Subject + base verb (add -s/-es for he/she/it)",
    "negative": "Subject + do/does not + base verb",
    "question": "Do/Does + Subject + base verb?"
  },
  "keywords": ["always", "usually", "every day", "regularly"],
  "spellingRules": "Verbs ending in -o, -sh, -ch add -es.",
  "examples": [
    {
      "text": "The server runs on Linux.",
      "type": "positive"
    },
    {
      "text": "Does the system require a reboot?",
      "type": "question"
    }
  ],
  "exerciseID": 300
}
```

---

## 5. Vocabulary

טבלת `Vocabulary` מייצגת אוצר מילים המשויך לשיעור מסוים.

### Field notes

- `completeSentence` - שדה שישמש בחימום של שיעור ספציפי. זו תהיה שאלה אמריקאית שבה המסיחים הם שאר המילים באותו שיעור.
- `definition` - שדה שישמש בתרגיל התאמה, שבו הסטודנט יתאים בין מילה לבין ההגדרה שלה.

| Field | Type / Example | Description |
|---|---|---|
| `vocabularyID` | `101` | מזהה רשומת אוצר מילים |
| `lessonId` | `3` | מזהה שיעור |
| `word` | `Maintain` | המילה באנגלית |
| `translation` | `לתחזק` | תרגום לעברית |
| `example` | `I maintain the servers.` | משפט דוגמה |
| `definition` | `to keep something working or in good condition` | הגדרה באנגלית |
| `completeSentence` | `I ________ the servers every day.` | משפט השלמה |

### Example

```json
{
  "vocabularyID": 101,
  "lessonId": 3,
  "word": "Maintain",
  "translation": "לתחזק",
  "example": "I maintain the servers.",
  "definition": "to keep something working or in good condition",
  "completeSentence": "I ________ the servers every day."
}
```

---

## 6. Warm-up Grammar

`Warm-up Grammar` הוא תרגיל קצר, למשל שאלת בחירה אמריקאית או השלמת משפט, המשויך לשיעור ולחוק דקדוקי.

### Field notes

- `type` - סוג השאלה. לדוגמה:
  - `multiple_choice`
  - `fill_in_the_blanks`
  - `matching`
- `options` - רשימת מסיחים, למשל: `["do", "does", "is", "are"]`.
- `difficulty` - רמת קושי, למשל:
  - `BEGINNER`
  - `INTERMEDIATE`
  - `EXPERT`

דוגמה לשאילתה אפשרית:  
"שלח לי 5 שאלות אקראיות המשויכות ל־Present Simple".

| Field | Type / Example | Description |
|---|---|---|
| `exerciseID` | `300` | מזהה תרגיל |
| `lessonId` | `3` | מזהה שיעור |
| `grammarRuleID` | `present_simple` | מזהה חוק דקדוקי |
| `type` | `multiple_choice` | סוג התרגיל |
| `instruction` | `Choose the correct answer` | הוראה לסטודנט |
| `content` | `How often ____ you update...` | תוכן השאלה |
| `options` | `["do", "does", "is", "are"]` | אפשרויות תשובה |
| `correctAnswer` | `do` | תשובה נכונה |
| `difficulty` | `INTERMEDIATE` | רמת קושי |

### Example

```json
{
  "exerciseID": 300,
  "lessonId": 3,
  "grammarRuleID": "present_simple",
  "type": "multiple_choice",
  "instruction": "Choose the correct answer",
  "content": "How often ____ you update the server?",
  "options": ["do", "does", "is", "are"],
  "correctAnswer": "do",
  "difficulty": "INTERMEDIATE"
}
```

---

## 7. Vocabulary Warm-up

כאשר הסטודנט בוחר שיעור מסוים באמצעות `lessonId`, המערכת שולפת את כל רשומות אוצר המילים (`Vocabulary`) המשויכות לאותו שיעור.

מתוך כל מילה נשלפים בעיקר השדות:

- `word`
- `definition`
- `completeSentence`

לאחר שליפת הנתונים, המערכת מייצרת באופן דינמי שאלון `WarmUp` אינטראקטיבי שמורכב משני סוגי תרגולים.

### 7.1 Complete Sentence - השלמת משפט

עבור כל מילה בשיעור, המערכת משתמשת בשדה `completeSentence` כדי ליצור שאלת השלמת משפט בסגנון אמריקאי.

המשפט מוצג עם מקום ריק `______`, והסטודנט צריך לבחור את המילה המתאימה מתוך מספר אפשרויות.

#### יצירת אפשרויות תשובה

- התשובה הנכונה היא המילה של אותה רשומה (`word`).
- המסיחים (`Distractors`) נוצרים מתוך שאר המילים הקיימות באותו שיעור.
- כל השאלות מותאמות לאוצר המילים של השיעור הנבחר בלבד.

#### Example

```json
{
  "sentence": "I ________ the servers every day.",
  "options": ["maintain", "support"],
  "answer": "maintain"
}
```

### 7.2 Match Definitions - התאמת מילה להגדרה

המערכת משתמשת בשדות:

- `word`
- `definition`

כדי ליצור תרגיל התאמה (`Matching Exercise`).

בתרגיל זה:

- כל המילים של השיעור מוצגות ברשימה אחת.
- כל ההגדרות של השיעור מוצגות ברשימה נפרדת.
- הרשימות מעורבבות באופן רנדומלי.
- הסטודנט צריך להתאים בין כל מילה להגדרה הנכונה שלה.

#### Example

```json
{
  "word": "Maintain",
  "definition": "to keep something working or in good condition"
}
```

### 7.3 Flow מלא של יצירת ה־WarmUp

1. הסטודנט בוחר שיעור באמצעות `lessonId`.
2. המערכת שולחת שאילתה לטבלת `Vocabulary`.
3. נשלפות כל המילים המשויכות לאותו שיעור.
4. עבור כל רשומה נשלפים:
   - `word`
   - `definition`
   - `completeSentence`
5. המערכת יוצרת:
   - שאלות השלמת משפט (`sentence_complete`)
   - תרגיל התאמת מילים והגדרות (`match`)
6. עבור שאלות ההשלמה:
   - המילה הנכונה נלקחת מהרשומה עצמה.
   - שאר המילים בשיעור משמשות כמסיחים.
7. עבור תרגיל ההתאמה:
   - כל המילים וההגדרות מעורבבות.
   - נוצר מערך התאמות עבור הסטודנט.

---

## 8. Conversation

טבלת `Conversation` מתעדת את הדו־שיח בין המשתמש ל־AI.

### Main idea

- זו ישות מקשרת.
- היא שייכת למשתמש ספציפי ומתבצעת בתוך שיעור ספציפי.
- היא מכילה את כל הודעות הצ'אט.
- קשר: `User (1) ↔ Conversation (N)`, כלומר תלמיד אחד יכול לבצע הרבה שיחות.

### מה נשלח לפרומפט של ה־AI

- הסצנה, כדי שהשיחה תישאר בקונטקסט המקצועי.
- `aiRole`, למשל: הדמות Charles שמנסה לגשת לקבצים.
- רמת הסטודנט: `beginner`, `intermediate`, `expert`.
- אוצר המילים שהסטודנט למד בחימום, כדי שה־AI יעודד שימוש בו בשיחה.
- `grammarRule`, כדי שהשיחה תתמקד בחוק הדקדוקי הרלוונטי.
- בכל קריאת API יש להחזיר את כל תוכן השיחה עד כה.
- כדי לקיים את הרעיון של "רשימת מילים צפה", יש להחזיר גם את רשימת המילים שטרם נוצלו.

### Floating Vocabulary Logic

ה־Backend יכול לבדוק בכל הודעה חדשה של המשתמש האם ההודעה מכילה מילים מטבלת `Vocabulary` של אותו שיעור. לאחר מכן הוא יעדכן את ה־state שנשלח ל־Frontend.

יתרון: זה חוסך טוקנים יקרים בקריאות ל־AI, כי לא צריך שה־AI יחשב בעצמו אילו מילים נוצלו.

### Teacher Comments

- `teacherComment` יאותחל בהתחלה ל־`null`.
- רק לאחר שהמורה יראה את השיחה הוא יוכל למשב ולעדכן אותה.
- הסטודנט יוכל להשיב למורה.
- צריך לתמוך בהודעות מסוג `teacher` ו־`student` לאחר סיום השיחה עם ה־AI.
- הודעות אלו לא צריכות להתערבב עם תוכן ה־AI roleplay המקורי.
- השדה `isReviewedByTeacher` מאפשר למורה לדעת מה כבר נבדק ומה חדש בדשבורד שלו.

| Field | Type / Example | Description |
|---|---|---|
| `conversationID` | `conv_501` | מזהה שיחה |
| `userID` | `3` | מזהה תלמיד |
| `lessonId` | `101` | מזהה שיעור |
| `createdAt` | `2026-05-03T12:00:00Z` | תאריך יצירת שיחה |
| `status` | `completed` | סטטוס שיחה |
| `teacherId` | `2` | מזהה מורה |
| `messages` | Array | הודעות השיחה עם ה־AI |
| `aiScore` | `95` | ציון AI |
| `teacherScore` | `85` | ציון מורה |
| `teacherComment` | String / `null` | משוב מורה |
| `isReviewedByTeacher` | `true` / `false` | האם השיחה נבדקה על ידי מורה |

### Example

```json
{
  "conversationID": "conv_501",
  "userID": 3,
  "lessonId": 101,
  "createdAt": "2026-05-03T12:00:00Z",
  "status": "completed",
  "teacherId": 2,
  "messages": [
    {
      "role": "assistant",
      "content": "Hi, tell me about your work routine.",
      "timestamp": "2026-05-03T12:01:00Z"
    },
    {
      "role": "user",
      "content": "I usually maintain the servers.",
      "timestamp": "2026-05-03T12:02:00Z"
    }
  ],
  "aiScore": 95,
  "teacherScore": 85,
  "teacherComment": "Good job, but watch your grammar in the second sentence.",
  "isReviewedByTeacher": true
}
```

---

## 9. User Progress

טבלת `User_Progress` שומרת את מצב ההתקדמות של סטודנט.

### Field notes

- `studentID` - Foreign Key לתלמיד.
- `currentLevel` - הרמה הנוכחית של הסטודנט.
- `completedLessonsCount` - כמה שיעורים הסתיימו בסטטוס `completed`.
- `successedLessonsCount` - כמה שיעורים ברמת הסטודנט הסתיימו בהצלחה. הצלחה מוגדרת כממוצע משוקלל של ציון AI וציון מורה מעל 85.
- `lastActivityDate` - מתי הייתה השיחה האחרונה.
- `skillsRadar` - הערה שנוצרת על ידי AI עם דגשים כלליים לשיפור.

| Field | Type / Example | Description |
|---|---|---|
| `progressID` | `34` | מזהה רשומת התקדמות |
| `studentID` | `3` | מזהה סטודנט |
| `currentLevel` | `intermedia` | רמה נוכחית |
| `overallAverage` | `85` | ממוצע כללי |
| `lastActivityDate` | `2026-05-03T12:00:00Z` | פעילות אחרונה |
| `skillsRadar` | `practice more on present simple` | הערת AI לשיפור |
| `completedLessonsCount` | `12` | מספר שיעורים שהושלמו |
| `successedLessonsCount` | `8` | מספר שיעורים שהושלמו בהצלחה |

### Example

```json
{
  "progressID": 34,
  "studentID": 3,
  "currentLevel": "intermedia",
  "overallAverage": 85,
  "lastActivityDate": "2026-05-03T12:00:00Z",
  "skillsRadar": "practice more on present simple",
  "completedLessonsCount": 12,
  "successedLessonsCount": 8
}
```

---

## 10. Relation Student Teacher

טבלת `Relation_Student_Teacher` מייצגת קשר בין מורה לתלמיד.

### Main idea

- זו טבלת קישור שמכילה `teacherID` ו־`studentID`.
- היא מגדירה איזה מורה רשאי לראות איזה תלמיד.
- רשומה תופיע רק לאחר שתלמיד בחר מורה.
- קשר מורה־תלמיד: מורה יכול ללמד הרבה תלמידים, ותלמיד משויך למורה אחד.

### Field notes

- `student_feedback` - פידבק שסטודנט יכול להשאיר על המורה.
- `status` - יכול להיות:
  - `pending`
  - `active`
  - `rejected`
- השדה `status` מתחיל כ־`pending`, ורק לאחר אישור המורה הופך ל־`active`.
- `rating` - דירוג כוכבים שהסטודנט נותן למורה, מ־0 עד 4.

| Field | Type / Example | Description |
|---|---|---|
| `T_S_Relation` | `52` | מזהה קשר |
| `studentID` | `3` | מזהה תלמיד |
| `teacherID` | `2` | מזהה מורה |
| `student_feedback` | `GoodTeacher` | פידבק תלמיד |
| `connection_date` | `2024-05-03T12:00:00Z` | תאריך יצירת קשר |
| `created_at` | `2024-05-03T12:00:00Z` | תאריך יצירה |
| `status` | `active` | סטטוס קשר |
| `rating` | `4` | דירוג מ־0 עד 4 |

### Example

```json
{
  "T_S_Relation": 52,
  "studentID": 3,
  "teacherID": 2,
  "student_feedback": "GoodTeacher",
  "connection_date": "2024-05-03T12:00:00Z",
  "created_at": "2024-05-03T12:00:00Z",
  "status": "active",
  "rating": 4
}
```

---

## 11. Student Preferences

טבלת `Student_Preferences` שומרת את ההעדפות שהסטודנט הזין בתהליך ההרשמה/השאלון.

### Field notes

- `budget_max` - התקרה הכספית שהסטודנט הזין ברישום.
- `learning_goal` - המטרה המקצועית של הסטודנט, למשל `Job Interviews`.
- `onboarding_text` - תיאור חופשי שהסטודנט כתב, לצורך ניתוח עתידי והתאמה למורה.

| Field | Type / Example | Description |
|---|---|---|
| `studentID` | `75` | מזהה סטודנט |
| `userID` | `3` | מזהה משתמש |
| `budget_max` | `20$` | תקציב מקסימלי |
| `learning_goal` | `Job Interviews` | מטרת למידה |
| `onboarding_text` | `I Love English` | טקסט חופשי מהשאלון |

### Example

```json
{
  "studentID": 75,
  "userID": 3,
  "budget_max": "20$",
  "learning_goal": "Job Interviews",
  "onboarding_text": "I Love English"
}
```

---

# Flows

---

## 12. Student Flow - זרימת תלמיד

### 12.1 כניסה למערכת

בעת כניסה ל־URL הראשי יופיע מסך התחברות/הירשמות.

אם התלמיד נרשם כעת, יוצג בפניו שאלון שבו המערכת תאסוף מידע ותיצור לו פרופיל.

### 12.2 ניתוח שאלון

השאלון יכלול:

- רמת אנגלית בשירות עצמי.
- חלון כתיבה קצר שבו הסטודנט יכתוב טקסט חופשי.
- סיווג רמת האנגלית לפי שילוב של:
  - ההערכה העצמית של הסטודנט.
  - טקסט חופשי שכתב.
  - הערכה של ה־AI.
- דגשים רצויים, למשל:
  - דקדוק.
  - אוצר מילים.
  - הכנה לראיונות.
- ציפיות מהמורה ורקע אישי/מקצועי.

### 12.3 Matching - תהליך התאמה למורה

כאשר הסטודנט מסיים את השאלון, המערכת תבצע שאילתה או סריקת AI על טבלת `Teacher`.

התהליך כולל:

1. סינון יבש לפי מחיר:
   - הצלבת טווח המחיר שהסטודנט הזין מול עלות המורה.
2. הצלבת ניסיון:
   - אם הסטודנט ציין שהוא רוצה אנגלית טכנית, המערכת תחפש במחרוזת `experience` של המורה מילים כמו `Tech English`.
3. סינון לפי זמינות:
   - שימוש בשדה `available` בטבלת `Teacher`.
4. דירוג התאמה:
   - למשל: "מצאנו לך 3 מורים שמתאימים ב־95% לצרכים שלך".

### 12.4 תיאום ציפיות לגבי ה־AI

כדאי לשאול את הסטודנט בשאלון: "מהן המטרות המקצועיות שלך?"

לדוגמה:

- אם הוא עונה "ראיונות עבודה", המערכת תמליץ לו להתחיל בשיעור `The Technical Interview`.

### 12.5 דף בית של תלמיד

לאחר יצירת פרופיל או התחברות לפרופיל קיים, יוצגו כפתורים כגון:

- `Lesson` - מעבר לרשימת שיעורים.
- `Progress` - מעבר לדף התקדמות.
- החלפת מורה - אפשרות לחפש מורה חדש באמצעות Matching מוכוון AI.

### 12.6 רשימת שיעורים

- שיעורים שמתאימים לרמת הסטודנט יהיו פתוחים.
- שיעורים שלא ברמה של הסטודנט יוצגו, אך לא יהיה ניתן להיכנס אליהם.
- אם הסטודנט בחר שיעור, הוא יעבור לדף השיעור.

### 12.7 דף שיעור ספציפי

במסך השיעור יוצגו:

- הסצנה.
- התפקיד שה־AI ישחק.
- תפקיד הסטודנט בסצנה.

#### כפתור אוצר מילים

- יוצגו מילים כרשימה.
- תהיה אפשרות להציג את המילים בכרטיסיות.
- יהיה כפתור "תרגול מילים" או "חימום".

#### כפתור חוק דקדוק

- יוצג כל המידע על החוק הדקדוקי.
- יופיע הסבר מפורט.
- יהיה כפתור "תרגול דקדוק" או "חימום".

#### כפתור שיחה עם AI

- כפתור שיחת AI ייפתח רק לאחר סיום החימום של הדקדוק ושל אוצר המילים.

### 12.8 אסטרטגיה לניהול שיחה עם AI

המטרה היא לשלב את ה־AI כמאמן ולא רק כשותף לשיחה.

#### פתרון לבעיית תקיעות - הדרכה אקטיבית ב־Frontend

במקום להשאיר את שדה ה־chat input ריק, אפשר להוסיף רכיבי עזר:

- כפתורי `Help me start`:
  - ה־AI יכול להציע 3 אופציות לתגובה בכל שלב.
  - לחיצה על אופציה תמלא את שדה הטקסט.
- רשימת מילים צפה (`Floating Vocabulary`):
  - אוצר המילים של השיעור יוצג בצד הצ'אט.
  - מילה שהמשתמש השתמש בה תיצבע בירוק.
- הנחיות שלב (`Scaffolding`):
  - מעל הצ'אט יוצג משפט שמסביר איפה אנחנו בסצנה.
  - לדוגמה: `Now, describe what you are doing to fix the server issue using Present Progressive`.

### 12.9 מבנה שיחה מוצע - התקדמות בשלבים

| שלב בשיחה | מה ה־AI עושה | מה המשתמש עושה |
|---|---|---|
| פתיחה | Brian מברך את המשתמש ומציג את הבעיה, לפי הסצנה | עונה שלום ומאשר שהוא זמין לעזור |
| ליבה / Practice | Brian שואל שאלות שמאלצות שימוש בדקדוק הרלוונטי | משתמש בחוק הדקדוק ובמילים כמו `LAN` או `Maintenance` |
| סגירה | Brian מסכם ומבקש לקבוע פגישה | משתמש בביטויים של תיאום זמנים, למשל `Wednesday at 7` |

### 12.10 המלצה לגבי הסצנה

לא מומלץ לתת למשתמש להעתיק את הסצנה המקורית. עדיף לתת לו לשחק דמות אחרת באותה סיטואציה, למשל טכנאי חדש שמגיע לעזור ל־Brian. כך הוא חייב להשתמש בידע שלו ולא רק בזיכרון.

### 12.11 סיום שיחה

בסוף השיחה:

- ה־AI נותן משוב מילולי קצר.
- ה־AI נותן דגשים לשיפור ולשימור.
- ה־AI נותן ציון בין 0 ל־100.
- השיחה משוקללת בחלק ה־`Progress` של הסטודנט.
- המורה יכול בהמשך להגיב על השיחה ולתת:
  - הערה לשיפור.
  - הערה לשימור.
  - ציון בין 0 ל־100.
- התלמיד יוכל להגיב למורה.
- השיחה ביניהם תישמר ב־DB.

### 12.12 מגבלת זמן לשיחה

משך השיחה יהיה עד הראשון מבין השניים:

1. עברו 5 דקות מתחילת השיחה.
2. הסטודנט לחץ ידנית על כפתור "סיים שיחה".

לאחר שהשיחה מסתיימת, היא לא אקטיבית יותר ולא ניתן להמשיך אותה מאותה נקודה.

---

## 13. Teacher Flow - זרימת מורה

המרצה ביקש Flow חדש למורה, בנוסף ל־Flow של התלמיד.

### יצירת פרופיל מורה

בעת יצירת פרופיל, המורה ימלא את כל השדות הרלוונטיים שלו.

### Flow A - יצירת קשר / Onboarding

1. המורה מקבל הזמנה מתלמיד להצטרף אליו.
2. נוצרת רשומה בטבלת הקשרים `Student_Teacher`.
3. המורה יקבל התראות כאשר:
   - תלמיד סיים שיחה.
   - תלמיד שלח הודעה למורה.

### Flow B - בקרה ומשוב / Monitoring

1. המורה מתחבר ורואה Dashboard עם רשימת התלמידים שלו.
2. המורה עובר על ההתראות.
3. ההתראות יורכבו מ:
   - שיחות של סטודנטים שהסתיימו וצריך למשב.
   - תשובה של סטודנט על פידבק קיים.
4. המורה בוחר תלמיד ורואה את רשימת ה־`Conversations` שלו.
5. המורה לוחץ על שיחה ספציפית וקורא:
   - את השיחה.
   - את הפידבק של ה־AI.
   - את הודעת הסטודנט, אם קיימת.
6. המורה מוסיף `Teacher Recommendation`, שנשמרת ב־DB.
7. התלמיד מקבל התראה או רואה בדף ה־`Progress` רכיב חדש: "הערות המורה".

---

## 14. Admin Flow - זרימת מנהל מערכת

מנהל המערכת הוא בעל הבית של התוכן והמשתמשים. הוא אחראי לוודא שהנתונים ב־DB תקינים ושהמערכת פועלת כסדרה.

### כניסה למערכת

- ה־Admin מתחבר דרך אותו מסך `Login`.
- המערכת מזהה את ה־`role` שלו כ־`admin`.
- הוא מנותב ל־Dashboard ניהולי.

### Flow A - ניהול תוכן לימודי / CMS

ה־Admin אחראי על CRUD של הלב של המערכת.

#### ניהול שיעורים - Lessons

- הוספת שיעור חדש:
  - כותרת.
  - תיאור סצנה.
  - בחירת דמות AI (`aiRole`).
  - קישור לחוק דקדוקי.
- עריכה/מחיקה:
  - עדכון פרטי סצנה קיימת אם התגלו שגיאות.

#### ניהול חוקי דקדוק - Grammar Rules

- יצירת חוקים חדשים:
  - קטגוריה.
  - מבני זמנים (`forms`).
  - חוקי איות.
  - דוגמאות.
- ניהול שאלות חימום:
  - הוספה או הסרה של שאלות מטבלת Exercises המשויכות לחוק מסוים.

#### ניהול אוצר מילים - Vocabulary

- הוספת מילים חדשות לשיעור ספציפי.
- לכל מילה יש:
  - תרגום.
  - הגדרה.
  - משפט לדוגמה.
- עדכון הגדרות לבקשת מורים.

### Flow B - ניהול משתמשים ובקרה

- צפייה ב־`Users`:
  - ה־Admin רואה טבלה של כל המשתמשים, סטודנטים ומורים.
- ניהול סטטוס מורים:
  - אישור מורים חדשים שנרשמו למערכת.
  - עדכון שדה `available` של מורה במקרה של חריגה או בעיה.
- ניטור קשרים `Student-Teacher Relations`:
  - צפייה בטבלת הקשרים כדי לוודא שאין סטודנטים בסטטוס `pending` זמן רב מדי.

### Flow C - בקרה על ה־AI / Monitoring

#### Conversation Review

- ל־Admin יש הרשאה לצפות בכל שיחה (`Conversation`) במערכת, ללא קשר למורה.
- המטרה: לוודא שה־AI מתפקד כראוי ומספק ציונים הגיוניים.
- ה־Admin יכול לצפות ב־`skillsRadar` של סטודנטים כדי לזהות נושאים דקדוקיים שהרבה סטודנטים מתקשים בהם.
- אם הרבה סטודנטים מתקשים בנושא מסוים, זה עשוי להעיד על צורך בשיפור תוכן השיעור.

### Example Admin Dashboard Actions

| Action | Target Object | Description |
|---|---|---|
| `Create` | `Lesson` | יצירת שיעור חדש בנושא `Cyber Security Meeting` |
| `Update` | `Grammar Rule ID: 300` | עדכון דוגמאות ב־`Present Simple` |
| `Delete` | `User ID: 432` | חסימת מורה שקיבל דירוג נמוך מדי |
| `Read` | `Conversation Log` | בדיקת תקינות הפרומפט שנשלח ל־AI |

---

## 15. Progress Page - דף התקדמות

כדי לממש את הויז'ן לדף `Progress` בצורה מקצועית, צריך לשלב בין:

- לוגיקת Backend - איך הנתונים נאספים ומתעדכנים.
- UX/UI - מה הסטודנט רואה בפועל.

### 15.1 Flows מאחורי הקלעים - עדכון נתונים

#### Post-Conversation Flow

1. ברגע ששיחה עוברת לסטטוס `completed`, ה־Backend מעדכן את `completedLessonsCount` בטבלת `Progress`.
2. המערכת מחשבת ממוצע ראשוני על בסיס ציון AI ומעדכנת את `overallAverage`.
3. השדה `lastActivityDate` מתעדכן לתאריך הנוכחי.

#### Teacher Review Flow

1. כאשר מורה מזין `teacherScore`, ה־Backend מחשב מחדש את הממוצע המשוקלל בטבלת `Progress`.
2. אם הציון המשוקלל של AI + מורה עולה על 85, אז `successedLessonsCount` עולה ב־1.

### 15.2 מה כדאי להציג בדף Progress

#### KPIs - סיכום כמותי

- מספר שיעורים שהושלמו.
- שיעורי הצלחה - כמה שיעורים עברו את רף 85.
- ציון ממוצע כללי - הממוצע המשוקלל לאורך זמן.

#### Progress Bar - סקאלת התקדמות ויזואלית

- הצגת הרמה הנוכחית (`currentLevel`).
- הצגת המרחק מהרמה הבאה.
- לדוגמה: "עוד 3 שיעורים בהצלחה כדי להגיע ל־Expert".

#### Trend Chart - גרף התקדמות

- גרף שמראה את מגמת הציונים ב־5 השיעורים האחרונים.
- מטרתו לעזור לסטודנט לראות אם הוא משתפר.

#### Skills Radar - רדאר מיומנויות

- שימוש בשדה `skillsRadar`.
- מומלץ להציג זאת כרשימת נקודות לשיפור שה־AI מייצר.
- לדוגמה:
  - "עליך להתמקד בזמני עבר".
  - "אוצר המילים הטכני שלך מצוין".

#### Vocabulary Mastery - מילים שלמדת

- מדד שמראה כמה מילים חדשות מתוך טבלת `Vocabulary` כבר "נכבשו".
- כלומר, בכמה מילים הסטודנט השתמש בהצלחה בשיחות.

### 15.3 ערך מוסף מומלץ - השיעור הבא

כדאי להוסיף רכיב של "השיעור המומלץ הבא".

מכיוון שיש לסטודנט `learning_goal`, למשל ראיונות עבודה, המערכת יכולה להציג בדף ההתקדמות:

> על סמך המטרה שלך, אנחנו ממליצים על השיעור: `The Technical Interview`.

זה נותן תחושה של מסלול למידה מותאם אישית.

---

## 16. Notes for Copilot Implementation

כדי ש־Copilot יבין טוב יותר את הכוונה, מומלץ לשמור על שמות באנגלית בקוד ובקבצי הנתונים, גם אם ההסברים במסמך הם בעברית.

### Suggested folders

```text
project/
  server.js
  routes/
  controllers/
  models/
  middleware/
  docs/
```

### Suggested model responsibility

תיקיית `models/` תשמש כשכבת DAO-like:

- הקונטרולרים לא ייגשו ישירות לקבצי JSON.
- הקונטרולרים יקראו לפונקציות מתוך קבצי model.
- כרגע ה־models יקראו ויעדכנו mock JSON / מערכים בזיכרון.
- בעתיד יהיה אפשר להחליף את המימוש למסד נתונים רלציוני בלי לשנות את הקונטרולרים.

