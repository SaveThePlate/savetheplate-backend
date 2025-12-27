-- AlterTable
ALTER TABLE `Order` ADD COLUMN `qrCodeToken` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Order_qrCodeToken_key` ON `Order`(`qrCodeToken`);

