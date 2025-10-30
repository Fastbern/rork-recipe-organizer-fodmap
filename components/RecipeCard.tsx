import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { Heart, Clock, Users, Camera, FolderOpen, Plus } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import Colors from '@/constants/colors';
import { Recipe } from '@/types/recipe';
import { useRecipes } from '@/hooks/recipe-store';

interface RecipeCardProps {
  recipe: Recipe;
  onPress: () => void;
  onToggleFavorite: () => void;
}

export default function RecipeCard({ recipe, onPress, onToggleFavorite }: RecipeCardProps) {
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
  const { updateRecipeImage, updateRecipeCategory, categories, addRecipeToMeal } = useRecipes();
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showAddToPlan, setShowAddToPlan] = useState(false);

  const handleImageUpload = async (e: any) => {
    e.persist();
    e.stopPropagation();
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

  const handleGenerateImage = async (e: any) => {
    e.persist();
    e.stopPropagation();
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

  const showImageOptions = (e: any) => {
    e.persist();
    e.stopPropagation();
    Alert.alert(
      'Recipe Photo',
      'Choose an option',
      [
        {
          text: 'Upload Photo',
          onPress: () => handleImageUpload(e),
        },
        {
          text: 'Generate with AI',
          onPress: () => handleGenerateImage(e),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const handleLongPress = () => {
    setShowCategoryModal(true);
  };

  const handleCategorySelect = (categoryName: string) => {
    updateRecipeCategory(recipe.id, categoryName);
    setShowCategoryModal(false);
    Alert.alert('Success', `Recipe moved to ${categoryName}`);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.container}
        onPress={onPress}
        onLongPress={handleLongPress}
        activeOpacity={0.9}
        testID="recipe-card"
      >
      <View style={styles.imageContainer}>
        {recipe.imageUrl ? (
          <Image source={{ uri: recipe.imageUrl }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.placeholderImage]}>
            <Text style={styles.placeholderEmoji}>🍽️</Text>
          </View>
        )}
        
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          testID="favorite-button"
        >
          <Heart
            size={20}
            color={recipe.isFavorite ? Colors.favorite : Colors.text.inverse}
            fill={recipe.isFavorite ? Colors.favorite : 'transparent'}
          />
        </TouchableOpacity>

        {recipe.sourcePlatform && recipe.sourcePlatform !== 'manual' && (
          <View style={styles.sourceBadge}>
            <Text style={styles.sourceText}>
              {recipe.sourcePlatform === 'instagram' && '📷'}
              {recipe.sourcePlatform === 'pinterest' && '📌'}
              {recipe.sourcePlatform === 'tiktok' && '🎵'}
              {recipe.sourcePlatform === 'facebook' && '👤'}
              {recipe.sourcePlatform === 'web' && '🌐'}
            </Text>
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
            <Camera size={16} color={Colors.text.inverse} />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {recipe.title}
        </Text>

        {recipe.description && (
          <Text style={styles.description} numberOfLines={2}>
            {recipe.description}
          </Text>
        )}

        <View style={styles.metadata}>
          {totalTime > 0 && (
            <View style={styles.metaItem}>
              <Clock size={12} color={Colors.text.secondary} />
              <Text style={styles.metaText}>{totalTime} min</Text>
            </View>
          )}
          
          {recipe.servings && (
            <View style={styles.metaItem}>
              <Users size={12} color={Colors.text.secondary} />
              <Text style={styles.metaText}>{recipe.servings}</Text>
            </View>
          )}

          {recipe.nutrition?.calories && (
            <View style={styles.metaItem}>
              <Text style={styles.metaText}>{recipe.nutrition.calories} cal</Text>
            </View>
          )}
        </View>

        {recipe.categories.length > 0 && (
          <View style={styles.categories}>
            {recipe.categories.slice(0, 2).map((cat) => (
              <View key={cat} style={styles.categoryChip}>
                <Text style={styles.categoryText}>{cat}</Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.addPlanBtn}
          onPress={(e) => {
            e.stopPropagation();
            setShowAddToPlan(true);
          }}
          testID="add-to-plan"
        >
          <Plus size={14} color={Colors.text.inverse} />
          <Text style={styles.addPlanText}>Add to today</Text>
        </TouchableOpacity>
      </View>
      </TouchableOpacity>

      <Modal
        visible={showCategoryModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCategoryModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <FolderOpen size={24} color={Colors.primary} />
              <Text style={styles.modalTitle}>Move to Category</Text>
            </View>
            <ScrollView style={styles.categoriesList}>
              {categories.map((category) => {
                const isCurrentCategory = recipe.categories.includes(category.name);
                return (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryOption,
                      isCurrentCategory && styles.categoryOptionActive,
                    ]}
                    onPress={() => handleCategorySelect(category.name)}
                    disabled={isCurrentCategory}
                  >
                    <View style={styles.categoryOptionLeft}>
                      {category.imageUrl ? (
                        <Image
                          source={{ uri: category.imageUrl }}
                          style={styles.categoryOptionImage}
                        />
                      ) : (
                        <View style={[styles.categoryOptionIcon, { backgroundColor: category.color + '20' }]}>
                          <Text style={styles.categoryOptionEmoji}>{category.icon || '📁'}</Text>
                        </View>
                      )}
                      <View>
                        <Text style={styles.categoryOptionName}>{category.name}</Text>
                        <Text style={styles.categoryOptionCount}>
                          {category.recipeCount} {category.recipeCount === 1 ? 'recipe' : 'recipes'}
                        </Text>
                      </View>
                    </View>
                    {isCurrentCategory && (
                      <Text style={styles.currentBadge}>Current</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowCategoryModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showAddToPlan} transparent animationType="fade" onRequestClose={() => setShowAddToPlan(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowAddToPlan(false)}>
          <View style={styles.smallModal}>
            <Text style={styles.modalTitle}>Add to Today</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {(['breakfast','lunch','dinner','snack'] as const).map(meal => (
                <TouchableOpacity
                  key={meal}
                  style={styles.mealBadge}
                  onPress={async () => {
                    const today = new Date().toISOString().split('T')[0];
                    await addRecipeToMeal(today, meal, recipe.id);
                    setShowAddToPlan(false);
                  }}
                  testID={`add-today-${meal}`}
                >
                  <Text style={styles.mealBadgeText}>{meal}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 4/3,
  },
  image: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  placeholderImage: {
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 48,
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageUploadButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  sourceBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  sourceText: {
    fontSize: 16,
  },
  content: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 8,
    lineHeight: 16,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 11,
    color: Colors.text.secondary,
    marginLeft: 4,
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  addPlanBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addPlanText: {
    color: Colors.text.inverse,
    fontSize: 12,
    fontWeight: '600',
  },
  categoryChip: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 6,
    marginTop: 4,
  },
  categoryText: {
    fontSize: 10,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  smallModal: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    width: '90%',
    maxWidth: 360,
    gap: 12,
  },
  mealBadge: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  mealBadgeText: {
    color: Colors.text.primary,
    fontWeight: '600',
    textTransform: 'capitalize' as const,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  categoriesList: {
    maxHeight: 400,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  categoryOptionActive: {
    backgroundColor: Colors.surface,
    opacity: 0.6,
  },
  categoryOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryOptionImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  categoryOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryOptionEmoji: {
    fontSize: 20,
  },
  categoryOptionName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  categoryOptionCount: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  currentBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
});