import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Plus, X, Upload, Link as LinkIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import Colors from '@/constants/colors';
import { useRecipes } from '@/hooks/recipe-store';
import { Recipe, Ingredient } from '@/types/recipe';
import { importRecipeFromUrl } from '@/utils/recipe-import';

export default function AddRecipeScreen() {
  const { saveRecipe } = useRecipes();
  const [url, setUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [servings, setServings] = useState('');
  const [ingredients, setIngredients] = useState<Partial<Ingredient>[]>([
    { name: '', amount: '' }
  ]);
  const [instructions, setInstructions] = useState<string[]>(['']);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('Dinner');

  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const CATEGORY_OPTIONS = ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Healthy', 'Quick and Easy'] as const;

  const handleUrlImport = async () => {
    const urlTrimmed = url.trim();
    if (!urlTrimmed) {
      setErrorMessage('Please enter a recipe URL');
      return;
    }

    if (!urlTrimmed.startsWith('http://') && !urlTrimmed.startsWith('https://')) {
      setErrorMessage('Please enter a valid URL starting with http:// or https://');
      return;
    }

    try {
      setIsImporting(true);
      setErrorMessage('');
      setSuccessMessage('');
      console.log('[Import] Importing from URL:', urlTrimmed);
      
      const { recipe } = await importRecipeFromUrl(urlTrimmed);
      console.log('[Import] Successfully imported recipe:', recipe.title);
      
      saveRecipe(recipe);
      setSuccessMessage(`Recipe "${recipe.title}" imported successfully!`);
      
      setTimeout(() => {
        router.replace(`/recipe/${recipe.id}`);
      }, 1000);
    } catch (e: any) {
      console.error('[Import] URL import failed', e);
      const errorMsg = e?.message ?? 'Failed to import recipe';
      
      if (errorMsg.includes('CORS_ERROR')) {
        Alert.alert(
          'Website Blocked',
          'This website blocks direct access. Try manually entering the recipe below.',
          [{ text: 'OK' }]
        );
        setErrorMessage('Website blocked. Please create recipe manually below.');
      } else if (errorMsg.includes('Failed to fetch') || errorMsg.includes('network')) {
        setErrorMessage('Network error. Please check your internet connection and try again.');
      } else {
        setErrorMessage(errorMsg);
      }
    } finally {
      setIsImporting(false);
    }
  };

  const generateImageForRecipe = async () => {
    if (!title) {
      setErrorMessage('Please enter a recipe title first');
      return;
    }

    try {
      setIsGeneratingImage(true);
      console.log('[Image] Generating image for recipe:', title);
      
      const response = await fetch('https://toolkit.rork.com/images/generate/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `A professional, appetizing food photography of ${title}. High quality, well-lit, restaurant-style presentation.`,
          size: '1024x1024',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate image');
      }

      const data = await response.json();
      const generatedImageUri = `data:${data.image.mimeType};base64,${data.image.base64Data}`;
      setImageUri(generatedImageUri);
      console.log('[Image] Generated successfully');
    } catch (error) {
      console.error('[Image] Generation failed:', error);
      setErrorMessage('Failed to generate image');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleManualSubmit = async () => {
    setErrorMessage('');
    
    if (!title) {
      setErrorMessage('Please enter a recipe title');
      return;
    }

    const validIngredients = ingredients.filter(i => i.name && i.amount);
    const validInstructions = instructions.filter(i => i.trim());

    if (validIngredients.length === 0) {
      setErrorMessage('Please add at least one ingredient');
      return;
    }

    if (validInstructions.length === 0) {
      setErrorMessage('Please add at least one instruction');
      return;
    }

    const finalImageUrl: string | undefined = imageUri ?? undefined;

    const nutrition = calories || protein || carbs || fat ? {
      calories: parseInt(calories) || undefined,
      protein: parseInt(protein) || undefined,
      carbs: parseInt(carbs) || undefined,
      fat: parseInt(fat) || undefined,
    } : undefined;

    const newRecipe: Recipe = {
      id: Date.now().toString(),
      title,
      description,
      imageUrl: finalImageUrl,
      prepTime: parseInt(prepTime) || undefined,
      cookTime: parseInt(cookTime) || undefined,
      servings: parseInt(servings) || undefined,
      nutrition,
      ingredients: validIngredients.map((ing, index) => ({
        id: `ing-${index}`,
        name: ing.name!,
        amount: ing.amount!,
        unit: ing.unit,
        category: 'other',
      })),
      instructions: validInstructions,
      categories: [selectedCategory],
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isFavorite: false,
      sourcePlatform: 'manual',
    };

    saveRecipe(newRecipe);
    router.back();
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', amount: '' }]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const addInstruction = () => {
    setInstructions([...instructions, '']);
  };

  const removeInstruction = (index: number) => {
    setInstructions(instructions.filter((_, i) => i !== index));
  };

  const updateInstruction = (index: number, value: string) => {
    const updated = [...instructions];
    updated[index] = value;
    setInstructions(updated);
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        setErrorMessage('Permission to access photos is required');
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
        if (asset.base64) {
          setImageUri(`data:image/jpeg;base64,${asset.base64}`);
        } else if (asset.uri) {
          setImageUri(asset.uri);
        }
      }
    } catch (error) {
      console.error('[Image] Pick failed:', error);
      setErrorMessage('Failed to pick image');
    }
  };

  const removeImage = () => {
    setImageUri(null);
  };

  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <Text style={styles.mainTitle}>Add Recipe</Text>
          <Text style={styles.subtitle}>Import from a URL or create manually</Text>
        </View>

        <View style={styles.urlSection}>
          <Text style={styles.sectionTitle}>🔗 Import from URL</Text>
          <Text style={styles.helperText}>
            Paste a recipe URL from any website. AI will extract the recipe for you.
          </Text>
          
          <Text style={styles.label}>Recipe URL</Text>
          <TextInput
            testID="input-url"
            style={styles.input}
            value={url}
            onChangeText={setUrl}
            placeholder="https://www.allrecipes.com/recipe/..."
            placeholderTextColor={Colors.text.light}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          
          <TouchableOpacity
            testID="btn-import-url"
            style={[styles.importButton, isImporting ? styles.importButtonDisabled : null]}
            onPress={handleUrlImport}
            disabled={isImporting}
          >
            {isImporting ? (
              <>
                <ActivityIndicator size="small" color={Colors.text.inverse} style={styles.iconMargin} />
                <Text style={styles.importButtonText}>Importing...</Text>
              </>
            ) : (
              <>
                <LinkIcon size={20} color={Colors.text.inverse} style={styles.iconMargin} />
                <Text style={styles.importButtonText}>Import Recipe</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>
        </View>

        <View style={styles.manualSection}>
          <View style={styles.manualHeader}>
            <Text style={styles.sectionTitle}>✏️ Create Manually</Text>
          </View>
          
          <View style={styles.imageSection}>
            <Text style={styles.label}>Recipe Photo</Text>
            {imageUri ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                <TouchableOpacity style={styles.removeImageButton} onPress={removeImage}>
                  <X size={16} color={Colors.text.inverse} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.uploadSection}>
                <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                  <Upload size={24} color={Colors.primary} />
                  <Text style={styles.uploadButtonText}>Upload Photo</Text>
                </TouchableOpacity>
                <Text style={styles.orText}>or</Text>
                <TouchableOpacity 
                  style={[styles.generateButton, isGeneratingImage && styles.generateButtonDisabled]} 
                  onPress={generateImageForRecipe}
                  disabled={isGeneratingImage}
                >
                  {isGeneratingImage ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : (
                    <Text style={styles.generateButtonText}>✨ Generate with AI</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          <Text style={styles.label}>Recipe Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter recipe title..."
            placeholderTextColor={Colors.text.light}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Brief description..."
            placeholderTextColor={Colors.text.light}
            multiline
            numberOfLines={3}
          />

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>Prep Time (min)</Text>
              <TextInput
                style={styles.input}
                value={prepTime}
                onChangeText={setPrepTime}
                placeholder="15"
                placeholderTextColor={Colors.text.light}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>Cook Time (min)</Text>
              <TextInput
                style={styles.input}
                value={cookTime}
                onChangeText={setCookTime}
                placeholder="30"
                placeholderTextColor={Colors.text.light}
                keyboardType="numeric"
              />
            </View>
          </View>

          <Text style={styles.label}>Servings</Text>
          <TextInput
            style={styles.input}
            value={servings}
            onChangeText={setServings}
            placeholder="4"
            placeholderTextColor={Colors.text.light}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Nutrition per Serving (Optional)</Text>
          <View style={styles.nutritionGrid}>
            <View style={styles.nutritionField}>
              <Text style={styles.nutritionFieldLabel}>Calories</Text>
              <TextInput
                style={styles.input}
                value={calories}
                onChangeText={setCalories}
                placeholder="250"
                placeholderTextColor={Colors.text.light}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.nutritionField}>
              <Text style={styles.nutritionFieldLabel}>Protein (g)</Text>
              <TextInput
                style={styles.input}
                value={protein}
                onChangeText={setProtein}
                placeholder="20"
                placeholderTextColor={Colors.text.light}
                keyboardType="numeric"
              />
            </View>
          </View>
          <View style={styles.nutritionGrid}>
            <View style={styles.nutritionField}>
              <Text style={styles.nutritionFieldLabel}>Carbs (g)</Text>
              <TextInput
                style={styles.input}
                value={carbs}
                onChangeText={setCarbs}
                placeholder="30"
                placeholderTextColor={Colors.text.light}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.nutritionField}>
              <Text style={styles.nutritionFieldLabel}>Fat (g)</Text>
              <TextInput
                style={styles.input}
                value={fat}
                onChangeText={setFat}
                placeholder="10"
                placeholderTextColor={Colors.text.light}
                keyboardType="numeric"
              />
            </View>
          </View>

          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryContainer}>
            {CATEGORY_OPTIONS.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryChip,
                  selectedCategory === category && styles.categoryChipSelected,
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategory === category && styles.categoryChipTextSelected,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.label}>Ingredients *</Text>
            <TouchableOpacity onPress={addIngredient}>
              <Plus size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>
          {ingredients.map((ingredient, index) => (
            <View key={`ingredient-${index}`} style={styles.ingredientRow}>
              <TextInput
                style={[styles.input, styles.ingredientAmount]}
                value={ingredient.amount}
                onChangeText={(value) => updateIngredient(index, 'amount', value)}
                placeholder="1 cup"
                placeholderTextColor={Colors.text.light}
              />
              <TextInput
                style={[styles.input, styles.ingredientName]}
                value={ingredient.name}
                onChangeText={(value) => updateIngredient(index, 'name', value)}
                placeholder="Ingredient name"
                placeholderTextColor={Colors.text.light}
              />
              {ingredients.length > 1 && (
                <TouchableOpacity onPress={() => removeIngredient(index)}>
                  <X size={20} color={Colors.error} />
                </TouchableOpacity>
              )}
            </View>
          ))}

          <View style={styles.sectionHeader}>
            <Text style={styles.label}>Instructions *</Text>
            <TouchableOpacity onPress={addInstruction}>
              <Plus size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>
          {instructions.map((instruction, index) => (
            <View key={`instruction-${index}`} style={styles.instructionRow}>
              <Text style={styles.stepNumber}>{index + 1}</Text>
              <TextInput
                style={[styles.input, styles.instructionInput]}
                value={instruction}
                onChangeText={(value) => updateInstruction(index, value)}
                placeholder="Enter instruction..."
                placeholderTextColor={Colors.text.light}
                multiline
              />
              {instructions.length > 1 && (
                <TouchableOpacity onPress={() => removeInstruction(index)}>
                  <X size={20} color={Colors.error} />
                </TouchableOpacity>
              )}
            </View>
          ))}

          <TouchableOpacity 
            style={[styles.submitButton, isGeneratingImage && styles.submitButtonDisabled]} 
            onPress={handleManualSubmit}
            disabled={isGeneratingImage}
          >
            {isGeneratingImage ? (
              <>
                <ActivityIndicator size="small" color={Colors.text.inverse} style={styles.iconMargin} />
                <Text style={styles.submitButtonText}>Generating Image...</Text>
              </>
            ) : (
              <Text style={styles.submitButtonText}>Save Recipe</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {errorMessage ? (
        <View style={styles.messageContainer}>
          <Text testID="msg-error" style={styles.errorMessage}>{errorMessage}</Text>
        </View>
      ) : null}
      
      {successMessage ? (
        <View style={styles.messageContainer}>
          <Text testID="msg-success" style={styles.successMessage}>{successMessage}</Text>
        </View>
      ) : null}
    </SafeAreaView>
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
  headerSection: {
    padding: 20,
    paddingBottom: 8,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  urlSection: {
    padding: 16,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  manualSection: {
    padding: 16,
    paddingTop: 0,
  },
  manualHeader: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: Colors.text.primary,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  ingredientAmount: {
    width: 100,
  },
  ingredientName: {
    flex: 1,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    color: Colors.text.inverse,
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 12,
    fontWeight: '600',
  },
  instructionInput: {
    flex: 1,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 32,
    marginBottom: 32,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  importButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 16,
  },
  importButtonDisabled: {
    opacity: 0.7,
  },
  importButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
  messageContainer: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  errorMessage: {
    color: Colors.error,
    fontSize: 14,
    fontWeight: '500',
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  successMessage: {
    color: Colors.success,
    fontSize: 14,
    fontWeight: '500',
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  iconMargin: {
    marginRight: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginHorizontal: 16,
  },
  imageSection: {
    marginBottom: 16,
  },
  uploadSection: {
    gap: 12,
  },
  uploadButton: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary + '30',
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 8,
  },
  orText: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  generateButton: {
    backgroundColor: Colors.primary + '15',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  imagePreviewContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.error,
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.secondary,
  },
  categoryChipTextSelected: {
    color: Colors.text.inverse,
  },
  nutritionGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  nutritionField: {
    flex: 1,
  },
  nutritionFieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: 6,
  },
});
