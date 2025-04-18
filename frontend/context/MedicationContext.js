import React, { createContext, useState, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MedicationContext = createContext();

export const useMedications = () => useContext(MedicationContext);

export const MedicationProvider = ({ children }) => {
  const [medications, setMedications] = useState([]);

  const loadMedications = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
  
      const response = await fetch('http://<your-server>/api/medications', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      const json = await response.json();
  
      if (json.success) {
        setMedications(json.data); // assuming setMedications updates context state
      } else {
        console.log(json.error.message);
      }
    } catch (error) {
      console.log('Failed to load medications:', error);
    }
  };
  

  // Save medications to storage
  const saveMedications = async (updatedMedications) => {
    try {
      await AsyncStorage.setItem('medications', JSON.stringify(updatedMedications));
      setMedications(updatedMedications);
    } catch (error) {
      console.error('Error saving medications:', error);
    }
  };

  // Add a new medication
  const addMedication = (medication) => {
    const updatedMedications = [...medications, medication];
    saveMedications(updatedMedications);
  };

  // Delete a medication
  const deleteMedication = (medicationId) => {
    const updatedMedications = medications.filter(med => med.id !== medicationId);
    saveMedications(updatedMedications);
  };

  // Update an existing medication
  const updateMedication = (updatedMedication) => {
    const updatedMedications = medications.map(med => 
      med.id === updatedMedication.id ? updatedMedication : med
    );
    saveMedications(updatedMedications);
  };

  return (
    <MedicationContext.Provider 
      value={{ 
        medications, 
        loadMedications,
        addMedication,
        deleteMedication,
        updateMedication
      }}
    >
      {children}
    </MedicationContext.Provider>
  );
};