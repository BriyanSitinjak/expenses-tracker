import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { TransactionRow } from '../components/TransactionRow';
import { colors, spacing } from '../constants/theme';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useBudgetStore } from '../store/budgetStore';
import { DraftExpense } from '../types';
import { formatCurrency } from '../utils/format';
import {
  isExcelFileName,
  parseImportExcel,
  parseImportFile,
  ParseReport,
  sampleBankStatementCsv,
} from '../utils/import';

type ImportScreenProps = NativeStackScreenProps<RootStackParamList, 'Import'>;

const PICKER_TYPES = [
  'text/csv',
  'text/comma-separated-values',
  'application/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '*/*',
];

// Reads a picked text file across web and native.
async function readFileText(uri: string): Promise<string> {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    return response.text();
  }
  const FileSystem = await import('expo-file-system/legacy');
  return FileSystem.readAsStringAsync(uri);
}

// Reads a picked Excel file as base64 (native) or ArrayBuffer (web).
async function readExcelPayload(
  uri: string
): Promise<{ data: ArrayBuffer | string; dataType: 'array' | 'base64' }> {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    const data = await response.arrayBuffer();
    return { data, dataType: 'array' };
  }
  const FileSystem = await import('expo-file-system/legacy');
  const data = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return { data, dataType: 'base64' };
}

// Bank statement / backup import: pick CSV or Excel, review, then import.
export function ImportScreen({ navigation }: ImportScreenProps) {
  const { importExpenses } = useBudgetStore();
  const [report, setReport] = useState<ParseReport | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function ingest(result: ParseReport, name: string) {
    setReport(result);
    setFileName(name);
    if (result.drafts.length === 0) {
      Alert.alert(
        'No transactions found',
        result.format === 'backup'
          ? 'This backup file has no valid rows. Export Excel or CSV from the app and try again.'
          : 'We could not detect outgoing transactions. Use an app Excel/CSV backup, or a bank file with Date, Description and Amount (or Debit) columns.'
      );
    }
  }

  async function handlePickFile() {
    try {
      setLoading(true);
      const DocumentPicker = await import('expo-document-picker');
      const result = await DocumentPicker.getDocumentAsync({
        type: PICKER_TYPES,
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      const name = asset.name ?? 'statement.csv';

      if (isExcelFileName(name) || asset.mimeType?.includes('spreadsheet') || asset.mimeType?.includes('excel')) {
        const { data, dataType } = await readExcelPayload(asset.uri);
        ingest(parseImportExcel(data, dataType), name);
        return;
      }

      const text = await readFileText(asset.uri);
      ingest(parseImportFile(text), name);
    } catch (error) {
      Alert.alert('Could not read file', String(error instanceof Error ? error.message : error));
    } finally {
      setLoading(false);
    }
  }

  function handleDemo() {
    ingest(parseImportFile(sampleBankStatementCsv()), 'demo-statement.csv');
  }

  function handleConfirmImport() {
    if (!report || report.drafts.length === 0) return;
    const { added, skipped } = importExpenses(report.drafts);
    Alert.alert(
      'Import complete',
      `Added ${added} transaction${added === 1 ? '' : 's'}.` +
        (skipped > 0 ? `\nSkipped ${skipped} duplicate${skipped === 1 ? '' : 's'}.` : ''),
      [{ text: 'OK', onPress: () => navigation.navigate('Dashboard') }]
    );
  }

  const drafts = report?.drafts ?? [];
  const expenseDrafts = drafts.filter((item) => item.type === 'expense');
  const expenseCount = expenseDrafts.length;
  const spendTotal = expenseDrafts.reduce((sum, item) => sum + item.amount, 0);

  const listHeader = (
    <View>
      <Card style={styles.infoCard}>
        <Text style={styles.infoTitle}>🏦 Import transactions</Text>
        <Text style={styles.infoText}>
          Import an Excel (.xlsx) or CSV backup from this app, or a bank statement CSV. App backups
          keep categories, payment method, and notes. Bank files need Date, Description and Amount
          (or Debit) columns.
        </Text>
        <View style={styles.buttonRow}>
          <Button
            icon="📁"
            label={loading ? 'Reading…' : 'Pick file'}
            onPress={handlePickFile}
            style={styles.flexBtn}
          />
          <Button
            icon="✨"
            variant="secondary"
            label="Try demo"
            onPress={handleDemo}
            style={styles.flexBtn}
          />
        </View>
      </Card>

      {report ? (
        <View style={styles.summary}>
          <Text style={styles.summaryFile}>{fileName}</Text>
          <Text style={styles.summaryStats}>
            {report.format === 'backup' ? 'App backup' : 'Bank statement'} · {expenseCount} expenses
            · {report.withdrawals} cash withdrawals
            {report.format === 'bank'
              ? ` · ${report.incomeSkipped} income skipped · ${report.invalidSkipped} ignored`
              : report.invalidSkipped > 0
                ? ` · ${report.invalidSkipped} invalid rows skipped`
                : ''}
          </Text>
          <Text style={styles.summaryTotal}>Spending total: {formatCurrency(spendTotal)}</Text>
          {report.withdrawals > 0 ? (
            <Text style={styles.summaryNote}>
              Cash withdrawals are imported as transfers (excluded from spending).
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={styles.container}>
      {loading && drafts.length === 0 ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : null}

      <FlatList
        data={drafts}
        keyExtractor={(_, index) => String(index)}
        ListHeaderComponent={listHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }: { item: DraftExpense }) => (
          <TransactionRow item={item} compact />
        )}
      />

      {drafts.length > 0 ? (
        <View style={styles.footer}>
          <Button
            icon="⬇️"
            label={`Import ${drafts.length} transaction${drafts.length === 1 ? '' : 's'}`}
            onPress={handleConfirmImport}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg,
    flex: 1,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  infoCard: {
    marginBottom: spacing.lg,
  },
  infoTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  infoText: {
    color: colors.subText,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  flexBtn: {
    flex: 1,
  },
  summary: {
    marginBottom: spacing.md,
  },
  summaryFile: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 16,
  },
  summaryStats: {
    color: colors.subText,
    marginTop: 2,
  },
  summaryTotal: {
    color: colors.accent,
    fontWeight: '800',
    marginTop: 4,
  },
  summaryNote: {
    color: colors.subText,
    fontSize: 12,
    marginTop: 4,
  },
  loader: {
    paddingTop: spacing.xl,
  },
  footer: {
    padding: spacing.lg,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    backgroundColor: colors.bgElevated,
  },
});
