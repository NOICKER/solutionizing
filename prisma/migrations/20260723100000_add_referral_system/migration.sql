-- AlterTable
ALTER TABLE "missions" ADD COLUMN IF NOT EXISTS "referral_code" TEXT;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "referral_code" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "referral_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "referrer_name" TEXT NOT NULL,
    "discount_amount" INTEGER NOT NULL DEFAULT 40,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "times_used" INTEGER NOT NULL DEFAULT 0,
    "max_uses" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "referral_codes_code_key" ON "referral_codes"("code");
