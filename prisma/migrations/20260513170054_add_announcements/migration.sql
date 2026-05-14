-- CreateEnum
CREATE TYPE "AnnouncementType" AS ENUM ('GUNCELLEME', 'BILGILENDIRME', 'BAKIM', 'YENI_OZELLIK');

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" "AnnouncementType" NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Announcement_isPublished_startsAt_endsAt_idx" ON "Announcement"("isPublished", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "Announcement_createdAt_idx" ON "Announcement"("createdAt");

-- CreateIndex
CREATE INDEX "Announcement_type_idx" ON "Announcement"("type");
