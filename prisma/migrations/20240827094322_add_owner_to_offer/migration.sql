/*
  Warnings:

  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Offer` ADD COLUMN `owner` VARCHAR(191) NOT NULL DEFAULT 'default_owner';

-- AlterTable
ALTER TABLE `User` DROP COLUMN `name`;
