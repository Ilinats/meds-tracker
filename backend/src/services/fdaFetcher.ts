import axios from 'axios';

type FdaApiResponse = {
  results: Array<{
    description?: string[];
    precautions?: string[];
    dosage_and_administration?: string[];
    adverse_reactions?: string[];
  }>;
};

type FdaDrugInfo = {
  name: string;
  description?: string;
  precautions?: string;
  dosage_and_administration?: string;
  adverse_reactions?: string;
};

const medications = [
  'Lisinopril',
  'Amlodipine',
  'Losartan',
  'Glipizide',
  'Atorvastatin',
  'Simvastatin',
  'Gabapentin',
  'Carbamazepine',
  'Amoxicillin',
  'Azithromycin',
  'Ciprofloxacin',
  'Sertraline',
  'Hydrocodone',
  'Warfarin',
  'Apixaban',
];

export const fetchFdaMedications = async (): Promise<FdaDrugInfo[]> => {
  const results: FdaDrugInfo[] = [];

  for (const medName of medications) {
    try {
      const response = await axios.get<FdaApiResponse>('https://api.fda.gov/drug/label.json', {
        params: {
          search: `openfda.generic_name:"${medName}"`,
          limit: 1,
        },
      });

      const result = response.data.results[0];
      results.push({
        name: medName,
        description: result.description?.[0] ?? '',
        precautions: result.precautions?.[0] ?? '',
        dosage_and_administration: result.dosage_and_administration?.[0] ?? '',
        adverse_reactions: result.adverse_reactions?.[0] ?? '',
      });
    } catch (error) {
      console.warn(` Could not fetch data for: ${medName}`);
    }
  }

  return results;
};
