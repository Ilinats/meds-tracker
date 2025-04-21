import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Alert,
  FlatList,
  ActivityIndicator,
  ImageBackground
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useMedications } from '../context/MedicationContext';
import { medicineApi } from '../services/api';

//TODO: opravii dezajna na schedule conteinera

const UNITS = ['PILLS', 'ML', 'MG', 'G', 'TABLET', 'CAPSULE', 'DROP', 'TEASPOON', 'TABLESPOON', 'PATCH'];

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

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const isValidTime = (time) => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

const isValidDay = (day) => {
  return DAYS.includes(day);
};

const AddMedicationScreen = ({ navigation }) => {
  const [medicationName, setMedicationName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [prescription, setPrescription] = useState('');
  const [dosagePerDay, setDosagePerDay] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showExpirationDatePicker, setShowExpirationDatePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPresetId, setSelectedPresetId] = useState(null);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [expirationDate, setExpirationDate] = useState(new Date());
  const [isScheduleModalVisible, setIsScheduleModalVisible] = useState(false);
  const [schedule, setSchedule] = useState({
    timesOfDay: ['8:00, 14:00'],
    repeatDays: ['Tuesday', 'Thursday'],
    dosageAmount: 1
  });

  const { 
    data: presetData, 
    isLoading: isLoadingPresets,
    error: presetError
  } = medicineApi.usePresetMedicines({ search: searchQuery });

  const { addMedication } = useMedications();

  const presetMedications = presetData?.medicines || [];

  const handleStartDateChange = (event, selectedDate) => {
    setShowStartDatePicker(false);
    if (selectedDate) setStartDate(selectedDate);
  };

  const handleEndDateChange = (event, selectedDate) => {
    setShowEndDatePicker(false);
    if (selectedDate) setEndDate(selectedDate);
  };

  const handleExpirationDateChange = (event, selectedDate) => {
    setShowExpirationDatePicker(false);
    if (selectedDate) setExpirationDate(selectedDate);
  };

  const handlePresetMedicationSelect = (medication) => {
    setMedicationName(medication.name);
    setQuantity(medication.quantity?.toString() || '');
    setSelectedCategory(medication.category);
    setSelectedPresetId(medication.id);
    setShowCustomForm(true);
  };

  const handleSaveMedication = async () => {
    // Validate times
    const invalidTimes = schedule.timesOfDay.filter(time => !isValidTime(time.trim()));
    if (invalidTimes.length > 0) {
      Alert.alert('Error', `Invalid time format: ${invalidTimes.join(', ')}. Please use 24-hour format (HH:MM)`);
      return;
    }

    // Validate days
    const invalidDays = schedule.repeatDays.filter(day => !isValidDay(day.trim()));
    if (invalidDays.length > 0) {
      Alert.alert('Error', `Invalid day: ${invalidDays.join(', ')}. Please select valid days.`);
      return;
    }

    if (!medicationName || !quantity || !startDate || !endDate || !selectedCategory || !dosagePerDay) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      Alert.alert('Error', 'Start date cannot be after end date.');
      return;
    }

    if (isNaN(dosagePerDay) || dosagePerDay <= 0) {
      Alert.alert('Error', 'Dosage per day must be a positive number.');
      return;
    }

    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert('Error', 'Quantity must be a positive number.');
      return;
    }

    if (schedule.dosageAmount <= 0) {
      Alert.alert('Error', 'Dosage amount must be a positive number.');
      return;
    }

    if (schedule.timesOfDay.length === 0) {
      Alert.alert('Error', 'Please select at least one time of day for the schedule.');
      return;
    }

    if (schedule.repeatDays.length === 0) {
      Alert.alert('Error', 'Please select at least one repeat day for the schedule.');
      return;
    }

    try {
      const medicationData = {
        name: medicationName,
        category: selectedCategory,
        unit: "PILLS",
        quantity: Number(quantity),
        expiryDate: expirationDate.toISOString(),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        dosagePerDay: Number(dosagePerDay),
        prescription: prescription,
        presetMedicineId: selectedPresetId,
        schedules: [schedule]
      };

      const success = await addMedication(medicationData);
      if (success) {
        Alert.alert('Success', 'Medication added successfully!');
        navigation.goBack();
      } else {
        Alert.alert('Error', 'Failed to add medication. Please try again.');
      }
    } catch (error) {
      console.error('Error adding medication:', error);
      Alert.alert('Error', 'An error occurred while adding the medication. Please try again.');
    }
  };

  const renderPresetList = () => (
    <ImageBackground 
      source={require('../assets/images/background8.jpg')}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search medications..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {isLoadingPresets ? (
        <ActivityIndicator size="large" color="#4299e1" style={styles.loader} />
      ) : presetError ? (
        <Text style={styles.errorText}>Error loading medications. Please try again.</Text>
      ) : (
        <FlatList
          data={presetMedications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.presetItem}
              onPress={() => handlePresetMedicationSelect(item)}
            >
              <Text style={styles.presetName}>{item.name}</Text>
              <Text style={styles.presetCategory}>{item.category}</Text>
              <Ionicons name="chevron-forward" size={20} color="#a0aec0" />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No medications found. Try another search.</Text>
          }
        />
      )}

      <TouchableOpacity
        style={styles.customButton}
        onPress={() => setShowCustomForm(true)}
      >
        <Ionicons name="add-circle-outline" size={24} color="#4299e1" />
        <Text style={styles.customButtonText}>Add Custom Medication</Text>
      </TouchableOpacity>
    </ImageBackground>
  );

  const renderForm = () => (
    <ImageBackground 
      source={require('../assets/images/background8.jpg')}
      style={styles.container}
      resizeMode="cover"
    >
      <KeyboardAvoidingView style={styles.container} behavior="padding">
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => {
              setShowCustomForm(false);
              setMedicationName('');
              setQuantity('');
              setSelectedCategory('');
              setSelectedPresetId(null);
            }}
          >
            <Ionicons name="arrow-back" size={28} color="#4a5568" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Medication</Text>
        </View>
        <ScrollView 
          style={styles.formContainer}
          contentContainerStyle={styles.formContentContainer}
          showsVerticalScrollIndicator={false}
        >
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
            placeholder="Enter quantity"
            keyboardType="numeric"
          />

          <Text style={styles.label}>Start Date*</Text>
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => setShowStartDatePicker(true)}
          >
            <Text>{startDate.toLocaleDateString()}</Text>
          </TouchableOpacity>

          {showStartDatePicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display="default"
              onChange={handleStartDateChange}
            />
          )}

          <Text style={styles.label}>End Date*</Text>
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => setShowEndDatePicker(true)}
          >
            <Text>{endDate.toLocaleDateString()}</Text>
          </TouchableOpacity>

          {showEndDatePicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display="default"
              onChange={handleEndDateChange}
            />
          )}

          <Text style={styles.label}>Expiry Date*</Text>
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => setShowExpirationDatePicker(true)}
          >
            <Text>{expirationDate.toLocaleDateString()}</Text>
          </TouchableOpacity>

          {showExpirationDatePicker && (
            <DateTimePicker
              value={expirationDate}
              mode="date"
              display="default"
              onChange={handleExpirationDateChange}
            />
          )}

          <Text style={styles.label}>Category*</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowCategoryPicker(!showCategoryPicker)}
          >
            <Text>{selectedCategory || 'Select a category'}</Text>
          </TouchableOpacity>

          {showCategoryPicker && (
            <View style={styles.categoryPickerContainer}>
              <ScrollView 
                style={styles.categoryPickerScroll}
                nestedScrollEnabled={true}
              >
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

          <Text style={styles.label}>Prescription (Optional)</Text>
          <TextInput
            style={styles.input}
            value={prescription}
            onChangeText={setPrescription}
            placeholder="Optional: Add prescription details"
          />

          <Text style={styles.label}>Dosage per Day*</Text>
          <TextInput
            style={styles.input}
            value={String(dosagePerDay)}
            onChangeText={(text) => setDosagePerDay(Number(text))}
            placeholder="How many times per day?"
            keyboardType="numeric"
          />

          <Text style={styles.label}>Schedule</Text>
          <View style={styles.scheduleContainer}>
            <Text style={styles.scheduleText}>Times of Day: {schedule.timesOfDay.join(', ')}</Text>
            <Text style={styles.scheduleText}>Repeat Days: {schedule.repeatDays.join(', ')}</Text>
            <Text style={styles.scheduleText}>Dosage Amount: {schedule.dosageAmount}</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setIsScheduleModalVisible(true)}
            >
              <Text style={styles.buttonText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveMedication}
          >
            <Text style={styles.saveButtonText}>Save Medication</Text>
          </TouchableOpacity>
        </ScrollView>

        <Modal
            visible={isScheduleModalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setIsScheduleModalVisible(false)}
            >
            <View style={styles.modalBackground}>
                <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Edit Schedule</Text>

                <Text style={styles.modalLabel}>Times of Day (comma separated)</Text>
                <TextInput
                    style={styles.modalInput}
                    value={schedule.timesOfDay.join(', ')}
                    onChangeText={(text) => setSchedule(prev => ({ ...prev, timesOfDay: text.split(',').map(item => item.trim()) }))}
                    placeholder="e.g., 8:00, 14:00"
                />

                <Text style={styles.modalLabel}>Repeat Days (comma separated)</Text>
                <TextInput
                    style={styles.modalInput}
                    value={schedule.repeatDays.join(', ')}
                    onChangeText={(text) => setSchedule(prev => ({ ...prev, repeatDays: text.split(',').map(item => item.trim()) }))}
                    placeholder="e.g., Monday, Wednesday"
                />

                <Text style={styles.modalLabel}>Dosage Amount</Text>
                <TextInput
                    style={styles.modalInput}
                    value={String(schedule.dosageAmount)}
                    onChangeText={(text) => setSchedule(prev => ({ ...prev, dosageAmount: Number(text) }))}
                    placeholder="e.g., 1"
                    keyboardType="numeric"
                />

                <View style={styles.modalButtonContainer}>
                    <TouchableOpacity 
                    style={[styles.modalButton, styles.cancelButton]} 
                    onPress={() => setIsScheduleModalVisible(false)}
                    >
                    <Text style={[styles.modalButtonText, {color: '#4a5568'}]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                    style={styles.modalButton} 
                    onPress={() => setIsScheduleModalVisible(false)}
                    >
                    <Text style={styles.modalButtonText}>Save</Text>
                    </TouchableOpacity>
                </View>
                </View>
            </View>
            </Modal>
      </KeyboardAvoidingView>
    </ImageBackground>
  );

  return showCustomForm ? renderForm() : renderPresetList();
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        fontFamily: 'Comfortaa',
    },
    searchContainer: {
        marginBottom: 16,
        marginTop: 20,
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    searchInput: {
        height: 60,
        fontSize: 16,
        marginTop: 30,
        backgroundColor: 'white',
        padding: 12,
        borderRadius: 10,
        borderWidth: 3,
        borderColor: '#4299e1',
        fontFamily: 'Comfortaa',
    },
    presetItem: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 8,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.25,
        shadowRadius: 1.84,
        elevation: 2,
        marginHorizontal: 16,
    },
    presetName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#2d3748',
        fontFamily: 'Comfortaa',
        flex: 1,
    },
    presetCategory: {
        fontSize: 12,
        color: '#718096',
        fontFamily: 'Comfortaa',
        marginLeft: 8,
        maxWidth: '60%',
        textAlign: 'right',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    customButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 8,
        marginTop: 16,
        borderWidth: 1,
        borderColor: '#4299e1',
        borderStyle: 'dashed',
        marginHorizontal: 16,
        marginBottom: 16,
    },
    customButtonText: {
        marginLeft: 8,
        fontSize: 16,
        fontWeight: '500',
        color: '#4299e1',
        fontFamily: 'Comfortaa',
    },
    loader: {
        marginTop: 20,
    },
    errorText: {
        textAlign: 'center',
        color: '#e53e3e',
        marginTop: 20,
    },
    emptyText: {
        textAlign: 'center',
        color: '#718096',
        marginTop: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        paddingHorizontal: 16,
        paddingTop: 40,
        fontFamily: 'Comfortaa',
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '600',
        color: '#2d3748',
        marginLeft: 8,
        fontFamily: 'Comfortaa',
    },
    formContainer: {
        flex: 1,
        marginTop: 20,
    },
    formContentContainer: {
        paddingHorizontal: 16,
        paddingBottom: 40,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2d3748',
        marginBottom: 8,
        fontFamily: 'Comfortaa',
    },
    input: {
        backgroundColor: 'white',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 16,
        fontFamily: 'Comfortaa',
    },
    datePickerButton: {
        backgroundColor: 'white',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 16,
    },
    categoryPickerContainer: {
        maxHeight: 200,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 16,
    },
    categoryPickerScroll: {
        maxHeight: 200,
    },
    categoryOption: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        fontFamily: 'Comfortaa',
    },
    categoryText: {
        fontSize: 13,
        color: '#2d3748',
        fontFamily: 'Comfortaa',
    },
    scheduleContainer: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 16,
    },
    scheduleText: {
        fontSize: 14,
        color: '#4a5568',
        marginBottom: 8,
        fontFamily: 'Comfortaa',
    },
    editButton: {
        backgroundColor: '#4299e1',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonText: {
        color: 'white',
        fontWeight: '600',
        fontFamily: 'Comfortaa',
    },
    saveButton: {
        backgroundColor: '#4299e1',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 24,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Comfortaa',
    },
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        backgroundColor: 'white',
        width: '100%',
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#2d3748',
        marginBottom: 20,
        fontFamily: 'Comfortaa',
        textAlign: 'center',
    },
    modalLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4a5568',
        marginBottom: 8,
        fontFamily: 'Comfortaa',
    },
    modalInput: {
        backgroundColor: '#f7fafc',
        padding: 14,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 20,
        fontFamily: 'Comfortaa',
        fontSize: 15,
    },
    modalButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    modalButton: {
        backgroundColor: '#4299e1',
        padding: 14,
        borderRadius: 10,
        flex: 1,
        marginHorizontal: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
    },
    cancelButton: {
        backgroundColor: '#cbd5e0',
    },
    modalButtonText: {
        color: 'white',
        textAlign: 'center',
        fontWeight: '600',
        fontFamily: 'Comfortaa',
        fontSize: 15,
    },
});

export default AddMedicationScreen;