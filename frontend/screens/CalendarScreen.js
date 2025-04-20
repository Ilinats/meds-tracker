import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, SafeAreaView, Alert } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { format, parseISO, isWithinInterval, isSameDay } from 'date-fns';
import { medicineApi } from '../services/api';

const CalendarScreen = () => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [markedDates, setMarkedDates] = useState({});
  const [daySchedule, setDaySchedule] = useState([]);
  
  const { data: userMedicines, isLoading, refetch } = medicineApi.useUserMedicines();
  
  // Process medications to create marked dates and daily schedules
  useEffect(() => {
    if (userMedicines) {
      processUserMedicines(userMedicines);
    }
  }, [userMedicines, selectedDate]);
  
  const processUserMedicines = (medicines) => {
    const newMarkedDates = {};
    const selectedDateSchedules = [];
    
    medicines.forEach(medicine => {
      if (!medicine.schedules || !medicine.startDate) return;
      
      const startDate = new Date(medicine.startDate);
      const endDate = medicine.endDate ? new Date(medicine.endDate) : new Date(2099, 11, 31);
      
      // Skip if medicine is not active yet or has expired
      if (new Date() > endDate || new Date() < startDate) return;
      
      medicine.schedules.forEach(schedule => {
        // Process each schedule
        const { repeatDays, timesOfDay, dosageAmount } = schedule;
        
        // Map day names to day numbers (0 = Sunday, 1 = Monday, etc.)
        const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
        const repeatDayNumbers = repeatDays.map(day => dayMap[day]);
        
        // Mark dates in the calendar (for the current month and next month)
        const today = new Date();
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 2, 0); // End of next month
        
        for (let d = new Date(startDate); d <= monthEnd && d <= endDate; d.setDate(d.getDate() + 1)) {
          if (
            d >= startDate && 
            d <= endDate && 
            repeatDayNumbers.includes(d.getDay())
          ) {
            const dateStr = format(d, 'yyyy-MM-dd');
            if (!newMarkedDates[dateStr]) {
              newMarkedDates[dateStr] = { marked: true, dotColor: '#5C6BC0' };
            }
            
            // If this is the selected date, add to day schedule
            if (isSameDay(d, parseISO(selectedDate))) {
              timesOfDay.forEach(time => {
                selectedDateSchedules.push({
                  id: `${medicine.id}-${time}`,
                  medicineId: medicine.id,
                  scheduleId: schedule.id,
                  medicineName: medicine.name,
                  time,
                  dosageAmount,
                  unit: medicine.unit,
                  category: medicine.category,
                  prescription: medicine.prescription,
                  quantity: medicine.quantity,
                  expiryDate: medicine.expiryDate
                });
              });
            }
          }
        }
      });
    });
    
    // Highlight selected date
    newMarkedDates[selectedDate] = {
      ...newMarkedDates[selectedDate],
      selected: true,
      selectedColor: '#3F51B5'
    };
    
    // Sort schedules by time
    selectedDateSchedules.sort((a, b) => {
      return a.time.localeCompare(b.time);
    });
    
    setMarkedDates(newMarkedDates);
    setDaySchedule(selectedDateSchedules);
  };
  
  const handleTakeMedication = async (medicineId, scheduleId) => {
    try {
      await medicineApi.recordIntake(medicineId, scheduleId);
      Alert.alert('Success', 'Medication intake recorded successfully!');
      refetch(); // Refresh the data
    } catch (error) {
      console.error('Error recording intake:', error);
      Alert.alert('Error', 'Failed to record medication intake. Please try again.');
    }
  };
  
  const onDayPress = (day) => {
    setSelectedDate(day.dateString);
  };
  
  const formatTime = (timeString) => {
    // Format 24-hour time (like "08:00") to "8:00 AM"
    const [hours, minutes] = timeString.split(':');
    const hourNum = parseInt(hours, 10);
    const period = hourNum >= 12 ? 'PM' : 'AM';
    const hour12 = hourNum % 12 || 12;
    return `${hour12}:${minutes} ${period}`;
  };

  const getDateHeader = () => {
    if (!selectedDate) return 'Select a date';
    const date = parseISO(selectedDate);
    return format(date, 'EEEE, MMMM d, yyyy');
  };
  
  const renderScheduleItem = ({ item }) => {
    const daysUntilExpiry = Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    const isLowStock = item.quantity <= 5;
    const isExpiringSoon = daysUntilExpiry <= 7;
    
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
          style={styles.takeButton}
          onPress={() => handleTakeMedication(item.medicineId, item.scheduleId)}
        >
          <Text style={styles.takeButtonText}>Take Now</Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <Calendar
        current={selectedDate}
        onDayPress={onDayPress}
        markedDates={markedDates}
        theme={{
          calendarBackground: '#ffffff',
          textSectionTitleColor: '#b6c1cd',
          selectedDayBackgroundColor: '#3F51B5',
          selectedDayTextColor: '#ffffff',
          todayTextColor: '#3F51B5',
          dayTextColor: '#2d4150',
          textDisabledColor: '#d9e1e8',
          dotColor: '#5C6BC0',
          selectedDotColor: '#ffffff',
          arrowColor: '#3F51B5',
          monthTextColor: '#3F51B5',
          indicatorColor: '#3F51B5',
        }}
      />
      
      <View style={styles.scheduleContainer}>
        <Text style={styles.dateHeader}>{getDateHeader()}</Text>
        
        {isLoading ? (
          <Text style={styles.loadingText}>Loading medication schedule...</Text>
        ) : daySchedule.length > 0 ? (
          <FlatList
            data={daySchedule}
            keyExtractor={(item) => item.id}
            renderItem={renderScheduleItem}
            contentContainerStyle={styles.scheduleList}
          />
        ) : (
          <View style={styles.emptySchedule}>
            <Text style={styles.emptyText}>No medications scheduled for this day.</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
    backgroundColor: '#38A169',
    padding: 8,
    borderRadius: 8,
    justifyContent: 'center',
    marginLeft: 8,
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
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
  }
});

export default CalendarScreen;