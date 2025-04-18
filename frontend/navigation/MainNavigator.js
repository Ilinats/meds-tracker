import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

//TODO: da opravq dizajna na nav bara

// Screens
import MedicationListScreen from '../screens/MedicationListScreen';
import AddMedicationScreen from '../screens/AddMedicationScreen';
import CalendarScreen from '../screens/CalendarScreen';
import MedicationDetailScreen from '../screens/MedicationDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack navigators for each tab
const MedicationStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MedicationList" component={MedicationListScreen} />
    <Stack.Screen name="MedicationDetail" component={MedicationDetailScreen} />
    <Stack.Screen name="AddMedication" component={AddMedicationScreen} />
  </Stack.Navigator>
);

// Custom tab bar
const CustomTabBar = ({ state, descriptors, navigation }) => {
  return (
    <View style={styles.tabBarContainer}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel || options.title || route.name;
        const isFocused = state.index === index;
        
        // Custom style for middle button
        const isMiddleButton = index === 1;
        
        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };
        
        if (isMiddleButton) {
          return (
            <TouchableOpacity
              key={index}
              style={styles.middleTabButton}
              onPress={onPress}
            >
              <View style={styles.addButtonContainer}>
                <Ionicons name="add" size={30} color="white" />
              </View>
            </TouchableOpacity>
          );
        }
        
        return (
          <TouchableOpacity
            key={index}
            style={[styles.tabButton, isFocused && styles.tabButtonFocused]}
            onPress={onPress}
          >
            <Ionicons
              name={
                route.name === 'Medications'
                  ? isFocused ? 'medical' : 'medical-outline'
                  : isFocused ? 'calendar' : 'calendar-outline'
              }
              size={22}
              color={isFocused ? '#4299e1' : '#718096'}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const MainNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen 
        name="Medications" 
        component={MedicationStack}
      />
      <Tab.Screen 
        name="AddMedication" 
        component={AddMedicationScreen}
      />
      <Tab.Screen 
        name="Calendar" 
        component={CalendarScreen}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    height: 70,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    justifyContent: 'space-around',
    alignItems: 'center',
    position: 'relative',
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  tabButtonFocused: {
    borderTopWidth: 2,
    borderTopColor: '#4299e1',
  },
  middleTabButton: {
    width: 70,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4299e1',
    justifyContent: 'center',
    alignItems: 'center',
    bottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
});

export default MainNavigator;