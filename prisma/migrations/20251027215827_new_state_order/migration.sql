-- AlterTable
ALTER TABLE `Order` ADD COLUMN `collectedAt` DATETIME(3) NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NULL,
    MODIFY `status` ENUM('expired', 'confirmed', 'cancelled', 'pending') NOT NULL DEFAULT 'pending';
