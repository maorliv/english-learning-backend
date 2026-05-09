# API Reference

Base URL: `http://localhost:3000`

App root: `/`

Protected endpoints use mock headers:

- `x-user-role: student | teacher | admin`
- `x-user-id: <numeric id>` when ownership checks are required
- `Content-Type: application/json` for POST, PUT, and PATCH requests

## Common Response Shapes

Success envelope:

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

Error envelope:

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

## Health

### GET /

- Access: public
- Query params: none
- Request body: none
- Example success (`200 OK`):

```json
{
  "success": true,
  "data": {
    "message": "Server is running",
    "timestamp": "2026-05-09T12:00:00.000Z"
  },
  "error": null
}
```

- Example error (`500 Internal Server Error`):

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Unexpected server error",
    "details": {}
  }
}
```

## Users

### POST /api/users/register

- Access: public
- Query params: none
- Request body:

```json
{
  "firstName": "Lior",
  "lastName": "Katz",
  "email": "lior.katz@example.com",
  "password": "1234",
  "userRole": "student",
  "sex": "male"
}
```

- Example success (`201 Created`):

```json
{
  "success": true,
  "data": {
    "userId": 9,
    "firstName": "Lior",
    "lastName": "Katz",
    "userRole": "student"
  },
  "error": null
}
```

- Example error (`409 Conflict`):

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "EMAIL_ALREADY_EXISTS",
    "message": "Email already exists",
    "details": {
      "email": "dana.levi@example.com"
    }
  }
}
```

### POST /api/users/login

- Access: public
- Query params: none
- Request body:

```json
{
  "email": "dana.levi@example.com",
  "password": "1234"
}
```

- Example success (`200 OK`):

```json
{
  "success": true,
  "data": {
    "userId": 1,
    "userRole": "student",
    "token": "mock-token-user-1"
  },
  "error": null
}
```

- Example error (`401 Unauthorized`):

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password",
    "details": {
      "email": "wrong@example.com"
    }
  }
}
```

### GET /api/users

- Access: admin
- Query params: none
- Request body: none
- Example success (`200 OK`):

```json
{
  "success": true,
  "data": [
    {
      "userID": 1,
      "firstName": "Dana",
      "lastName": "Levi",
      "email": "dana.levi@example.com",
      "role": "student"
    }
  ],
  "error": null
}
```

- Example error (`403 Forbidden`):

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to perform this action.",
    "details": {
      "allowedRoles": ["admin"]
    }
  }
}
```

### GET /api/users/:id

- Access: admin, or self when `x-user-id` matches `:id`
- Query params: none
- Request body: none
- Example success (`200 OK`):

```json
{
  "success": true,
  "data": {
    "userID": 1,
    "firstName": "Dana",
    "lastName": "Levi",
    "email": "dana.levi@example.com",
    "role": "student",
    "sex": "female"
  },
  "error": null
}
```

- Example error (`404 Not Found`):

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User not found",
    "details": {
      "userID": 999
    }
  }
}
```

### PUT /api/users/:id

- Access: admin, or self when `x-user-id` matches `:id`
- Query params: none
- Request body:

```json
{
  "firstName": "Dana",
  "lastName": "Levi",
  "userRole": "student"
}
```

- Example success (`200 OK`):

```json
{
  "success": true,
  "data": {
    "userId": 1
  },
  "error": null
}
```

- Example error (`400 Bad Request`):

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Missing required fields",
    "details": {
      "missingFields": ["userRole"]
    }
  }
}
```

### DELETE /api/users/:id

- Access: admin
- Query params: none
- Request body: none
- Example success (`200 OK`):

```json
{
  "success": true,
  "data": {
    "userId": 1
  },
  "error": null
}
```

- Example error (`404 Not Found`):

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User not found",
    "details": {
      "userID": 999
    }
  }
}
```

## Teachers

### GET /api/teachers

- Access: student, admin
- Query params:
  - `available=true|false`
  - `maxPrice=<number>`
- Request body: none
- Example success (`200 OK`):

```json
{
  "success": true,
  "data": [
    {
      "teacherId": 1,
      "firstName": "Yael",
      "lastName": "Levi",
      "rank": 4,
      "pricePerWeek": 80,
      "available": true,
      "experience": "5 years in Tech English",
      "specialties": ["Grammar", "Tech English"]
    }
  ],
  "error": null
}
```

- Example error (`400 Bad Request`):

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid maxPrice filter",
    "details": {
      "maxPrice": "cheap",
      "expected": "number"
    }
  }
}
```

