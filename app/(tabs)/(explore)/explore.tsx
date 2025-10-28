import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { TrendingUp, Clock, Star, Shield } from 'lucide-react-native';
import Colors from '@/constants/colors';
import SearchBar from '@/components/SearchBar';
import { useRecipes } from '@/hooks/recipe-store';
import { useFodmap } from '@/hooks/fodmap-store';
import { FodmapRating } from '@/types/fodmap';
import { router } from 'expo-router';

type ExploreFilter = 'low' | 'moderate' | 'high' | 'all' | 'quick' | 'top' | 'trending';

function ratingColor(r: FodmapRating): string {
  switch (r) {
    case 'low':
      return '#10B981';
    case 'moderate':
      return '#F59E0B';
    case 'high':
      return '#EF4444';
    default:
      return Colors.text.secondary;
  }
}

export default function ExploreScreen() {
  const { recipes, searchQuery, setSearchQuery } = useRecipes();
  const { dataset, isLoading } = useFodmap();
  const [selectedFilter, setSelectedFilter] = useState<ExploreFilter>('low');

  const computeRecipeRating = useCallback((recipeId: string) => {
    try {
      const recipe = recipes.find(r => r.id === recipeId);
      if (!recipe || !dataset) return { rating: 'unknown' as FodmapRating, lowCount: 0, highCount: 0 };
      let low = 0, high = 0, moderate = 0, unknown = 0;
      for (const ing of recipe.ingredients) {
        const n = (ing.name || '').trim();
        if (!n) continue;
        const match = dataset.entries.find(e => {
          const a = e.name.toLowerCase().trim();
          const b = n.toLowerCase().trim();
          return a === b || a.includes(b) || b.includes(a);
        });
        const r: FodmapRating = match?.rating ?? 'unknown';
        if (r === 'low') low += 1; else if (r === 'high') high += 1; else if (r === 'moderate') moderate += 1; else unknown += 1;
      }
      const rating: FodmapRating = high > 0 ? 'high' : (moderate > 0 ? 'moderate' : (low > 0 ? 'low' : 'unknown'));
      return { rating, lowCount: low, highCount: high };
    } catch (e) {
      return { rating: 'unknown' as FodmapRating, lowCount: 0, highCount: 0 };
    }
  }, [recipes, dataset]);

  const enhanced = useMemo(() => {
    return recipes.map(r => ({
      recipe: r,
      ...computeRecipeRating(r.id),
    }));
  }, [recipes, computeRecipeRating]);

  const baseFilters = [
    { id: 'low' as const, label: 'Low FODMAP', icon: Shield },
    { id: 'moderate' as const, label: 'Moderate', icon: Shield },
    { id: 'high' as const, label: 'High', icon: Shield },
  ];

  const secondaryFilters = [
    { id: 'quick' as const, label: 'Quick', icon: Clock },
    { id: 'top' as const, label: 'Top Rated', icon: Star },
    { id: 'trending' as const, label: 'Trending', icon: TrendingUp },
    { id: 'all' as const, label: 'All', icon: Shield },
  ];

  const displayed = useMemo(() => {
    let list = enhanced;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(({ recipe }) =>
        recipe.title.toLowerCase().includes(q) ||
        recipe.description?.toLowerCase().includes(q) ||
        recipe.ingredients.some(i => i.name.toLowerCase().includes(q))
      );
    }

    switch (selectedFilter) {
      case 'low':
      case 'moderate':
      case 'high':
        list = list.filter(it => it.rating === selectedFilter);
        break;
      case 'quick':
        list = list.filter(it => ((it.recipe.prepTime || 0) + (it.recipe.cookTime || 0)) <= 30);
        break;
      case 'top':
        list = list.filter(it => it.recipe.rating === 5);
        break;
      case 'trending':
        list = list.slice(0, 5);
        break;
      case 'all':
      default:
        break;
    }
    return list;
  }, [enhanced, selectedFilter, searchQuery]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} testID="explore-scroll">
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search Low FODMAP recipes..."
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Explore FODMAP-Friendly</Text>
        <Text style={styles.sectionSubtitle}>
          Smart filters to discover recipes that fit your gut
        </Text>
      </View>

      <View style={styles.filterRow}>
        {baseFilters.map((f) => {
          const Icon = f.icon;
          const active = selectedFilter === f.id;
          return (
            <TouchableOpacity
              key={f.id}
              style={[styles.filterPill, active && styles.filterPillActive]}
              onPress={() => setSelectedFilter(f.id)}
              testID={`filter-${f.id}`}
            >
              <Icon size={16} color={active ? Colors.text.inverse : ratingColor(f.id)} />
              <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.filterRowSecondary}>
        {secondaryFilters.map((f) => {
          const Icon = f.icon;
          const active = selectedFilter === f.id;
          return (
            <TouchableOpacity
              key={f.id}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setSelectedFilter(f.id)}
              testID={`filter-${f.id}`}
            >
              <Icon size={14} color={active ? Colors.text.inverse : Colors.text.primary} />
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {isLoading && (
        <View style={styles.loadingBox} testID="fodmap-loading">
          <Text style={styles.loadingText}>Loading FODMAP database...</Text>
        </View>
      )}

      {displayed.map(({ recipe, rating }) => (
        <TouchableOpacity
          key={recipe.id}
          style={styles.recipeCard}
          onPress={() => router.push(`/recipe/${recipe.id}`)}
          testID={`recipe-${recipe.id}`}
        >
          <Image
            source={{ uri: recipe.imageUrl || 'https://images.unsplash.com/photo-1466637574441-749b8f19452f?q=80&w=800&auto=format&fit=crop' }}
            style={styles.recipeImage}
          />
          <View style={styles.recipeContent}>
            <View style={styles.recipeHeaderRow}>
              <Text style={styles.recipeTitle} numberOfLines={2}>{recipe.title}</Text>
              <View style={[styles.badge, { backgroundColor: ratingColor(rating) + '26' }]}> 
                <Shield size={12} color={ratingColor(rating)} />
                <Text style={[styles.badgeText, { color: ratingColor(rating) }]}>{rating.toUpperCase()}</Text>
              </View>
            </View>
            {recipe.description && (
              <Text style={styles.recipeDescription} numberOfLines={2}>
                {recipe.description}
              </Text>
            )}
            <View style={styles.recipeMeta}>
              {(recipe.prepTime || recipe.cookTime) && (
                <View style={styles.metaItem}>
                  <Clock size={14} color={Colors.text.secondary} />
                  <Text style={styles.metaText}>
                    {(recipe.prepTime || 0) + (recipe.cookTime || 0)} min
                  </Text>
                </View>
              )}
              {typeof recipe.rating === 'number' && (
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
          Paste a recipe URL on Import to auto-check FODMAPs per ingredient.
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
  section: {
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 8,
  },
  filterRowSecondary: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    gap: 8,
  },
  filterPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: Colors.surface,
    gap: 6,
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  filterPillTextActive: {
    color: Colors.text.inverse,
  },
  filterChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  filterChipTextActive: {
    color: Colors.text.inverse,
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
  recipeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  recipeTitle: {
    flex: 1,
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
  loadingBox: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.surface,
  },
  loadingText: {
    color: Colors.text.secondary,
    fontSize: 13,
  },
});