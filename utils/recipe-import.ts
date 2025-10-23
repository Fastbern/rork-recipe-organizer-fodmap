import { Platform } from 'react-native';
import { Recipe, Ingredient, NutritionInfo } from '@/types/recipe';
import { generateObject } from '@rork/toolkit-sdk';
import { z } from 'zod';

export type ImportResult = {
  recipe: Recipe;
  logs: string[];
};

function safeJsonParse<T = unknown>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch (e) {
    return null;
  }
}

function extractJsonLdBlocks(html: string): any[] {
  const logs: string[] = [];
  const blocks: any[] = [];
  const scriptRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = scriptRegex.exec(html)) !== null) {
    const raw = match[1].trim();
    const maybeArrayOrObj = safeJsonParse<any>(raw) ?? safeJsonParse<any>(raw.replace(/\u0000/g, ''));
    if (maybeArrayOrObj) {
      if (Array.isArray(maybeArrayOrObj)) {
        maybeArrayOrObj.forEach((m) => blocks.push(m));
      } else if (maybeArrayOrObj['@graph'] && Array.isArray(maybeArrayOrObj['@graph'])) {
        blocks.push(...maybeArrayOrObj['@graph']);
      } else {
        blocks.push(maybeArrayOrObj);
      }
    } else {
      logs.push('Failed to parse one JSON-LD block');
    }
  }
  return blocks;
}

function first<T>(arr: T[] | T | undefined | null): T | undefined {
  if (!arr) return undefined;
  return Array.isArray(arr) ? arr[0] : arr;
}

function parseDurationToMinutes(d: string | number | undefined): number | undefined {
  if (typeof d === 'number') return d;
  if (!d || typeof d !== 'string') return undefined;
  // ISO8601 durations like PT1H30M or PT45M
  const iso = /^P(T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)$/i;
  const m = d.match(iso);
  if (m) {
    const hours = m[2] ? parseInt(m[2], 10) : 0;
    const mins = m[3] ? parseInt(m[3], 10) : 0;
    return hours * 60 + mins;
  }
  const num = parseInt(d, 10);
  return Number.isFinite(num) ? num : undefined;
}

function normalizeIngredient(item: any, index: number): Ingredient | null {
  if (!item) return null;
  if (typeof item === 'string') {
    return {
      id: `ing-${index}`,
      name: item,
      amount: '',
      category: 'other',
    };
  }
  const name: string = item.name ?? item.food ?? item.ingredient ?? '';
  if (!name) return null;
  const amount: string = item.amount ?? item.quantity ?? item.measure ?? '';
  const unit: string | undefined = item.unit ?? item.unitText ?? undefined;
  return {
    id: `ing-${index}`,
    name,
    amount,
    unit,
    category: 'other',
  };
}

function parseNutrition(obj: any): NutritionInfo | undefined {
  if (!obj) return undefined;
  const getNum = (v: any): number | undefined => {
    if (v == null) return undefined;
    if (typeof v === 'number') return v;
    if (typeof v === 'string') {
      const n = parseFloat(v.replace(/[^0-9.]/g, ''));
      return Number.isFinite(n) ? n : undefined;
    }
    return undefined;
  };
  return {
    calories: getNum(obj.calories ?? obj['calories']) ?? getNum(obj.caloriesPerServing),
    protein: getNum(obj.proteinContent),
    carbs: getNum(obj.carbohydrateContent ?? obj.carbs),
    fat: getNum(obj.fatContent),
    fiber: getNum(obj.fiberContent),
    sugar: getNum(obj.sugarContent),
    sodium: getNum(obj.sodiumContent),
  };
}

