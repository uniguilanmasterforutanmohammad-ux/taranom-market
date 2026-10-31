-- AlterEnum
ALTER TYPE "ProductStatus" ADD VALUE 'AWAITING_PARENT';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "parentApprovedAt" TIMESTAMP(3);
