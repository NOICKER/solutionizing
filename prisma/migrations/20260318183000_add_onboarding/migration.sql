ALTER TABLE "founder_profiles"
ADD COLUMN "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "tester_profiles"
ADD COLUMN "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;
