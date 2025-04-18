import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMedications } from '../context/MedicationContext';

//TODO: Edit button da raboti

const MedicationDetailScreen = ({ route, navigation }) => {
  const { medicationId } = route.params;
  const { medications, deleteMedication } = useMedications();
  
  const medication = medications.find(med => med.id === medicationId);
  
  if (!medication) {
    return (
      <View style={styles.notFoundContainer}>
        <Text style={styles.notFoundText}>Medication not found</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  const handleDelete = () => {
    deleteMedication(medicationId);
    navigation.goBack();
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
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
            <Text style={styles.infoValue}>{medication.quantity}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Purpose:</Text>
            <Text style={styles.infoValue}>{medication.purpose}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Expiration Date:</Text>
            <Text style={styles.infoValue}>{formatDate(medication.expirationDate)}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Added On:</Text>
            <Text style={styles.infoValue}>{formatDate(medication.addedDate)}</Text>
          </View>
        </View>
        
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => navigation.navigate('EditMedication', { medicationId })}
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
          {isExpiringSoon(medication.expirationDate) ? (
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
      </ScrollView>
    </View>
  );
};

// Helper function to check if medication is expiring soon
const isExpiringSoon = (dateString) => {
  const expDate = new Date(dateString);
  const today = new Date();
  const diffTime = expDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 30 && diffDays > 0;
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
});

export default MedicationDetailScreen;