export function parseRecipeFromJsonLd(json: any, sourceUrl?: string): Partial<Recipe> | null {
  if (!json) return null;
  const type = (json['@type'] ?? json.type ?? '').toString();
  const isRecipe = type === 'Recipe' || (Array.isArray(json['@type']) && json['@type'].includes('Recipe'));
  if (!isRecipe) return null;

  const name: string | undefined = json.name ?? json.headline;
  const description: string | undefined = json.description;
  const imageField = json.image;
  const imageUrl: string | undefined = typeof imageField === 'string' ? imageField : first<string>(imageField);
  const instructionsField = json.recipeInstructions;
  let instructions: string[] = [];
  if (Array.isArray(instructionsField)) {
    instructions = instructionsField.map((i: any) => {
      if (typeof i === 'string') return i;
      return i.text ?? i.name ?? '';
    }).filter(Boolean);
  } else if (typeof instructionsField === 'string') {
    instructions = instructionsField.split(/\n+/).map((s) => s.trim()).filter(Boolean);
  }
  const ingredientsField = json.recipeIngredient ?? json.ingredients;
  let ingredients: Ingredient[] = [];
  if (Array.isArray(ingredientsField)) {
    ingredients = ingredientsField.map((item, idx) => normalizeIngredient(item, idx)).filter(Boolean) as Ingredient[];
  }

  const servingsNum = json.recipeYield ?? json.yield;
  const servingsParsed = typeof servingsNum === 'string' ? parseInt(servingsNum.replace(/[^0-9]/g, ''), 10) : servingsNum;

  const nutrition = parseNutrition(json.nutrition);

  const partial: Partial<Recipe> = {
    title: name ?? 'Untitled Recipe',
    description,
    imageUrl,
    sourceUrl,
    sourcePlatform: 'web',
    prepTime: parseDurationToMinutes(json.prepTime),
    cookTime: parseDurationToMinutes(json.cookTime),
    servings: typeof servingsParsed === 'number' && Number.isFinite(servingsParsed) ? servingsParsed : undefined,
    ingredients,
    instructions,
    nutrition,
    categories: [],
    tags: [],
    isFavorite: false,
  } as Partial<Recipe>;

  return partial;
}

function parseOpenGraph(html: string): { title?: string; image?: string; description?: string } {
  const getMeta = (property: string) => {
    const regex = new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"]+)["'][^>]*>`, 'i');
    const m = html.match(regex);
    return m ? m[1] : undefined;
  };
  return {
    title: getMeta('og:title'),
    image: getMeta('og:image'),
    description: getMeta('og:description'),
  };
}

// AI-powered recipe parsing schema
const RecipeSchema = z.object({
  title: z.string().describe('Recipe title'),
  description: z.string().optional().describe('Brief description of the recipe'),
  prepTime: z.number().optional().describe('Preparation time in minutes'),
  cookTime: z.number().optional().describe('Cooking time in minutes'),
  servings: z.number().optional().describe('Number of servings'),
  ingredients: z.array(z.object({
    name: z.string().describe('Ingredient name'),
    amount: z.string().describe('Amount/quantity (e.g., "1 cup", "2 tbsp")'),
    unit: z.string().optional().describe('Unit of measurement if separate from amount')
  })).describe('List of ingredients'),
  instructions: z.array(z.string()).describe('Step-by-step cooking instructions'),
  categories: z.array(z.string()).optional().describe('Recipe categories (e.g., "dinner", "vegetarian")'),
  tags: z.array(z.string()).optional().describe('Recipe tags for organization'),
  nutrition: z.object({
    calories: z.number().optional(),
    protein: z.number().optional(),
    carbs: z.number().optional(),
    fat: z.number().optional(),
    fiber: z.number().optional(),
    sugar: z.number().optional(),
    sodium: z.number().optional()
  }).optional().describe('Nutritional information')
});

export async function parseRecipeWithAI(content: string, sourceUrl?: string): Promise<ImportResult> {
  const logs: string[] = [];
  
  try {
    logs.push('Using AI to parse recipe content...');
    logs.push('Connecting to AI service...');
    
    // Detect if this is from a social media platform
    let platformContext = '';
    if (sourceUrl) {
      if (sourceUrl.includes('tiktok.com')) {
        platformContext = 'This content is from a TikTok video. The recipe is likely in the video caption, comments, or description. Extract the complete recipe including all ingredients with measurements and detailed step-by-step instructions.';
      } else if (sourceUrl.includes('instagram.com')) {
        platformContext = 'This content is from Instagram. The recipe is likely in the post caption or comments. Extract the complete recipe including all ingredients with measurements and detailed instructions.';
      } else if (sourceUrl.includes('pinterest.com')) {
        platformContext = 'This content is from Pinterest. Extract the complete recipe including all ingredients and instructions.';
      } else if (sourceUrl.includes('facebook.com')) {
        platformContext = 'This content is from Facebook. The recipe may be in the post text or comments. Extract the complete recipe.';
      }
    }
    
    const aiResult = await generateObject({
      messages: [{
        role: 'user',
        content: `Extract recipe information from this content. ${platformContext}

IMPORTANT: 
- Extract the COMPLETE recipe with ALL ingredients and their measurements
- Include ALL cooking steps in detail
- Look for recipe title, ingredients with amounts, step-by-step instructions, cooking times, servings, and nutritional information
- If ingredients are listed without amounts, try to infer reasonable amounts or note "to taste"
- Make sure instructions are complete and in the correct order
- For social media content, the recipe might be in captions, descriptions, comments, or overlaid text

Content:
${content}`
      }],
      schema: RecipeSchema
    });
    
    logs.push('AI successfully parsed recipe content');
    
    // Determine source platform from URL
    let sourcePlatform: Recipe['sourcePlatform'] = 'web';
    if (sourceUrl) {
      if (sourceUrl.includes('instagram.com')) sourcePlatform = 'instagram';
      else if (sourceUrl.includes('pinterest.com')) sourcePlatform = 'pinterest';
      else if (sourceUrl.includes('tiktok.com')) sourcePlatform = 'tiktok';
      else if (sourceUrl.includes('facebook.com')) sourcePlatform = 'facebook';
    }
    
    const now = new Date().toISOString();
    const recipe: Recipe = {
      id: Date.now().toString(),
      title: aiResult.title,
      description: aiResult.description,
      sourceUrl,
      sourcePlatform,
      prepTime: aiResult.prepTime,
      cookTime: aiResult.cookTime,
      servings: aiResult.servings,
      ingredients: aiResult.ingredients.map((ing, index) => ({
        id: `ing-${index}`,
        name: ing.name,
        amount: ing.amount,
        unit: ing.unit,
        category: 'other' as const
      })),
      instructions: aiResult.instructions,
      nutrition: aiResult.nutrition,
      categories: aiResult.categories || [],
      tags: aiResult.tags || [],
      rating: undefined,
      notes: undefined,
      createdAt: now,
      updatedAt: now,
      isFavorite: false,
    };
    
    logs.push(`AI parsed ${recipe.ingredients.length} ingredients and ${recipe.instructions.length} steps`);
    return { recipe, logs };
    
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    logs.push(`AI parsing failed: ${errorMsg}`);
    
    // Provide more helpful error messages
    if (errorMsg.includes('fetch') || errorMsg.includes('network')) {
      throw new Error('Network error: Unable to connect to AI service. Please check your internet connection and try again.');
    } else if (errorMsg.includes('not configured')) {
      throw new Error(errorMsg);
    } else {
      throw new Error(`Failed to parse recipe with AI: ${errorMsg}`);
    }
  }
}