### GET /api/teachers/my-reviews

- Access: teacher,  when x-user-id matches
- Query params: none
- Request body: none
- Example success (`200 OK`):

```json
{
  "success": true,
  "data": {
    "avgRating": 4,
    "reviews": [
      {
        "studentId": 7,
        "rating": 4,
        "feedback": "Very clear explanations and useful weekly feedback."
      }
    ]
  },
  "error": null
}
```

- Example error (`400 Bad Request`):

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid x-user-id",
    "details": {
      "field": "x-user-id"
    }
  }
}
```

### GET /api/teachers/:id

- Access: student, admin, or self when owner mapping allows it
- Query params: none
- Request body: none
- Example success (`200 OK`):

```json
{
  "success": true,
  "data": {
    "teacherId": 1,
    "firstName": "Yael",
    "lastName": "Levi",
    "rank": 4,
    "pricePerWeek": 80,
    "available": true,
    "experience": "5 years in Tech English",
    "feedback": "weekly",
    "specialties": ["Grammar", "Tech English"]
  },
  "error": null
}
```

- Example error (`404 Not Found`):

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "TEACHER_NOT_FOUND",
    "message": "Teacher not found",
    "details": {
      "teacherId": 999
    }
  }
}
```

### PUT /api/teachers/:id

- Access: admin, or self when owner mapping allows it
- Query params: none
- Request body:

```json
{
  "experience": "6 years in Tech English",
  "pricePerWeek": 95,
  "specialties": ["Grammar", "Interview Prep"],
  "available": true,
  "feedback": "weekly"
}
```

- Example success (`200 OK`):

```json
{
  "success": true,
  "data": {
    "teacherId": 1
  },
  "error": null
}
```

- Example error (`400 Bad Request`):

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Missing required fields",
    "details": {
      "missingFields": ["feedback"]
    }
  }
}
```

## Lessons

### GET /api/lessons

- Access: student, admin
- Query params:
  - `level=<string>`
- Request body: none
- Example success (`200 OK`):

```json
{
  "success": true,
  "data": [
    {
      "lessonId": 101,
      "vocabularyId": 301,
      "title": "The Technical Interview",
      "scene": "You are applying for an IT position.",
      "aiRole": "Technical Team Lead",
      "grammarRuleId": "present_simple",
      "level": "Intermediate",
      "locked": false
    }
  ],
  "error": null
}
```

- Example error (`403 Forbidden`):

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to perform this action.",
    "details": {
      "allowedRoles": ["student", "admin"]
    }
  }
}
```

### POST /api/lessons

- Access: admin
- Query params: none
- Request body:

```json
{
  "title": "Bug Triage Meeting",
  "scene": "You explain a production bug to your team.",
  "aiRole": "Engineering Manager",
  "level": "Intermediate",
  "grammarRuleId": "present_continuous",
  "vocabularyId": 304
}
```

- Example success (`201 Created`):

```json
{
  "success": true,
  "data": {
    "lessonId": 104,
    "vocabularyId": 304,
    "title": "Bug Triage Meeting",
    "scene": "You explain a production bug to your team.",
    "aiRole": "Engineering Manager",
    "grammarRuleId": "present_continuous",
    "level": "Intermediate"
  },
  "error": null
}
```

- Example error (`400 Bad Request`):

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Missing required fields",
    "details": {
      "missingFields": ["level"]
    }
  }
}
```

### GET /api/lessons/:id

- Access: student, admin
- Query params: none
- Request body: none
- Example success (`200 OK`):

```json
{
  "success": true,
  "data": {
    "lessonId": 101,
    "vocabularyId": 301,
    "title": "The Technical Interview",
    "scene": "You are applying for an IT position. Brian, the team leader, is asking about your routine.",
    "aiRole": "Technical Team Lead",
    "grammarRuleId": "present_simple",
    "level": "Intermediate"
  },
  "error": null
}
```

- Example error (`404 Not Found`):

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "LESSON_NOT_FOUND",
    "message": "Lesson not found",
    "details": {
      "lessonId": 999
    }
  }
}
```

