import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { Pressable } from 'react-native';
import { Icon } from '../components/Icon';
import { colors } from '../constants/theme';
import { AddExpenseScreen } from '../screens/AddExpenseScreen';
import { BudgetSetupScreen } from '../screens/BudgetSetupScreen';
import { CategoryDetailScreen } from '../screens/CategoryDetailScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { ImportScreen } from '../screens/ImportScreen';
import { ManageCategoriesScreen } from '../screens/ManageCategoriesScreen';
import { StatsScreen } from '../screens/StatsScreen';

export type RootStackParamList = {
  Dashboard: undefined;
  AddExpense: { expenseId?: string } | undefined;
  BudgetSetup: undefined;
  Import: undefined;
  Stats: undefined;
  Manage: undefined;
  CategoryDetail: { category: string; monthKey?: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Defines app navigation stack and screen options.
export function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bgElevated },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '800' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen
        component={DashboardScreen}
        name="Dashboard"
        options={({ navigation }) => ({
          title: 'My Expenses',
          headerRight: () => (
            <Pressable onPress={() => navigation.navigate('Manage')} hitSlop={12}>
              <Icon name="settings-sharp" size={22} color={colors.text} />
            </Pressable>
          ),
        })}
      />
      <Stack.Screen
        component={AddExpenseScreen}
        name="AddExpense"
        options={({ route }) => ({
          title: route.params?.expenseId ? 'Edit Expense' : 'Add Expense',
          presentation: 'modal',
        })}
      />
      <Stack.Screen
        component={BudgetSetupScreen}
        name="BudgetSetup"
        options={{ title: 'Monthly Budget', presentation: 'modal' }}
      />
      <Stack.Screen
        component={ImportScreen}
        name="Import"
        options={{ title: 'Import' }}
      />
      <Stack.Screen
        component={StatsScreen}
        name="Stats"
        options={{ title: 'Stats' }}
      />
      <Stack.Screen
        component={CategoryDetailScreen}
        name="CategoryDetail"
        options={{ title: 'Category' }}
      />
      <Stack.Screen
        component={ManageCategoriesScreen}
        name="Manage"
        options={{ title: 'Manage Categories' }}
      />
    </Stack.Navigator>
  );
}
