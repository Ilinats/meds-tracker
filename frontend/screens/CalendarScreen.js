import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, SafeAreaView, Alert, ScrollView } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { format, parseISO, isWithinInterval, isSameDay, isToday } from 'date-fns';
import { medicineApi } from '../services/api';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

//TODO: da pazq v async storage-a dali sym vzela medikationite, zashtotot sega kato izlqza ot stranicata to se refreshva

const CalendarScreen = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [medications, setMedications] = useState([]);
  const [markedDates, setMarkedDates] = useState({});
  const [takenMeds, setTakenMeds] = useState([]);

  const recordIntakeMutation = medicineApi.useRecordIntake();
  
  useFocusEffect(
    useCallback(() => {
      loadMedications();
    }, [])
  );  
  
  const loadMedications = async () => {
    try {
      const data = await medicineApi.getUserMedicines();
      
      const medicationsArray = Array.isArray(data) ? data : data.medicines || [];
      
      setMedications(medicationsArray);
      updateMarkedDates(medicationsArray);
      
      setTakenMeds([]);
    } catch (error) {
      console.error('Error loading medications:', error);
      Alert.alert('Error', 'Failed to load medications');
    }
  };
  
  const updateMarkedDates = (meds) => {
    const marked = {};
    
    meds.forEach(med => {
      const startDate = new Date(med.startDate);
      const endDate = new Date(med.endDate);
      
      let currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'long' });

        const isScheduled = med.schedules.some(schedule => {
          const isDayScheduled = schedule.repeatDays.includes(dayOfWeek);
          return isDayScheduled;
        });

        if (isScheduled) {
          marked[dateStr] = {
            marked: true,
            dotColor: '#4299e1',
            selected: dateStr === selectedDate
          };
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });
    setMarkedDates(marked);
  };
  
  const getScheduledMedications = () => {
    if (!medications || medications.length === 0) {
      console.log('No medications available');
      return [];
    }
    
    const selectedDay = new Date(selectedDate);
    const dayOfWeek = selectedDay.toLocaleDateString('en-US', { weekday: 'long' });
    
    const medicationsForDay = medications.filter(med => {
      const startDate = new Date(med.startDate);
      const endDate = new Date(med.endDate);
      
      const selectedDayNoTime = new Date(selectedDay);
      selectedDayNoTime.setHours(0, 0, 0, 0);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      
      const isInDateRange = selectedDayNoTime >= startDate && selectedDayNoTime <= endDate;
      const isScheduledForDay = med.schedules.some(schedule => {
        const isScheduled = schedule.repeatDays.includes(dayOfWeek);
        return isScheduled;
      });
      
      return isInDateRange && isScheduledForDay;
    });
    
    
    const scheduledMeds = medicationsForDay.flatMap(med => {
      return med.schedules.flatMap(schedule => {
        return schedule.timesOfDay.map(time => {
          const medId = `${med.id}-${time}`;
          
          return {
            id: medId,
            medicineName: med.name,
            category: med.category,
            unit: med.unit,
            quantity: med.quantity,
            expiryDate: med.expiryDate,
            dosageAmount: schedule.dosageAmount,
            prescription: med.prescription,
            time: time,
            scheduleId: schedule.id,
            isTaken: takenMeds.includes(medId)
          };
        });
      });
    }).sort((a, b) => {
      return a.time.localeCompare(b.time);
    });
    
    return scheduledMeds;
  };
  
  const handleRecordIntake = async (medicationSchedule) => {
    try {
      console.log('Recording intake for medication:', medicationSchedule);
      const medicationId = medicationSchedule.scheduleId;

      console.log('Recording intake for medication ID:', medicationId);
      console.log('Taken at:', new Date());

      const result = await recordIntakeMutation.mutateAsync({ 
        scheduleId: medicationId,
        data: { takenAt: new Date() }
      });
      
      // Update local state to show button is pressed
      setTakenMeds(prev => [...prev, medicationSchedule.id]);
      
      Alert.alert('Success', 'Medication intake recorded');
    } catch (error) {
      console.error('Error recording intake:', error);
      Alert.alert('Error', 'Failed to record medication intake');
    }
  };
  
  const onDayPress = (day) => {
    setSelectedDate(day.dateString);
  };
  
  const formatTime = (timeString) => {
    if (timeString === "Night") return "20:00 PM";
    
    const [hours, minutes] = timeString.split(':');
    const hourNum = parseInt(hours, 10);
    const period = hourNum >= 12 ? 'PM' : 'AM';
    const hour12 = hourNum % 12 || 12;
    return `${hour12}:${minutes || '00'} ${period}`;
  };

  const getDateHeader = () => {
    if (!selectedDate) return 'Select a date';
    const date = parseISO(selectedDate);
    return format(date, 'EEEE, MMMM d, yyyy');
  };
  
  // Check if the selected date is today
  const isCurrentDay = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    
    return today.getTime() === selected.getTime();
  };
  
  const renderScheduleItem = ({ item }) => {
    const daysUntilExpiry = Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    const isLowStock = item.quantity <= 5;
    const isExpiringSoon = daysUntilExpiry <= 7;
    const canTakeMedication = isCurrentDay();
    
    return (
      <View style={styles.scheduleItem}>
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{formatTime(item.time)}</Text>
        </View>
        <View style={styles.medicineDetails}>
          <Text style={styles.medicineName}>{item.medicineName}</Text>
          <Text style={styles.dosageText}>
            {item.dosageAmount} {item.unit.toLowerCase()} • {item.category}
          </Text>
          {item.prescription && (
            <Text style={styles.prescriptionText}>{item.prescription}</Text>
          )}
          {isLowStock && (
            <View style={styles.warningContainer}>
              <Text style={styles.warningText}>Low stock: {item.quantity} remaining</Text>
            </View>
          )}
          {isExpiringSoon && (
            <View style={styles.warningContainer}>
              <Text style={styles.warningText}>Expires in {daysUntilExpiry} days</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={[
            styles.takeButton,
            item.isTaken ? styles.takenButton : styles.notTakenButton,
            !canTakeMedication && styles.disabledButton
          ]}
          onPress={() => handleRecordIntake(item)}
          disabled={!canTakeMedication || item.isTaken}
        >
          <Text style={styles.takeButtonText}>Taken</Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  const scheduledMeds = getScheduledMedications();
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Medication Calendar</Text>
      </View>
      
      <Calendar
        current={selectedDate}
        onDayPress={onDayPress}
        markedDates={{
          ...markedDates,
          [selectedDate]: {
            ...markedDates[selectedDate],
            selected: true
          }
        }}
        theme={{
          calendarBackground: '#ffffff',
          textSectionTitleColor: '#b6c1cd',
          selectedDayBackgroundColor: '#4299e1',
          selectedDayTextColor: '#ffffff',
          todayTextColor: '#4299e1',
          dayTextColor: '#2d4150',
          textDisabledColor: '#d9e1e8',
          dotColor: '#4299e1',
          selectedDotColor: '#ffffff',
          arrowColor: '#4299e1',
          monthTextColor: '#3F51B5',
          indicatorColor: '#3F51B5',
        }}
      />
      
      <ScrollView style={styles.scheduleContainer}>
        <Text style={styles.dateHeader}>{getDateHeader()}</Text>
        
        {scheduledMeds.length > 0 ? (
          <FlatList
            data={scheduledMeds}
            keyExtractor={(item) => item.id}
            renderItem={renderScheduleItem}
            contentContainerStyle={styles.scheduleList}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.emptySchedule}>
            <Text style={styles.emptyText}>No medications scheduled for this day.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    paddingTop: 50,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  scheduleContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  dateHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  scheduleList: {
    paddingBottom: 20,
  },
  scheduleItem: {
    flexDirection: 'row',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#5C6BC0',
  },
  timeContainer: {
    width: 80,
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3F51B5',
  },
  medicineDetails: {
    flex: 1,
    paddingLeft: 12,
  },
  medicineName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  dosageText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  prescriptionText: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  warningContainer: {
    backgroundColor: '#FFF5F5',
    padding: 4,
    borderRadius: 4,
    marginTop: 4,
  },
  warningText: {
    color: '#E53E3E',
    fontSize: 12,
  },
  takeButton: {
    padding: 8,
    borderRadius: 8,
    justifyContent: 'center',
    marginLeft: 8,
    width: 60,
    alignItems: 'center',
  },
  notTakenButton: {
    backgroundColor: '#4299e1', // Blue when not taken
  },
  takenButton: {
    backgroundColor: '#38A169', // Green when taken
  },
  disabledButton: {
    backgroundColor: '#a0aec0', // Gray when disabled
    opacity: 0.6,
  },
  takeButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  emptySchedule: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
});

export default CalendarScreen;