### PUT /api/lessons/:id

- Access: admin
- Query params: none
- Request body:

```json
{
  "title": "The Technical Interview",
  "scene": "Updated lesson scene",
  "aiRole": "Technical Team Lead",
  "level": "Intermediate",
  "grammarRuleId": "present_simple",
  "vocabularyId": 301
}
```

- Example success (`200 OK`):

```json
{
  "success": true,
  "data": {
    "lessonId": 101
  },
  "error": null
}
```

- Example error (`404 Not Found`):

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "LESSON_NOT_FOUND",
    "message": "Lesson not found",
    "details": {
      "lessonId": 999
    }
  }
}
```

### DELETE /api/lessons/:id

- Access: admin
- Query params: none
- Request body: none
- Example success (`200 OK`):

```json
{
  "success": true,
  "data": {
    "lessonId": 101
  },
  "error": null
}
```

- Example error (`404 Not Found`):

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "LESSON_NOT_FOUND",
    "message": "Lesson not found",
    "details": {
      "lessonId": 999
    }
  }
}
```

### GET /api/lessons/:id/grammar

- Access: student, admin
- Query params: none
- Request body: none
- Example success (`200 OK`):

```json
{
  "success": true,
  "data": {
    "grammarRuleId": "present_simple",
    "category": "Tenses",
    "usage": "Used for routines and facts.",
    "forms": {
      "general_formula": "Subject + Verb",
      "positive": "Subject + base verb (add -s/-es for he/she/it)",
      "negative": "Subject + do/does not + base verb",
      "question": "Do/Does + Subject + base verb?"
    },
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
    ]
  },
  "error": null
}
```

- Example error (`404 Not Found`):

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "GRAMMAR_RULE_NOT_FOUND",
    "message": "Grammar rule not found",
    "details": {
      "grammarRuleId": "unknown_rule"
    }
  }
}
```

### GET /api/lessons/:id/grammar-warmup

- Access: student
- Query params:
  - `difficulty=<string>`
- Request body: none
- Example success (`200 OK`):

```json
{
  "success": true,
  "data": [
    {
      "exerciseId": 300,
      "type": "multiple_choice",
      "instruction": "Choose the correct answer",
      "content": "How often ____ you update the server?",
      "options": ["do", "does", "is", "are"],
      "difficulty": "INTERMEDIATE"
    }
  ],
  "error": null
}
```

- Example error (`404 Not Found`):

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "WARMUP_GRAMMAR_NOT_FOUND",
    "message": "Warm-up grammar exercises not found for lesson",
    "details": {
      "lessonId": 101,
      "difficulty": "impossible"
    }
  }
}
```

### GET /api/lessons/:id/vocab-warmup

- Access: student, admin
- Query params: none
- Request body: none
- Example success (`200 OK`):

```json
{
  "success": true,
  "data": {
    "completeSentence": [
      {
        "vocabularyId": 301,
        "completeSentence": "I ________ the servers every day.",
        "word": "Maintain"
      }
    ],
    "matching": [
      {
        "word": "Maintain",
        "definition": "to keep something working or in good condition"
      }
    ]
  },
  "error": null
}
```

- Example error (`404 Not Found`):

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "LESSON_NOT_FOUND",
    "message": "Lesson not found",
    "details": {
      "lessonId": 999
    }
  }
}
```

### GET /api/lessons/:id/vocab

- Access: student, admin
- Query params: none
- Request body: none
- Example success (`200 OK`):

```json
{
  "success": true,
  "data": [
    {
      "vocabularyId": 301,
      "word": "Maintain",
      "translation": "לתחזק",
      "example": "I maintain the servers every day.",
      "definition": "to keep something working or in good condition",
      "completeSentence": "I ________ the servers every day."
    }
  ],
  "error": null
}
```

- Example error (`404 Not Found`):

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "LESSON_NOT_FOUND",
    "message": "Lesson not found",
    "details": {
      "lessonId": 999
    }
  }
}
```

### POST /api/lessons/:id/vocab

- Access: admin
- Query params: none
- Request body:

```json
{
  "word": "Escalate",
  "translation": "להסלים / להעביר לטיפול",
  "example": "We escalate the issue to the platform team.",
  "definition": "to pass a problem to a higher level of support",
  "completeSentence": "We ________ the issue to the platform team."
}
```

