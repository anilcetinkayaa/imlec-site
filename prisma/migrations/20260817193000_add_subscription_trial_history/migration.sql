ALTER TABLE "Subscription"
ADD COLUMN "testMode" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "trialUsedAt" TIMESTAMP(3);

UPDATE "Subscription"
SET
  "testMode" = true,
  "trialUsedAt" = COALESCE("trialUsedAt", "createdAt")
WHERE "trialEndsAt" IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM "Payment"
    WHERE "Payment"."subscriptionId" = "Subscription"."id"
      AND "Payment"."testMode" = true
  );

UPDATE "Subscription"
SET "trialUsedAt" = COALESCE("trialUsedAt", "createdAt")
WHERE "trialEndsAt" IS NOT NULL;

CREATE INDEX "Subscription_testMode_trialUsedAt_idx"
ON "Subscription"("testMode", "trialUsedAt");
