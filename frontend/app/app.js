import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AddMedicationScreen from '../screens/AddMedicationScreen';
import MedicationListScreen from '../screens/MedicationListScreen';
import { MedicationProvider } from '../context/MedicationContext';

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <MedicationProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="MedicationListScreen">
          <Stack.Screen name="MedicationListScreen" component={MedicationListScreen} />
          <Stack.Screen name="AddMedicationScreen" component={AddMedicationScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </MedicationProvider>
  );
};

export default App;