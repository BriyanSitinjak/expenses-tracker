import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { colorForCategory, colors, radius, spacing } from '../constants/theme';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useBudgetStore } from '../store/budgetStore';
import { DraftExpense } from '../types';
import { formatCurrency } from '../utils/format';
import { parseBankCsv, ParseReport, sampleBankStatementCsv } from '../utils/import';

type ImportScreenProps = NativeStackScreenProps<RootStackParamList, 'Import'>;

// Reads a picked file's text content across web and native.
async function readFileText(uri: string): Promise<string> {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    return response.text();
  }
  const FileSystem = await import('expo-file-system/legacy');
  return FileSystem.readAsStringAsync(uri);
}

// Bank statement import: pick a CSV (or try a demo) then review and import.
export function ImportScreen({ navigation }: ImportScreenProps) {
  const { importExpenses } = useBudgetStore();
  const [report, setReport] = useState<ParseReport | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function ingest(text: string, name: string) {
    const result = parseBankCsv(text);
    setReport(result);
    setFileName(name);
    if (result.drafts.length === 0) {
      Alert.alert(
        'No expenses found',
        'We could not detect any outgoing transactions in that file. Make sure it has Date, Description and Amount (or Debit) columns.'
      );
    }
  }

  async function handlePickFile() {
    try {
      setLoading(true);
      const DocumentPicker = await import('expo-document-picker');
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'application/vnd.ms-excel', '*/*'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const text = await readFileText(asset.uri);
      ingest(text, asset.name ?? 'statement.csv');
    } catch (error) {
      Alert.alert('Could not read file', String(error instanceof Error ? error.message : error));
    } finally {
      setLoading(false);
    }
  }

  function handleDemo() {
    ingest(sampleBankStatementCsv(), 'demo-statement.csv');
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
        <Text style={styles.infoTitle}>🏦 Import from your bank</Text>
        <Text style={styles.infoText}>
          In your mobile banking app, export your transaction history as a CSV/Excel file (often
          under Statements or History), then import it here. We auto-detect amounts and categories.
        </Text>
        <View style={styles.buttonRow}>
          <Button
            icon="📁"
            label={loading ? 'Reading…' : 'Pick statement'}
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
            {expenseCount} expenses · {report.withdrawals} cash withdrawals ·{' '}
            {report.incomeSkipped} income skipped · {report.invalidSkipped} ignored
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
        renderItem={({ item }: { item: DraftExpense }) => {
          const isWithdrawal = item.type === 'withdrawal';
          return (
            <View style={styles.draftRow}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: isWithdrawal ? colors.muted : colorForCategory(item.category) },
                ]}
              />
              <View style={styles.draftBody}>
                <Text style={styles.draftTitle} numberOfLines={1}>
                  {item.merchant}
                </Text>
                <Text style={styles.draftMeta}>
                  {isWithdrawal ? 'Transfer → Cash' : `${item.category} · 💳`} ·{' '}
                  {new Date(item.date).toLocaleDateString()}
                </Text>
              </View>
              <Text style={[styles.draftAmount, isWithdrawal && styles.draftTransfer]}>
                {isWithdrawal ? '→ ' : '-'}
                {formatCurrency(item.amount)}
              </Text>
            </View>
          );
        }}
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
  draftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  draftBody: {
    flex: 1,
  },
  draftTitle: {
    color: colors.text,
    fontWeight: '700',
  },
  draftMeta: {
    color: colors.subText,
    fontSize: 12,
    marginTop: 2,
  },
  draftAmount: {
    color: colors.danger,
    fontWeight: '800',
  },
  draftTransfer: {
    color: colors.muted,
  },
  footer: {
    padding: spacing.lg,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    backgroundColor: colors.bgElevated,
  },
});
