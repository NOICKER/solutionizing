-- CreateTable
CREATE TABLE "feedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "page" TEXT NOT NULL,
    "screenshotUrl" TEXT,
    "message" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback_widget_waitlist" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_widget_waitlist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "feedback_category_idx" ON "feedback"("category");

-- CreateIndex
CREATE INDEX "feedback_createdAt_idx" ON "feedback"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "feedback_widget_waitlist_email_key" ON "feedback_widget_waitlist"("email");

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
