ALTER TABLE "Completion"
  ADD COLUMN "adultEmailHash" CHAR(64),
  ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Completion_adultEmailHash_key"
  ON "Completion"("adultEmailHash");

CREATE UNIQUE INDEX "Challenge_single_published"
  ON "Challenge"("status")
  WHERE "status" = 'PUBLISHED';

ALTER TYPE "AnalyticsEventType" ADD VALUE 'STAR_CARD_DOWNLOADED';
ALTER TYPE "AnalyticsEventType" ADD VALUE 'STAR_CARD_SHARED';
