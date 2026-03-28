import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Check, Trash2, ShoppingCart, Plus, Minus, PlusCircle, MoreVertical } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useRecipes } from '@/hooks/recipe-store';
import { GroceryItem } from '@/types/recipe';
import { Stack, router } from 'expo-router';

export default function GroceryScreen() {
  const { groceryList, toggleGroceryItem, clearCheckedItems, addCustomGroceryItem, updateGroceryQuantity, removeGroceryItem } = useRecipes();

  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [unit, setUnit] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const openModal = useCallback(() => {
    setIsModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalVisible(false);
  }, []);

  const submitCustomItem = useCallback(async () => {
    if (!name.trim() || !amount.trim()) {
      Alert.alert('Missing info', 'Please enter a name and amount.');
      return;
    }
    try {
      setSaving(true);
      await addCustomGroceryItem({ name: name.trim(), amount: amount.trim(), unit: unit.trim() || undefined, quantity: 1 });
      setName('');
      setAmount('');
      setUnit('');
      setIsModalVisible(false);
    } catch (e) {
      Alert.alert('Error', 'Could not add item. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [name, amount, unit, addCustomGroceryItem]);

  const renderItem = ({ item }: { item: GroceryItem }) => {
    const isExpanded = expandedItemId === item.id;

    return (
      <View style={styles.itemWrapper}>
        <TouchableOpacity
          style={[styles.itemCard, item.isChecked && styles.itemChecked]}
          onPress={() => toggleGroceryItem(item.id)}
          testID={`grocery-item-${item.id}`}
        >
          <View style={[styles.checkbox, item.isChecked && styles.checkboxChecked]}>
            {item.isChecked && <Check size={16} color={Colors.text.inverse} />}
          </View>
          <View style={styles.itemContent}>
            <Text style={[styles.itemName, item.isChecked && styles.itemNameChecked]}>
              {item.ingredient.name}
            </Text>
            <Text style={[styles.itemAmount, item.isChecked && styles.itemAmountChecked]}>
              {item.ingredient.amount} {item.ingredient.unit || ''}
            </Text>
          </View>
          <View style={styles.quantityControls}>
            <TouchableOpacity
              onPress={(e) => { e.stopPropagation(); updateGroceryQuantity(item.id, Math.max(0, (item.quantity ?? 1) - 1)); }}
              style={styles.qtyButton}
              testID={`decrement-${item.id}`}
            >
              <Minus size={16} color={Colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.qtyText}>{item.quantity ?? 1}</Text>
            <TouchableOpacity
              onPress={(e) => { e.stopPropagation(); updateGroceryQuantity(item.id, (item.quantity ?? 1) + 1); }}
              style={styles.qtyButton}
              testID={`increment-${item.id}`}
            >
              <Plus size={16} color={Colors.text.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={(e) => { e.stopPropagation(); setExpandedItemId(isExpanded ? null : item.id); }}
              style={styles.moreButton}
              testID={`more-${item.id}`}
            >
              <MoreVertical size={18} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
        {isExpanded && (
          <TouchableOpacity
            style={styles.deleteAction}
            onPress={() => {
              setExpandedItemId(null);
              removeGroceryItem(item.id);
            }}
            testID={`remove-${item.id}`}
          >
            <Trash2 size={16} color={Colors.error} />
            <Text style={styles.deleteText}>Delete item</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const checkedCount = useMemo(() => groceryList.filter(item => item.isChecked).length, [groceryList]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <TouchableOpacity onPress={openModal} testID="header-add-grocery-item" style={styles.headerAddBtn}>
              <Plus size={20} color={Colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />
      {groceryList.length === 0 ? (
        <View style={styles.emptyState}>
          <ShoppingCart size={48} color={Colors.text.light} />
          <Text style={styles.emptyTitle}>Your grocery list is empty</Text>
          <Text style={styles.emptyText}>
            Add ingredients from recipes to build your shopping list
          </Text>
          <TouchableOpacity style={styles.addCta} onPress={openModal} testID="open-add-item-empty">
            <PlusCircle size={20} color={Colors.text.inverse} />
            <Text style={styles.addCtaText}>Add custom item</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={groceryList}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
          
          {checkedCount > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearCheckedItems}
              testID="clear-checked"
            >
              <Trash2 size={20} color={Colors.text.inverse} />
              <Text style={styles.clearButtonText}>
                Clear {checkedCount} checked {checkedCount === 1 ? 'item' : 'items'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.fab} onPress={() => router.push('/add-recipe')} testID="quick-add-recipe">
            <Plus size={24} color={Colors.text.inverse} />
          </TouchableOpacity>
        </>
      )}

      <Modal visible={isModalVisible} animationType="slide" transparent onRequestClose={closeModal}>
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={80}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalCard}>
              <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 12 }}>
                <Text style={styles.modalTitle}>Add custom item</Text>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Name</Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="e.g. Bananas"
                    placeholderTextColor={Colors.text.light}
                    style={styles.input}
                    autoCapitalize="words"
                    autoFocus
                    testID="input-name"
                  />
                </View>
                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Amount</Text>
                    <TextInput
                      value={amount}
                      onChangeText={setAmount}
                      placeholder="e.g. 6"
                      placeholderTextColor={Colors.text.light}
                      style={styles.input}
                      keyboardType="numbers-and-punctuation"
                      testID="input-amount"
                    />
                  </View>
                  <View style={{ width: 12 }} />
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Unit</Text>
                    <TextInput
                      value={unit}
                      onChangeText={setUnit}
                      placeholder="e.g. pcs, lbs, kg"
                      placeholderTextColor={Colors.text.light}
                      style={styles.input}
                      autoCapitalize="none"
                      testID="input-unit"
                    />
                  </View>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity onPress={closeModal} style={[styles.actionBtn, styles.cancelBtn]} testID="cancel-add-item">
                    <Text style={styles.actionTextCancel}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={submitCustomItem} disabled={saving} style={[styles.actionBtn, styles.saveBtn]} testID="save-add-item">
                    <Text style={styles.actionTextSave}>{saving ? 'Adding…' : 'Add item'}</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    padding: 16,
    paddingBottom: 120,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  itemChecked: {
    backgroundColor: Colors.surface,
    opacity: 0.7,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  itemNameChecked: {
    textDecorationLine: 'line-through',
    color: Colors.text.secondary,
  },
  itemAmount: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  itemAmountChecked: {
    textDecorationLine: 'line-through',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  qtyText: {
    minWidth: 20,
    textAlign: 'center',
    fontWeight: '600',
    color: Colors.text.primary,
  },
  moreButton: {
    marginLeft: 8,
    width: 32,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  itemWrapper: {
    marginBottom: 8,
  },
  deleteAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 4,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  deleteText: {
    fontSize: 14,
    color: Colors.error,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  clearButton: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  clearButtonText: {
    color: Colors.text.inverse,
    fontWeight: '600',
  },
  headerAddBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    backgroundColor: Colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  addCta: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
  },
  addCtaText: {
    color: Colors.text.inverse,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.card,
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.text.primary,
    backgroundColor: Colors.surface,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalActions: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  cancelBtn: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
  },
  actionTextCancel: {
    color: Colors.text.primary,
    fontWeight: '600',
  },
  actionTextSave: {
    color: Colors.text.inverse,
    fontWeight: '700',
  },
});