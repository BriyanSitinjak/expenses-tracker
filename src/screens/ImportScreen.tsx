import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
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
import { TransferStatusModal } from '../components/TransferStatusModal';
import { ThemeColors, spacing } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useBudgetStore } from '../store/budgetStore';
import { DraftExpense } from '../types';
import { onlyExpenses, sumAmount } from '../utils/analytics';
import { exportImportTemplate } from '../utils/backup';
import { formatCurrency } from '../utils/format';
import {
  isExcelFileName,
  parseImportExcel,
  parseImportFile,
  ParseReport,
  sampleBankStatementCsv,
} from '../utils/import';
import {
  describeTransferError,
  preloadTransferModules,
  readBase64File,
  readTextFile,
  TransferStatus,
  yieldToUI,
} from '../utils/transfer';

type ImportScreenProps = NativeStackScreenProps<RootStackParamList, 'Import'>;

const PICKER_TYPES = [
  'text/csv',
  'text/comma-separated-values',
  'application/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '*/*',
];

// Reads a picked Excel file as base64 (native) or ArrayBuffer (web).
async function readExcelPayload(
  uri: string
): Promise<{ data: ArrayBuffer | string; dataType: 'array' | 'base64' }> {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    const data = await response.arrayBuffer();
    return { data, dataType: 'array' };
  }
  const data = await readBase64File(uri);
  return { data, dataType: 'base64' };
}

// Bank statement / backup import: pick CSV or Excel, review, then import.
export function ImportScreen({ navigation }: ImportScreenProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { importExpenses } = useBudgetStore();
  const [report, setReport] = useState<ParseReport | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<TransferStatus>(null);

  function ingest(result: ParseReport, name: string) {
    setReport(result);
    setFileName(name);
    if (result.drafts.length === 0) {
      Alert.alert(
        'No transactions found',
        result.format === 'backup'
          ? 'This backup file has no valid rows. Export a CSV from the app and try again.'
          : 'We could not detect outgoing transactions. Use an app CSV backup, or a bank file with Date, Description and Amount (or Debit) columns.'
      );
    }
  }

  async function handlePickFile() {
    try {
      setLoading(true);
      setProgress({ title: 'Importing', message: 'Opening file picker…', step: 1, totalSteps: 3 });
      await yieldToUI();

      const DocumentPicker = await import('expo-document-picker');
      const result = await DocumentPicker.getDocumentAsync({
        type: PICKER_TYPES,
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) {
        setProgress(null);
        return;
      }

      const asset = result.assets[0];
      const name = asset.name ?? 'statement.csv';
      const isExcel =
        isExcelFileName(name) ||
        asset.mimeType?.includes('spreadsheet') ||
        asset.mimeType?.includes('excel');

      setProgress({
        title: 'Reading file',
        message: isExcel ? `Parsing Excel: ${name}` : `Parsing CSV: ${name}`,
        step: 2,
        totalSteps: 3,
      });
      await yieldToUI();

      if (isExcel) {
        const { data, dataType } = await readExcelPayload(asset.uri);
        setProgress({
          title: 'Reading file',
          message: 'Detecting transactions…',
          step: 3,
          totalSteps: 3,
        });
        await yieldToUI();
        ingest(parseImportExcel(data, dataType), name);
      } else {
        const text = await readTextFile(asset.uri);
        setProgress({
          title: 'Reading file',
          message: 'Detecting transactions…',
          step: 3,
          totalSteps: 3,
        });
        await yieldToUI();
        ingest(parseImportFile(text), name);
      }
    } catch (error) {
      Alert.alert(
        'Import failed',
        describeTransferError(
          error,
          'Could not read or parse that file. Try exporting a fresh CSV backup from this app.'
        )
      );
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }

  function handleDemo() {
    ingest(parseImportFile(sampleBankStatementCsv()), 'demo-statement.csv');
  }

  async function handleDownloadTemplate() {
    if (loading || progress != null) return;
    try {
      setLoading(true);
      preloadTransferModules();
      setProgress({
        title: 'CSV template',
        message: 'Preparing template…',
        step: 1,
        totalSteps: 2,
      });
      await yieldToUI();

      const result = await exportImportTemplate({
        onProgress: (update) => {
          setProgress({
            title: 'CSV template',
            message: update.message,
            step: update.step,
            totalSteps: update.totalSteps,
          });
        },
        onBeforeShare: async () => {
          setProgress(null);
          await yieldToUI(40);
        },
      });

      setProgress(null);
      if (!result.shared && !result.dismissed) {
        Alert.alert(
          'Template saved',
          `Sharing is unavailable on this device, so the file was saved locally:\n${result.fileUri}`
        );
      }
    } catch (error) {
      setProgress(null);
      Alert.alert(
        'Template failed',
        describeTransferError(error, 'Could not create or share the CSV template. Please try again.')
      );
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }

  async function handleConfirmImport() {
    if (!report || report.drafts.length === 0) return;
    try {
      setProgress({
        title: 'Saving import',
        message: `Adding ${report.drafts.length} transaction${report.drafts.length === 1 ? '' : 's'}…`,
        step: 1,
        totalSteps: 1,
      });
      await yieldToUI();
      const { added } = importExpenses(report.drafts);
      setProgress(null);
      Alert.alert(
        'Import complete',
        `Added ${added} transaction${added === 1 ? '' : 's'}.`,
        [
          {
            text: 'OK',
            onPress: () =>
              navigation.reset({
                index: 0,
                routes: [{ name: 'Dashboard' }],
              }),
          },
        ]
      );
    } catch (error) {
      setProgress(null);
      Alert.alert(
        'Import failed',
        describeTransferError(
          error,
          'Transactions were read from the file, but saving them into the app failed. Please try again.'
        )
      );
    }
  }

  const drafts = report?.drafts ?? [];
  const expenseDrafts = onlyExpenses(drafts);
  const expenseCount = expenseDrafts.length;
  const spendTotal = sumAmount(expenseDrafts);

  const listHeader = (
    <View>
      <Card style={styles.infoCard}>
        <Text style={styles.infoTitle}>Import transactions</Text>
        <Text style={styles.infoText}>
          Import an Excel (.xlsx) or CSV backup from this app, or a bank statement CSV. Download the
          CSV template to fill rows offline — keep the header columns, then pick the file here. Bank
          files need Date, Description and Amount (or Debit) columns.
        </Text>
        <View style={styles.buttonRow}>
          <Button
            icon="document"
            label={loading ? 'Reading…' : 'Pick file'}
            onPress={handlePickFile}
            style={styles.flexBtn}
            disabled={loading || progress != null}
          />
          <Button
            icon="flash"
            variant="secondary"
            label="Try demo"
            onPress={handleDemo}
            style={styles.flexBtn}
            disabled={loading || progress != null}
          />
        </View>
        <Button
          icon="download"
          variant="secondary"
          label="Download CSV template"
          onPress={handleDownloadTemplate}
          style={styles.templateBtn}
          disabled={loading || progress != null}
        />
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
      {loading && drafts.length === 0 && progress == null ? (
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
            icon="download"
            label={`Import ${drafts.length} transaction${drafts.length === 1 ? '' : 's'}`}
            onPress={handleConfirmImport}
            disabled={progress != null}
          />
        </View>
      ) : null}

      <TransferStatusModal
        visible={progress != null}
        title={progress?.title ?? ''}
        message={progress?.message ?? ''}
        step={progress?.step}
        totalSteps={progress?.totalSteps}
      />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
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
    templateBtn: {
      marginTop: spacing.sm,
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
}
