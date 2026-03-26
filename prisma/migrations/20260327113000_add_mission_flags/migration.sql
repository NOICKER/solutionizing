CREATE TYPE "FlagReason" AS ENUM (
  'CONFUSING',
  'UNCLEAR_NEXT_STEP',
  'FEELS_SUSPICIOUS',
  'HARD_TO_USE',
  'TOO_SLOW_OR_ANNOYING',
  'NOT_COMPELLING'
);

CREATE TYPE "FlagStatus" AS ENUM (
  'PENDING',
  'RESOLVED',
  'DISMISSED'
);

CREATE TABLE "mission_flags" (
  "id" TEXT NOT NULL,
  "missionId" TEXT NOT NULL,
  "assignmentId" TEXT NOT NULL,
  "reporterUserId" TEXT NOT NULL,
  "targetUserId" TEXT NOT NULL,
  "reporterRole" "Role" NOT NULL,
  "targetRole" "Role" NOT NULL,
  "reason" "FlagReason" NOT NULL,
  "details" TEXT,
  "status" "FlagStatus" NOT NULL DEFAULT 'PENDING',
  "resolutionNote" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "resolvedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "mission_flags_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "mission_flags_assignmentId_reporterUserId_reason_key"
ON "mission_flags"("assignmentId", "reporterUserId", "reason");

CREATE INDEX "mission_flags_missionId_idx" ON "mission_flags"("missionId");
CREATE INDEX "mission_flags_assignmentId_idx" ON "mission_flags"("assignmentId");
CREATE INDEX "mission_flags_targetUserId_idx" ON "mission_flags"("targetUserId");
CREATE INDEX "mission_flags_status_idx" ON "mission_flags"("status");
CREATE INDEX "mission_flags_reason_idx" ON "mission_flags"("reason");

ALTER TABLE "mission_flags"
ADD CONSTRAINT "mission_flags_missionId_fkey"
FOREIGN KEY ("missionId") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "mission_flags"
ADD CONSTRAINT "mission_flags_assignmentId_fkey"
FOREIGN KEY ("assignmentId") REFERENCES "mission_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "mission_flags"
ADD CONSTRAINT "mission_flags_reporterUserId_fkey"
FOREIGN KEY ("reporterUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "mission_flags"
ADD CONSTRAINT "mission_flags_targetUserId_fkey"
FOREIGN KEY ("targetUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "mission_flags"
ADD CONSTRAINT "mission_flags_resolvedById_fkey"
FOREIGN KEY ("resolvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