export async function importRecipeFromUrl(url: string): Promise<ImportResult> {
  const logs: string[] = [];
  try {
    logs.push(`Fetching content from: ${url}`);
    
    // Try direct fetch first
    let html: string;
    try {
      const res = await fetch(url, { 
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; RecipeBot/1.0)'
        }
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      html = await res.text();
      logs.push('Successfully fetched page content');
    } catch (fetchError: any) {
      if (Platform.OS === 'web' && (/network|cors|failed to fetch|cross-origin/i.test(fetchError.message) || fetchError.name === 'TypeError')) {
        throw new Error('CORS_ERROR: This website blocks direct access from browsers. Please switch to the "AI Import" tab and paste the recipe content directly (copy from the website and paste the text).');
      }
      throw fetchError;
    }
    
    // First try traditional JSON-LD parsing
    const jsonLdBlocks = extractJsonLdBlocks(html);
    const recipeBlock = jsonLdBlocks.find((b) => parseRecipeFromJsonLd(b));
    let partial = recipeBlock ? parseRecipeFromJsonLd(recipeBlock, url) : null;
    
    if (partial) {
      logs.push('Found structured recipe data (JSON-LD)');
      const now = new Date().toISOString();
      const recipe: Recipe = {
        id: Date.now().toString(),
        title: partial.title ?? 'Untitled Recipe',
        description: partial.description,
        imageUrl: partial.imageUrl,
        sourceUrl: partial.sourceUrl ?? url,
        sourcePlatform: partial.sourcePlatform ?? 'web',
        prepTime: partial.prepTime,
        cookTime: partial.cookTime,
        servings: partial.servings,
        ingredients: partial.ingredients ?? [],
        instructions: partial.instructions ?? [],
        nutrition: partial.nutrition,
        categories: partial.categories ?? [],
        tags: partial.tags ?? [],
        rating: undefined,
        notes: undefined,
        createdAt: now,
        updatedAt: now,
        isFavorite: false,
      };
      logs.push(`Traditional parsing found ${recipe.ingredients.length} ingredients and ${recipe.instructions.length} steps`);
      return { recipe, logs };
    }
    
    // If no structured data, try AI parsing
    logs.push('No structured data found, using AI to parse content...');
    
    // Clean HTML for AI processing
    const cleanText = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (cleanText.length < 100) {
      throw new Error('Page content too short to contain a recipe');
    }
    
    // Truncate if too long (keep first 8000 chars for context)
    const contentForAI = cleanText.length > 8000 ? cleanText.substring(0, 8000) + '...' : cleanText;
    
    return await parseRecipeWithAI(contentForAI, url);
    
  } catch (e: any) {
    const message = e?.message ?? String(e);
    logs.push(`Import failed: ${message}`);
    throw new Error(message);
  }
}

