import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Colors from '@/constants/colors';
import { Category } from '@/types/recipe';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (categoryName: string | null) => void;
}

export default function CategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryFilterProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <TouchableOpacity
        style={[
          styles.chip,
          !selectedCategory && styles.chipSelected,
        ]}
        onPress={() => onSelectCategory(null)}
        testID="category-all"
      >
        <Text style={[
          styles.chipText,
          !selectedCategory && styles.chipTextSelected,
        ]}>
          All
        </Text>
      </TouchableOpacity>

      {categories.map((category) => (
        <TouchableOpacity
          key={category.id}
          style={[
            styles.chip,
            selectedCategory === category.name && styles.chipSelected,
            { borderColor: category.color },
          ]}
          onPress={() => onSelectCategory(
            selectedCategory === category.name ? null : category.name
          )}
          testID={`category-${category.id}`}
        >
          {category.icon && (
            <Text style={styles.chipIcon}>{category.icon}</Text>
          )}
          <Text style={[
            styles.chipText,
            selectedCategory === category.name && styles.chipTextSelected,
          ]}>
            {category.name}
          </Text>
          <View style={[styles.badge, { backgroundColor: category.color }]}>
            <Text style={styles.badgeText}>{category.recipeCount}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  content: {
    paddingHorizontal: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.primary,
    marginRight: 6,
  },
  chipTextSelected: {
    color: Colors.text.inverse,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
});