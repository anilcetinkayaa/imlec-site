ALTER TABLE "Announcement" ADD COLUMN "imageUrl" TEXT;
ALTER TABLE "Announcement" ADD COLUMN "productSlug" TEXT;

CREATE INDEX "Announcement_productSlug_idx" ON "Announcement"("productSlug");
