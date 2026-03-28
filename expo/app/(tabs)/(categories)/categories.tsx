import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import Colors from '@/constants/colors';
import { useRecipes } from '@/hooks/recipe-store';
import { Category } from '@/types/recipe';
import { Plus, Edit2, Trash2 } from 'lucide-react-native';

export default function CategoriesScreen() {
  const { categories, setSelectedCategory, deleteCategory, recipes } = useRecipes();
  const [editMode, setEditMode] = useState(false);

  const handleCategoryPress = (category: Category) => {
    if (editMode) {
      router.push({
        pathname: '/manage-category',
        params: { id: category.id },
      });
    } else {
      setSelectedCategory(category.name);
      router.push('/(tabs)/(home)/home');
    }
  };

  const handleDeleteCategory = (category: Category) => {
    const affectedRecipes = recipes.filter(r => 
      r.categories.includes(category.name)
    );
    
    Alert.alert(
      'Delete Category',
      affectedRecipes.length > 0
        ? `This will remove the category from ${affectedRecipes.length} recipe(s). Continue?`
        : 'Are you sure you want to delete this category?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteCategory(category.id),
        },
      ]
    );
  };

  const renderCategory = ({ item }: { item: Category }) => (
    <View style={styles.categoryCardWrapper}>
      <TouchableOpacity
        style={[styles.categoryCard, { borderLeftColor: item.color }]}
        onPress={() => handleCategoryPress(item)}
        testID={`category-card-${item.id}`}
      >
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.categoryImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
            <Text style={styles.icon}>{item.icon}</Text>
          </View>
        )}
        <View style={styles.categoryContent}>
          <Text style={styles.categoryName}>{item.name}</Text>
          <Text style={styles.recipeCount}>
            {item.recipeCount} {item.recipeCount === 1 ? 'recipe' : 'recipes'}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: item.color }]}>
          <Text style={styles.badgeText}>{item.recipeCount}</Text>
        </View>
      </TouchableOpacity>
      {editMode && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteCategory(item)}
          testID={`delete-category-${item.id}`}
        >
          <Trash2 size={20} color={Colors.error} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.headerButton, editMode && styles.headerButtonActive]}
          onPress={() => setEditMode(!editMode)}
          testID="edit-mode-button"
        >
          <Edit2 size={20} color={editMode ? Colors.primary : Colors.text.primary} />
          <Text style={[styles.headerButtonText, editMode && styles.headerButtonTextActive]}>
            {editMode ? 'Done' : 'Edit'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/manage-category')}
          testID="add-category-button"
        >
          <Plus size={20} color={Colors.primary} />
          <Text style={styles.addButtonText}>New Category</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={renderCategory}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  headerButtonActive: {
    backgroundColor: Colors.primary + '15',
  },
  headerButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  headerButtonTextActive: {
    color: Colors.primary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.primary + '15',
    gap: 6,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
  listContent: {
    padding: 16,
  },
  categoryCardWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  categoryImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginRight: 12,
  },
  deleteButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.error + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  categoryContent: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  recipeCount: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 32,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
});