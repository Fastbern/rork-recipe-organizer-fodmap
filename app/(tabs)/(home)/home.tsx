import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { Plus, Heart } from 'lucide-react-native';
import Colors from '@/constants/colors';
import RecipeCard from '@/components/RecipeCard';
import SearchBar from '@/components/SearchBar';
import CategoryFilter from '@/components/CategoryFilter';
import { useRecipes, useFavoriteRecipes } from '@/hooks/recipe-store';

export default function HomeScreen() {
  const {
    filteredRecipes,
    categories,
    searchQuery,
    selectedCategory,
    setSearchQuery,
    setSelectedCategory,
    toggleFavorite,

  } = useRecipes();

  const favoriteRecipes = useFavoriteRecipes();
  const [showFavoritesOnly, setShowFavoritesOnly] = React.useState(false);

  const displayedRecipes = showFavoritesOnly ? favoriteRecipes : filteredRecipes;

  const handleRecipePress = (recipeId: string) => {
    router.push(`/recipe/${recipeId}`);
  };

  const handleAddRecipe = () => {
    router.push('/add-recipe');
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <View style={styles.headerButtons}>
              <TouchableOpacity
                onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
                style={styles.headerButton}
                testID="toggle-favorites"
              >
                <Heart
                  size={24}
                  color={showFavoritesOnly ? Colors.favorite : Colors.text.primary}
                  fill={showFavoritesOnly ? Colors.favorite : 'transparent'}
                />
              </TouchableOpacity>

            </View>
          ),
        }}
      />

      <View style={styles.container}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search recipes, ingredients..."
        />

        {!showFavoritesOnly && (
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        )}

        {showFavoritesOnly && favoriteRecipes.length === 0 ? (
          <View style={styles.emptyState}>
            <Heart size={48} color={Colors.text.light} />
            <Text style={styles.emptyTitle}>No Favorite Recipes</Text>
            <Text style={styles.emptyText}>
              Tap the heart icon on recipes to add them to your favorites
            </Text>
          </View>
        ) : displayedRecipes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Recipes Found</Text>
            <Text style={styles.emptyText}>
              Try adjusting your search or filters
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddRecipe}
            >
              <Plus size={20} color={Colors.text.inverse} />
              <Text style={styles.addButtonText}>Add Your First Recipe</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={displayedRecipes}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <RecipeCard
                recipe={item}
                onPress={() => handleRecipePress(item.id)}
                onToggleFavorite={() => toggleFavorite(item.id)}
              />
            )}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}

          />
        )}

        {!showFavoritesOnly && displayedRecipes.length > 0 && (
          <TouchableOpacity
            style={styles.floatingButton}
            onPress={handleAddRecipe}
            testID="floating-add-button"
          >
            <Plus size={28} color={Colors.text.inverse} />
          </TouchableOpacity>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  headerButton: {
    marginLeft: 16,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 80,
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
    marginBottom: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  addButtonText: {
    color: Colors.text.inverse,
    fontWeight: '600',
    marginLeft: 8,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
});