-- AlterTable
ALTER TABLE `Order` ADD COLUMN `status` ENUM('pending', 'confirmed', 'cancelled') NOT NULL DEFAULT 'pending';
