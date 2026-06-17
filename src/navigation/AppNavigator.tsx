import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AddExpenseScreen } from '../screens/AddExpenseScreen';
import { BudgetSetupScreen } from '../screens/BudgetSetupScreen';
import { DashboardScreen } from '../screens/DashboardScreen';

export type RootStackParamList = {
  Dashboard: undefined;
  AddExpense: undefined;
  BudgetSetup: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Defines app navigation stack and screen options.
export function AppNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen component={DashboardScreen} name="Dashboard" options={{ title: 'Expenses' }} />
      <Stack.Screen
        component={AddExpenseScreen}
        name="AddExpense"
        options={{ title: 'Add Expense' }}
      />
      <Stack.Screen
        component={BudgetSetupScreen}
        name="BudgetSetup"
        options={{ title: 'Monthly Budget' }}
      />
    </Stack.Navigator>
  );
}
