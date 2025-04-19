import React, { createContext, useContext } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { medicineApi } from '../services/api';

const MedicationContext = createContext(null);

export const useMedications = () => useContext(MedicationContext);

export const MedicationProvider = ({ children }) => {
  const queryClient = useQueryClient();

  const {
    data: medications = [],
    isLoading: isMedicationsLoading,
    refetch: loadMedications,
  } = medicineApi.useUserMedicines();

  const addMedicationMutation = medicineApi.useAddMedicine();
  const updateMedicationMutation = medicineApi.useUpdateMedicine();
  const removeMedicationMutation = medicineApi.useRemoveMedicine();
  const recordIntakeMutation = medicineApi.useRecordIntake();

  const { data: expiringMedicines = [] } = medicineApi.useExpiringMedicines();
  const { data: lowStockMedicines = [] } = medicineApi.useLowStockMedicines();

  const addMedication = async (medicationData) => {
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
    try {
      await removeMedicationMutation.mutateAsync(id);
      return true;
    } catch (error) {
      console.error('Error deleting medication:', error);
      return false;
    }
  };

  const recordMedicineIntake = async (scheduleId, takenAt = new Date()) => {
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