import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet,
  ActivityIndicator,
  ImageBackground
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { medicineApi } from '../services/api.ts';
import MedicationCard from '../components/MedicationCard';

const MedicationListScreen = ({ navigation }) => {
  const [medications, setMedications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadMedications();
    });

    return unsubscribe;
  }, [navigation]);

  const loadMedications = async () => {
    try {
      setIsLoading(true);
      const data = await medicineApi.getUserMedicines();
      setMedications(data);
    } catch (error) {
      console.error('Error loading medications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMedication = (medicationId) => {
    setMedications(prevMeds => prevMeds.filter(med => med.id !== medicationId));
  };

  const renderEmptyList = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#4299e1" />
          <Text style={styles.loadingText}>Loading medications...</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="medical-outline" size={60} color="#cbd5e0" />
        <Text style={styles.emptyText}>No medications added yet</Text>
        <Text style={styles.emptySubText}>
          Tap the + button below to add your first medication
        </Text>
      </View>
    );
  };

  return (
    <ImageBackground 
      source={require('../assets/images/background8.jpg')}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Medications</Text>
      </View>
      
      <FlatList
        data={medications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MedicationCard 
            medication={item} 
            onPress={() => navigation.navigate('MedicationDetail', { medicationId: item.id })}
            onDelete={handleDeleteMedication}
          />
        )}
        contentContainerStyle={medications?.length === 0 ? { flex: 1 } : { paddingBottom: 100 }}
        ListEmptyComponent={renderEmptyList}
        refreshing={isLoading}
        onRefresh={loadMedications}
      />
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 45,
    backgroundColor: '#f7fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e0',
    fontFamily: 'Comfortaa',
  },
  headerTitle: {
    fontSize: 24,
    color: '#2d3748',
    fontFamily: 'Comfortaa',
    fontWeight: '600'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#4a5568',
    marginTop: 20,
    fontFamily: 'Comfortaa',
  },
  emptySubText: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    marginTop: 10,
    fontFamily: 'Comfortaa',
  },
  loadingText: {
    fontSize: 16,
    color: '#4a5568',
    marginTop: 20,
    fontFamily: 'Comfortaa',
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: '#4299e1',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  }
});

export default MedicationListScreen;