ALTER TYPE "AnalyticsEventType" ADD VALUE 'CHALLENGE_START';
ALTER TYPE "AnalyticsEventType" ADD VALUE 'CHALLENGE_COMPLETE';
ALTER TYPE "AnalyticsEventType" ADD VALUE 'ANDROID_WAITLIST_SIGNUP';

CREATE TABLE "AndroidWaitlist" (
    "id" TEXT NOT NULL,
    "emailHash" CHAR(64) NOT NULL,
    "encryptedEmail" TEXT NOT NULL,
    "source" VARCHAR(100) NOT NULL DEFAULT 'android_waitlist',
    "completedChallenge" VARCHAR(100),
    "language" VARCHAR(2) NOT NULL,
    "consentVersion" VARCHAR(40) NOT NULL DEFAULT 'android-launch-v1',
    "utmSource" VARCHAR(100),
    "medium" VARCHAR(100),
    "campaign" VARCHAR(100),
    "content" VARCHAR(100),
    "referralCode" VARCHAR(36),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AndroidWaitlist_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AndroidWaitlist_emailHash_key" ON "AndroidWaitlist"("emailHash");
CREATE INDEX "AndroidWaitlist_expiresAt_idx" ON "AndroidWaitlist"("expiresAt");
