ALTER TABLE "Completion" ADD COLUMN "starNumber" INTEGER;
ALTER TABLE "Completion" ADD COLUMN "starName" VARCHAR(40);

WITH numbered AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "registeredAt", "id")::INTEGER AS number
  FROM "Completion"
)
UPDATE "Completion" SET "starNumber" = numbered.number
FROM numbered WHERE "Completion"."id" = numbered."id";

ALTER TABLE "Completion" ALTER COLUMN "starNumber" SET NOT NULL;
ALTER TABLE "Completion" ADD CONSTRAINT "Completion_starNumber_range"
  CHECK ("starNumber" BETWEEN 1 AND 1000000);
CREATE UNIQUE INDEX "Completion_starNumber_key" ON "Completion"("starNumber");

ALTER TABLE "CampaignConfig" ADD COLUMN "starsIssued" INTEGER NOT NULL DEFAULT 0;
INSERT INTO "CampaignConfig" ("id", "starsIssued", "updatedAt")
VALUES (1, COALESCE((SELECT MAX("starNumber") FROM "Completion"), 0), CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO UPDATE SET "starsIssued" = EXCLUDED."starsIssued";
