CREATE TYPE "BillingRequestType" AS ENUM ('CANCEL_TRIAL', 'CANCEL_SUBSCRIPTION', 'REFUND');
CREATE TYPE "BillingRequestStatus" AS ENUM ('OPEN', 'REVIEWING', 'APPROVED', 'REJECTED', 'COMPLETED');
CREATE TYPE "BillingRequestReason" AS ENUM ('TRIAL_NOT_NEEDED', 'PRICE_TOO_HIGH', 'OCR_NOT_ENOUGH', 'TECHNICAL_PROBLEM', 'BOUGHT_BY_MISTAKE', 'DUPLICATE_PAYMENT', 'CUSTOMER_SERVICE', 'OTHER');

CREATE TABLE "BillingRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "paymentId" TEXT,
    "type" "BillingRequestType" NOT NULL,
    "status" "BillingRequestStatus" NOT NULL DEFAULT 'OPEN',
    "reason" "BillingRequestReason" NOT NULL,
    "message" TEXT,
    "adminNote" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BillingRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BillingRequest_userId_status_idx" ON "BillingRequest"("userId", "status");
CREATE INDEX "BillingRequest_productId_status_idx" ON "BillingRequest"("productId", "status");
CREATE INDEX "BillingRequest_subscriptionId_idx" ON "BillingRequest"("subscriptionId");
CREATE INDEX "BillingRequest_paymentId_idx" ON "BillingRequest"("paymentId");
CREATE INDEX "BillingRequest_type_status_idx" ON "BillingRequest"("type", "status");
CREATE INDEX "BillingRequest_createdAt_idx" ON "BillingRequest"("createdAt");

ALTER TABLE "BillingRequest" ADD CONSTRAINT "BillingRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BillingRequest" ADD CONSTRAINT "BillingRequest_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BillingRequest" ADD CONSTRAINT "BillingRequest_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BillingRequest" ADD CONSTRAINT "BillingRequest_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
