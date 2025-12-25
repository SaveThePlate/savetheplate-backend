-- Safe migration: Only creates the Rating table
-- This will NOT delete or modify any existing data
-- Run this SQL directly on your database using your MySQL client

-- Step 1: Create the Rating table (safe - only creates if it doesn't exist)
CREATE TABLE IF NOT EXISTS `Rating` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderId` INTEGER NOT NULL,
    `providerId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `rating` INTEGER NOT NULL,
    `tags` JSON NULL,
    `comment` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Rating_orderId_key`(`orderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Step 2: Add foreign key constraint
-- Note: If you get an error that the constraint already exists, that's fine - just ignore it
-- The table creation above is safe and won't affect existing data
ALTER TABLE `Rating` 
ADD CONSTRAINT `Rating_orderId_fkey` 
FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

