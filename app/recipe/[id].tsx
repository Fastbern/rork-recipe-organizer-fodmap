/* eslint-disable @rork/linters/expo-router-enforce-safe-area-usage */
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';

import { useLocalSearchParams, Stack, router } from 'expo-router';
import { Recipe } from '@/types/recipe';
import { Heart, Clock, Users, ShoppingCart, Share2, ArrowLeft, Camera, Tag, Edit, Sparkles } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import Colors from '@/constants/colors';
import { useRecipe, useRecipes } from '@/hooks/recipe-store';
import DietaryAdaptationModal from '@/components/DietaryAdaptationModal';
import { useFodmap } from '@/hooks/fodmap-store';
import { useAdaptation } from '@/hooks/adaptation-store';
import { FodmapRating } from '@/types/fodmap';
import { trpc } from '@/lib/trpc';
import { adaptRecipeWithDatabase, AdaptedRecipeData, enforceLowFodmapOnAdapted } from '@/utils/recipe-adaptation';


function getFodmapDotStyle(rating: FodmapRating) {
  switch (rating) {
    case 'low':
      return { backgroundColor: '#34C759' };
    case 'moderate':
      return { backgroundColor: '#FFCC00' };
    case 'high':
      return { backgroundColor: '#FF3B30' };
    default:
      return { backgroundColor: '#C7C7CC' };
  }
}

