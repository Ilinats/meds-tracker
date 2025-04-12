import { fetchFdaMedications } from './fdaFetcher';
import { FixData } from './fixUpData'
async function testFetchData() {
  try {
    const medicationsData = await FixData();

    medicationsData.forEach((medicine) => {
      console.log(`Data for ${medicine.name}:`);

      console.log('Precautions:', medicine.precautions ? medicine.precautions.slice(0, 100) : 'No precautions available');
      
      console.log('Description:', medicine.description ? medicine.description.slice(0, 100) : 'No description available');
      
      console.log('Dosage & Administration:', medicine.dosage_and_administration ? medicine.dosage_and_administration.slice(0, 100) : 'No dosage information available');
      
      console.log('Adverse Reactions:', medicine.adverse_reactions ? medicine.adverse_reactions.slice(0, 100) : 'No adverse reactions available');
      
      console.log('---');
    });
  } catch (error) {
    console.error('Error fetching medications data:', error);
  }
}

testFetchData();
