//import { PrismaClient, MedicineUnit } from '../../prisma/app/generated/prisma/client';
import { PrismaClient, MedicineUnit } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const filePath = path.join(__dirname, 'shortenedData.json');
  const fileContent = await fs.readFile(filePath, 'utf-8');
  const data = JSON.parse(fileContent);

  for (const key in data) {
    const med = data[key];

    await prisma.presetMedicine.upsert({
      where: { name: med.name },
      update: {},
      create: {
        name: med.name,
        category: med.category,
        unit: med.unit as MedicineUnit,
        description: med.description,
        precautions: med.precautions,
        adverseReactions: med.adverse_reactions,
        dosageInstructions: med.dosage_and_administration,
        isFDA: true,
      },
    });
  }

  console.log('Preset medicines inserted successfully.');
}

main()
  .catch((e) => {
    console.error('Error inserting medicines:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
