-- DropIndex
DROP INDEX "missions_parentMissionId_idx";

-- AlterTable
ALTER TABLE "missions" ADD COLUMN     "healthScore" INTEGER;