- Example success (`201 Created`):

```json
{
  "success": true,
  "data": {
    "vocabularyId": 305
  },
  "error": null
}
```

- Example error (`400 Bad Request`):

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Missing required fields",
    "details": {
      "missingFields": ["definition"]
    }
  }
}
```

### GET /api/lessons/:id/vocab/:vocabId

- Access: student, admin
- Query params: none
- Request body: none
- Example success (`200 OK`):

```json
{
  "success": true,
  "data": {
    "vocabularyId": 301,
    "word": "Maintain",
    "translation": "לתחזק",
    "example": "I maintain the servers every day.",
    "definition": "to keep something working or in good condition"
  },
  "error": null
}
```

- Example error (`404 Not Found`):

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VOCABULARY_NOT_FOUND",
    "message": "Vocabulary item not found",
    "details": {
      "lessonId": 101,
      "vocabId": 999
    }
  }
}
```

### PUT /api/lessons/:id/vocab/:vocabId

- Access: admin
- Query params: none
- Request body:

```json
{
  "word": "Maintain",
  "translation": "לתחזק",
  "example": "I maintain servers for the whole company.",
  "definition": "to keep something working well",
  "completeSentence": "I ________ servers for the whole company."
}
```

- Example success (`200 OK`):

```json
{
  "success": true,
  "data": {
    "vocabularyId": 301
  },
  "error": null
}
```

- Example error (`404 Not Found`):

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VOCABULARY_NOT_FOUND",
    "message": "Vocabulary item not found",
    "details": {
      "lessonId": 101,
      "vocabId": 999
    }
  }
}
```

### DELETE /api/lessons/:id/vocab/:vocabId

- Access: admin
- Query params: none
- Request body: none
- Example success (`200 OK`):

```json
{
  "success": true,
  "data": {
    "vocabularyId": 301
  },
  "error": null
}
```

- Example error (`404 Not Found`):

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VOCABULARY_NOT_FOUND",
    "message": "Vocabulary item not found",
    "details": {
      "lessonId": 101,
      "vocabId": 999
    }
  }
}
```

## Grammar Rules

### GET /api/grammar-rules

- Access: student, admin
- Query params:
  - `category=<string>`
- Request body: none
- Example success (`200 OK`):

```json
{
  "success": true,
  "data": [
    {
      "id": "present_simple",
      "category": "Tenses",
      "usage": "To talk about regular actions, facts, and general truths."
    }
  ],
  "error": null
}
```

- Example error (`403 Forbidden`):

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to perform this action.",
    "details": {
      "allowedRoles": ["student", "admin"]
    }
  }
}
```

### POST /api/grammar-rules

- Access: admin
- Query params: none
- Request body:

```json
{
  "id": "future_simple",
  "category": "Tenses",
  "usage": "Used for predictions and future decisions.",
  "forms": {
    "general_formula": "Subject + will + base verb",
    "positive": "Subject + will + base verb",
    "negative": "Subject + will not + base verb",
    "question": "Will + subject + base verb?"
  },
  "spellingRules": "No verb change after will.",
  "examples": [
    {
      "text": "I will deploy tomorrow.",
      "type": "positive"
    }
  ],
  "keywords": ["tomorrow", "next week"]
}
```

- Example success (`201 Created`):

```json
{
  "success": true,
  "data": {
    "grammarRuleId": "future_simple"
  },
  "error": null
}
```

- Example error (`400 Bad Request`):

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Missing required fields",
    "details": {
      "missingFields": ["keywords"]
    }
  }
}
```

### GET /api/grammar-rules/:id

- Access: student, admin
- Query params: none
- Request body: none
- Example success (`200 OK`):

```json
{
  "success": true,
  "data": {
    "id": "present_simple",
    "category": "Tenses",
    "usage": "To talk about regular actions, facts, and general truths.",
    "forms": {
      "general_formula": "Subject + Verb",
      "positive": "Subject + base verb (add -s/-es for he/she/it)",
      "negative": "Subject + do/does not + base verb",
      "question": "Do/Does + Subject + base verb?"
    },
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
    "keywords": ["always", "usually", "every day", "regularly"]
  },
  "error": null
}
```

