import React from 'react';
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
import { useMedications } from '../context/MedicationContext';
import { useQuery } from '@tanstack/react-query';
import { medicineApi } from '../services/api';

const MedicationDetailScreen = ({ route, navigation }) => {
  const { medicationId } = route.params;
  const { deleteMedication, medications } = useMedications();
  
  // First check if we already have this medication in our context
  // Find the medication in the context's medications array
  const contextMedication = medications?.find(med => med.id === medicationId);
  
  // Use a specific query for this medication to get fresh data
  // Note: getMedicineDetails doesn't exist in the api.js you provided, so we'll 
  // need to adapt to use what's available
  const { 
    data: medicationDetail, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['medication', medicationId],
    // Use the proper endpoint based on the API implementation
    queryFn: async () => {
      // Since there's no direct getMedicineDetails function in the provided API,
      // we can use the existing data from context as a fallback
      if (contextMedication) {
        return contextMedication;
      }
      
      // If you need to fetch fresh data, you would implement this
      // For now, throw an error if not in context since API doesn't have this endpoint
      throw new Error("Medication details not available");
    },
    // Initialize with context data to avoid loading state if already available
    initialData: contextMedication
  });
  
  // Use the medication data from either source
  const medication = medicationDetail || contextMedication;
  
  const handleDelete = () => {
    Alert.alert(
      "Delete Medication",
      "Are you sure you want to delete this medication?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: async () => {
          const success = await deleteMedication(medicationId);
          if (success) {
            navigation.goBack();
          } else {
            Alert.alert("Error", "Failed to delete medication. Please try again.");
          }
        }},
      ]
    );
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4299e1" />
        <Text style={styles.loadingText}>Loading medication details...</Text>
      </View>
    );
  }
  
  if (error || !medication) {
    return (
      <View style={styles.notFoundContainer}>
        <Text style={styles.notFoundText}>
          {error ? `Error loading medication: ${error.message}` : 'Medication not found'}
        </Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#4a5568" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Medication Details</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.medicationHeader}>
          <View style={styles.medicationIcon}>
            <Ionicons name="medical" size={30} color="white" />
          </View>
          <Text style={styles.medicationName}>{medication.name}</Text>
        </View>
        
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Quantity:</Text>
            <Text style={styles.infoValue}>
              {medication.quantity} {medication.unit?.toLowerCase() || 'pills'}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Category:</Text>
            <Text style={styles.infoValue}>{medication.category}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Expiration Date:</Text>
            <Text style={styles.infoValue}>
              {formatDate(medication.expiryDate || medication.expirationDate)}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Added On:</Text>
            <Text style={styles.infoValue}>{formatDate(medication.createdAt)}</Text>
          </View>
        </View>
        
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => navigation.navigate('EditMedication', { 
              medicationId,
              medication // Pass the medication data to the edit screen
            })}
          >
            <Ionicons name="pencil" size={20} color="white" />
            <Text style={styles.buttonText}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={handleDelete}
          >
            <Ionicons name="trash" size={20} color="white" />
            <Text style={styles.buttonText}>Delete</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Expiration Information</Text>
          {isExpiringSoon(medication.expiryDate || medication.expirationDate) ? (
            <View style={styles.expiryWarning}>
              <Ionicons name="warning" size={20} color="#dd6b20" />
              <Text style={styles.expiryWarningText}>
                This medication expires in less than 30 days
              </Text>
            </View>
          ) : null}
          
          <Text style={styles.expiryAdvice}>
            Proper storage can help maintain medication effectiveness. Always check with your 
            pharmacist about specific storage requirements.
          </Text>
        </View>

        {medication.schedules && medication.schedules.length > 0 && (
          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Dosage Schedule</Text>
            {medication.schedules.map((schedule, index) => (
              <View key={schedule.id || index} style={styles.scheduleItem}>
                <Text style={styles.scheduleTimesTitle}>Times per day:</Text>
                <View style={styles.timesContainer}>
                  {schedule.timesOfDay.map((time, timeIndex) => (
                    <Text key={timeIndex} style={styles.timeChip}>{time}</Text>
                  ))}
                </View>
                <Text style={styles.scheduleDosage}>
                  Dosage: {schedule.dosageAmount} {medication.unit?.toLowerCase() || 'pill'}(s)
                </Text>
                
                <Text style={styles.scheduleDaysTitle}>Days:</Text>
                <View style={styles.daysContainer}>
                  {schedule.repeatDays.map((day, dayIndex) => (
                    <Text key={dayIndex} style={styles.dayChip}>{formatDay(day)}</Text>
                  ))}
                </View>
                
                <TouchableOpacity 
                  style={styles.takeButton}
                  onPress={() => handleTakeMedication(schedule.id)}
                >
                  <Ionicons name="checkmark-circle" size={16} color="white" />
                  <Text style={styles.takeButtonText}>Log Intake</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

// Helper function to check if medication is expiring soon
const isExpiringSoon = (dateString) => {
  if (!dateString) return false;
  const expDate = new Date(dateString);
  const today = new Date();
  const diffTime = expDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 30 && diffDays > 0;
};

// Helper function to format day abbreviations
const formatDay = (day) => {
  const days = {
    'MON': 'Monday',
    'TUE': 'Tuesday',
    'WED': 'Wednesday',
    'THU': 'Thursday',
    'FRI': 'Friday',
    'SAT': 'Saturday',
    'SUN': 'Sunday'
  };
  return days[day] || day;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  medicationHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  medicationIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4299e1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  medicationName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3748',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#edf2f7',
  },
  infoLabel: {
    fontSize: 16,
    color: '#718096',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#2d3748',
    fontWeight: '400',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 15,
  },
  expiryWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffaf0',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  expiryWarningText: {
    color: '#dd6b20',
    marginLeft: 10,
    fontSize: 14,
  },
  expiryAdvice: {
    fontSize: 14,
    color: '#718096',
    lineHeight: 22,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  editButton: {
    backgroundColor: '#4299e1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
  },
  deleteButton: {
    backgroundColor: '#e53e3e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    flex: 1,
    marginLeft: 10,
  },
  buttonText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notFoundText: {
    fontSize: 18,
    color: '#4a5568',
    marginBottom: 20,
  },
  backButtonText: {
    color: '#4299e1',
    fontSize: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#4a5568',
  },
  scheduleItem: {
    backgroundColor: '#f7fafc',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  scheduleTimesTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4a5568',
    marginBottom: 5,
  },
  scheduleDaysTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4a5568',
    marginTop: 10,
    marginBottom: 5,
  },
  timesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  timeChip: {
    backgroundColor: '#ebf8ff',
    color: '#3182ce',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    marginRight: 5,
    marginBottom: 5,
    fontSize: 12,
  },
  dayChip: {
    backgroundColor: '#e9f5f2',
    color: '#38a169',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    marginRight: 5,
    marginBottom: 5,
    fontSize: 12,
  },
  scheduleDosage: {
    fontSize: 14,
    color: '#4a5568',
    fontWeight: '500',
  },
  takeButton: {
    backgroundColor: '#38a169',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    marginTop: 5,
  },
  takeButtonText: {
    color: 'white',
    marginLeft: 5,
    fontSize: 14,
    fontWeight: '500',
  }
});

export default MedicationDetailScreen;