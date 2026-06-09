CREATE TYPE "BillingProfileType" AS ENUM ('INDIVIDUAL', 'COMPANY');
CREATE TYPE "BillingProfileStatus" AS ENUM ('COMPLETE', 'MISSING_INFO', 'NEEDS_REVIEW');

CREATE TABLE "BillingProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "BillingProfileType" NOT NULL,
    "status" "BillingProfileStatus" NOT NULL DEFAULT 'MISSING_INFO',
    "fullName" TEXT,
    "companyTitle" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "country" TEXT DEFAULT 'TR',
    "city" TEXT,
    "district" TEXT,
    "postalCode" TEXT,
    "addressLine" TEXT,
    "tckn" TEXT,
    "vkn" TEXT,
    "taxOffice" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BillingProfile_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Payment" ADD COLUMN "billingProfileId" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "billingProfileId" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "paymentId" TEXT;

CREATE INDEX "BillingProfile_userId_isDefault_idx" ON "BillingProfile"("userId", "isDefault");
CREATE INDEX "BillingProfile_status_idx" ON "BillingProfile"("status");
CREATE INDEX "BillingProfile_vkn_idx" ON "BillingProfile"("vkn");
CREATE INDEX "BillingProfile_tckn_idx" ON "BillingProfile"("tckn");
CREATE INDEX "Payment_billingProfileId_idx" ON "Payment"("billingProfileId");
CREATE INDEX "Invoice_billingProfileId_idx" ON "Invoice"("billingProfileId");
CREATE INDEX "Invoice_paymentId_idx" ON "Invoice"("paymentId");

ALTER TABLE "BillingProfile" ADD CONSTRAINT "BillingProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_billingProfileId_fkey" FOREIGN KEY ("billingProfileId") REFERENCES "BillingProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_billingProfileId_fkey" FOREIGN KEY ("billingProfileId") REFERENCES "BillingProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
