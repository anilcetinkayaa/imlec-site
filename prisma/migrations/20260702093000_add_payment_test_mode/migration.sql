ALTER TABLE "Payment"
ADD COLUMN "testMode" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Payment"
SET "testMode" = true
WHERE "provider" = 'lemonsqueezy';

CREATE INDEX "Payment_testMode_idx" ON "Payment"("testMode");
