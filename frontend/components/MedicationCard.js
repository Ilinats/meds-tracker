import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MedicationCard = ({ medication, onPress }) => {
  // Calculate days until expiry
  const daysUntilExpiry = () => {
    const today = new Date();
    const expiryDate = new Date(medication.expiryDate);
    const diffTime = Math.abs(expiryDate - today);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Function to get appropriate schedule display
  const getScheduleDisplay = () => {
    if (!medication.schedules || medication.schedules.length === 0) {
      return 'No schedule set';
    }

    // Get the first schedule for display
    const schedule = medication.schedules[0];
    
    // Format days
    const days = schedule.repeatDays.join(', ');
    
    // Format times
    const times = schedule.timesOfDay.map(time => {
      // Convert 24hr format to 12hr if needed
      const [hour, minute] = time.split(':');
      return `${hour}:${minute}`;
    }).join(', ');

    return `${days} at ${times}`;
  };

  // Get unit display
  const getUnitDisplay = () => {
    switch (medication.unit) {
      case 'PILLS':
        return 'pills';
      case 'ML':
        return 'ml';
      case 'MG':
        return 'mg';
      case 'G':
        return 'g';
      default:
        return medication.unit.toLowerCase();
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.name}>{medication.name}</Text>
        <View style={styles.quantityContainer}>
          <Text style={styles.quantity}>
            {medication.quantity} {getUnitDisplay()}
          </Text>
        </View>
      </View>
      
      <View style={styles.infoRow}>
        <Ionicons name="medical" size={16} color="#4299e1" />
        <Text style={styles.infoText}>{medication.category}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <Ionicons name="time-outline" size={16} color="#4299e1" />
        <Text style={styles.infoText}>{getScheduleDisplay()}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <Ionicons name="calendar-outline" size={16} color="#4299e1" />
        <Text style={styles.expiryText}>
          Expires in {daysUntilExpiry()} days
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
    flex: 1,
  },
  quantityContainer: {
    backgroundColor: '#ebf4ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  quantity: {
    color: '#4299e1',
    fontWeight: '500',
    fontSize: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 8,
    color: '#4a5568',
    fontSize: 14,
  },
  expiryText: {
    marginLeft: 8,
    color: '#ed8936', // Orange color for expiry
    fontSize: 14,
  },
});

export default MedicationCard;