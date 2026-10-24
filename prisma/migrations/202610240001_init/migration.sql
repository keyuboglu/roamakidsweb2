CREATE TYPE "ChallengeStatus" AS ENUM ('DRAFT','PUBLISHED','ARCHIVED');
CREATE TYPE "CompletionStatus" AS ENUM ('ACCEPTED','REJECTED');
CREATE TYPE "AnalyticsEventType" AS ENUM ('PAGE_VIEW','CHALLENGE_VIEW','COMPLETION_STARTED','COMPLETION_ACCEPTED','SHARE','STORE_CLICK');
CREATE TABLE "Challenge" (
 "id" TEXT NOT NULL, "slug" TEXT NOT NULL, "title" TEXT NOT NULL, "shortDescription" VARCHAR(300) NOT NULL,
 "description" TEXT NOT NULL DEFAULT '', "instructions" TEXT NOT NULL DEFAULT '', "safety" TEXT NOT NULL DEFAULT '',
 "imageUrl" TEXT, "duration" TEXT, "status" "ChallengeStatus" NOT NULL DEFAULT 'DRAFT', "displayOrder" INTEGER NOT NULL DEFAULT 0,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, "publishedAt" TIMESTAMP(3),
 CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Completion" (
 "id" TEXT NOT NULL, "challengeId" TEXT NOT NULL, "status" "CompletionStatus" NOT NULL DEFAULT 'ACCEPTED',
 "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "countryCode" CHAR(2), "idempotencyKey" VARCHAR(80) NOT NULL,
 "abuseKey" VARCHAR(64), CONSTRAINT "Completion_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CampaignConfig" (
 "id" INTEGER NOT NULL DEFAULT 1, "title" TEXT NOT NULL DEFAULT 'The Great Signal Quest',
 "headline" TEXT NOT NULL DEFAULT 'A million stars. One global quest.',
 "description" TEXT NOT NULL DEFAULT 'Complete a challenge. Add your star. Help build something bigger than a game.',
 "goal" INTEGER NOT NULL DEFAULT 1000000,
 "milestones" JSONB NOT NULL DEFAULT '[{"threshold":100,"label":"First light"},{"threshold":1000,"label":"A brighter sky"},{"threshold":10000,"label":"A constellation"},{"threshold":100000,"label":"A world of stars"},{"threshold":1000000,"label":"The Great Signal"}]',
 "iosStoreUrl" TEXT,"androidStoreUrl" TEXT,"socialImageUrl" TEXT,"published" BOOLEAN NOT NULL DEFAULT false,"updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "CampaignConfig_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AdminUser" ("id" TEXT NOT NULL,"email" TEXT NOT NULL,"passwordHash" TEXT NOT NULL,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"lastLoginAt" TIMESTAMP(3),CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id"));
CREATE TABLE "AnalyticsEvent" ("id" TEXT NOT NULL,"type" "AnalyticsEventType" NOT NULL,"challengeId" TEXT,"source" VARCHAR(100),"medium" VARCHAR(100),"campaign" VARCHAR(100),"target" VARCHAR(20),"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id"));
CREATE TABLE "RateLimitBucket" ("key" VARCHAR(64) NOT NULL,"windowStart" TIMESTAMP(3) NOT NULL,"count" INTEGER NOT NULL DEFAULT 0,CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("key"));
CREATE UNIQUE INDEX "Challenge_slug_key" ON "Challenge"("slug");
CREATE INDEX "Challenge_status_displayOrder_idx" ON "Challenge"("status","displayOrder");
CREATE UNIQUE INDEX "Completion_idempotencyKey_key" ON "Completion"("idempotencyKey");
CREATE INDEX "Completion_status_registeredAt_idx" ON "Completion"("status","registeredAt");
CREATE INDEX "Completion_challengeId_status_idx" ON "Completion"("challengeId","status");
CREATE INDEX "Completion_abuseKey_registeredAt_idx" ON "Completion"("abuseKey","registeredAt");
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");
CREATE INDEX "AnalyticsEvent_type_createdAt_idx" ON "AnalyticsEvent"("type","createdAt");
CREATE INDEX "AnalyticsEvent_challengeId_type_createdAt_idx" ON "AnalyticsEvent"("challengeId","type","createdAt");
CREATE INDEX "RateLimitBucket_windowStart_idx" ON "RateLimitBucket"("windowStart");
ALTER TABLE "Completion" ADD CONSTRAINT "Completion_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE SET NULL ON UPDATE CASCADE;
