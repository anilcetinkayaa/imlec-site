-- CreateTable
CREATE TABLE "ProductVersion" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "minimumVersion" TEXT,
    "releaseNotes" TEXT,
    "filePath" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductVersion_productId_createdAt_idx" ON "ProductVersion"("productId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVersion_productId_version_key" ON "ProductVersion"("productId", "version");

-- AddForeignKey
ALTER TABLE "ProductVersion" ADD CONSTRAINT "ProductVersion_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
