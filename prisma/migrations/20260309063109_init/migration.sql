-- CreateEnum
CREATE TYPE "Role" AS ENUM ('FOUNDER', 'TESTER', 'ADMIN');

-- CreateEnum
CREATE TYPE "RepTier" AS ENUM ('NEWCOMER', 'RELIABLE', 'TRUSTED', 'ELITE');

-- CreateEnum
CREATE TYPE "MissionStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'PAUSED', 'COMPLETED', 'REJECTED');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('LINK', 'SCREENSHOT', 'TEXT_DESCRIPTION', 'SHORT_VIDEO');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('TEXT_SHORT', 'TEXT_LONG', 'RATING_1_5', 'MULTIPLE_CHOICE', 'YES_NO');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'ABANDONED', 'TIMED_OUT', 'MISSION_FULL');

-- CreateEnum
CREATE TYPE "TxType" AS ENUM ('PURCHASE', 'MISSION_DEDUCT', 'MISSION_REFUND', 'TESTER_EARN', 'TESTER_WITHDRAWAL', 'ADMIN_ADJUSTMENT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'TESTER',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "isSuspended" BOOLEAN NOT NULL DEFAULT false,
    "suspendedAt" TIMESTAMP(3),
    "suspendReason" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "founder_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "companyName" TEXT,
    "coinBalance" INTEGER NOT NULL DEFAULT 0,
    "totalMissions" INTEGER NOT NULL DEFAULT 0,
    "stripeCustomerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "founder_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tester_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "coinBalance" INTEGER NOT NULL DEFAULT 0,
    "reputationScore" DOUBLE PRECISION NOT NULL DEFAULT 50.0,
    "reputationTier" "RepTier" NOT NULL DEFAULT 'RELIABLE',
    "totalCompleted" INTEGER NOT NULL DEFAULT 0,
    "totalAbandoned" INTEGER NOT NULL DEFAULT 0,
    "totalTimedOut" INTEGER NOT NULL DEFAULT 0,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "stripeAccountId" TEXT,
    "stripeOnboarded" BOOLEAN NOT NULL DEFAULT false,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tester_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "missions" (
    "id" TEXT NOT NULL,
    "founderId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'MEDIUM',
    "estimatedMinutes" INTEGER NOT NULL,
    "testersRequired" INTEGER NOT NULL,
    "testersAssigned" INTEGER NOT NULL DEFAULT 0,
    "testersCompleted" INTEGER NOT NULL DEFAULT 0,
    "minRepTier" "RepTier" NOT NULL DEFAULT 'NEWCOMER',
    "coinPerTester" INTEGER NOT NULL,
    "coinPlatformFee" INTEGER NOT NULL,
    "coinCostTotal" INTEGER NOT NULL,
    "status" "MissionStatus" NOT NULL DEFAULT 'DRAFT',
    "reviewNote" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "launchedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "pausedAt" TIMESTAMP(3),
    "reportCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "missions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mission_assets" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "type" "AssetType" NOT NULL,
    "url" TEXT NOT NULL,
    "label" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mission_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mission_questions" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "type" "QuestionType" NOT NULL,
    "text" TEXT NOT NULL,
    "options" TEXT[],
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mission_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mission_assignments" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "testerId" TEXT NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'ASSIGNED',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "abandonedAt" TIMESTAMP(3),
    "timedOutAt" TIMESTAMP(3),
    "timeoutAt" TIMESTAMP(3) NOT NULL,
    "coinsEarned" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "mission_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mission_responses" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "responseText" TEXT,
    "responseRating" INTEGER,
    "responseChoice" TEXT,
    "timeTakenSeconds" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mission_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coin_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "TxType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "missionId" TEXT,
    "assignmentId" TEXT,
    "stripePaymentId" TEXT,
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coin_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tester_ratings" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "founderId" TEXT NOT NULL,
    "testerId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "flaggedLowEffort" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tester_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_templates" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,
    "options" TEXT[],
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mission_reports" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "testerId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mission_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "founder_profiles_userId_key" ON "founder_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "founder_profiles_stripeCustomerId_key" ON "founder_profiles"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "tester_profiles_userId_key" ON "tester_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "tester_profiles_stripeAccountId_key" ON "tester_profiles"("stripeAccountId");

-- CreateIndex
CREATE INDEX "missions_founderId_idx" ON "missions"("founderId");

-- CreateIndex
CREATE INDEX "missions_status_idx" ON "missions"("status");

-- CreateIndex
CREATE INDEX "missions_status_difficulty_idx" ON "missions"("status", "difficulty");

-- CreateIndex
CREATE INDEX "mission_assets_missionId_idx" ON "mission_assets"("missionId");

-- CreateIndex
CREATE INDEX "mission_questions_missionId_idx" ON "mission_questions"("missionId");

-- CreateIndex
CREATE INDEX "mission_assignments_testerId_idx" ON "mission_assignments"("testerId");

-- CreateIndex
CREATE INDEX "mission_assignments_missionId_idx" ON "mission_assignments"("missionId");

-- CreateIndex
CREATE INDEX "mission_assignments_status_idx" ON "mission_assignments"("status");

-- CreateIndex
CREATE INDEX "mission_assignments_timeoutAt_idx" ON "mission_assignments"("timeoutAt");

-- CreateIndex
CREATE UNIQUE INDEX "mission_assignments_missionId_testerId_key" ON "mission_assignments"("missionId", "testerId");

-- CreateIndex
CREATE INDEX "mission_responses_assignmentId_idx" ON "mission_responses"("assignmentId");

-- CreateIndex
CREATE INDEX "mission_responses_questionId_idx" ON "mission_responses"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "mission_responses_assignmentId_questionId_key" ON "mission_responses"("assignmentId", "questionId");

-- CreateIndex
CREATE INDEX "coin_transactions_userId_idx" ON "coin_transactions"("userId");

-- CreateIndex
CREATE INDEX "coin_transactions_userId_createdAt_idx" ON "coin_transactions"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "coin_transactions_missionId_idx" ON "coin_transactions"("missionId");

-- CreateIndex
CREATE UNIQUE INDEX "tester_ratings_assignmentId_key" ON "tester_ratings"("assignmentId");

-- CreateIndex
CREATE INDEX "tester_ratings_testerId_idx" ON "tester_ratings"("testerId");

-- CreateIndex
CREATE INDEX "tester_ratings_founderId_idx" ON "tester_ratings"("founderId");

-- CreateIndex
CREATE INDEX "question_templates_category_idx" ON "question_templates"("category");

-- CreateIndex
CREATE INDEX "question_templates_usageCount_idx" ON "question_templates"("usageCount");

-- CreateIndex
CREATE INDEX "mission_reports_missionId_idx" ON "mission_reports"("missionId");

-- CreateIndex
CREATE UNIQUE INDEX "mission_reports_missionId_testerId_key" ON "mission_reports"("missionId", "testerId");

-- AddForeignKey
ALTER TABLE "founder_profiles" ADD CONSTRAINT "founder_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tester_profiles" ADD CONSTRAINT "tester_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "missions" ADD CONSTRAINT "missions_founderId_fkey" FOREIGN KEY ("founderId") REFERENCES "founder_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_assets" ADD CONSTRAINT "mission_assets_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_questions" ADD CONSTRAINT "mission_questions_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_assignments" ADD CONSTRAINT "mission_assignments_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_assignments" ADD CONSTRAINT "mission_assignments_testerId_fkey" FOREIGN KEY ("testerId") REFERENCES "tester_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_responses" ADD CONSTRAINT "mission_responses_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "mission_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_responses" ADD CONSTRAINT "mission_responses_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "mission_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coin_transactions" ADD CONSTRAINT "coin_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tester_ratings" ADD CONSTRAINT "tester_ratings_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "mission_assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tester_ratings" ADD CONSTRAINT "tester_ratings_founderId_fkey" FOREIGN KEY ("founderId") REFERENCES "founder_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tester_ratings" ADD CONSTRAINT "tester_ratings_testerId_fkey" FOREIGN KEY ("testerId") REFERENCES "tester_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
