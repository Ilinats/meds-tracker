import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useMedications } from '../context/MedicationContext';

//TODO: kogato dobavqm novo lekarstvo, da ne me vrushta na ekrana sus starata na lekarstvoto, a na ekrana s lekarstvata
//TODO: da raboti strelkata nazad

// Mock data
const EXISTING_MEDICATIONS = [
  { id: 'med1', name: 'Acetaminophen (Tylenol)', category: 'Pain Reliever' },
  { id: 'med2', name: 'Ibuprofen (Advil)', category: 'Anti-inflammatory' },
  { id: 'med3', name: 'Aspirin', category: 'Pain Reliever' },
  { id: 'med4', name: 'Loratadine (Claritin)', category: 'Antihistamine' },
  { id: 'med5', name: 'Diphenhydramine (Benadryl)', category: 'Antihistamine' },
  { id: 'med6', name: 'Omeprazole (Prilosec)', category: 'Acid Reducer' },
  { id: 'med7', name: 'Simvastatin', category: 'Cholesterol' },
  { id: 'med8', name: 'Lisinopril', category: 'Blood Pressure' },
  { id: 'med9', name: 'Amoxicillin', category: 'Antibiotic' },
  { id: 'med10', name: 'Metformin', category: 'Diabetes' },
];

const CATEGORIES = [
  'Pain Reliever',
  'Anti-inflammatory',
  'Antihistamine',
  'Acid Reducer',
  'Cholesterol',
  'Blood Pressure',
  'Antibiotic',
  'Diabetes',
  'Sleep Aid',
  'Vitamin/Supplement',
  'Other',
];

const AddMedicationScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [medicationName, setMedicationName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [expirationDate, setExpirationDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const { addMedication } = useMedications();

  const resetFormAndGoBack = () => {
    setMedicationName('');
    setQuantity('');
    setExpirationDate(new Date());
    setSelectedCategory('');
    setCustomCategory('');
    setShowCustomForm(false);
    
    navigation.navigate('Medications');
  };

  const filteredMedications = EXISTING_MEDICATIONS.filter((med) =>
    med.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectExisting = (medication) => {
    setMedicationName(medication.name);
    setSelectedCategory(medication.category);
    setShowCustomForm(true);
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setExpirationDate(selectedDate);
    }
  };

  const handleSaveMedication = () => {
    if (!medicationName || !quantity) {
      alert('Please fill in all required fields');
      return;
    }

    if (isNaN(quantity) || parseInt(quantity) <= 0) {
      alert('Please enter a valid quantity.');
      return;
    }

    if (selectedCategory === 'Other' && !customCategory.trim()) {
      alert('Please provide a custom category.');
      return;
    }

    const finalCategory = selectedCategory === 'Other' ? customCategory : selectedCategory;

    if (expirationDate < new Date()) {
      alert('Expiration date cannot be in the past.');
        return;
    }

    const newMedication = {
      id: Date.now().toString(),
      name: medicationName,
      quantity: parseInt(quantity),
      expirationDate: expirationDate.toISOString(),
      purpose: finalCategory || 'Not specified',
      addedDate: new Date().toISOString(),
    };

    addMedication(newMedication);
    resetFormAndGoBack();
  };

  const renderCustomForm = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.formContainer}>
        <Text style={styles.formTitle}>Add New Medication</Text>

        <Text style={styles.label}>Medication Name*</Text>
        <TextInput
          style={styles.input}
          value={medicationName}
          onChangeText={setMedicationName}
          placeholder="Enter medication name"
        />

        <Text style={styles.label}>Quantity*</Text>
        <TextInput
          style={styles.input}
          value={quantity}
          onChangeText={setQuantity}
          placeholder="How many pills/tablets/etc."
          keyboardType="numeric"
        />

        <Text style={styles.label}>Expiration Date</Text>
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text>{expirationDate.toLocaleDateString()}</Text>
          <Ionicons name="calendar-outline" size={20} color="#4a5568" />
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={expirationDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}

        <Text style={styles.label}>Purpose/Category</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowCategoryPicker(!showCategoryPicker)}
        >
          <Text>{selectedCategory || 'Select a category'}</Text>
        </TouchableOpacity>

        {showCategoryPicker && (
          <View style={styles.categoryPicker}>
            <ScrollView style={{ maxHeight: 200 }}>
              {CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={styles.categoryOption}
                  onPress={() => {
                    setSelectedCategory(category);
                    setShowCategoryPicker(false);
                  }}
                >
                  <Text style={styles.categoryText}>{category}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {selectedCategory === 'Other' && (
          <>
            <Text style={styles.label}>Custom Category</Text>
            <TextInput
              style={styles.input}
              value={customCategory}
              onChangeText={setCustomCategory}
              placeholder="Enter custom category"
            />
          </>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.cancelButton} onPress={resetFormAndGoBack}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.saveButton} onPress={handleSaveMedication}>
            <Text style={styles.saveButtonText}>Save Medication</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderMedicationSelector = () => (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#718096" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search medications..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredMedications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.medicationItem} onPress={() => handleSelectExisting(item)}>
            <View>
              <Text style={styles.medicationName}>{item.name}</Text>
              <Text style={styles.medicationCategory}>{item.category}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#a0aec0" />
          </TouchableOpacity>
        )}
        ListFooterComponent={
          <TouchableOpacity
            style={styles.customMedicationButton}
            onPress={() => setShowCustomForm(true)}
          >
            <Ionicons name="add-circle-outline" size={24} color="#4299e1" />
            <Text style={styles.customMedicationText}>Add Custom Medication</Text>
          </TouchableOpacity>
        }
      />
    </View>
  );

  return (
    <View style={styles.mainContainer}>
        <TouchableOpacity style={styles.backButton} onPress={resetFormAndGoBack}>
            <Ionicons name="arrow-back" size={24} color="#4a5568" />
        </TouchableOpacity>
        <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={resetFormAndGoBack}>
            <Ionicons name="arrow-back" size={24} color="#4a5568" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
            {showCustomForm ? 'Add Medication' : 'Select Medication'}
            </Text>
        </View>

        {showCustomForm ? renderCustomForm() : renderMedicationSelector()}
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
    padding: 20,
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
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  medicationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2d3748',
  },
  medicationCategory: {
    fontSize: 14,
    color: '#718096',
    marginTop: 4,
  },
  customMedicationButton: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#4299e1',
    borderStyle: 'dashed',
  },
  customMedicationText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '500',
    color: '#4299e1',
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2d3748',
    marginTop: 10,
    marginBottom: 5,
  },
  input: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  categoryPicker: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 5,
    marginBottom: 10,
  },
  categoryOption: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  categoryText: {
    fontSize: 16,
    color: '#2d3748',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#e53e3e',
    padding: 12,
    borderRadius: 8,
    marginRight: 10,
  },
  cancelButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#38a169',
    padding: 12,
    borderRadius: 8,
  },
  saveButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default AddMedicationScreen;