DROP INDEX IF EXISTS "Entitlement_userId_productId_key";

CREATE INDEX IF NOT EXISTS "Entitlement_userId_productId_idx"
  ON "Entitlement"("userId", "productId");

CREATE INDEX IF NOT EXISTS "Entitlement_userId_productId_source_idx"
  ON "Entitlement"("userId", "productId", "source");
