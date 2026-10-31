-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "submittedById" TEXT,
ADD COLUMN     "viaGuardian" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "managedByGuardian" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Product_submittedById_idx" ON "Product"("submittedById");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
