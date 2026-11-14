CREATE TABLE "AnonymousDailyCount" (
    "event" VARCHAR(100) NOT NULL,
    "date" DATE NOT NULL,
    "source" VARCHAR(20) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "AnonymousDailyCount_pkey" PRIMARY KEY ("event", "date", "source"),
    CONSTRAINT "AnonymousDailyCount_nonnegative" CHECK ("count" >= 0),
    CONSTRAINT "AnonymousDailyCount_source" CHECK ("source" IN ('direct','wa','email','share','tiktok','instagram','facebook','youtube','google','bing','roamatech','signalquest','signal_card','other'))
);
CREATE INDEX "AnonymousDailyCount_date_idx" ON "AnonymousDailyCount"("date");