export async function importRecipeFromHtml(html: string, sourceUrl?: string): Promise<ImportResult> {
  const logs: string[] = [];
  
  // First try traditional JSON-LD parsing
  const jsonLdBlocks = extractJsonLdBlocks(html);
  const recipeBlock = jsonLdBlocks.find((b) => parseRecipeFromJsonLd(b));
  let partial = recipeBlock ? parseRecipeFromJsonLd(recipeBlock, sourceUrl) : null;
  
  if (partial) {
    logs.push('Found structured recipe data (JSON-LD)');
    const now = new Date().toISOString();
    const recipe: Recipe = {
      id: Date.now().toString(),
      title: partial.title ?? 'Untitled Recipe',
      description: partial.description,
      imageUrl: partial.imageUrl,
      sourceUrl: partial.sourceUrl ?? sourceUrl,
      sourcePlatform: partial.sourcePlatform ?? 'web',
      prepTime: partial.prepTime,
      cookTime: partial.cookTime,
      servings: partial.servings,
      ingredients: partial.ingredients ?? [],
      instructions: partial.instructions ?? [],
      nutrition: partial.nutrition,
      categories: partial.categories ?? [],
      tags: partial.tags ?? [],
      rating: undefined,
      notes: undefined,
      createdAt: now,
      updatedAt: now,
      isFavorite: false,
    };
    logs.push(`Traditional parsing found ${recipe.ingredients.length} ingredients and ${recipe.instructions.length} steps`);
    return { recipe, logs };
  }
  
  // Try Open Graph as fallback
  const og = parseOpenGraph(html);
  if (og.title && og.title.toLowerCase().includes('recipe')) {
    logs.push('Found Open Graph recipe data, using AI to enhance...');
    const ogContent = `Title: ${og.title}\nDescription: ${og.description || ''}`;
    return await parseRecipeWithAI(ogContent + '\n\n' + html, sourceUrl);
  }
  
  // Use AI parsing as primary method
  logs.push('No structured data found, using AI to parse HTML content...');
  
  // Clean HTML for AI processing
  const cleanText = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  if (cleanText.length < 50) {
    throw new Error('HTML content too short to contain a recipe');
  }
  
  // Truncate if too long
  const contentForAI = cleanText.length > 8000 ? cleanText.substring(0, 8000) + '...' : cleanText;
  
  return await parseRecipeWithAI(contentForAI, sourceUrl);
}

export async function importRecipeFromJson(jsonText: string, sourceUrl?: string): Promise<ImportResult> {
  const logs: string[] = [];
  
  const obj = safeJsonParse<any>(jsonText);
  if (!obj) {
    throw new Error('Invalid JSON');
  }
  
  // Try traditional JSON-LD parsing first
  let candidate: any = obj;
  if (Array.isArray(obj)) {
    candidate = obj.find((o) => parseRecipeFromJsonLd(o));
  } else if (obj['@graph']) {
    candidate = (obj['@graph'] as any[]).find((o) => parseRecipeFromJsonLd(o));
  }
  
  const partial = parseRecipeFromJsonLd(candidate, sourceUrl);
  if (partial) {
    logs.push('Successfully parsed JSON-LD recipe data');
    const now = new Date().toISOString();
    const recipe: Recipe = {
      id: Date.now().toString(),
      title: partial.title ?? 'Untitled Recipe',
      description: partial.description,
      imageUrl: partial.imageUrl,
      sourceUrl: partial.sourceUrl ?? sourceUrl,
      sourcePlatform: partial.sourcePlatform ?? 'web',
      prepTime: partial.prepTime,
      cookTime: partial.cookTime,
      servings: partial.servings,
      ingredients: partial.ingredients ?? [],
      instructions: partial.instructions ?? [],
      nutrition: partial.nutrition,
      categories: partial.categories ?? [],
      tags: partial.tags ?? [],
      rating: undefined,
      notes: undefined,
      createdAt: now,
      updatedAt: now,
      isFavorite: false,
    };
    logs.push(`Traditional parsing found ${recipe.ingredients.length} ingredients and ${recipe.instructions.length} steps`);
    return { recipe, logs };
  }
  
  // If not a standard recipe JSON-LD, try AI parsing
  logs.push('Not a standard recipe JSON-LD, using AI to parse...');
  return await parseRecipeWithAI(JSON.stringify(obj, null, 2), sourceUrl);
}

// New function for parsing any text content with AI
export async function importRecipeFromText(text: string, sourceUrl?: string): Promise<ImportResult> {
  const logs: string[] = [];
  
  if (!text.trim()) {
    throw new Error('No text content provided');
  }
  
  logs.push('Using AI to parse text content for recipe...');
  return await parseRecipeWithAI(text, sourceUrl);
}