function getFodmapTagStyle(rating: FodmapRating) {
  switch (rating) {
    case 'low':
      return { backgroundColor: '#34C75920', borderColor: '#34C759' };
    case 'moderate':
      return { backgroundColor: '#FFCC0020', borderColor: '#FFCC00' };
    case 'high':
      return { backgroundColor: '#FF3B3020', borderColor: '#FF3B30' };
    default:
      return { backgroundColor: '#C7C7CC20', borderColor: '#C7C7CC' };
  }
}

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams();
  const recipe = useRecipe(id as string);
  const { rateIngredient } = useFodmap();
  const { toggleFavorite, addToGroceryList, updateRecipeImage, updateRecipeCategory, categories, saveRecipe } = useRecipes();
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showDietaryModal, setShowDietaryModal] = useState(false);
  const { setProposal } = useAdaptation();
  
  const adaptRecipeMutation = trpc.recipe.adaptRecipe.useMutation();

  if (!recipe) {
    return (
      <View style={styles.container}>
        <Text>Recipe not found</Text>
      </View>
    );
  }

  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);

  const handleAddToGrocery = async () => {
    try {
      const result = await addToGroceryList(recipe.ingredients, recipe.id);
      const added = result?.added ?? 0;
      const merged = result?.merged ?? 0;
      const parts = [] as string[];
      if (added > 0) parts.push(`${added} new ${added === 1 ? 'item' : 'items'}`);
      if (merged > 0) parts.push(`${merged} ${merged === 1 ? 'existing item' : 'existing items'} updated`);
      const msg = parts.length > 0 ? parts.join(', ') : 'No changes';
      Alert.alert('Added to grocery list', msg);
    } catch (e) {
      Alert.alert('Error', 'Could not add to grocery list');
    }
  };

  const handleImageUpload = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Permission to access photos is required');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        let imageUri: string;
        
        if (asset.base64) {
          imageUri = `data:image/jpeg;base64,${asset.base64}`;
        } else if (asset.uri) {
          imageUri = asset.uri;
        } else {
          return;
        }
        
        updateRecipeImage(recipe.id, imageUri);
      }
    } catch (error) {
      console.error('[Image] Upload failed:', error);
      Alert.alert('Error', 'Failed to upload image');
    }
  };

  const handleGenerateImage = async () => {
    try {
      setIsUploadingImage(true);
      console.log('[Image] Generating image for recipe:', recipe.title);
      
      const response = await fetch('https://toolkit.rork.com/images/generate/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `A professional, appetizing food photography of ${recipe.title}. High quality, well-lit, restaurant-style presentation.`,
          size: '1024x1024',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate image');
      }

      const data = await response.json();
      const imageUri = `data:${data.image.mimeType};base64,${data.image.base64Data}`;
      updateRecipeImage(recipe.id, imageUri);
      console.log('[Image] Generated successfully');
    } catch (error) {
      console.error('[Image] Generation failed:', error);
      Alert.alert('Error', 'Failed to generate image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Recipe Photo',
      'Choose an option',
      [
        {
          text: 'Upload Photo',
          onPress: handleImageUpload,
        },
        {
          text: 'Generate with AI',
          onPress: handleGenerateImage,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const showCategoryOptions = () => {
    Alert.alert(
      'Select Category',
      'Choose a category for this recipe',
      [
        ...categories.map(category => ({
          text: category.name,
          onPress: () => updateRecipeCategory(recipe.id, category.name),
        })),
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const handleShare = () => {
    Alert.alert(
      'Share Recipe',
      'Choose a format to share',
      [
        {
          text: 'Full Recipe (Text)',
          onPress: () => shareAsText(),
        },
        {
          text: 'Recipe Link',
          onPress: () => shareAsLink(),
        },
        {
          text: 'Ingredients List',
          onPress: () => shareIngredients(),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const shareAsText = async () => {
    try {
      const recipeText = formatRecipeAsText(recipe);
      await Share.share({
        message: recipeText,
        title: recipe.title,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const shareAsLink = async () => {
    try {
      if (recipe.sourceUrl) {
        await Share.share({
          message: `Check out this recipe: ${recipe.title}\n${recipe.sourceUrl}`,
          title: recipe.title,
        });
      } else {
        await Share.share({
          message: `Check out this recipe: ${recipe.title}`,
          title: recipe.title,
        });
      }
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const shareIngredients = async () => {
    try {
      const ingredientsList = recipe.ingredients
        .map(ing => `• ${ing.amount} ${ing.unit || ''} ${ing.name}`.trim())
        .join('\n');
      await Share.share({
        message: `Ingredients for ${recipe.title}:\n\n${ingredientsList}`,
        title: `${recipe.title} - Ingredients`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleDietaryAdaptation = async (
    diets: string[],
    allergies: string[],
    customAllergies: string
  ) => {
    let adaptedData: AdaptedRecipeData;
    let usedFallback = false;

    try {
      console.log('[Dietary] Attempting AI-powered adaptation via backend tRPC', { diets, allergies, customAllergies });
      console.log('[Dietary] Recipe:', recipe.title);

      const allAllergies = customAllergies ? [...allergies, customAllergies] : allergies;

      adaptedData = await adaptRecipeMutation.mutateAsync({
        recipe: {
          title: recipe.title,
          description: recipe.description,
          servings: recipe.servings,
          prepTime: recipe.prepTime,
          cookTime: recipe.cookTime,
          ingredients: recipe.ingredients.map(ing => ({
            amount: ing.amount,
            unit: ing.unit,
            name: ing.name,
          })),
          instructions: recipe.instructions,
        },
        diets,
        allergies: allAllergies,
        customAllergies: '',
      });

      adaptedData = enforceLowFodmapOnAdapted(adaptedData, diets, allAllergies);
      console.log('[Dietary] AI adaptation successful (post-processed for FODMAP)', adaptedData);
    } catch (aiError) {
      console.log('[Dietary] AI adaptation failed, using rule-based fallback', aiError);
      usedFallback = true;

      const allAllergies = customAllergies ? [...allergies, customAllergies] : allergies;
      adaptedData = adaptRecipeWithDatabase(recipe, diets, allAllergies);
      console.log('[Dietary] Fallback adaptation complete', adaptedData);
    }

    try {
      setProposal({ original: recipe, adapted: adaptedData, diets, allergies });
      const methodUsed = usedFallback ? ' using rule-based substitutions' : '';
      Alert.alert(
        'Review changes',
        `We prepared an adapted version${methodUsed}. Review and approve substitutions.`,
        [
          { text: 'Review now', onPress: () => router.push('/adapt-review') },
          { text: 'Later', style: 'cancel' },
        ]
      );
      console.log('[Dietary] Proposal ready, navigating to review');
    } catch (error) {
      console.error('[Dietary] Failed to save adapted recipe:', error);
      throw error;
    }
  };

  const formatRecipeAsText = (recipe: Recipe): string => {
    let text = `${recipe.title}\n${'='.repeat(recipe.title.length)}\n\n`;
    
    if (recipe.description) {
      text += `${recipe.description}\n\n`;
    }
    
    const prepTime = recipe.prepTime || 0;
    const cookTime = recipe.cookTime || 0;
    const totalTime = prepTime + cookTime;
    if (totalTime > 0) {
      text += `⏱ Total Time: ${totalTime} min`;
      if (prepTime > 0) text += ` (Prep: ${prepTime} min, `;
      if (cookTime > 0) text += `Cook: ${cookTime} min)`;
      text += '\n';
    }
    
    if (recipe.servings) {
      text += `👥 Servings: ${recipe.servings}\n`;
    }
    
    if (recipe.nutrition?.calories) {
      text += `🔥 Calories: ${recipe.nutrition.calories} per serving\n`;
    }
    
    text += '\n';
    
    text += 'INGREDIENTS:\n';
    recipe.ingredients.forEach(ing => {
      text += `• ${ing.amount} ${ing.unit || ''} ${ing.name}`.trim() + '\n';
    });
    
    text += '\n';
    text += 'INSTRUCTIONS:\n';
    recipe.instructions.forEach((instruction, index) => {
      text += `${index + 1}. ${instruction}\n\n`;
    });
    
    if (recipe.notes) {
      text += 'NOTES:\n';
      text += `${recipe.notes}\n`;
    }
    
    if (recipe.sourceUrl) {
      text += `\nSource: ${recipe.sourceUrl}`;
    }
    
    return text;
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerTransparent: true,
          headerLeft: () => (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color={Colors.text.primary} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => router.push(`/edit-recipe/${recipe.id}`)}
              >
                <Edit size={24} color={Colors.text.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => toggleFavorite(recipe.id)}
              >
                <Heart
                  size={24}
                  color={recipe.isFavorite ? Colors.favorite : Colors.text.primary}
                  fill={recipe.isFavorite ? Colors.favorite : 'transparent'}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
                <Share2 size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          {recipe.imageUrl ? (
            <Image source={{ uri: recipe.imageUrl }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.placeholderImage]}>
              <Text style={styles.placeholderEmoji}>🍽️</Text>
            </View>
          )}
          
          <TouchableOpacity
            style={styles.imageUploadButton}
            onPress={showImageOptions}
            disabled={isUploadingImage}
          >
            {isUploadingImage ? (
              <ActivityIndicator size="small" color={Colors.text.inverse} />
            ) : (
              <Camera size={20} color={Colors.text.inverse} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{recipe.title}</Text>
            <TouchableOpacity
              style={styles.categoryButton}
              onPress={showCategoryOptions}
            >
              <Tag size={16} color={Colors.primary} />
              <Text style={styles.categoryButtonText}>
                {recipe.categories && recipe.categories.length > 0 ? recipe.categories[0] : 'Add Category'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {recipe.description && (
            <Text style={styles.description}>{recipe.description}</Text>
          )}

          <View style={styles.metaContainer}>
            {totalTime > 0 && (
              <View style={styles.metaItem}>
                <Clock size={16} color={Colors.text.secondary} />
                <Text style={styles.metaText}>{totalTime} min</Text>
              </View>
            )}
            {recipe.servings && (
              <View style={styles.metaItem}>
                <Users size={16} color={Colors.text.secondary} />
                <Text style={styles.metaText}>{recipe.servings} servings</Text>
              </View>
            )}
            {recipe.nutrition?.calories && (
              <View style={styles.metaItem}>
                <Text style={styles.metaText}>{recipe.nutrition.calories} cal</Text>
              </View>
            )}
          </View>

          {recipe.nutrition && (
            <View style={styles.nutritionCard}>
              <Text style={styles.sectionTitle}>Nutrition per serving</Text>
              <View style={styles.nutritionGrid}>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{recipe.nutrition.calories || 0}</Text>
                  <Text style={styles.nutritionLabel}>Calories</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{recipe.nutrition.protein || 0}g</Text>
                  <Text style={styles.nutritionLabel}>Protein</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{recipe.nutrition.carbs || 0}g</Text>
                  <Text style={styles.nutritionLabel}>Carbs</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{recipe.nutrition.fat || 0}g</Text>
                  <Text style={styles.nutritionLabel}>Fat</Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Ingredients</Text>
              <TouchableOpacity
                style={styles.addToGroceryButton}
                onPress={handleAddToGrocery}
                testID="add-to-grocery"
              >
                <ShoppingCart size={18} color={Colors.primary} />
                <Text style={styles.addToGroceryText}>Add to list</Text>
              </TouchableOpacity>
            </View>
            {recipe.ingredients.map((ingredient) => {
              const { rating } = rateIngredient(ingredient.name);
              return (
                <View key={ingredient.id} style={styles.ingredientItem}>
                  <Text style={styles.ingredientAmount}>
                    {ingredient.amount} {ingredient.unit}
                  </Text>
                  <View style={styles.ingredientNameRow}>
                    <View style={[styles.fodmapDot, getFodmapDotStyle(rating)]} />
                    <Text style={styles.ingredientName}>
                      {ingredient.name}
                      {ingredient.isOptional && ' (optional)'}
                    </Text>
                    {rating !== 'unknown' && (
                      <View style={[styles.fodmapTag, getFodmapTagStyle(rating)]}>
                        <Text style={styles.fodmapTagText}>{rating === 'low' ? 'Low FODMAP' : rating === 'moderate' ? 'Moderate' : 'High'}</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            {recipe.instructions.map((instruction, index) => (
              <View key={`instruction-${index}`} style={styles.instructionItem}>
                <View style={styles.instructionNumber}>
                  <Text style={styles.instructionNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.instructionText}>{instruction}</Text>
              </View>
            ))}
          </View>

          {recipe.notes && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={styles.notes}>{recipe.notes}</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.adaptButton}
            onPress={() => setShowDietaryModal(true)}
          >
            <Sparkles size={20} color={Colors.text.inverse} />
            <Text style={styles.adaptButtonText}>Adapt for Dietary Needs</Text>
          </TouchableOpacity>
        </View>
        </ScrollView>

        <DietaryAdaptationModal
          visible={showDietaryModal}
          onClose={() => setShowDietaryModal(false)}
          onAdapt={handleDietaryAdaptation}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 300,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageUploadButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  placeholderImage: {
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 64,
  },
  content: {
    padding: 20,
  },
  titleRow: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.primary + '15',
    alignSelf: 'flex-start',
  },
  categoryButtonText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    color: Colors.text.secondary,
    lineHeight: 24,
    marginBottom: 16,
  },
  metaContainer: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  nutritionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  addToGroceryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.primary + '15',
  },
  addToGroceryText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  ingredientItem: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  ingredientAmount: {
    fontSize: 14,
    color: Colors.text.secondary,
    width: 80,
  },
  ingredientNameRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ingredientName: {
    fontSize: 14,
    color: Colors.text.primary,
    flexShrink: 1,
  },
  fodmapDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  fodmapTag: {
    marginLeft: 'auto',
    borderWidth: 1,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  fodmapTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  instructionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  instructionNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.primary,
    lineHeight: 20,
    paddingTop: 4,
  },
  notes: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  adaptButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 32,
    marginBottom: 20,
  },
  adaptButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
});