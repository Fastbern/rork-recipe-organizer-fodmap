import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Sparkles, ChefHat, Filter, X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import SearchBar from '@/components/SearchBar';
import { useRecipes } from '@/hooks/recipe-store';
import { router } from 'expo-router';
import { trpc } from '@/lib/trpc';
import { generateText } from '@rork/toolkit-sdk';

type MealTypeFilter = 'all' | 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert';

interface LocalGeneratedRecipe {
  title: string;
  description?: string;
  mealType: string;
  ingredients: { name: string; amount: string; unit?: string }[];
  instructions: string[];
  prepTime?: number;
  cookTime?: number;
  servings?: number;
}

export default function ExploreScreen() {
  const { recipes, aiRecipesGenerated, saveGeneratedRecipes } = useRecipes();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMealType, setSelectedMealType] = useState<MealTypeFilter>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  const mealTypeFilters: { id: MealTypeFilter; label: string; emoji: string }[] = [
    { id: 'all', label: 'All', emoji: '🍽️' },
    { id: 'breakfast', label: 'Breakfast', emoji: '🍳' },
    { id: 'lunch', label: 'Lunch', emoji: '🥗' },
    { id: 'dinner', label: 'Dinner', emoji: '🍝' },
    { id: 'snack', label: 'Snacks', emoji: '🥨' },
    { id: 'dessert', label: 'Desserts', emoji: '🍰' },
  ];

  const filteredRecipes = useMemo(() => {
    let filtered = recipes;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(query) ||
          r.description?.toLowerCase().includes(query) ||
          r.tags.some((t) => t.toLowerCase().includes(query)) ||
          r.ingredients.some((i) => i.name.toLowerCase().includes(query))
      );
    }

    if (selectedMealType !== 'all') {
      filtered = filtered.filter((r) => r.tags.includes(selectedMealType));
    }

    return filtered;
  }, [recipes, searchQuery, selectedMealType]);

  const generateRecipesMutation = trpc.recipe.generateRecipes.useMutation();

  const handleGenerateRecipes = async () => {
    if (aiRecipesGenerated) {
      Alert.alert(
        'Recipes Already Generated',
        'You already have AI-generated recipes in your collection. Would you like to generate more?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Generate More', onPress: () => startGeneration() },
        ]
      );
    } else {
      startGeneration();
    }
  };

  const startGeneration = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      console.log('[Explore] Starting AI recipe generation - 100 recipes');

      const batchSize = 10;
      const totalBatches = 10;
      const allRecipes: any[] = [];

      for (let batch = 1; batch <= totalBatches; batch++) {
        console.log(`[Explore] Generating batch ${batch}/${totalBatches}`);
        setGenerationProgress((batch - 1) / totalBatches);

        try {
          const result = await generateRecipesMutation.mutateAsync({
            count: batchSize,
            batchNumber: batch,
          });
          allRecipes.push(...result);
        } catch (err) {
          console.warn('[Explore] tRPC generation failed, falling back to local AI:', err);
          const local = await generateLocalRecipes(batchSize, batch);
          allRecipes.push(...local);
        }

        console.log(`[Explore] Batch ${batch} completed. Total recipes: ${allRecipes.length}`);
      }

      await saveGeneratedRecipes(allRecipes);
      setGenerationProgress(1);

      Alert.alert(
        'Success! 🎉',
        `Generated ${allRecipes.length} unique low-FODMAP recipes! Start exploring now.`,
        [{ text: 'Explore Recipes', onPress: () => setIsGenerating(false) }]
      );

      console.log('[Explore] All recipes generated and saved successfully');
    } catch (error) {
      console.error('[Explore] Recipe generation failed:', error);
      Alert.alert(
        'Generation Failed',
        'Unable to generate recipes. Please check your connection and try again.',
        [{ text: 'OK', onPress: () => setIsGenerating(false) }]
      );
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  async function generateLocalRecipes(count: number, batchNumber: number) {
    const prompt = `Generate ${count} unique and creative low-FODMAP recipes for batch ${batchNumber}.

IMPORTANT REQUIREMENTS:
- All recipes MUST use ONLY low-FODMAP ingredients
- Each recipe must be completely unique and creative
- Use varied cooking techniques and international cuisines
- Include meal types: breakfast, lunch, dinner, snack, dessert
- Make recipes practical and realistic
- Ensure accurate cooking times and servings

Return a valid JSON array with ${count} recipe objects. Each recipe must have this exact structure:
{
  "title": "Creative recipe name",
  "description": "Brief appetizing description (1-2 sentences)",
  "mealType": "breakfast|lunch|dinner|snack|dessert",
  "ingredients": [
    { "name": "ingredient name", "amount": "quantity", "unit": "measurement unit (optional)" }
  ],
  "instructions": ["Step 1 instruction", "Step 2 instruction"],
  "prepTime": number,
  "cookTime": number,
  "servings": number
}

Return ONLY the JSON array, no additional text or explanation.`;

    const response = await generateText({
      messages: [
        { role: 'user', content: prompt },
      ],
    });

    let cleaned = response.trim();
    if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    else if (cleaned.startsWith('```')) cleaned = cleaned.replace(/```\n?/g, '');

    const parsed = JSON.parse(cleaned) as LocalGeneratedRecipe[];

    const imageByMeal: Record<string, string[]> = {
      breakfast: [
        'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800',
        'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800',
      ],
      lunch: [
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
        'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
      ],
      dinner: [
        'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
        'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800',
      ],
      snack: [
        'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=800',
        'https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=800',
      ],
      dessert: [
        'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800',
        'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800',
      ],
    };

    const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

    return parsed.map((r, idx) => {
      const id = `ai-local-${batchNumber}-${Date.now()}-${idx}`;
      return {
        id,
        title: r.title,
        description: r.description ?? '',
        imageUrl: pick(imageByMeal[r.mealType] ?? imageByMeal.lunch),
        sourcePlatform: 'manual' as const,
        prepTime: r.prepTime ?? 15,
        cookTime: r.cookTime ?? 30,
        servings: r.servings ?? 4,
        ingredients: r.ingredients.map((ing, i) => ({
          id: `${id}-ing-${i}`,
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit ?? '',
          category: 'other' as const,
        })),
        instructions: r.instructions,
        nutrition: {
          calories: 400,
          protein: 20,
          carbs: 40,
          fat: 15,
          fiber: 6,
          sugar: 8,
          sodium: 500,
        },
        categories: [r.mealType, 'Low FODMAP'],
        tags: ['low-fodmap', 'ai-generated', r.mealType],
        rating: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isFavorite: false,
      };
    });
  }


  if (isGenerating) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <Sparkles size={48} color={Colors.primary} />
          <Text style={styles.loadingTitle}>Creating Amazing Recipes</Text>
          <Text style={styles.loadingSubtitle}>
            Generating {Math.floor(generationProgress * 100)} unique low-FODMAP recipes...
          </Text>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                { width: `${Math.floor(generationProgress * 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.loadingHint}>This may take a few minutes</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search recipes, ingredients..."
        />

        {!aiRecipesGenerated && (
          <View style={styles.heroCard}>
            <View style={styles.heroContent}>
              <ChefHat size={40} color={Colors.primary} />
              <Text style={styles.heroTitle}>Discover 100 Low-FODMAP Recipes</Text>
              <Text style={styles.heroDescription}>
                AI-powered recipes tailored for your dietary needs. Delicious, safe, and easy to
                make.
              </Text>
              <TouchableOpacity
                style={styles.generateButton}
                onPress={handleGenerateRecipes}
              >
                <Sparkles size={20} color="#fff" />
                <Text style={styles.generateButtonText}>Generate Recipes</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.filterSection}>
          <View style={styles.filterHeader}>
            <Filter size={18} color={Colors.text.primary} />
            <Text style={styles.filterTitle}>Filter by Meal Type</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}
          >
            {mealTypeFilters.map((filter) => {
              const isSelected = selectedMealType === filter.id;
              return (
                <TouchableOpacity
                  key={filter.id}
                  style={[
                    styles.filterChip,
                    isSelected && styles.filterChipActive,
                  ]}
                  onPress={() => setSelectedMealType(filter.id)}
                >
                  <Text style={styles.filterEmoji}>{filter.emoji}</Text>
                  <Text
                    style={[
                      styles.filterLabel,
                      isSelected && styles.filterLabelActive,
                    ]}
                  >
                    {filter.label}
                  </Text>
                  {isSelected && <X size={14} color="#fff" />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.resultsSection}>
          <Text style={styles.resultsTitle}>
            {filteredRecipes.length} Recipe{filteredRecipes.length !== 1 ? 's' : ''} Found
          </Text>
        </View>

        {filteredRecipes.length === 0 ? (
          <View style={styles.emptyState}>
            <ChefHat size={64} color={Colors.text.light} />
            <Text style={styles.emptyTitle}>No Recipes Found</Text>
            <Text style={styles.emptyDescription}>
              {searchQuery
                ? 'Try adjusting your search or filters'
                : 'Generate AI recipes to get started'}
            </Text>
            {!aiRecipesGenerated && (
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={handleGenerateRecipes}
              >
                <Text style={styles.emptyButtonText}>Generate Recipes</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.recipeGrid}>
            {filteredRecipes.map((recipe) => (
              <TouchableOpacity
                key={recipe.id}
                style={styles.recipeCard}
                onPress={() => router.push(`/recipe/${recipe.id}`)}
              >
                <Image
                  source={{
                    uri: recipe.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
                  }}
                  style={styles.recipeImage}
                />
                <View style={styles.recipeOverlay}>
                  <View style={styles.recipeBadge}>
                    <Text style={styles.recipeBadgeText}>Low FODMAP</Text>
                  </View>
                </View>
                <View style={styles.recipeContent}>
                  <Text style={styles.recipeTitle} numberOfLines={2}>
                    {recipe.title}
                  </Text>
                  {recipe.description && (
                    <Text style={styles.recipeDescription} numberOfLines={2}>
                      {recipe.description}
                    </Text>
                  )}
                  <View style={styles.recipeMeta}>
                    {recipe.prepTime !== undefined && recipe.cookTime !== undefined && (
                      <Text style={styles.metaText}>
                        ⏱️ {recipe.prepTime + recipe.cookTime} min
                      </Text>
                    )}
                    {recipe.servings && (
                      <Text style={styles.metaText}>👥 {recipe.servings} servings</Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 24,
  },
  loadingCard: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
    marginTop: 16,
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginTop: 8,
    textAlign: 'center',
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: Colors.surface,
    borderRadius: 4,
    marginTop: 24,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  loadingHint: {
    fontSize: 14,
    color: Colors.text.light,
    marginTop: 12,
    fontStyle: 'italic' as const,
  },
  heroCard: {
    backgroundColor: Colors.primary + '10',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    borderColor: Colors.primary + '30',
  },
  heroContent: {
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text.primary,
    marginTop: 16,
    textAlign: 'center',
  },
  heroDescription: {
    fontSize: 15,
    color: Colors.text.secondary,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  filterSection: {
    marginTop: 8,
    marginBottom: 12,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  filterScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
  },
  filterEmoji: {
    fontSize: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  filterLabelActive: {
    color: '#fff',
  },
  resultsSection: {
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  recipeGrid: {
    paddingHorizontal: 16,
    gap: 16,
  },
  recipeCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  recipeImage: {
    width: '100%',
    height: 200,
    backgroundColor: Colors.surface,
  },
  recipeOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  recipeBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  recipeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recipeContent: {
    padding: 16,
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 6,
  },
  recipeDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  recipeMeta: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 13,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    marginTop: 16,
  },
  emptyDescription: {
    fontSize: 15,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  emptyButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
