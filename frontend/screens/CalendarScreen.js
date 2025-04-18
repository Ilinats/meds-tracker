import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList,
  Modal,
  TextInput,
  Platform
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useMedications } from '../context/MedicationContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

//TODO: Da ocvetq dneshniqt den i denqt, na kojto sum cuknala

const CalendarScreen = () => {
  const { medications } = useMedications();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [reminders, setReminders] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [reminderTime, setReminderTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedMedicationId, setSelectedMedicationId] = useState(null);
  const [notes, setNotes] = useState('');
  const [markedDates, setMarkedDates] = useState({});

  // Load reminders
  useEffect(() => {
    loadReminders();
  }, []);

  // Update marked dates when reminders change
  useEffect(() => {
    updateMarkedDates();
  }, [reminders]);

  const loadReminders = async () => {
    try {
      const reminderData = await AsyncStorage.getItem('reminders');
      if (reminderData) {
        setReminders(JSON.parse(reminderData));
      }
    } catch (error) {
      console.log('Error loading reminders:', error);
    }
  };

  const saveReminders = async (updatedReminders) => {
    try {
      await AsyncStorage.setItem('reminders', JSON.stringify(updatedReminders));
      setReminders(updatedReminders);
    } catch (error) {
      console.log('Error saving reminders:', error);
    }
  };

  const updateMarkedDates = () => {
    const dates = {};
    const today = new Date().toISOString().split('T')[0];
  
    reminders.forEach(reminder => {
      const dateKey = reminder.date;
      if (!dates[dateKey]) {
        dates[dateKey] = {
          marked: true,
          dotColor: '#4299e1',
          dots: [{ color: '#4299e1' }],
        };
      } else {
        if (!dates[dateKey].dots) {
          dates[dateKey].dots = [{ color: '#4299e1' }];
        } else {
          dates[dateKey].dots.push({ color: '#4299e1' });
        }
      }
    });
  
    // Highlight today
    if (!dates[today]) {
      dates[today] = {};
    }
    dates[today] = {
      ...dates[today],
      customStyles: {
        container: {
          backgroundColor: '#c6f6d5', // light green
        },
        text: {
          color: '#22543d',
          fontWeight: 'bold',
        },
      },
    };
  
    // Highlight selected date
    if (!dates[selectedDate]) {
      dates[selectedDate] = {};
    }
    dates[selectedDate] = {
      ...dates[selectedDate],
      selected: true,
      selectedColor: '#90cdf4', // light blue
    };
  
    setMarkedDates(dates);
  };  

  const handleDateSelect = (day) => {
    setSelectedDate(day.dateString);
  };

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setReminderTime(selectedTime);
    }
  };

  const addReminder = () => {
    if (!selectedMedicationId) {
      alert('Please select a medication');
      return;
    }

    const selectedMedication = medications.find(med => med.id === selectedMedicationId);
    if (!selectedMedication) return;

    const newReminder = {
      id: Date.now().toString(),
      medicationId: selectedMedicationId,
      medicationName: selectedMedication.name,
      date: selectedDate,
      time: reminderTime.toISOString(),
      notes: notes,
    };

    const updatedReminders = [...reminders, newReminder];
    saveReminders(updatedReminders);
    
    // Schedule notifications (would integrate with Expo Notifications in real app)
    scheduleNotification(newReminder);
    
    // Close modal and reset form
    setModalVisible(false);
    setSelectedMedicationId(null);
    setNotes('');
    setReminderTime(new Date());
  };

  const scheduleNotification = (reminder) => {
    // This would use Expo's notification API in a real app
    console.log('Scheduling notification for:', reminder);
    
    // Scheduling logic would go here:
    // 1. Schedule a notification 15 minutes before the reminder time
    // 2. If the medication has an expiration date and it's within a week, schedule another notification
  };

  const deleteReminder = (id) => {
    const updatedReminders = reminders.filter(reminder => reminder.id !== id);
    saveReminders(updatedReminders);
  };

  const filteredReminders = reminders.filter(reminder => reminder.date === selectedDate);

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Medication Calendar</Text>
      </View>
      
        <Calendar
            current={selectedDate}
            onDayPress={handleDateSelect}
            markedDates={markedDates}
            markingType="custom"
            theme={{
                todayTextColor: '#4299e1',
                selectedDayBackgroundColor: '#4299e1',
                dotColor: '#4299e1',
                arrowColor: '#4299e1',
            }}
        />

      
      <View style={styles.reminderListContainer}>
        <View style={styles.reminderHeader}>
          <Text style={styles.reminderHeaderText}>
            Reminders for {new Date(selectedDate).toLocaleDateString()}
          </Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
        
        {filteredReminders.length === 0 ? (
          <View style={styles.emptyReminders}>
            <Ionicons name="calendar-outline" size={40} color="#cbd5e0" />
            <Text style={styles.emptyRemindersText}>No reminders for this date</Text>
          </View>
        ) : (
          <FlatList
            data={filteredReminders}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.reminderItem}>
                <View style={styles.reminderInfo}>
                  <Text style={styles.reminderTime}>{formatTime(item.time)}</Text>
                  <Text style={styles.reminderMedName}>{item.medicationName}</Text>
                  {item.notes ? (
                    <Text style={styles.reminderNotes}>{item.notes}</Text>
                  ) : null}
                </View>
                <TouchableOpacity 
                  onPress={() => deleteReminder(item.id)}
                  style={styles.deleteButton}
                >
                  <Ionicons name="trash-outline" size={20} color="#e53e3e" />
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>
      
      {/* Add Reminder Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Medication Reminder</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#4a5568" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalLabel}>Date</Text>
            <View style={styles.dateDisplay}>
              <Text>{new Date(selectedDate).toLocaleDateString()}</Text>
            </View>
            
            <Text style={styles.modalLabel}>Time</Text>
            <TouchableOpacity 
              style={styles.timePickerButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Text>{reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              <Ionicons name="time-outline" size={20} color="#4a5568" />
            </TouchableOpacity>
            
            {showTimePicker && (
              <DateTimePicker
                value={reminderTime}
                mode="time"
                display="default"
                onChange={handleTimeChange}
              />
            )}
            
            <Text style={styles.modalLabel}>Select Medication</Text>
            <View style={styles.medicationList}>
              <FlatList
                data={medications}
                keyExtractor={(item) => item.id}
                horizontal={false}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={[
                      styles.medicationOption,
                      selectedMedicationId === item.id && styles.selectedMedicationOption
                    ]}
                    onPress={() => setSelectedMedicationId(item.id)}
                  >
                    <Text 
                      style={[
                        styles.medicationOptionText,
                        selectedMedicationId === item.id && styles.selectedMedicationOptionText
                      ]}
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={styles.noMedicationsText}>
                    No medications added yet. Please add medications first.
                  </Text>
                }
              />
            </View>
            
            <Text style={styles.modalLabel}>Notes (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any notes about this reminder"
              multiline
            />
            
            <TouchableOpacity 
              style={styles.saveReminderButton}
              onPress={addReminder}
              disabled={medications.length === 0}
            >
              <Text style={styles.saveReminderButtonText}>Save Reminder</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  reminderListContainer: {
    flex: 1,
    padding: 20,
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  reminderHeaderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#4299e1',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    marginLeft: 5,
    fontWeight: '500',
  },
  emptyReminders: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  emptyRemindersText: {
    marginTop: 10,
    fontSize: 16,
    color: '#718096',
  },
  reminderItem: {
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
  reminderInfo: {
    flex: 1,
  },
  reminderTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  reminderMedName: {
    fontSize: 14,
    color: '#4a5568',
    marginTop: 2,
  },
  reminderNotes: {
    fontSize: 12,
    color: '#718096',
    marginTop: 5,
    fontStyle: 'italic',
  },
  deleteButton: {
    padding: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4a5568',
    marginBottom: 8,
    marginTop: 8,
  },
  dateDisplay: {
    backgroundColor: '#f7fafc',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  timePickerButton: {
    backgroundColor: '#f7fafc',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  medicationList: {
    maxHeight: 150,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    marginBottom: 10,
  },
  medicationOption: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  selectedMedicationOption: {
    backgroundColor: '#ebf8ff',
  },
  medicationOptionText: {
    fontSize: 16,
    color: '#4a5568',
  },
  selectedMedicationOptionText: {
    color: '#3182ce',
    fontWeight: '500',
  },
  noMedicationsText: {
    padding: 15,
    color: '#718096',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  notesInput: {
    backgroundColor: '#f7fafc',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveReminderButton: {
    backgroundColor: '#4299e1',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 30,
  },
  saveReminderButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CalendarScreen;