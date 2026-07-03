import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { InlineAddRow } from '../components/InlineAddRow';
import { FALLBACK_CATEGORY } from '../constants/categories';
import { colorForCategory, colors, radius, spacing } from '../constants/theme';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useBudgetStore } from '../store/budgetStore';

type ManageCategoriesScreenProps = NativeStackScreenProps<RootStackParamList, 'Manage'>;

// Screen to add, rename, and delete categories and their sub-categories.
export function ManageCategoriesScreen(_: ManageCategoriesScreenProps) {
  const {
    categories,
    subcategories,
    expenses,
    addCategory,
    addSubcategory,
    renameCategory,
    deleteCategory,
    deleteSubcategory,
  } = useBudgetStore();

  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [addingSubFor, setAddingSubFor] = useState<string | null>(null);
  const [newSub, setNewSub] = useState('');

  // Transaction count per category, for context when deleting.
  const usage = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of expenses) {
      map[item.category] = (map[item.category] || 0) + 1;
    }
    return map;
  }, [expenses]);

  function handleAddCategory() {
    if (!addCategory(newCategory)) {
      Alert.alert('Invalid name', 'Please type a category name.');
      return;
    }
    setNewCategory('');
    setAddingCategory(false);
  }

  function handleSaveRename() {
    if (!editingCat) return;
    const ok = renameCategory(editingCat, draftName);
    if (!ok) {
      Alert.alert('Cannot rename', 'The name is empty or already used by another category.');
      return;
    }
    setEditingCat(null);
    setDraftName('');
  }

  function confirmDeleteCategory(name: string) {
    const count = usage[name] ?? 0;
    Alert.alert(
      `Delete "${name}"?`,
      count > 0
        ? `${count} transaction${count === 1 ? '' : 's'} will be moved to "${FALLBACK_CATEGORY}".`
        : 'This category has no transactions.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteCategory(name) },
      ]
    );
  }

  function handleAddSub(parent: string) {
    if (!addSubcategory(parent, newSub)) {
      Alert.alert('Invalid name', 'Please type a sub-category name.');
      return;
    }
    setNewSub('');
    setAddingSubFor(null);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Button
        icon={addingCategory ? '×' : '➕'}
        label={addingCategory ? 'Cancel' : 'New category'}
        variant={addingCategory ? 'secondary' : 'primary'}
        onPress={() => setAddingCategory((v) => !v)}
      />
      <View style={styles.addWrap}>
        <InlineAddRow
          visible={addingCategory}
          value={newCategory}
          onChangeText={setNewCategory}
          onSubmit={handleAddCategory}
          placeholder="New category name"
        />
      </View>

      {categories.map((name) => {
        const isFallback = name === FALLBACK_CATEGORY;
        const isEditing = editingCat === name;
        const subs = subcategories[name] ?? [];
        const color = colorForCategory(name);

        return (
          <Card key={name} style={styles.card}>
            <View style={styles.headerRow}>
              <View style={[styles.dot, { backgroundColor: color }]} />
              {isEditing ? (
                <TextInput
                  autoFocus
                  value={draftName}
                  onChangeText={setDraftName}
                  onSubmitEditing={handleSaveRename}
                  placeholder="Category name"
                  placeholderTextColor={colors.muted}
                  style={styles.renameInput}
                />
              ) : (
                <Text style={styles.name}>{name}</Text>
              )}

              {!isEditing ? (
                <Text style={styles.count}>{usage[name] ?? 0}</Text>
              ) : null}

              {isFallback ? (
                <Text style={styles.defaultTag}>default</Text>
              ) : isEditing ? (
                <View style={styles.actions}>
                  <Pressable onPress={handleSaveRename} hitSlop={8} style={styles.iconBtn}>
                    <Text style={styles.save}>Save</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setEditingCat(null);
                      setDraftName('');
                    }}
                    hitSlop={8}
                    style={styles.iconBtn}
                  >
                    <Text style={styles.cancel}>Cancel</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.actions}>
                  <Pressable
                    onPress={() => {
                      setEditingCat(name);
                      setDraftName(name);
                      setAddingSubFor(null);
                    }}
                    hitSlop={8}
                    style={styles.iconBtn}
                  >
                    <Text style={styles.icon}>✎</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => confirmDeleteCategory(name)}
                    hitSlop={8}
                    style={styles.iconBtn}
                  >
                    <Text style={styles.icon}>🗑</Text>
                  </Pressable>
                </View>
              )}
            </View>

            <View style={styles.subWrap}>
              {subs.map((sub) => (
                <View key={sub} style={styles.subChip}>
                  <Text style={styles.subText}>{sub}</Text>
                  <Pressable
                    onPress={() => deleteSubcategory(name, sub)}
                    hitSlop={8}
                    style={styles.subRemove}
                  >
                    <Text style={styles.subRemoveText}>×</Text>
                  </Pressable>
                </View>
              ))}
              <Pressable
                onPress={() => {
                  setAddingSubFor(addingSubFor === name ? null : name);
                  setNewSub('');
                }}
                style={styles.addSubChip}
              >
                <Text style={styles.addSubText}>
                  {addingSubFor === name ? '× Cancel' : '+ Sub'}
                </Text>
              </Pressable>
            </View>

            <InlineAddRow
              visible={addingSubFor === name}
              value={newSub}
              onChangeText={setNewSub}
              onSubmit={() => handleAddSub(name)}
              placeholder={`New sub-category in ${name}`}
            />
          </Card>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg,
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  addWrap: {
    marginTop: spacing.md,
  },
  card: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  name: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  renameInput: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderColor: colors.primary,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  count: {
    color: colors.subText,
    fontSize: 13,
    fontWeight: '700',
    minWidth: 20,
    textAlign: 'right',
  },
  defaultTag: {
    color: colors.muted,
    fontSize: 12,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconBtn: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  icon: {
    fontSize: 18,
  },
  save: {
    color: colors.success,
    fontWeight: '800',
  },
  cancel: {
    color: colors.subText,
    fontWeight: '700',
  },
  subWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  subChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.bgElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    paddingVertical: spacing.xs,
  },
  subText: {
    color: colors.subText,
  },
  subRemove: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.track,
  },
  subRemoveText: {
    color: colors.text,
    fontWeight: '800',
    lineHeight: 16,
  },
  addSubChip: {
    borderColor: colors.accent,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  addSubText: {
    color: colors.accent,
    fontWeight: '700',
  },
});
