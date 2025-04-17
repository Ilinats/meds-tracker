///DUE TO PROBLEMS WITH THE API NOT FETCHING DATA
///THAT IS VERY OBVIUSLY THERE I NEED TO DO THIS
import { fetchFdaMedications } from '../services/fdaFetcher';
import * as fs from 'fs';
import * as path from 'path';

const readPrecautionFromFile = (medicationName: string): string | null => {
    const filePath = path.join(__dirname, 'precautions', `${medicationName}.txt`);
    
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      return fileContent;
    } catch (error) {
      console.warn(` No file found for ${medicationName} at ${filePath}`);
      return null;
    }
  };

export async function fixData() {
  const medicationData = await fetchFdaMedications();

  for (let medicine of medicationData) {
    if (!medicine.precautions) {
      const precautionData = readPrecautionFromFile(medicine.name);
      
      if (precautionData) {
        medicine.precautions = precautionData;
      } else {
        console.log(`No precautions available for ${medicine.name}`);
      }
    }
  }

  return medicationData;
}

fixData().catch((error) => {
  console.error('Error fixing data:', error);
});
