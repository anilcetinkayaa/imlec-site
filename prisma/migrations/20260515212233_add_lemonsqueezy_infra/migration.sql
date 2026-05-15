-- AlterEnum
ALTER TYPE "EntitlementSource" ADD VALUE 'LEMON_SQUEEZY';

-- CreateTable
CREATE TABLE "LemonSqueezyCustomer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lemonSqueezyId" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LemonSqueezyCustomer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LemonSqueezyLicense" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "licenseKeyId" TEXT NOT NULL,
    "licenseKey" TEXT,
    "activationLimit" INTEGER,
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LemonSqueezyLicense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LemonSqueezyWebhookEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LemonSqueezyWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LemonSqueezyCustomer_lemonSqueezyId_key" ON "LemonSqueezyCustomer"("lemonSqueezyId");

-- CreateIndex
CREATE INDEX "LemonSqueezyCustomer_userId_idx" ON "LemonSqueezyCustomer"("userId");

-- CreateIndex
CREATE INDEX "LemonSqueezyCustomer_email_idx" ON "LemonSqueezyCustomer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "LemonSqueezyLicense_licenseKeyId_key" ON "LemonSqueezyLicense"("licenseKeyId");

-- CreateIndex
CREATE INDEX "LemonSqueezyLicense_userId_idx" ON "LemonSqueezyLicense"("userId");

-- CreateIndex
CREATE INDEX "LemonSqueezyLicense_subscriptionId_idx" ON "LemonSqueezyLicense"("subscriptionId");

-- CreateIndex
CREATE INDEX "LemonSqueezyLicense_status_idx" ON "LemonSqueezyLicense"("status");

-- CreateIndex
CREATE UNIQUE INDEX "LemonSqueezyWebhookEvent_eventId_key" ON "LemonSqueezyWebhookEvent"("eventId");

-- CreateIndex
CREATE INDEX "LemonSqueezyWebhookEvent_eventName_idx" ON "LemonSqueezyWebhookEvent"("eventName");

-- CreateIndex
CREATE INDEX "LemonSqueezyWebhookEvent_processedAt_idx" ON "LemonSqueezyWebhookEvent"("processedAt");

-- CreateIndex
CREATE INDEX "LemonSqueezyWebhookEvent_createdAt_idx" ON "LemonSqueezyWebhookEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "LemonSqueezyCustomer" ADD CONSTRAINT "LemonSqueezyCustomer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LemonSqueezyLicense" ADD CONSTRAINT "LemonSqueezyLicense_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
