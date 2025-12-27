/*
  Warnings:

  - Made the column `updatedAt` on table `Order` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `Order` MODIFY `updatedAt` DATETIME(3) NOT NULL;
