-- AlterTable
ALTER TABLE `Offer` ADD COLUMN `foodType` ENUM('snack', 'meal', 'beverage', 'other') NULL DEFAULT 'other',
    ADD COLUMN `taste` ENUM('sweet', 'salty', 'both', 'neutral') NULL DEFAULT 'neutral';