- Example error (`404 Not Found`):

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "GRAMMAR_RULE_NOT_FOUND",
    "message": "Grammar rule not found",
    "details": {
      "id": "unknown_rule"
    }
  }
}
```

### PUT /api/grammar-rules/:id

- Access: admin
- Query params: none
- Request body:

```json
{
  "category": "Tenses",
  "usage": "To talk about regular actions, facts, and general truths.",
  "forms": {
    "general_formula": "Subject + Verb",
    "positive": "Subject + base verb (add -s/-es for he/she/it)",
    "negative": "Subject + do/does not + base verb",
    "question": "Do/Does + Subject + base verb?"
  },
  "spellingRules": "Verbs ending in -o, -sh, -ch add -es.",
  "examples": [
    {
      "text": "The server runs on Linux.",
      "type": "positive"
    }
  ],
  "keywords": ["always", "usually", "every day", "regularly"]
}
```

- Example success (`200 OK`):

```json
{
  "success": true,
  "data": {
    "grammarRuleId": "present_simple"
  },
  "error": null
}
```

- Example error (`404 Not Found`):

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "GRAMMAR_RULE_NOT_FOUND",
    "message": "Grammar rule not found",
    "details": {
      "id": "unknown_rule"
    }
  }
}
```

### DELETE /api/grammar-rules/:id

- Access: admin
- Query params: none
- Request body: none
- Example success (`200 OK`):

```json
{
  "success": true,
  "data": {
    "grammarRuleId": "present_simple"
  },
  "error": null
}
```

- Example error (`404 Not Found`):

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "GRAMMAR_RULE_NOT_FOUND",
    "message": "Grammar rule not found",
    "details": {
      "id": "unknown_rule"
    }
  }
}
```

## Warm-Up Grammar

### GET /api/warm-up-grammar

- Access: admin
- Query params: none
- Request body: none
- Example success (`200 OK`):

```json
{
  "success": true,
  "data": [
    {
      "exerciseId": 300,
      "grammarRuleId": "present_simple",
      "lessonId": 101,
      "type": "multiple_choice",
      "instruction": "Choose the correct answer",
      "difficulty": "INTERMEDIATE"
    }
  ],
  "error": null
}
```

- Example error (`403 Forbidden`):

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to perform this action.",
    "details": {
      "allowedRoles": ["admin"]
    }
  }
}
```

### GET /api/warm-up-grammar/:id

- Access: admin
- Query params: none
- Request body: none
- Example success (`200 OK`):

```json
{
  "success": true,
  "data": {
    "exerciseId": 300,
    "grammarRuleId": "present_simple",
    "lessonId": 101,
    "type": "multiple_choice",
    "instruction": "Choose the correct answer",
    "content": "How often ____ you update the server?",
    "options": ["do", "does", "is", "are"],
    "correctAnswer": "do",
    "difficulty": "INTERMEDIATE"
  },
  "error": null
}
```

- Example error (`404 Not Found`):

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "WARMUP_GRAMMAR_NOT_FOUND",
    "message": "Warm-up grammar exercise not found",
    "details": {
      "exerciseId": 999
    }
  }
}
```

### POST /api/warm-up-grammar

- Access: admin
- Query params: none
- Request body:

```json
{
  "grammarRuleId": "present_simple",
  "lessonId": 101,
  "type": "multiple_choice",
  "instruction": "Choose the correct answer",
  "content": "He ___ in a startup.",
  "options": ["work", "works"],
  "correctAnswer": "works",
  "difficulty": "INTERMEDIATE"
}
```

- Example success (`201 Created`):

```json
{
  "success": true,
  "data": {
    "exerciseId": 303
  },
  "error": null
}
```

- Example error (`400 Bad Request`):

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Missing required fields",
    "details": {
      "missingFields": ["correctAnswer"]
    }
  }
}
```

### PUT /api/warm-up-grammar/:id

- Access: admin
- Query params: none
- Request body:

```json
{
  "type": "multiple_choice",
  "instruction": "Choose the correct answer.",
  "content": "They ___ meetings every Monday.",
  "options": ["has", "have"],
  "correctAnswer": "have",
  "difficulty": "INTERMEDIATE"
}
```

- Example success (`200 OK`):

```json
{
  "success": true,
  "data": {
    "exerciseId": 300
  },
  "error": null
}
```

