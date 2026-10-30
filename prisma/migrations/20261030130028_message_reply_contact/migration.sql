/*
  Warnings:

  - You are about to drop the column `contact` on the `Message` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Consent" ADD COLUMN     "parentPhone" TEXT;

-- AlterTable
ALTER TABLE "Message" DROP COLUMN "contact",
ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "replyToId" TEXT,
ADD COLUMN     "viaGuardian" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Message_replyToId_idx" ON "Message"("replyToId");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;
