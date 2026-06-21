-- CreateTable
CREATE TABLE `users` (
    `userID` INTEGER NOT NULL AUTO_INCREMENT,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('student', 'teacher', 'admin') NOT NULL,
    `sex` VARCHAR(191) NOT NULL DEFAULT '',
    `createDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`userID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `teachers` (
    `teacherId` INTEGER NOT NULL AUTO_INCREMENT,
    `userID` INTEGER NOT NULL,
    `rank` INTEGER NOT NULL DEFAULT 0,
    `pricePerWeek` INTEGER NULL,
    `specialties` JSON NOT NULL,
    `feedbackFrequency` VARCHAR(191) NULL,
    `available` BOOLEAN NOT NULL DEFAULT false,
    `experience` VARCHAR(191) NULL,
    `onlineOnly` BOOLEAN NULL,
    `bio` TEXT NULL,
    `teachingLevels` JSON NOT NULL,
    `availability` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateDate` DATETIME(3) NOT NULL,

    UNIQUE INDEX `teachers_userID_key`(`userID`),
    PRIMARY KEY (`teacherId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lessons` (
    `lessonId` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `scene` TEXT NOT NULL,
    `aiRole` VARCHAR(191) NOT NULL,
    `level` ENUM('Beginner', 'Intermediate', 'Advanced') NOT NULL,
    `grammarRuleId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`lessonId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vocabulary` (
    `vocabularyId` INTEGER NOT NULL AUTO_INCREMENT,
    `lessonId` INTEGER NOT NULL,
    `word` VARCHAR(191) NOT NULL,
    `translation` VARCHAR(191) NOT NULL,
    `example` TEXT NOT NULL,
    `definition` TEXT NOT NULL,
    `completeSentence` TEXT NOT NULL,

    PRIMARY KEY (`vocabularyId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `grammar_rules` (
    `id` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `usage` TEXT NOT NULL,
    `forms` JSON NOT NULL,
    `keywords` JSON NOT NULL,
    `spellingRules` TEXT NULL,
    `examples` JSON NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `warm_up_exercises` (
    `exerciseId` INTEGER NOT NULL AUTO_INCREMENT,
    `lessonId` INTEGER NOT NULL,
    `grammarRuleId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `instruction` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `options` JSON NOT NULL,
    `correctAnswer` VARCHAR(191) NOT NULL,
    `difficulty` ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED') NOT NULL,

    PRIMARY KEY (`exerciseId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `conversations` (
    `conversationId` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` INTEGER NOT NULL,
    `lessonId` INTEGER NOT NULL,
    `status` ENUM('active', 'completed') NOT NULL DEFAULT 'active',
    `unusedVocab` JSON NOT NULL,
    `usedWords` JSON NOT NULL,
    `aiScore` INTEGER NULL,
    `aiFeedback` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endedAt` DATETIME(3) NULL,

    PRIMARY KEY (`conversationId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `conversation_messages` (
    `messageId` INTEGER NOT NULL AUTO_INCREMENT,
    `conversationId` INTEGER NOT NULL,
    `role` ENUM('student', 'assistant') NOT NULL,
    `content` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`messageId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `teacher_reviews` (
    `reviewId` INTEGER NOT NULL AUTO_INCREMENT,
    `conversationId` INTEGER NOT NULL,
    `teacherId` INTEGER NOT NULL,
    `teacherScore` INTEGER NOT NULL,
    `teacherComment` TEXT NOT NULL,
    `reviewedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`reviewId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `conversation_replies` (
    `replyId` INTEGER NOT NULL AUTO_INCREMENT,
    `conversationId` INTEGER NOT NULL,
    `role` ENUM('student', 'teacher') NOT NULL,
    `content` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`replyId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `progress` (
    `progressId` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` INTEGER NOT NULL,
    `currentLevel` ENUM('Beginner', 'Intermediate', 'Advanced') NULL,
    `completedLessonsCount` INTEGER NOT NULL DEFAULT 0,
    `successedLessonsCount` INTEGER NOT NULL DEFAULT 0,
    `overallAverage` DOUBLE NOT NULL DEFAULT 0,
    `lastActivityDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `progress_studentId_key`(`studentId`),
    PRIMARY KEY (`progressId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `assessments` (
    `assessmentId` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` INTEGER NOT NULL,
    `status` ENUM('active', 'completed') NOT NULL DEFAULT 'active',
    `detectedLevel` ENUM('Beginner', 'Intermediate', 'Advanced') NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endedAt` DATETIME(3) NULL,

    PRIMARY KEY (`assessmentId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `assessment_messages` (
    `messageId` INTEGER NOT NULL AUTO_INCREMENT,
    `assessmentId` INTEGER NOT NULL,
    `role` ENUM('student', 'assistant') NOT NULL,
    `content` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`messageId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `settings` (
    `userId` INTEGER NOT NULL,
    `displayName` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `theme` VARCHAR(191) NOT NULL DEFAULT 'light',

    PRIMARY KEY (`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_preferences` (
    `userId` INTEGER NOT NULL,
    `budget_max` INTEGER NOT NULL DEFAULT 0,
    `learning_goal` TEXT NOT NULL,
    `onboarding_text` TEXT NOT NULL,
    `currentLevel` ENUM('Beginner', 'Intermediate', 'Advanced') NULL,
    `availability` VARCHAR(191) NULL,
    `teacherGender` VARCHAR(191) NULL,
    `mainGoal` VARCHAR(191) NULL,
    `onlineOnly` BOOLEAN NULL,

    PRIMARY KEY (`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_teacher_relations` (
    `relationId` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` INTEGER NOT NULL,
    `teacherId` INTEGER NOT NULL,
    `status` ENUM('pending', 'active', 'rejected') NOT NULL DEFAULT 'pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `rating` INTEGER NULL,
    `student_feedback` TEXT NULL,

    PRIMARY KEY (`relationId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_completed_lessons` (
    `studentId` INTEGER NOT NULL,
    `lessonId` INTEGER NOT NULL,
    `completedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`studentId`, `lessonId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `teachers` ADD CONSTRAINT `teachers_userID_fkey` FOREIGN KEY (`userID`) REFERENCES `users`(`userID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lessons` ADD CONSTRAINT `lessons_grammarRuleId_fkey` FOREIGN KEY (`grammarRuleId`) REFERENCES `grammar_rules`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vocabulary` ADD CONSTRAINT `vocabulary_lessonId_fkey` FOREIGN KEY (`lessonId`) REFERENCES `lessons`(`lessonId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `warm_up_exercises` ADD CONSTRAINT `warm_up_exercises_lessonId_fkey` FOREIGN KEY (`lessonId`) REFERENCES `lessons`(`lessonId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `warm_up_exercises` ADD CONSTRAINT `warm_up_exercises_grammarRuleId_fkey` FOREIGN KEY (`grammarRuleId`) REFERENCES `grammar_rules`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `users`(`userID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_lessonId_fkey` FOREIGN KEY (`lessonId`) REFERENCES `lessons`(`lessonId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conversation_messages` ADD CONSTRAINT `conversation_messages_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `conversations`(`conversationId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacher_reviews` ADD CONSTRAINT `teacher_reviews_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `conversations`(`conversationId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacher_reviews` ADD CONSTRAINT `teacher_reviews_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `teachers`(`teacherId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conversation_replies` ADD CONSTRAINT `conversation_replies_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `conversations`(`conversationId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `progress` ADD CONSTRAINT `progress_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `users`(`userID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assessments` ADD CONSTRAINT `assessments_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `users`(`userID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assessment_messages` ADD CONSTRAINT `assessment_messages_assessmentId_fkey` FOREIGN KEY (`assessmentId`) REFERENCES `assessments`(`assessmentId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `settings` ADD CONSTRAINT `settings_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`userID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_preferences` ADD CONSTRAINT `student_preferences_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`userID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_teacher_relations` ADD CONSTRAINT `student_teacher_relations_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `users`(`userID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_teacher_relations` ADD CONSTRAINT `student_teacher_relations_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `teachers`(`teacherId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_completed_lessons` ADD CONSTRAINT `student_completed_lessons_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `users`(`userID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_completed_lessons` ADD CONSTRAINT `student_completed_lessons_lessonId_fkey` FOREIGN KEY (`lessonId`) REFERENCES `lessons`(`lessonId`) ON DELETE RESTRICT ON UPDATE CASCADE;