- Example error (`404 Not Found`):

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "WARMUP_GRAMMAR_NOT_FOUND",
    "message": "Warm-up grammar exercise not found",
    "details": {
      "exerciseId": 999
    }
  }
}
```

### DELETE /api/warm-up-grammar/:id

- Access: admin
- Query params: none
- Request body: none
- Example success (`200 OK`):

```json
{
  "success": true,
  "data": {
    "exerciseId": 300
  },
  "error": null
}
```

- Example error (`404 Not Found`):

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "WARMUP_GRAMMAR_NOT_FOUND",
    "message": "Warm-up grammar exercise not found",
    "details": {
      "exerciseId": 999
    }
  }
}
```

## Matching

### POST /api/matching/preferences

- Access: student
- Query params: none
- Request body:

```json
{
  "budget_max": 100,
  "learning_goal": "tech english interview grammar",
  "onboarding_text": "I want help speaking more clearly in technical interviews.",
  "currentLevel": "Intermediate"
}
```

- Example success (`201 Created`):

```json
{
  "success": true,
  "data": [
    {
      "teacherId": 1,
      "firstName": "Yael",
      "matchScore": 44,
      "rank": 4,
      "pricePerWeek": 80,
      "specialties": ["Grammar", "Tech English"]
    }
  ],
  "error": null
}
```

- Example error (`400 Bad Request`):

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Missing required fields",
    "details": {
      "missingFields": ["currentLevel"]
    }
  }
}
```

### GET /api/matching/recommendations

- Access: student
- Query params: none
- Request body: none
- Example success (`200 OK`):

```json
{
  "success": true,
  "data": [
    {
      "teacherId": 1,
      "firstName": "Yael",
      "matchScore": 44,
      "rank": 4,
      "pricePerWeek": 80,
      "specialties": ["Grammar", "Tech English"]
    }
  ],
  "error": null
}
```

- Example error (`404 Not Found`):

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "PREFERENCES_NOT_FOUND",
    "message": "Student preferences not found",
    "details": {
      "userId": 1
    }
  }
}
```

## Progress

### GET /api/progress/stats

- Access: student
- Query params: none
- Request body: none
- Example success (`200 OK`):

```json
{
  "success": true,
  "data": {
    "currentLevel": "Intermediate",
    "completedLessonsCount": 6,
    "successedLessonsCount": 5,
    "overallAverage": 84,
    "lastActivityDate": "2026-05-09T10:30:00.000Z"
  },
  "error": null
}
```

- Example error (`404 Not Found`):

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "PROGRESS_NOT_FOUND",
    "message": "Progress not found for this student",
    "details": {
      "studentId": 999
    }
  }
}
```

### GET /api/progress/chart

- Access: student
- Query params: none
- Request body: none
- Example success (`200 OK`):

```json
{
  "success": true,
  "data": [
    {
      "conversationId": 1,
      "lessonTitle": "The Technical Interview",
      "aiScore": 80,
      "teacherScore": 88,
      "date": "2026-05-09T09:05:00.000Z"
    }
  ],
  "error": null
}
```

- Example error (`400 Bad Request`):

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid x-user-id",
    "details": {
      "field": "x-user-id"
    }
  }
}
```

### GET /api/progress/skills

- Access: student
- Query params: none
- Request body: none
- Example success (`200 OK`):

```json
{
  "success": true,
  "data": {
    "skillsRadar": "Practice more present simple and technical vocabulary."
  },
  "error": null
}
```

- Example error (`404 Not Found`):

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "PROGRESS_NOT_FOUND",
    "message": "Progress not found for this student",
    "details": {
      "studentId": 999
    }
  }
}
```

### GET /api/progress/next-lesson

- Access: student
- Query params: none
- Request body: none
- Example success (`200 OK`):

```json
{
  "success": true,
  "data": {
    "lessonId": 101,
    "title": "The Technical Interview",
    "reason": "Recommended for your Intermediate level and learning goal: tech english interview grammar."
  },
  "error": null
}
```

- Example error (`404 Not Found`):

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "PREFERENCES_NOT_FOUND",
    "message": "Student preferences not found",
    "details": {
      "studentId": 1
    }
  }
}
```

### GET /api/progress/:studentId

- Access: teacher, admin
- Query params: none
- Request body: none
- Example success (`200 OK`):

