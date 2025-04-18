import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMedications } from '../context/MedicationContext';
import MedicationCard from '../components/MedicationCard';

const MedicationListScreen = ({ navigation }) => {
  const { medications, loadMedications } = useMedications();

  useEffect(() => {
    loadMedications();
  }, []);

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="medical-outline" size={60} color="#cbd5e0" />
      <Text style={styles.emptyText}>No medications added yet</Text>
      <Text style={styles.emptySubText}>
        Tap the + button below to add your first medication
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Medications</Text>
      </View>
      
      <FlatList
        data={medications}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <MedicationCard 
            medication={item} 
            onPress={() => navigation.navigate('MedicationDetail', { medicationId: item.id })}
          />
        )}
        contentContainerStyle={medications.length === 0 ? { flex: 1 } : { paddingBottom: 100 }}
        ListEmptyComponent={renderEmptyList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4a5568',
    marginTop: 20,
  },
  emptySubText: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default MedicationListScreen;