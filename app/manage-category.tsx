import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import Colors from '@/constants/colors';
import { useRecipes } from '@/hooks/recipe-store';
import { Category } from '@/types/recipe';
import { X, Check, Palette, ImagePlus } from 'lucide-react-native';

const PRESET_COLORS = [
  '#FFB74D', '#81C784', '#64B5F6', '#F06292',
  '#AED581', '#FFD54F', '#9575CD', '#FF8A65',
  '#4DB6AC', '#DCE775', '#BA68C8', '#4FC3F7',
];

const PRESET_ICONS = [
  '🍳', '🥗', '🍽️', '🍰', '🥑', '⚡',
  '🍕', '🍜', '🥘', '🍔', '🌮', '🍱',
  '🥐', '🍝', '🥙', '🧁', '🍲', '🥩',
];

export default function ManageCategoryScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const { categories, saveCategory, recipes, updateRecipeCategory } = useRecipes();
  
  const existingCategory = params.id 
    ? categories.find(c => c.id === params.id)
    : undefined;

  const [name, setName] = useState(existingCategory?.name || '');
  const [color, setColor] = useState(existingCategory?.color || PRESET_COLORS[0]);
  const [icon, setIcon] = useState(existingCategory?.icon || PRESET_ICONS[0]);
  const [imageUrl, setImageUrl] = useState(existingCategory?.imageUrl || '');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const isEditing = !!params.id;

  const handleGenerateImage = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a category name first');
      return;
    }

    setIsGeneratingImage(true);
    try {
      const response = await fetch('https://toolkit.rork.com/images/generate/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `A minimalist, clean icon representing ${name} food category. Simple, flat design with soft colors. Professional food photography style, top-down view, on a white background.`,
          size: '1024x1024',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate image');
      }

      const data = await response.json();
      const generatedImageUrl = `data:${data.image.mimeType};base64,${data.image.base64Data}`;
      setImageUrl(generatedImageUrl);
      console.log('Image generated successfully');
    } catch (error) {
      console.error('Error generating image:', error);
      Alert.alert('Error', 'Failed to generate image. Please try again.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    if (isEditing && existingCategory && existingCategory.name !== name) {
      const affectedRecipes = recipes.filter(r => 
        r.categories.includes(existingCategory.name)
      );
      
      if (affectedRecipes.length > 0) {
        Alert.alert(
          'Update Recipes?',
          `${affectedRecipes.length} recipe(s) use this category. Update them to use the new name?`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Update',
              onPress: () => {
                affectedRecipes.forEach(recipe => {
                  updateRecipeCategory(recipe.id, name);
                });
                saveCategory({
                  id: existingCategory.id,
                  name: name.trim(),
                  color,
                  icon,
                  imageUrl,
                  recipeCount: existingCategory.recipeCount,
                });
                router.back();
              },
            },
          ]
        );
        return;
      }
    }

    const category: Category = {
      id: existingCategory?.id || Date.now().toString(),
      name: name.trim(),
      color,
      icon,
      imageUrl,
      recipeCount: existingCategory?.recipeCount || 0,
    };

    saveCategory(category);
    router.back();
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: isEditing ? 'Edit Category' : 'New Category',
          headerRight: () => (
            <TouchableOpacity onPress={handleSave} testID="save-button">
              <Check size={24} color={Colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.label}>Category Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g., Italian, Vegan, BBQ"
            placeholderTextColor={Colors.text.secondary}
            testID="name-input"
          />
        </View>

        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Category Image</Text>
            {imageUrl && (
              <TouchableOpacity
                onPress={() => setImageUrl('')}
                style={styles.clearButton}
              >
                <X size={16} color={Colors.text.secondary} />
              </TouchableOpacity>
            )}
          </View>
          
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.previewImage}
              resizeMode="cover"
            />
          ) : (
            <TouchableOpacity
              style={styles.generateButton}
              onPress={handleGenerateImage}
              disabled={isGeneratingImage}
              testID="generate-image-button"
            >
              {isGeneratingImage ? (
                <ActivityIndicator color={Colors.primary} />
              ) : (
                <>
                  <ImagePlus size={24} color={Colors.primary} />
                  <Text style={styles.generateButtonText}>Generate with AI</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>
            <Palette size={16} color={Colors.text.primary} /> Color
          </Text>
          <View style={styles.colorGrid}>
            {PRESET_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.colorOption,
                  { backgroundColor: c },
                  color === c && styles.colorSelected,
                ]}
                onPress={() => setColor(c)}
                testID={`color-${c}`}
              >
                {color === c && <Check size={20} color="#FFF" />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Icon (Optional)</Text>
          <View style={styles.iconGrid}>
            {PRESET_ICONS.map((i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.iconOption,
                  icon === i && styles.iconSelected,
                ]}
                onPress={() => setIcon(i)}
                testID={`icon-${i}`}
              >
                <Text style={styles.iconText}>{i}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clearButton: {
    padding: 4,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: Colors.surface,
  },
  generateButton: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    minHeight: 200,
  },
  generateButtonText: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSelected: {
    borderColor: Colors.text.primary,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  iconOption: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.card,
  },
  iconText: {
    fontSize: 28,
  },
});
