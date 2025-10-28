import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { TrendingUp, Clock, Star } from 'lucide-react-native';
import Colors from '@/constants/colors';
import SearchBar from '@/components/SearchBar';
import { useRecipes } from '@/hooks/recipe-store';
import { router } from 'expo-router';

export default function ExploreScreen() {
  const { recipes, searchQuery, setSearchQuery } = useRecipes();
  const [selectedFilter, setSelectedFilter] = React.useState<'trending' | 'quick' | 'top'>('trending');

  const trendingRecipes = recipes.slice(0, 3);
  const quickRecipes = recipes.filter(r => ((r.prepTime || 0) + (r.cookTime || 0)) <= 30);
  const topRatedRecipes = recipes.filter(r => r.rating === 5);

  const filters = [
    { id: 'trending', label: 'Trending', icon: TrendingUp },
    { id: 'quick', label: 'Quick & Easy', icon: Clock },
    { id: 'top', label: 'Top Rated', icon: Star },
  ];

  const getFilteredRecipes = () => {
    switch (selectedFilter) {
      case 'quick':
        return quickRecipes;
      case 'top':
        return topRatedRecipes;
      default:
        return trendingRecipes;
    }
  };

  const displayedRecipes = getFilteredRecipes();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Discover new recipes..."
      />

      <View style={styles.filterContainer}>
        {filters.map((filter) => {
          const Icon = filter.icon;
          const isSelected = selectedFilter === filter.id;
          return (
            <TouchableOpacity
              key={filter.id}
              style={[styles.filterButton, isSelected && styles.filterButtonActive]}
              onPress={() => setSelectedFilter(filter.id as any)}
            >
              <Icon size={18} color={isSelected ? Colors.text.inverse : Colors.text.primary} />
              <Text style={[styles.filterText, isSelected && styles.filterTextActive]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Discover New Flavors</Text>
        <Text style={styles.sectionSubtitle}>
          Explore recipes from around the world
        </Text>
      </View>

      {displayedRecipes.map((recipe) => (
        <TouchableOpacity
          key={recipe.id}
          style={styles.recipeCard}
          onPress={() => router.push(`/recipe/${recipe.id}`)}
        >
          <Image
            source={{ uri: recipe.imageUrl || 'https://via.placeholder.com/150' }}
            style={styles.recipeImage}
          />
          <View style={styles.recipeContent}>
            <Text style={styles.recipeTitle}>{recipe.title}</Text>
            {recipe.description && (
              <Text style={styles.recipeDescription} numberOfLines={2}>
                {recipe.description}
              </Text>
            )}
            <View style={styles.recipeMeta}>
              {recipe.prepTime && recipe.cookTime && (
                <View style={styles.metaItem}>
                  <Clock size={14} color={Colors.text.secondary} />
                  <Text style={styles.metaText}>
                    {recipe.prepTime + recipe.cookTime} min
                  </Text>
                </View>
              )}
              {recipe.rating && (
                <View style={styles.metaItem}>
                  <Star size={14} color="#FFB800" fill="#FFB800" />
                  <Text style={styles.metaText}>{recipe.rating}.0</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      ))}

      <View style={styles.tipCard}>
        <Text style={styles.tipTitle}>💡 Pro Tip</Text>
        <Text style={styles.tipText}>
          Save recipes from any website by sharing the URL to our app!
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginVertical: 12,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  filterTextActive: {
    color: Colors.text.inverse,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  recipeCard: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  recipeImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  recipeContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  recipeDescription: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  recipeMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  tipCard: {
    backgroundColor: Colors.primary + '15',
    marginHorizontal: 16,
    marginVertical: 24,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
});