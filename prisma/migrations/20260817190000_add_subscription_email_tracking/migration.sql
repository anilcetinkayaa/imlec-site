ALTER TABLE "Subscription"
ADD COLUMN "trialEndingEmailSentAt" TIMESTAMP(3),
ADD COLUMN "trialEndedEmailSentAt" TIMESTAMP(3),
ADD COLUMN "canceledEmailSentAt" TIMESTAMP(3);
