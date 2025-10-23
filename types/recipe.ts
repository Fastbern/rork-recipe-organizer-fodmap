export interface Recipe {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  sourceUrl?: string;
  sourcePlatform?: 'web' | 'instagram' | 'pinterest' | 'tiktok' | 'facebook' | 'manual';
  prepTime?: number; // in minutes
  cookTime?: number; // in minutes
  servings?: number;
  ingredients: Ingredient[];
  instructions: string[];
  nutrition?: NutritionInfo;
  categories: string[];
  tags: string[];
  rating?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  isFavorite: boolean;
}

export interface Ingredient {
  id: string;
  name: string;
  amount: string;
  unit?: string;
  category?: 'produce' | 'dairy' | 'meat' | 'pantry' | 'spices' | 'other';
  isOptional?: boolean;
}

export interface NutritionInfo {
  calories?: number;
  protein?: number; // grams
  carbs?: number; // grams
  fat?: number; // grams
  fiber?: number; // grams
  sugar?: number; // grams
  sodium?: number; // mg
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
  imageUrl?: string;
  recipeCount: number;
}

export interface MealPlan {
  id: string;
  date: string;
  breakfast?: string; // recipe id
  lunch?: string; // recipe id
  dinner?: string; // recipe id
  snack?: string; // recipe id
}

export interface GroceryItem {
  id: string;
  ingredient: Ingredient;
  recipeIds: string[];
  isChecked: boolean;
  quantity: number;
}