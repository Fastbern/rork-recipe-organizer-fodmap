import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Recipe, Category, MealPlan, GroceryItem, Ingredient, MealType, ConsumedItem } from '@/types/recipe';
import { mockRecipes, mockCategories } from '@/mocks/recipes';
import { Platform, Alert } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';

const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return AsyncStorage.getItem(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return AsyncStorage.setItem(key, value);
  },
};

const STORAGE_KEYS = {
  RECIPES: 'recipes',
  CATEGORIES: 'categories',
  MEAL_PLANS: 'mealPlans',
  GROCERY_LIST: 'groceryList',
  USER_PROFILE: 'userProfile',
  AI_RECIPES_GENERATED: 'aiRecipesGenerated',
};

interface UserProfile {
  id: string;
  email: string | null;
  fullName: string | null;
  provider: 'apple' | 'guest';
  signedInAt: string;
}

export const [RecipeProvider, useRecipes] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [groceryList, setGroceryList] = useState<GroceryItem[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [aiRecipesGenerated, setAiRecipesGenerated] = useState<boolean>(false);

  // Load recipes from storage
  const recipesQuery = useQuery({
    queryKey: ['recipes'],
    queryFn: async () => {
      const stored = await storage.getItem(STORAGE_KEYS.RECIPES);
      if (stored && stored.trim()) {
        try {
          return JSON.parse(stored) as Recipe[];
        } catch {
          await storage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(mockRecipes));
          return mockRecipes;
        }
      }
      await storage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(mockRecipes));
      return mockRecipes;
    },
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Load categories from storage
  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const stored = await storage.getItem(STORAGE_KEYS.CATEGORIES);
      if (stored && stored.trim()) {
        try {
          return JSON.parse(stored) as Category[];
        } catch {
          await storage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(mockCategories));
          return mockCategories;
        }
      }
      await storage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(mockCategories));
      return mockCategories;
    },
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Load meal plans from storage
  const mealPlansQuery = useQuery({
    queryKey: ['mealPlans'],
    queryFn: async () => {
      const stored = await storage.getItem(STORAGE_KEYS.MEAL_PLANS);
      if (stored && stored.trim()) {
        try {
          return JSON.parse(stored) as MealPlan[];
        } catch {
          return [];
        }
      }
      return [];
    },
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Load grocery list from storage
  useEffect(() => {
    storage.getItem(STORAGE_KEYS.GROCERY_LIST).then((stored) => {
      if (stored && stored.trim()) {
        try {
          setGroceryList(JSON.parse(stored));
        } catch {
          setGroceryList([]);
        }
      }
    });
  }, []);

  // Load user profile from storage
  useEffect(() => {
    storage.getItem(STORAGE_KEYS.USER_PROFILE).then((stored) => {
      if (stored && stored.trim()) {
        try {
          setUserProfile(JSON.parse(stored));
        } catch {
          setUserProfile(null);
        }
      }
    });
  }, []);

  // Load AI recipes generation status
  useEffect(() => {
    storage.getItem(STORAGE_KEYS.AI_RECIPES_GENERATED).then((stored) => {
      if (stored && stored.trim()) {
        try {
          setAiRecipesGenerated(JSON.parse(stored));
        } catch {
          setAiRecipesGenerated(false);
        }
      }
    });
  }, []);

  // Save recipe mutation
  const saveRecipeMutation = useMutation({
    mutationFn: async (recipe: Recipe) => {
      const recipes = recipesQuery.data || [];
      const existingIndex = recipes.findIndex(r => r.id === recipe.id);
      
      let updatedRecipes: Recipe[];
      if (existingIndex >= 0) {
        updatedRecipes = [...recipes];
        updatedRecipes[existingIndex] = recipe;
      } else {
        updatedRecipes = [...recipes, recipe];
      }
      
      await storage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(updatedRecipes));
      return updatedRecipes;
    },
    onSuccess: (updatedData) => {
      if (updatedData && Array.isArray(updatedData)) {
        queryClient.setQueryData(['recipes'], updatedData);
      }
    },
  });

  // Delete recipe mutation
  const deleteRecipeMutation = useMutation({
    mutationFn: async (recipeId: string) => {
      const recipes = recipesQuery.data || [];
      const updatedRecipes = recipes.filter(r => r.id !== recipeId);
      await storage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(updatedRecipes));
      return updatedRecipes;
    },
    onSuccess: (updatedData) => {
      if (updatedData && Array.isArray(updatedData)) {
        queryClient.setQueryData(['recipes'], updatedData);
      }
    },
  });

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async (recipeId: string) => {
      const recipes = recipesQuery.data || [];
      const updatedRecipes = recipes.map(r => 
        r.id === recipeId ? { ...r, isFavorite: !r.isFavorite } : r
      );
      await storage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(updatedRecipes));
      return updatedRecipes;
    },
    onSuccess: (updatedData) => {
      if (updatedData && Array.isArray(updatedData)) {
        queryClient.setQueryData(['recipes'], updatedData);
      }
    },
  });

  // Update recipe image mutation
  const updateRecipeImageMutation = useMutation({
    mutationFn: async ({ recipeId, imageUrl }: { recipeId: string; imageUrl: string }) => {
      const recipes = recipesQuery.data || [];
      const updatedRecipes = recipes.map(r => 
        r.id === recipeId ? { ...r, imageUrl, updatedAt: new Date().toISOString() } : r
      );
      await storage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(updatedRecipes));
      return updatedRecipes;
    },
    onSuccess: (updatedData) => {
      if (updatedData && Array.isArray(updatedData)) {
        queryClient.setQueryData(['recipes'], updatedData);
      }
    },
  });

  // Update recipe category mutation
  const saveCategoryMutation = useMutation({
    mutationFn: async (category: Category) => {
      const categories = categoriesQuery.data || [];
      const existingIndex = categories.findIndex(c => c.id === category.id);
      
      let updatedCategories: Category[];
      if (existingIndex >= 0) {
        updatedCategories = [...categories];
        updatedCategories[existingIndex] = category;
      } else {
        updatedCategories = [...categories, category];
      }
      
      await storage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(updatedCategories));
      return updatedCategories;
    },
    onSuccess: (updatedData) => {
      if (updatedData && Array.isArray(updatedData)) {
        queryClient.setQueryData(['categories'], updatedData);
      }
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const categories = categoriesQuery.data || [];
      const updatedCategories = categories.filter(c => c.id !== categoryId);
      await storage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(updatedCategories));
      return updatedCategories;
    },
    onSuccess: (updatedData) => {
      if (updatedData && Array.isArray(updatedData)) {
        queryClient.setQueryData(['categories'], updatedData);
      }
    },
  });

  const updateRecipeCategoryMutation = useMutation({
    mutationFn: async ({ recipeId, category }: { recipeId: string; category: string }) => {
      const recipes = recipesQuery.data || [];
      const updatedRecipes = recipes.map(r => 
        r.id === recipeId ? { ...r, categories: [category], updatedAt: new Date().toISOString() } : r
      );
      await storage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(updatedRecipes));
      return updatedRecipes;
    },
    onSuccess: (updatedData) => {
      if (updatedData && Array.isArray(updatedData)) {
        queryClient.setQueryData(['recipes'], updatedData);
      }
    },
  });

  // Save meal plan mutation
  const saveMealPlanMutation = useMutation({
    mutationFn: async (mealPlan: MealPlan) => {
      const mealPlans = mealPlansQuery.data || [];
      const existingIndex = mealPlans.findIndex(m => m.date === mealPlan.date);
      
      let updatedPlans: MealPlan[];
      if (existingIndex >= 0) {
        updatedPlans = [...mealPlans];
        updatedPlans[existingIndex] = mealPlan;
      } else {
        updatedPlans = [...mealPlans, mealPlan];
      }
      
      await storage.setItem(STORAGE_KEYS.MEAL_PLANS, JSON.stringify(updatedPlans));
      return updatedPlans;
    },
    onSuccess: (updatedData) => {
      if (updatedData && Array.isArray(updatedData)) {
        queryClient.setQueryData(['mealPlans'], updatedData);
      }
    },
  });

  const addToGroceryList = useCallback(async (ingredients: Ingredient[], recipeId: string) => {
    let added = 0;
    let merged = 0;
    const timestamp = Date.now();

    const normalize = (s: string | undefined) => (s || '').trim().toLowerCase();
    const keyOf = (ing: Ingredient) => `${normalize(ing.name)}__${normalize(ing.unit)}`;

    const existingByKey = new Map<string, GroceryItem>();
    groceryList.forEach(item => existingByKey.set(keyOf(item.ingredient), item));

    const nextList: GroceryItem[] = [...groceryList];

    ingredients.forEach((ing, idx) => {
      const key = keyOf(ing);
      const existing = existingByKey.get(key);
      if (existing) {
        const mergedIds = Array.from(new Set([
          ...existing.recipeIds,
          recipeId,
        ]));
        const updated: GroceryItem = {
          ...existing,
          recipeIds: mergedIds,
          quantity: (existing.quantity ?? 1) + 1,
        };
        const indexInList = nextList.findIndex(it => it.id === existing.id);
        if (indexInList >= 0) nextList[indexInList] = updated;
        merged += 1;
      } else {
        const newItem: GroceryItem = {
          id: `${timestamp}-${idx}-${ing.id}`,
          ingredient: ing,
          recipeIds: [recipeId],
          isChecked: false,
          quantity: 1,
        };
        nextList.push(newItem);
        existingByKey.set(key, newItem);
        added += 1;
      }
    });

    setGroceryList(nextList);
    await storage.setItem(STORAGE_KEYS.GROCERY_LIST, JSON.stringify(nextList));
    return { added, merged } as const;
  }, [groceryList]);

  const toggleGroceryItem = useCallback(async (itemId: string) => {
    const updatedList = groceryList.map(item =>
      item.id === itemId ? { ...item, isChecked: !item.isChecked } : item
    );
    setGroceryList(updatedList);
    await storage.setItem(STORAGE_KEYS.GROCERY_LIST, JSON.stringify(updatedList));
  }, [groceryList]);

  const clearCheckedItems = useCallback(async () => {
    const updatedList = groceryList.filter(item => !item.isChecked);
    setGroceryList(updatedList);
    await storage.setItem(STORAGE_KEYS.GROCERY_LIST, JSON.stringify(updatedList));
  }, [groceryList]);

  const addCustomGroceryItem = useCallback(async (item: { name: string; amount: string; unit?: string; quantity: number }) => {
    const timestamp = Date.now();
    const newIngredient: Ingredient = {
      id: `custom-${timestamp}`,
      name: item.name,
      amount: item.amount,
      unit: item.unit,
    };
    const newItem: GroceryItem = {
      id: `grocery-${timestamp}`,
      ingredient: newIngredient,
      recipeIds: [],
      isChecked: false,
      quantity: item.quantity,
    };
    const updatedList = [...groceryList, newItem];
    setGroceryList(updatedList);
    await storage.setItem(STORAGE_KEYS.GROCERY_LIST, JSON.stringify(updatedList));
  }, [groceryList]);

  const updateGroceryQuantity = useCallback(async (itemId: string, quantity: number) => {
    if (quantity === 0) {
      const updatedList = groceryList.filter(item => item.id !== itemId);
      setGroceryList(updatedList);
      await storage.setItem(STORAGE_KEYS.GROCERY_LIST, JSON.stringify(updatedList));
    } else {
      const updatedList = groceryList.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      );
      setGroceryList(updatedList);
      await storage.setItem(STORAGE_KEYS.GROCERY_LIST, JSON.stringify(updatedList));
    }
  }, [groceryList]);

  const removeGroceryItem = useCallback(async (itemId: string) => {
    const updatedList = groceryList.filter(item => item.id !== itemId);
    setGroceryList(updatedList);
    await storage.setItem(STORAGE_KEYS.GROCERY_LIST, JSON.stringify(updatedList));
  }, [groceryList]);

  const signInWithApple = useCallback(async () => {
    try {
      console.log('[Auth] Starting Apple Sign-In');
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const profile: UserProfile = {
        id: credential.user,
        email: credential.email || null,
        fullName: credential.fullName
          ? `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim()
          : null,
        provider: 'apple',
        signedInAt: new Date().toISOString(),
      };

      setUserProfile(profile);
      await storage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
      console.log('[Auth] Apple Sign-In successful', profile);
      return profile;
    } catch (error: any) {
      console.error('[Auth] Apple Sign-In failed:', error);
      if (error.code === 'ERR_REQUEST_CANCELED') {
        console.log('[Auth] User canceled sign-in');
      } else {
        Alert.alert('Sign-In Failed', 'Unable to sign in with Apple. Please try again.');
      }
      return null;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      console.log('[Auth] Signing out');
      setUserProfile(null);
      await storage.setItem(STORAGE_KEYS.USER_PROFILE, '');
      console.log('[Auth] Sign-out successful');
    } catch (error) {
      console.error('[Auth] Sign-out failed:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  }, []);

  const { mutate: mutateRecipeImage } = updateRecipeImageMutation;
  const { mutate: mutateRecipeCategory } = updateRecipeCategoryMutation;

  const saveGeneratedRecipes = useCallback(async (newRecipes: Recipe[]) => {
    const existingRecipes = recipesQuery.data || [];
    const updatedRecipes = [...existingRecipes, ...newRecipes];
    await storage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(updatedRecipes));
    queryClient.setQueryData(['recipes'], updatedRecipes);
    await storage.setItem(STORAGE_KEYS.AI_RECIPES_GENERATED, JSON.stringify(true));
    setAiRecipesGenerated(true);
    console.log(`[Recipe Store] Saved ${newRecipes.length} AI-generated recipes`);
  }, [recipesQuery.data, queryClient]);
  
  const updateRecipeImage = useCallback((recipeId: string, imageUrl: string) => {
    mutateRecipeImage({ recipeId, imageUrl });
  }, [mutateRecipeImage]);

  const updateRecipeCategory = useCallback((recipeId: string, category: string) => {
    mutateRecipeCategory({ recipeId, category });
  }, [mutateRecipeCategory]);

  // Filtered recipes
  const filteredRecipes = useMemo(() => {
    let recipes = recipesQuery.data || [];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      recipes = recipes.filter(r => 
        r.title.toLowerCase().includes(query) ||
        r.description?.toLowerCase().includes(query) ||
        r.tags.some(t => t.toLowerCase().includes(query)) ||
        r.ingredients.some(i => i.name.toLowerCase().includes(query))
      );
    }
    
    if (selectedCategory) {
      recipes = recipes.filter(r => r.categories.includes(selectedCategory));
    }
    
    return recipes;
  }, [recipesQuery.data, searchQuery, selectedCategory]);

  const categoriesWithRecipeCount = useMemo(() => {
    const recipes = recipesQuery.data || [];
    const categories = categoriesQuery.data || [];
    
    return categories.map(category => ({
      ...category,
      recipeCount: recipes.filter(r => r.categories.includes(category.name)).length,
    }));
  }, [recipesQuery.data, categoriesQuery.data]);

  const upsertMealPlan = useCallback(async (date: string, updater: (prev: MealPlan | undefined) => MealPlan) => {
    const plans = mealPlansQuery.data || [];
    const existing = plans.find(p => p.date === date);
    const next = updater(existing);
    const updated = existing
      ? plans.map(p => (p.date === date ? next : p))
      : [...plans, next];
    await storage.setItem(STORAGE_KEYS.MEAL_PLANS, JSON.stringify(updated));
    queryClient.setQueryData(['mealPlans'], updated);
    return next;
  }, [mealPlansQuery.data, queryClient]);

  const addRecipeToMeal = useCallback(async (date: string, meal: MealType, recipeId: string) => {
    const id = `${date}`;
    await upsertMealPlan(date, (prev) => {
      const base: MealPlan = prev ?? { id, date, customItems: [] };
      const current = (base[meal] ?? []) as string[];
      const exists = current.includes(recipeId);
      const nextMeal = exists ? current : [...current, recipeId];
      return { ...base, [meal]: nextMeal };
    });
  }, [upsertMealPlan]);

  const removeRecipeFromMeal = useCallback(async (date: string, meal: MealType, recipeId: string) => {
    await upsertMealPlan(date, (prev) => {
      const base: MealPlan = prev ?? { id: date, date, customItems: [] };
      const current = (base[meal] ?? []) as string[];
      const nextMeal = current.filter(id => id !== recipeId);
      return { ...base, [meal]: nextMeal };
    });
  }, [upsertMealPlan]);

  const addCustomConsumedItem = useCallback(async (date: string, item: Omit<ConsumedItem, 'id'>) => {
    const timestamp = Date.now();
    const newItem: ConsumedItem = { id: `consumed-${timestamp}`, ...item };
    await upsertMealPlan(date, (prev) => {
      const base: MealPlan = prev ?? { id: date, date, customItems: [] };
      const nextItems = [...(base.customItems ?? []), newItem];
      return { ...base, customItems: nextItems };
    });
    return newItem;
  }, [upsertMealPlan]);

  const removeConsumedItem = useCallback(async (date: string, itemId: string) => {
    await upsertMealPlan(date, (prev) => {
      const base: MealPlan = prev ?? { id: date, date, customItems: [] };
      const nextItems = (base.customItems ?? []).filter(i => i.id !== itemId);
      return { ...base, customItems: nextItems };
    });
  }, [upsertMealPlan]);

  return useMemo(() => ({
    recipes: recipesQuery.data || [],
    categories: categoriesWithRecipeCount,
    mealPlans: mealPlansQuery.data || [],
    groceryList,
    filteredRecipes,
    searchQuery,
    selectedCategory,
    isLoading: recipesQuery.isLoading || categoriesQuery.isLoading,
    userProfile,
    aiRecipesGenerated,
    
    // Actions
    setSearchQuery,
    setSelectedCategory,
    saveRecipe: saveRecipeMutation.mutate,
    deleteRecipe: deleteRecipeMutation.mutate,
    toggleFavorite: toggleFavoriteMutation.mutate,
    updateRecipeImage,
    updateRecipeCategory,
    saveCategory: saveCategoryMutation.mutate,
    deleteCategory: deleteCategoryMutation.mutate,
    saveMealPlan: saveMealPlanMutation.mutate,
    addRecipeToMeal,
    removeRecipeFromMeal,
    addCustomConsumedItem,
    removeConsumedItem,
    addToGroceryList,
    toggleGroceryItem,
    clearCheckedItems,
    addCustomGroceryItem: addCustomGroceryItem,
    updateGroceryQuantity: updateGroceryQuantity,
    removeGroceryItem: removeGroceryItem,
    signInWithApple,
    signOut,
    saveGeneratedRecipes,
    
    // Mutation states
    isSaving: saveRecipeMutation.isPending,
    isDeleting: deleteRecipeMutation.isPending,
    isSavingCategory: saveCategoryMutation.isPending,
    isDeletingCategory: deleteCategoryMutation.isPending,
  }), [
    recipesQuery.data,
    categoriesWithRecipeCount,
    mealPlansQuery.data,
    groceryList,
    filteredRecipes,
    searchQuery,
    selectedCategory,
    recipesQuery.isLoading,
    categoriesQuery.isLoading,
    userProfile,
    aiRecipesGenerated,
    setSearchQuery,
    setSelectedCategory,
    saveRecipeMutation.mutate,
    deleteRecipeMutation.mutate,
    toggleFavoriteMutation.mutate,
    updateRecipeImage,
    updateRecipeCategory,
    saveCategoryMutation.mutate,
    deleteCategoryMutation.mutate,
    saveMealPlanMutation.mutate,
    addRecipeToMeal,
    removeRecipeFromMeal,
    addCustomConsumedItem,
    removeConsumedItem,
    addToGroceryList,
    toggleGroceryItem,
    clearCheckedItems,
    addCustomGroceryItem,
    updateGroceryQuantity,
    removeGroceryItem,
    signInWithApple,
    signOut,
    saveGeneratedRecipes,
    saveRecipeMutation.isPending,
    deleteRecipeMutation.isPending,
    saveCategoryMutation.isPending,
    deleteCategoryMutation.isPending,
  ]);
});

// Helper hooks
export function useRecipe(recipeId: string) {
  const { recipes } = useRecipes();
  return recipes.find(r => r.id === recipeId);
}

export function useFavoriteRecipes() {
  const { recipes } = useRecipes();
  return useMemo(() => recipes.filter(r => r.isFavorite), [recipes]);
}

export function useMealPlanForDate(date: string) {
  const { mealPlans } = useRecipes();
  return mealPlans.find(m => m.date === date);
}