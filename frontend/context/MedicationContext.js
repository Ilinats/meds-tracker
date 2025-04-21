import React, { createContext, useContext } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { medicineApi } from '../services/api';
import { useUser } from './UserContext';

const MedicationContext = createContext(null);

export const useMedications = () => useContext(MedicationContext);

export const MedicationProvider = ({ children }) => {
  const queryClient = useQueryClient();
  const { isLoggedIn } = useUser();

  const {
    data: medications = [],
    isLoading: isMedicationsLoading,
    refetch: loadMedications,
  } = medicineApi.useUserMedicines({
    enabled: isLoggedIn,
    retry: false
  });

  const addMedicationMutation = medicineApi.useAddMedicine();
  const updateMedicationMutation = medicineApi.useUpdateMedicine();
  const removeMedicationMutation = medicineApi.useRemoveMedicine();
  const recordIntakeMutation = medicineApi.useRecordIntake();

  const { data: expiringMedicines = [] } = medicineApi.useExpiringMedicines({
    enabled: isLoggedIn,
    retry: false
  });
  
  const { data: lowStockMedicines = [] } = medicineApi.useLowStockMedicines({
    enabled: isLoggedIn,
    retry: false
  });

  const addMedication = async (medicationData) => {
    if (!isLoggedIn) return false;
    
    try {
      const mappedData = {
        name: medicationData.name,
        category: medicationData.category || 'Other',
        unit: medicationData.unit || 'PILLS',
        quantity: medicationData.quantity || 0,
        expiryDate: medicationData.expiryDate || new Date(),
        startDate: medicationData.startDate || null,
        endDate: medicationData.endDate || null,
        dosagePerDay: medicationData.dosagePerDay || 1,
        prescription: medicationData.prescription || null,
        presetMedicineId: medicationData.presetMedicineId || null,
        schedules: medicationData.schedules || []
      };

      await addMedicationMutation.mutateAsync(mappedData);
      return true;
    } catch (error) {
      console.error('Error adding medication:', error);
      return false;
    }
  };

  const updateMedication = async (id, medicationData) => {
    if (!isLoggedIn) return false;
    
    try {
      const mappedData = {
        name: medicationData.name,
        category: medicationData.category || 'Other',
        unit: medicationData.unit || 'PILLS',
        quantity: medicationData.quantity || 0,
        expiryDate: medicationData.expiryDate || new Date(),
        startDate: medicationData.startDate || null,
        endDate: medicationData.endDate || null,
        dosagePerDay: medicationData.dosagePerDay || 1,
        prescription: medicationData.prescription || null,
        schedules: medicationData.schedules || []
      };

      await updateMedicationMutation.mutateAsync({ id, data: mappedData });
      return true;
    } catch (error) {
      console.error('Error updating medication:', error);
      return false;
    }
  };

  const deleteMedication = async (id) => {
    if (!isLoggedIn) return false;
    
    try {
      await removeMedicationMutation.mutateAsync(id);
      return true;
    } catch (error) {
      console.error('Error deleting medication:', error);
      return false;
    }
  };

  const recordMedicineIntake = async (scheduleId, takenAt = new Date()) => {
    if (!isLoggedIn) return false;
    
    try {
      await recordIntakeMutation.mutateAsync({
        scheduleId,
        data: { takenAt }
      });
      return true;
    } catch (error) {
      console.error('Error recording intake:', error);
      return false;
    }
  };

  return (
    <MedicationContext.Provider
      value={{
        medications,
        isMedicationsLoading,
        loadMedications,
        addMedication,
        updateMedication,
        deleteMedication,
        recordMedicineIntake,
        expiringMedicines,
        lowStockMedicines
      }}
    >
      {children}
    </MedicationContext.Provider>
  );
};