```json
{
  "success": true,
  "data": {
    "currentLevel": "Intermediate",
    "completedLessonsCount": 6,
    "successedLessonsCount": 5,
    "overallAverage": 84,
    "skillsRadar": "Practice more present simple and technical vocabulary."
  },
  "error": null
}
```

- Example error (`404 Not Found`):

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "PROGRESS_NOT_FOUND",
    "message": "Progress not found for this student",
    "details": {
      "studentId": 999
    }
  }
}
```

## Relations

### GET /api/relations

- Access: admin
- Query params:
  - `status=pending|active|rejected`
- Request body: none
- Example success (`200 OK`):

```json
{
  "success": true,
  "data": [
    {
      "relationId": 1,
      "teacherId": 2,
      "studentId": 5,
      "status": "pending",
      "createdAt": "2026-05-09T10:00:00.000Z"
    }
  ],
  "error": null
}
```

- Example error (`400 Bad Request`):

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid status filter",
    "details": {
      "status": "done",
      "allowedValues": ["pending", "active", "rejected"]
    }
  }
}
```

### GET /api/relations/my-students

- Access: teacher
- Query params: none
- Request body: none
- Example success (`200 OK`):

```json
{
  "success": true,
  "data": [
    {
      "studentId": 7,
      "firstName": "Lior",
      "lastName": "Azran",
      "currentLevel": null,
      "lastActivityDate": null
    }
  ],
  "error": null
}
```

- Example error (`400 Bad Request`):

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid x-user-id",
    "details": {
      "field": "x-user-id"
    }
  }
}
```

### GET /api/relations/pending

- Access: teacher
- Query params: none
- Request body: none
- Example success (`200 OK`):

```json
{
  "success": true,
  "data": [
    {
      "relationId": 1,
      "studentId": 5,
      "firstName": "Eitan",
      "lastName": "Sharon",
      "createdAt": "2026-05-09T10:00:00.000Z"
    }
  ],
  "error": null
}
```

- Example error (`403 Forbidden`):

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to perform this action.",
    "details": {
      "allowedRoles": ["teacher"]
    }
  }
}
```

### POST /api/relations/request

- Access: student
- Query params: none
- Request body:

```json
{
  "teacherId": 2
}
```

- Example success (`201 Created`):

```json
{
  "success": true,
  "data": {
    "relationId": 4,
    "status": "pending"
  },
  "error": null
}
```

- Example error (`409 Conflict`):

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "RELATION_ALREADY_EXISTS",
    "message": "Relation already exists between this student and teacher",
    "details": {
      "relationId": 1,
      "teacherId": 2,
      "studentId": 5
    }
  }
}
```

### PATCH /api/relations/:id/status

- Access: teacher
- Query params: none
- Request body:

```json
{
  "status": "active"
}
```

- Example success (`200 OK`):

```json
{
  "success": true,
  "data": {
    "relationId": 1,
    "status": "active"
  },
  "error": null
}
```

- Example error (`400 Bad Request`):

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid status value",
    "details": {
      "field": "status",
      "allowedValues": ["active", "rejected"],
      "receivedValue": "accepted"
    }
  }
}
```

### POST /api/relations/my-teacher/review

- Access: student
- Query params: none
- Request body:

```json
{
  "rating": 5,
  "student_feedback": "Helpful explanations and clear weekly goals."
}
```

- Example success (`200 OK`):

```json
{
  "success": true,
  "data": {
    "relationId": 2
  },
  "error": null
}
```

- Example error (`404 Not Found`):

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "RELATION_NOT_FOUND",
    "message": "Active relation not found for this student",
    "details": {
      "studentId": 1
    }
  }
}
```

## Conversations

### GET /api/conversations

- Access: admin, teacher
- Query params:
  - `status=active|completed`
  - `studentId=<number>`
  - `lessonId=<number>`
- Request body: none
- Example success (`200 OK`):

```json
{
  "success": true,
  "data": [
    {
      "conversationId": 1,
      "studentId": 1,
      "lessonId": 101,
      "status": "completed",
      "aiScore": 80,
      "isReviewedByTeacher": true
    }
  ],
  "error": null
}
```

- Example error (`400 Bad Request`):

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid status filter",
    "details": {
      "status": "done",
      "allowedValues": ["active", "completed"]
    }
  }
}
```

### GET /api/conversations/:id

