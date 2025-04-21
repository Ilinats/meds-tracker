import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { medicineApi } from '../services/api';

const MedicationCard = ({ medication, onPress, onDelete }) => {
//   useEffect(() => {
//     // Check if quantity is 0 and delete if true
//     if (medication.quantity <= 0) {
//       Alert.alert(
//         'Empty Medication',
//         `${medication.name} has run out. It will be removed from your collection.`,
//         [
//           {
//             text: 'OK',
//             onPress: async () => {
//                 try {
//                     // console.log('Complete medication object:', medication);
//                     // console.log('Attempting to delete medication with ID:', medication.id);
                    
//                     // // Try forcing a small delay before deletion (to rule out timing issues)
//                     // await new Promise(resolve => setTimeout(resolve, 100));
                    
//                     // const result = await medicineApi.removeFromCollection(medication.id);
//                     // console.log('Deletion API response:', result);
                    
//                     // Call onDelete to update UI
//                     onDelete(medication.id);
                    
//                     Alert.alert('Success', 'Medication deleted successfully!');
//                 } catch (error) {
//                     console.error('Error response data:', error.response?.data);
//                     console.error('Error response status:', error.response?.status);
//                     console.error('Error message:', error.message);
//                     Alert.alert('Error', 'Failed to delete medication. Please try again.');
//                 }
//             }
//           }
//         ]
//       );
//     }
//   }, [medication.quantity]);

  const daysUntilExpiry = () => {
    const today = new Date();
    const expiryDate = new Date(medication.expiryDate);
    const diffTime = Math.abs(expiryDate - today);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const isLowStock = medication.quantity <= 5;
  
  const isExpiringSoon = daysUntilExpiry() <= 7;

  const getScheduleDisplay = () => {
    if (!medication.schedules || medication.schedules.length === 0) {
      return 'No schedule set';
    }

    const schedule = medication.schedules[0];
    
    const days = schedule.repeatDays.join(', ');
    
    const times = schedule.timesOfDay.map(time => {
      const [hour, minute] = time.split(':');
      return `${hour}:${minute}`;
    }).join(', ');

    return `${days} at ${times}`;
  };

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

      {(isLowStock || isExpiringSoon) && (
        <View style={styles.warningContainer}>
          {isLowStock && (
            <View style={styles.warningItem}>
              <Ionicons name="warning" size={16} color="#E53E3E" />
              <Text style={styles.warningText}>Low stock: {medication.quantity} remaining</Text>
            </View>
          )}
          {isExpiringSoon && (
            <View style={styles.warningItem}>
              <Ionicons name="warning" size={16} color="#ECC94B" />
              <Text style={styles.warningText}>Expires in {daysUntilExpiry()} days</Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    fontFamily: 'Comfortaa',
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
    fontFamily: 'Comfortaa',
  },
  quantityContainer: {
    backgroundColor: '#EBF8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontFamily: 'Comfortaa',
  },
  quantity: {
    fontSize: 14,
    color: '#3182CE',
    fontWeight: '500',
    fontFamily: 'Comfortaa',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    fontFamily: 'Comfortaa',
  },
  infoText: {
    fontSize: 14,
    color: '#4a5568',
    marginLeft: 8,
    fontFamily: 'Comfortaa',
  },
  expiryText: {
    fontSize: 14,
    color: '#4a5568',
    marginLeft: 8,
    fontFamily: 'Comfortaa',
  },
  warningContainer: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    fontFamily: 'Comfortaa',
  },
  warningText: {
    fontSize: 12,
    color: '#E53E3E',
    marginLeft: 8,
    fontFamily: 'Comfortaa',
  },
});

export default MedicationCard;