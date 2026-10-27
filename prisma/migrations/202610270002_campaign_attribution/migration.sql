ALTER TABLE "EmailVerificationToken"
  ADD COLUMN "source" VARCHAR(100),
  ADD COLUMN "medium" VARCHAR(100),
  ADD COLUMN "campaign" VARCHAR(100),
  ADD COLUMN "content" VARCHAR(100),
  ADD COLUMN "referralCode" VARCHAR(36);

ALTER TABLE "AnalyticsEvent"
  ADD COLUMN "content" VARCHAR(100),
  ADD COLUMN "referralCode" VARCHAR(36);

CREATE INDEX "AnalyticsEvent_createdAt_source_medium_campaign_idx"
  ON "AnalyticsEvent"("createdAt", "source", "medium", "campaign");
