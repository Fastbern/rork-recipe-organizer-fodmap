import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { TrendingUp, Clock, Star, Info, Flame, Leaf } from 'lucide-react-native';
import Colors from '@/constants/colors';
import SearchBar from '@/components/SearchBar';
import { useRecipes } from '@/hooks/recipe-store';
import { router } from 'expo-router';
import { useFodmap } from '@/hooks/fodmap-store';
import type { FodmapEntry, FodmapRating } from '@/types/fodmap';

export default function ExploreScreen() {
  const { recipes, searchQuery, setSearchQuery } = useRecipes();
  const [selectedFilter, setSelectedFilter] = React.useState<'trending' | 'quick' | 'top'>('trending');

  const { dataset, isLoading, error, rateIngredient } = useFodmap();
  const [foodQuery, setFoodQuery] = React.useState<string>('');
  const [ratingFilter, setRatingFilter] = React.useState<FodmapRating | 'all'>('all');

  const trendingRecipes = recipes.slice(0, 3);
  const quickRecipes = recipes.filter(r => ((r.prepTime || 0) + (r.cookTime || 0)) <= 30);
  const topRatedRecipes = recipes.filter(r => r.rating === 5);

  const filters = [
    { id: 'trending', label: 'Trending', icon: TrendingUp },
    { id: 'quick', label: 'Quick & Easy', icon: Clock },
    { id: 'top', label: 'Top Rated', icon: Star },
  ] as const;

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

  const fodmapResults = React.useMemo(() => {
    const list: FodmapEntry[] = dataset?.entries ?? [];
    const q = foodQuery.trim().toLowerCase();
    const filtered = list.filter((e) => {
      const matchesQuery = q.length === 0 || e.name.toLowerCase().includes(q);
      const matchesRating = ratingFilter === 'all' || e.rating === ratingFilter;
      return matchesQuery && matchesRating;
    });
    return filtered.slice(0, 30);
  }, [dataset?.entries, foodQuery, ratingFilter]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Discover new recipes..."
      />

      <View style={styles.fodmapCard}>
        <Text style={styles.fodmapTitle}>FODMAP Lookup</Text>
        <Text style={styles.fodmapSubtitle}>Check foods rated for IBS-friendly eating</Text>

        <SearchBar
          value={foodQuery}
          onChangeText={setFoodQuery}
          placeholder="Search foods (e.g., apple, onion)"
        />

        <View style={styles.ratingRow}>
          {(['all','low','moderate','high'] as const).map((key) => {
            const isActive = ratingFilter === key;
            const Icon = key === 'low' ? Leaf : key === 'high' ? Flame : Info;
            return (
              <TouchableOpacity
                key={key}
                onPress={() => setRatingFilter(key as any)}
                style={[styles.pill, isActive && styles.pillActive]}
                testID={`rating-pill-${key}`}
              >
                <Icon size={14} color={isActive ? Colors.text.inverse : Colors.text.primary} />
                <Text style={[styles.pillText, isActive && styles.pillTextActive]}>{key.toString().toUpperCase()}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {isLoading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.loadingText}>Loading FODMAP data…</Text>
          </View>
        )}
        {!!error && (
          <View style={styles.errorRow}>
            <Text style={styles.errorText}>Couldn’t load dataset. Showing limited results.</Text>
          </View>
        )}

        {!isLoading && fodmapResults.length === 0 && (
          <View style={styles.emptyRow}>
            <Text style={styles.emptyText}>No foods match your search.</Text>
          </View>
        )}

        {!isLoading && fodmapResults.length > 0 && (
          <View style={styles.resultsList}>
            {fodmapResults.map((item, idx) => (
              <View key={`${item.name}-${idx}`} style={styles.resultItem} testID="fodmap-result-item">
                <View style={styles.resultBullet(item.rating)} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.resultName}>{item.name}</Text>
                  <Text style={styles.resultMeta} numberOfLines={1}>
                    {item.rating.toUpperCase()} {item.servingNote ? `• ${item.servingNote}` : ''}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

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
          testID="explore-recipe-card"
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
  fodmapCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: Colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  fodmapTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  fodmapSubtitle: {
    marginTop: 4,
    marginBottom: 8,
    fontSize: 13,
    color: Colors.text.secondary,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 0,
    marginTop: 6,
    marginBottom: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: Colors.surface,
  },
  pillActive: {
    backgroundColor: Colors.primary,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  pillTextActive: {
    color: Colors.text.inverse,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  errorRow: {
    paddingVertical: 6,
  },
  errorText: {
    color: Colors.error,
    fontSize: 13,
  },
  emptyRow: {
    paddingVertical: 8,
  },
  emptyText: {
    color: Colors.text.secondary,
    fontSize: 13,
  },
  resultsList: {
    marginTop: 4,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  // dynamic style helper for bullet color by rating
  resultBullet: (rating: FodmapRating) => ({
    width: 10,
    height: 10,
    borderRadius: 6,
    backgroundColor:
      rating === 'low' ? '#2ECC71' : rating === 'moderate' ? '#F1C40F' : rating === 'high' ? '#E74C3C' : Colors.text.light,
  } as const),
  resultName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  resultMeta: {
    marginTop: 2,
    fontSize: 12,
    color: Colors.text.secondary,
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