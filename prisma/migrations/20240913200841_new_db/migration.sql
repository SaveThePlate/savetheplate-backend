-- AlterTable
ALTER TABLE `Offer` ALTER COLUMN `owner` DROP DEFAULT;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `location` VARCHAR(191) NULL,
    ADD COLUMN `phoneNumber` VARCHAR(191) NULL,
    ADD COLUMN `profileImage` VARCHAR(191) NULL;
