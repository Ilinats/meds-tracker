import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { medicineApi } from '../services/api';
import { format } from 'date-fns';

const MedicationDetailScreen = ({ route, navigation }) => {
  const { medicationId } = route.params;
  const recordIntakeMutation = medicineApi.useRecordIntake();
  const [presetDetails, setPresetDetails] = useState(null);
  
  // Get current medication
  const { data: medication, isLoading, refetch } = medicineApi.useUserMedicines();
  const currentMedication = medication?.find(med => med.id === medicationId);
  
  // Fetch all preset medicines
  const { 
    data: presetData, 
    isLoading: isLoadingPresets 
  } = medicineApi.usePresetMedicines({ search: '' });  // Empty search to get all presets
  
  // Find matching preset medicine when data is available
  useEffect(() => {
    if (currentMedication?.presetMedicineId && presetData?.medicines) {
      const matchingPreset = presetData.medicines.find(
        preset => preset.id === currentMedication.presetMedicineId
      );
      setPresetDetails(matchingPreset);
    }
  }, [currentMedication, presetData]);

  const handleTakeMedication = async (scheduleId) => {
    try {
      console.log('Recording intake for medication:', scheduleId);
      const medicationId = scheduleId;

      console.log('Recording intake for medication ID:', medicationId);
      console.log('Taken at:', new Date());

      const result = await recordIntakeMutation.mutateAsync({ 
        scheduleId: medicationId,
        data: { takenAt: new Date() }
      });
      
      Alert.alert('Success', 'Medication intake recorded');
      refetch();
    } catch (error) {
      console.error('Error recording intake:', error);
      Alert.alert('Error', 'Failed to record medication intake');
    }
  };

  const handleDeleteMedication = async () => {
    Alert.alert(
      'Delete Medication',
      'Are you sure you want to delete this medication?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await medicineApi.removeFromCollection(medicationId);
              Alert.alert('Success', 'Medication deleted successfully!');
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting medication:', error);
              Alert.alert('Error', 'Failed to delete medication. Please try again.');
            }
          }
        }
      ]
    );
  };

  if (isLoading || !currentMedication) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3F51B5" />
      </View>
    );
  }

  const daysUntilExpiry = Math.ceil((new Date(currentMedication.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
  const isLowStock = currentMedication.quantity <= 5;
  const isExpiringSoon = daysUntilExpiry <= 7;

  // Helper function to render list items
  const renderListItems = (items) => {
    return items?.map((item, index) => (
      <View key={index} style={styles.listItem}>
        <Text style={styles.listItemBullet}>•</Text>
        <Text style={styles.listItemText}>{item}</Text>
      </View>
    ));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#3F51B5" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Medication Details</Text>
        <TouchableOpacity>
            <Ionicons name="checkmark" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.medicationName}>{currentMedication.name}</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Quantity:</Text>
          <Text style={styles.value}>{currentMedication.quantity} {currentMedication.unit}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Category:</Text>
          <Text style={styles.value}>{currentMedication.category}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Expiry Date:</Text>
          <Text style={styles.value}>{format(new Date(currentMedication.expiryDate), 'MMM dd, yyyy')}</Text>
        </View>
        {isLowStock && (
          <View style={styles.warningContainer}>
            <Ionicons name="warning" size={20} color="#E53E3E" />
            <Text style={styles.warningText}>Low stock: {currentMedication.quantity} remaining</Text>
          </View>
        )}
        {isExpiringSoon && (
          <View style={styles.warningContainer}>
            <Ionicons name="warning" size={20} color="#ECC94B" />
            <Text style={styles.warningText}>Expires in {daysUntilExpiry} days</Text>
          </View>
        )}
      </View>

      {/* Preset medication details section */}
      {(currentMedication.isPreset || currentMedication.presetMedicineId) && (
        <View style={styles.presetInfoContainer}>
          <Text style={styles.sectionTitle}>Medication Information</Text>
          
          {isLoadingPresets ? (
            <ActivityIndicator size="small" color="#3F51B5" />
          ) : presetDetails ? (
            <>
              {presetDetails.description && (
                <View style={styles.presetSection}>
                  <Text style={styles.presetSectionTitle}>Description</Text>
                  <Text style={styles.presetSectionText}>{presetDetails.description}</Text>
                </View>
              )}
              
              {presetDetails.dosageInstructions && presetDetails.dosageInstructions.length > 0 && (
                <View style={styles.presetSection}>
                  <Text style={styles.presetSectionTitle}>Dosage Instructions</Text>
                  {renderListItems(presetDetails.dosageInstructions)}
                </View>
              )}
              
              {presetDetails.precautions && presetDetails.precautions.length > 0 && (
                <View style={styles.presetSection}>
                  <Text style={styles.presetSectionTitle}>Precautions</Text>
                  {renderListItems(presetDetails.precautions)}
                </View>
              )}
              
              {presetDetails.adverseReactions && presetDetails.adverseReactions.length > 0 && (
                <View style={styles.presetSection}>
                  <Text style={styles.presetSectionTitle}>Adverse Reactions</Text>
                  {renderListItems(presetDetails.adverseReactions)}
                </View>
              )}
              
              {presetDetails.isFDA && (
                <View style={styles.fdaApproved}>
                  <Ionicons name="checkmark-circle" size={20} color="#38A169" />
                  <Text style={styles.fdaText}>FDA Approved</Text>
                </View>
              )}
            </>
          ) : (
            <Text style={styles.noPresetDataText}>Additional information unavailable</Text>
          )}
        </View>
      )}

      <View style={styles.schedulesContainer}>
        <Text style={styles.sectionTitle}>Schedules</Text>
        {currentMedication.schedules?.map((schedule, index) => (
          <View key={index} style={styles.scheduleCard}>
            <View style={styles.scheduleHeader}>
              <Text style={styles.scheduleTime}>{schedule.timesOfDay.join(', ')}</Text>
              <Text style={styles.scheduleDosage}>{schedule.dosageAmount} {currentMedication.unit}</Text>
            </View>
            <View style={styles.scheduleDays}>
              {schedule.repeatDays.map((day, i) => (
                <Text key={i} style={styles.dayChip}>{day}</Text>
              ))}
            </View>
            <TouchableOpacity
              style={styles.takeButton}
              onPress={() => handleTakeMedication(schedule.id)}
            >
              <Text style={styles.takeButtonText}>Take Now</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={handleDeleteMedication}
      >
        <Text style={styles.deleteButtonText}>Delete Medication</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2d3748',
  },
  card: {
    backgroundColor: 'white',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  medicationName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    color: '#718096',
  },
  value: {
    fontSize: 16,
    color: '#2d3748',
    fontWeight: '500',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  warningText: {
    color: '#E53E3E',
    marginLeft: 8,
    fontSize: 14,
  },
  schedulesContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 16,
  },
  scheduleCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  scheduleTime: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2d3748',
  },
  scheduleDosage: {
    fontSize: 16,
    color: '#718096',
  },
  scheduleDays: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  dayChip: {
    backgroundColor: '#EBF8FF',
    color: '#3182CE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
    fontSize: 12,
  },
  takeButton: {
    backgroundColor: '#38A169',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  takeButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#E53E3E',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  updateButton: {
    backgroundColor: '#3F51B5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  updateButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Styles for preset medication details
  presetInfoContainer: {
    backgroundColor: 'white',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  presetSection: {
    marginBottom: 16,
  },
  presetSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 8,
  },
  presetSectionText: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 20,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingRight: 8,
  },
  listItemBullet: {
    fontSize: 14,
    color: '#3182CE',
    marginRight: 8,
    marginTop: 2,
  },
  listItemText: {
    fontSize: 14,
    color: '#4A5568',
    flex: 1,
    lineHeight: 20,
  },
  fdaApproved: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FFF4',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  fdaText: {
    color: '#38A169',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  noPresetDataText: {
    fontSize: 14,
    color: '#718096',
    fontStyle: 'italic',
  },
});

export default MedicationDetailScreen;