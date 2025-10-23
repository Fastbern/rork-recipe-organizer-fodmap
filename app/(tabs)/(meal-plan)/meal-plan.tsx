import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Calendar, Plus } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useRecipes, useMealPlanForDate } from '@/hooks/recipe-store';

export default function MealPlanScreen() {
  const { recipes } = useRecipes();
  const today = new Date().toISOString().split('T')[0];
  const todaysPlan = useMealPlanForDate(today);

  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

  const getMealRecipe = (mealType: typeof mealTypes[number]) => {
    if (!todaysPlan) return null;
    const recipeId = todaysPlan[mealType];
    return recipeId ? recipes.find(r => r.id === recipeId) : null;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Calendar size={24} color={Colors.primary} />
        <Text style={styles.dateText}>Today&apos;s Plan</Text>
      </View>

      {mealTypes.map((mealType) => {
        const recipe = getMealRecipe(mealType);
        return (
          <View key={mealType} style={styles.mealCard}>
            <View style={styles.mealHeader}>
              <Text style={styles.mealType}>
                {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
              </Text>
              {recipe && (
                <Text style={styles.calories}>
                  {recipe.nutrition?.calories || 0} cal
                </Text>
              )}
            </View>
            
            {recipe ? (
              <View style={styles.recipeInfo}>
                <Text style={styles.recipeName}>{recipe.title}</Text>
                <Text style={styles.recipeTime}>
                  {(recipe.prepTime || 0) + (recipe.cookTime || 0)} min
                </Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.addButton}>
                <Plus size={20} color={Colors.text.secondary} />
                <Text style={styles.addText}>Add {mealType}</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Daily Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Calories:</Text>
          <Text style={styles.summaryValue}>0</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Protein:</Text>
          <Text style={styles.summaryValue}>0g</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Carbs:</Text>
          <Text style={styles.summaryValue}>0g</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Fat:</Text>
          <Text style={styles.summaryValue}>0g</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  dateText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  mealCard: {
    backgroundColor: Colors.card,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  mealType: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  calories: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  recipeInfo: {
    gap: 4,
  },
  recipeName: {
    fontSize: 14,
    color: Colors.text.primary,
  },
  recipeTime: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  addText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  summaryCard: {
    backgroundColor: Colors.primary + '15',
    marginHorizontal: 16,
    marginVertical: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
});