- Access: student, teacher, admin
- Query params: none
- Request body: none
- Example success (`200 OK`):

```json
{
  "success": true,
  "data": {
    "conversationId": 1,
    "messages": [
      {
        "role": "student",
        "content": "Hello, I maintain the servers and deploy updates every Friday.",
        "createdAt": "2026-05-09T09:00:00.000Z"
      }
    ],
    "aiScore": 80,
    "teacherScore": 88,
    "teacherComment": "Good fluency and strong use of lesson vocabulary.",
    "status": "completed"
  },
  "error": null
}
```

- Example error (`404 Not Found`):

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "CONVERSATION_NOT_FOUND",
    "message": "Conversation not found",
    "details": {
      "conversationId": 999
    }
  }
}
```

### POST /api/conversations/start

- Access: student
- Query params: none
- Request body:

```json
{
  "lessonId": 101
}
```

- Example success (`201 Created`):

```json
{
  "success": true,
  "data": {
    "conversationId": 4,
    "messages": [],
    "unusedVocab": ["Maintain", "Deploy"]
  },
  "error": null
}
```

- Example error (`404 Not Found`):

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "LESSON_NOT_FOUND",
    "message": "Lesson not found",
    "details": {
      "lessonId": 999
    }
  }
}
```

### POST /api/conversations/:id/message

- Access: student
- Query params: none
- Request body:

```json
{
  "content": "I maintain the servers and deploy updates every Friday."
}
```

- Example success (`200 OK`):

```json
{
  "success": true,
  "data": {
    "reply": "Mock AI reply: I understood your message about lesson 101.",
    "unusedVocab": [],
    "usedWords": ["Maintain", "Deploy"]
  },
  "error": null
}
```

- Example error (`404 Not Found`):

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "CONVERSATION_NOT_FOUND",
    "message": "Conversation not found",
    "details": {
      "conversationId": 999
    }
  }
}
```

### POST /api/conversations/:id/end

- Access: student
- Query params: none
- Request body: none
- Example success (`200 OK`):

```json
{
  "success": true,
  "data": {
    "conversationId": 4,
    "aiScore": 80,
    "aiFeedback": "Good job using lesson vocabulary in the conversation."
  },
  "error": null
}
```

- Example error (`404 Not Found`):

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "CONVERSATION_NOT_FOUND",
    "message": "Conversation not found",
    "details": {
      "conversationId": 999
    }
  }
}
```

### POST /api/conversations/:id/teacher-comment

- Access: teacher
- Query params: none
- Request body:

```json
{
  "teacherScore": 88,
  "teacherComment": "Good fluency and strong use of lesson vocabulary."
}
```

- Example success (`200 OK`):

```json
{
  "success": true,
  "data": {
    "conversationId": 1
  },
  "error": null
}
```

- Example error (`400 Bad Request`):

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Missing required fields",
    "details": {
      "missingFields": ["teacherComment"]
    }
  }
}
```

### POST /api/conversations/:id/reply

- Access: student, teacher
- Query params: none
- Request body:

```json
{
  "role": "teacher",
  "content": "Please add one more example using the word deploy."
}
```

- Example success (`200 OK`):

```json
{
  "success": true,
  "data": {
    "conversationId": 1,
    "reply": {
      "role": "teacher",
      "content": "Please add one more example using the word deploy.",
      "createdAt": "2026-05-09T12:05:00.000Z"
    }
  },
  "error": null
}
```

- Example error (`400 Bad Request`):

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid role value",
    "details": {
      "field": "role",
      "allowedValues": ["student", "teacher"],
      "receivedValue": "admin"
    }
  }
}
```

## Students

### GET /api/students/:studentId/conversations

- Access: teacher, admin
- Query params: none
- Request body: none
- Example success (`200 OK`):

```json
{
  "success": true,
  "data": [
    {
      "conversationId": 2,
      "lessonId": 102,
      "lessonTitle": "Daily Standup Meeting",
      "status": "active",
      "aiScore": null,
      "teacherScore": null,
      "isReviewedByTeacher": false,
      "createdAt": "2026-05-09T10:28:00.000Z"
    }
  ],
  "error": null
}
```

- Example error (`403 Forbidden`):

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to view conversations for this student.",
    "details": {
      "teacherId": 2,
      "studentId": 999
    }
  }
}
```