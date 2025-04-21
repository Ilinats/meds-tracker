import React from 'react';
import { useRouter } from 'expo-router';
import MedicationListScreen from '../screens/MedicationListScreen';

export default function MedicationList() {
  const router = useRouter();
  return <MedicationListScreen navigation={router} />;
}