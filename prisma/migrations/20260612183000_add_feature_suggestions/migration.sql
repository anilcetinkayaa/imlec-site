CREATE TYPE "FeatureSuggestionStatus" AS ENUM (
  'PENDING',
  'APPROVED',
  'REJECTED',
  'PLANNED',
  'IN_PROGRESS',
  'DONE',
  'ARCHIVED'
);

CREATE TABLE "FeatureSuggestion" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "productSlug" TEXT NOT NULL DEFAULT 'fis260',
  "appVersion" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "status" "FeatureSuggestionStatus" NOT NULL DEFAULT 'PENDING',
  "adminNote" TEXT,
  "score" INTEGER NOT NULL DEFAULT 0,
  "upvotes" INTEGER NOT NULL DEFAULT 0,
  "downvotes" INTEGER NOT NULL DEFAULT 0,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "FeatureSuggestion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FeatureSuggestionVote" (
  "id" TEXT NOT NULL,
  "suggestionId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "value" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "FeatureSuggestionVote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FeatureSuggestion_userId_idx" ON "FeatureSuggestion"("userId");
CREATE INDEX "FeatureSuggestion_productSlug_status_idx" ON "FeatureSuggestion"("productSlug", "status");
CREATE INDEX "FeatureSuggestion_score_idx" ON "FeatureSuggestion"("score");
CREATE INDEX "FeatureSuggestion_createdAt_idx" ON "FeatureSuggestion"("createdAt");

CREATE UNIQUE INDEX "FeatureSuggestionVote_suggestionId_userId_key" ON "FeatureSuggestionVote"("suggestionId", "userId");
CREATE INDEX "FeatureSuggestionVote_userId_idx" ON "FeatureSuggestionVote"("userId");
CREATE INDEX "FeatureSuggestionVote_suggestionId_idx" ON "FeatureSuggestionVote"("suggestionId");

ALTER TABLE "FeatureSuggestion"
  ADD CONSTRAINT "FeatureSuggestion_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "FeatureSuggestionVote"
  ADD CONSTRAINT "FeatureSuggestionVote_suggestionId_fkey"
  FOREIGN KEY ("suggestionId") REFERENCES "FeatureSuggestion"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FeatureSuggestionVote"
  ADD CONSTRAINT "FeatureSuggestionVote_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
