export const ANONYMIZE_LEGACY_ANALYTICS_SQL=`
WITH removed AS (
  DELETE FROM "AnalyticsEvent"
  RETURNING "type", "createdAt", "source", "challengeId"
), categorized AS (
  SELECT
    CASE WHEN r."type" = 'PAGE_VIEW' THEN 'page_view:/'
      ELSE CASE WHEN r."type" = 'STORE_CLICK' THEN 'app_store_click' ELSE lower(r."type"::text) END
        || CASE WHEN c."slug" IN ('shadow-signal','micro-world-safari','gravity-defier') THEN ':' || c."slug" ELSE '' END
    END AS event,
    r."createdAt"::date AS date,
    CASE WHEN r."source" IS NULL OR trim(r."source") = '' THEN 'direct'
      WHEN lower(trim(r."source")) = 'whatsapp' THEN 'wa'
      WHEN lower(trim(r."source")) IN ('direct','wa','email','share','tiktok','instagram','facebook','youtube','google','bing','roamatech','signalquest','signal_card','other') THEN lower(trim(r."source"))
      ELSE 'other' END AS source
  FROM removed r
  LEFT JOIN "Challenge" c ON c."id" = r."challengeId"
  WHERE r."createdAt"::date >= (NOW() AT TIME ZONE 'UTC')::date - 29
)
INSERT INTO "AnonymousDailyCount" ("event", "date", "source", "count")
SELECT event, date, source, COUNT(*)::integer FROM categorized GROUP BY event, date, source
ON CONFLICT ("event", "date", "source") DO UPDATE
SET "count" = "AnonymousDailyCount"."count" + EXCLUDED."count"
`;

export const EXPIRE_ANONYMOUS_TOTALS_SQL=`DELETE FROM "AnonymousDailyCount" WHERE "date" < (NOW() AT TIME ZONE 'UTC')::date - 29`;
export const CLEAR_TOKEN_ATTRIBUTION_SQL=`UPDATE "EmailVerificationToken" SET "source"=NULL, "medium"=NULL, "campaign"=NULL, "content"=NULL, "referralCode"=NULL WHERE "source" IS NOT NULL OR "medium" IS NOT NULL OR "campaign" IS NOT NULL OR "content" IS NOT NULL OR "referralCode" IS NOT NULL`;
