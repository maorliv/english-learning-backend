const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const dataDir = path.join(__dirname, '..', 'models', 'data');

function load(filename) {
  return JSON.parse(fs.readFileSync(path.join(dataDir, filename), 'utf8'));
}

async function main() {
  console.log('Seeding database...\n');

  // ── 1. Users ──
  const users = load('users.json');
  await prisma.user.createMany({
    data: users.map(u => ({
      userID: u.userID,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      password: u.password,
      role: u.role,
      sex: u.sex || '',
      createDate: new Date(u.createDate),
    })),
  });
  console.log(`✓ Users: ${users.length} rows`);

  // ── 2. Teachers (depends on users) ──
  const teachers = load('teachers.json');
  await prisma.teacher.createMany({
    data: teachers.map(t => ({
      teacherId: t.teacherId,
      userID: t.userID,
      rank: t.rank,
      pricePerWeek: t.pricePerWeek,
      specialties: t.specialties,
      feedbackFrequency: t.feedbackFrequency,
      available: t.available,
      experience: t.experience,
      onlineOnly: t.onlineOnly,
      bio: t.bio,
      teachingLevels: t.teachingLevels,
      availability: t.availability,
      createdAt: new Date(t.createdAt),
      updateDate: new Date(t.updateDate),
    })),
  });
  console.log(`✓ Teachers: ${teachers.length} rows`);

  // ── 3. Grammar Rules (no dependencies) ──
  const grammarRules = load('grammarRules.json');
  await prisma.grammarRule.createMany({
    data: grammarRules.map(g => ({
      id: g.id,
      category: g.category,
      usage: g.usage,
      forms: g.forms,
      keywords: g.keywords,
      spellingRules: g.spellingRules || null,
      examples: g.examples,
    })),
  });
  console.log(`✓ Grammar Rules: ${grammarRules.length} rows`);

  // ── 4. Lessons (depends on grammar_rules) ──
  const lessons = load('lessons.json');
  await prisma.lesson.createMany({
    data: lessons.map(l => ({
      lessonId: l.lessonId,
      title: l.title,
      scene: l.scene,
      aiRole: l.aiRole,
      level: l.level,
      grammarRuleId: l.grammarRuleId,
    })),
  });
  console.log(`✓ Lessons: ${lessons.length} rows`);

  // ── 5. Vocabulary (depends on lessons) ──
  const vocabulary = load('vocabulary.json');
  await prisma.vocabulary.createMany({
    data: vocabulary.map(v => ({
      vocabularyId: v.vocabularyId,
      lessonId: v.lessonId,
      word: v.word,
      translation: v.translation,
      example: v.example,
      definition: v.definition,
      completeSentence: v.completeSentence,
    })),
  });
  console.log(`✓ Vocabulary: ${vocabulary.length} rows`);

  // ── 6. Warm-up Exercises (depends on lessons + grammar_rules) ──
  const warmUp = load('warmUpGrammar.json');
  await prisma.warmUpExercise.createMany({
    data: warmUp.map(w => ({
      exerciseId: w.exerciseId,
      lessonId: w.lessonId,
      grammarRuleId: w.grammarRuleId,
      type: w.type,
      instruction: w.instruction,
      content: w.content,
      options: w.options,
      correctAnswer: w.correctAnswer,
      difficulty: w.difficulty,
    })),
  });
  console.log(`✓ Warm-up Exercises: ${warmUp.length} rows`);

  // ── 7. Settings (depends on users) ──
  const settings = load('settings.json');
  await prisma.settings.createMany({
    data: settings.map(s => ({
      userId: s.userId,
      displayName: s.displayName,
      email: s.email,
      theme: s.theme || 'light',
    })),
  });
  console.log(`✓ Settings: ${settings.length} rows`);

  // ── 8. Student Preferences (depends on users) ──
  const prefs = load('studentPreferences.json');
  await prisma.studentPreferences.createMany({
    data: prefs.map(p => ({
      userId: p.userId,
      budget_max: p.budget_max,
      learning_goal: p.learning_goal,
      onboarding_text: p.onboarding_text,
      currentLevel: p.currentLevel || null,
      availability: p.availability || null,
      teacherGender: p.teacherGender || null,
      mainGoal: p.mainGoal || null,
      onlineOnly: p.onlineOnly ?? null,
    })),
  });
  console.log(`✓ Student Preferences: ${prefs.length} rows`);

  // ── 9. Progress (depends on users) ──
  const progressData = load('progress.json');
  await prisma.progress.createMany({
    data: progressData.map(p => ({
      progressId: p.progressId,
      studentId: p.studentId,
      currentLevel: p.currentLevel || null,
      completedLessonsCount: p.completedLessonsCount,
      successedLessonsCount: p.successedLessonsCount,
      overallAverage: p.overallAverage,
      lastActivityDate: new Date(p.lastActivityDate),
    })),
  });
  console.log(`✓ Progress: ${progressData.length} rows`);

  // ── 10. Relations (depends on users + teachers) ──
  const relations = load('relations.json');
  await prisma.studentTeacherRelation.createMany({
    data: relations.map(r => ({
      relationId: r.relationId,
      studentId: r.studentId,
      teacherId: r.teacherId,
      status: r.status,
      createdAt: new Date(r.createdAt),
      rating: r.rating || null,
      student_feedback: r.student_feedback || null,
    })),
  });
  console.log(`✓ Relations: ${relations.length} rows`);

  // ── 11. Conversations + Messages + Reviews + Replies ──
  const conversations = load('conversations.json');
  let messageCount = 0;
  let reviewCount = 0;
  let replyCount = 0;

  for (const conv of conversations) {
    await prisma.conversation.create({
      data: {
        conversationId: conv.conversationId,
        studentId: conv.studentId,
        lessonId: conv.lessonId,
        status: conv.status,
        unusedVocab: conv.unusedVocab,
        usedWords: conv.usedWords,
        aiScore: conv.aiScore || null,
        aiFeedback: conv.aiFeedback || null,
        createdAt: new Date(conv.createdAt),
        endedAt: conv.endedAt ? new Date(conv.endedAt) : null,
      },
    });

    if (conv.messages && conv.messages.length > 0) {
      await prisma.conversationMessage.createMany({
        data: conv.messages.map(m => ({
          conversationId: conv.conversationId,
          role: m.role,
          content: m.content,
          createdAt: new Date(m.createdAt),
        })),
      });
      messageCount += conv.messages.length;
    }

    if (conv.teacherReviews && conv.teacherReviews.length > 0) {
      await prisma.teacherReview.createMany({
        data: conv.teacherReviews.map(r => ({
          conversationId: conv.conversationId,
          teacherId: r.teacherId,
          teacherScore: r.teacherScore,
          teacherComment: r.teacherComment,
          reviewedAt: new Date(r.reviewedAt),
        })),
      });
      reviewCount += conv.teacherReviews.length;
    }

    if (conv.commentsThread && conv.commentsThread.length > 0) {
      await prisma.conversationReply.createMany({
        data: conv.commentsThread.map(c => ({
          conversationId: conv.conversationId,
          role: c.role,
          content: c.content,
          createdAt: new Date(c.createdAt),
        })),
      });
      replyCount += conv.commentsThread.length;
    }
  }
  console.log(`✓ Conversations: ${conversations.length} rows`);
  console.log(`  ├─ Messages: ${messageCount} rows`);
  console.log(`  ├─ Reviews: ${reviewCount} rows`);
  console.log(`  └─ Replies: ${replyCount} rows`);

  // ── 12. Assessments (empty in current data) ──
  const assessments = load('assessments.json');
  if (assessments.length > 0) {
    for (const a of assessments) {
      await prisma.assessment.create({
        data: {
          assessmentId: a.assessmentId,
          studentId: a.studentId,
          status: a.status,
          detectedLevel: a.detectedLevel || null,
          createdAt: new Date(a.createdAt),
          endedAt: a.endedAt ? new Date(a.endedAt) : null,
        },
      });
      if (a.messages && a.messages.length > 0) {
        await prisma.assessmentMessage.createMany({
          data: a.messages.map(m => ({
            assessmentId: a.assessmentId,
            role: m.role,
            content: m.content,
            createdAt: new Date(m.createdAt),
          })),
        });
      }
    }
  }
  console.log(`✓ Assessments: ${assessments.length} rows`);

  // ── 13. Student Completed Lessons (from progress.completedLessonIds + completedAt) ──
  const completedRows = [];
  for (const p of progressData) {
    if (p.completedLessonIds && p.completedAt) {
      for (const lessonId of p.completedLessonIds) {
        const completedAt = p.completedAt[String(lessonId)];
        if (completedAt) {
          completedRows.push({
            studentId: p.studentId,
            lessonId: lessonId,
            completedAt: new Date(completedAt),
          });
        }
      }
    }
  }
  if (completedRows.length > 0) {
    await prisma.studentCompletedLesson.createMany({ data: completedRows });
  }
  console.log(`✓ Student Completed Lessons: ${completedRows.length} rows`);

  console.log('\n✅ Seeding complete!');
}

main()
  .catch(e => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
