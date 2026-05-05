ALTER TABLE "missions"
ADD COLUMN IF NOT EXISTS "parentMissionId" TEXT;

CREATE INDEX IF NOT EXISTS "missions_parentMissionId_idx" ON "missions"("parentMissionId");

DO $$
BEGIN
    ALTER TABLE "missions"
    ADD CONSTRAINT "missions_parentMissionId_fkey"
    FOREIGN KEY ("parentMissionId") REFERENCES "missions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END
$$;
