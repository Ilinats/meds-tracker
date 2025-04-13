-- CreateEnum
CREATE TYPE "MedicineUnit" AS ENUM ('PILLS', 'ML', 'MG', 'G');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PresetMedicine" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" "MedicineUnit" NOT NULL,
    "description" TEXT,
    "precautions" TEXT[],
    "adverseReactions" TEXT[],
    "dosageInstructions" TEXT[],
    "isFDA" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PresetMedicine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserMedicine" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" "MedicineUnit" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "isPreset" BOOLEAN NOT NULL DEFAULT false,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "dosagePerDay" DOUBLE PRECISION,
    "prescription" TEXT,
    "userId" TEXT NOT NULL,
    "presetMedicineId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserMedicine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicineSchedule" (
    "id" TEXT NOT NULL,
    "userMedicineId" TEXT NOT NULL,
    "timesOfDay" TEXT[],
    "repeatDays" TEXT[],
    "dosageAmount" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicineSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "PresetMedicine_name_key" ON "PresetMedicine"("name");

-- CreateIndex
CREATE INDEX "PresetMedicine_name_idx" ON "PresetMedicine"("name");

-- CreateIndex
CREATE INDEX "PresetMedicine_category_idx" ON "PresetMedicine"("category");

-- AddForeignKey
ALTER TABLE "UserMedicine" ADD CONSTRAINT "UserMedicine_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMedicine" ADD CONSTRAINT "UserMedicine_presetMedicineId_fkey" FOREIGN KEY ("presetMedicineId") REFERENCES "PresetMedicine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicineSchedule" ADD CONSTRAINT "MedicineSchedule_userMedicineId_fkey" FOREIGN KEY ("userMedicineId") REFERENCES "UserMedicine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicineSchedule" ADD CONSTRAINT "MedicineSchedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
