-- AlterTable
ALTER TABLE "tester_profiles" ADD COLUMN     "expertiseTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "notifyNewMission" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "payoutDetails" TEXT,
ADD COLUMN     "preferredDevice" TEXT;
