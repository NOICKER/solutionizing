ALTER TABLE "missions" ADD COLUMN "timeoutDuration" INTEGER NOT NULL DEFAULT 168;

CREATE TABLE "tester_rating_events" (
    "id" TEXT NOT NULL,
    "testerId" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "missionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tester_rating_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "tester_rating_events_testerId_createdAt_idx" ON "tester_rating_events"("testerId", "createdAt");
CREATE INDEX "tester_rating_events_missionId_idx" ON "tester_rating_events"("missionId");

ALTER TABLE "tester_rating_events" ADD CONSTRAINT "tester_rating_events_testerId_fkey" FOREIGN KEY ("testerId") REFERENCES "tester_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tester_rating_events" ADD CONSTRAINT "tester_rating_events_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
