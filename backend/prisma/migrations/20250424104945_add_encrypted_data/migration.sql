/*
  Warnings:

  - A unique constraint covering the columns `[encryptionKey]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "encryptionKey" TEXT;

-- AlterTable
ALTER TABLE "UserMedicine" ADD COLUMN     "encryptedData" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_encryptionKey_key" ON "User"("encryptionKey");
