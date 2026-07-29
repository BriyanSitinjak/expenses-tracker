import { Alert } from 'react-native';

// Shared confirm dialog before deleting a transaction.
export function confirmDeleteExpense(
  id: string,
  label: string,
  onDelete: (id: string) => void
): void {
  Alert.alert('Delete transaction', `Remove "${label}"?`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: () => onDelete(id) },
  ]);
}
