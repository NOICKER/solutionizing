-- AlterTable
ALTER TABLE "founder_profiles" ADD COLUMN     "defaultDifficulty" "Difficulty" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "defaultTestersRequired" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "notifyMissionApproved" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyMissionCompleted" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyTesterFeedback" BOOLEAN NOT NULL DEFAULT false;
