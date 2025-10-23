import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Check, Trash2, ShoppingCart } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useRecipes } from '@/hooks/recipe-store';
import { GroceryItem } from '@/types/recipe';

export default function GroceryScreen() {
  const { groceryList, toggleGroceryItem, clearCheckedItems } = useRecipes();

  const renderItem = ({ item }: { item: GroceryItem }) => (
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
    </TouchableOpacity>
  );

  const checkedCount = groceryList.filter(item => item.isChecked).length;

  return (
    <View style={styles.container}>
      {groceryList.length === 0 ? (
        <View style={styles.emptyState}>
          <ShoppingCart size={48} color={Colors.text.light} />
          <Text style={styles.emptyTitle}>Your grocery list is empty</Text>
          <Text style={styles.emptyText}>
            Add ingredients from recipes to build your shopping list
          </Text>
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
        </>
      )}
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
    paddingBottom: 80,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
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
});