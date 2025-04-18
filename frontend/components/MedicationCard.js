import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MedicationCard = ({ medication, onPress }) => {
  // Helper function to check if a medication is expiring soon
  const isExpiringSoon = () => {
    const today = new Date();
    const expDate = new Date(medication.expirationDate);
    
    // Calculate difference in days
    const diffTime = expDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays <= 30 && diffDays > 0;
  };
  
  // Format expiration date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  // Determine badge color based on purpose
  const getBadgeColor = (purpose) => {
    const purposeColors = {
      'Pain Reliever': '#4299e1', // blue
      'Anti-inflammatory': '#9f7aea', // purple
      'Antihistamine': '#48bb78', // green
      'Acid Reducer': '#ed8936', // orange
      'Cholesterol': '#ecc94b', // yellow
      'Blood Pressure': '#f56565', // red
      'Antibiotic': '#38b2ac', // teal
      'Diabetes': '#667eea', // indigo
      'Sleep Aid': '#9f7aea', // purple
      'Vitamin/Supplement': '#4fd1c5', // teal
    };
    
    return purposeColors[purpose] || '#a0aec0'; // default gray
  };
  
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.leftSection}>
        <View style={[styles.medicationIcon, { backgroundColor: getBadgeColor(medication.purpose) }]}>
          <Ionicons name="medical" size={20} color="white" />
        </View>
      </View>
      
      <View style={styles.middleSection}>
        <Text style={styles.medicationName}>{medication.name}</Text>
        <Text style={styles.purpose}>{medication.purpose}</Text>
        <View style={styles.medicationDetails}>
          <Text style={styles.detailText}>Qty: {medication.quantity}</Text>
          <Text style={styles.expiryDate}>Expires: {formatDate(medication.expirationDate)}</Text>
        </View>
      </View>
      
      <View style={styles.rightSection}>
        {isExpiringSoon() && (
          <View style={styles.expiryWarning}>
            <Ionicons name="alert-circle" size={14} color="#dd6b20" />
            <Text style={styles.expiryWarningText}>Expiring soon</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={20} color="#a0aec0" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  leftSection: {
    marginRight: 15,
  },
  medicationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  middleSection: {
    flex: 1,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 2,
  },
  purpose: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 5,
  },
  medicationDetails: {
    flexDirection: 'row',
  },
  detailText: {
    fontSize: 12,
    color: '#718096',
    marginRight: 12,
  },
  expiryDate: {
    fontSize: 12,
    color: '#718096',
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  expiryWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
    paddingHorizontal: 8,
    backgroundColor: '#FEEBC8',
    borderRadius: 12,
    marginBottom: 5,
  },
  expiryWarningText: {
    fontSize: 10,
    color: '#dd6b20',
    marginLeft: 3,
  },
});

export default MedicationCard;