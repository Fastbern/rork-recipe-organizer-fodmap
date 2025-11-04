import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { generateText } from "@rork/toolkit-sdk";

const LOW_FODMAP_INGREDIENTS = [
  "chicken breast", "turkey", "salmon", "tuna", "shrimp", "eggs",
  "tofu (firm)", "tempeh", "quinoa", "rice", "oats", "gluten-free bread",
  "spinach", "kale", "lettuce", "cucumber", "carrots", "bell peppers",
  "zucchini", "eggplant", "tomatoes", "green beans", "bok choy",
  "strawberries", "blueberries", "oranges", "bananas (firm)", "grapes",
  "kiwi", "pineapple", "papaya", "cantaloupe",
  "lactose-free milk", "lactose-free yogurt", "hard cheeses", "feta cheese",
  "olive oil", "coconut oil", "maple syrup", "ginger", "turmeric",
  "basil", "oregano", "thyme", "rosemary", "cumin", "paprika",
  "almonds", "walnuts", "pumpkin seeds", "chia seeds", "flaxseeds",
  "potatoes", "sweet potatoes", "parsnips", "turnips"
];

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack", "dessert"];

interface GeneratedRecipe {
  title: string;
  description: string;
  mealType: string;
  ingredients: {
    name: string;
    amount: string;
    unit?: string;
  }[];
  instructions: string[];
  prepTime: number;
  cookTime: number;
  servings: number;
}

export const generateRecipesProcedure = publicProcedure
  .input(
    z.object({
      count: z.number().min(1).max(100).default(10),
      batchNumber: z.number().min(1).default(1),
      filters: z
        .object({
          categories: z.array(z.string()).optional(),
          userCategories: z.array(z.string()).optional(),
          mealTypes: z.array(z.enum(["breakfast", "lunch", "dinner", "snack", "dessert"]))
            .optional(),
          maxPrepTime: z.number().min(1).max(240).optional(),
          maxCookTime: z.number().min(1).max(480).optional(),
          includeTags: z.array(z.string()).optional(),
          excludeIngredients: z.array(z.string()).optional(),
          imageStrategy: z.enum(["category-generic", "unsplash-by-query"]).optional(),
          exactName: z.string().optional(),
          ingredientSeeds: z.array(z.string()).optional(),
        })
        .optional(),
    })
  )
  .mutation(async ({ input }) => {
    console.log(`[Generate Recipes] Starting batch ${input.batchNumber} with ${input.count} recipes`);
    
    const selectedMealTypes = input.filters?.mealTypes && input.filters.mealTypes.length > 0
      ? input.filters.mealTypes
      : MEAL_TYPES;

    const mealTypesForBatch: string[] = [];
    for (let i = 0; i < input.count; i++) {
      mealTypesForBatch.push(selectedMealTypes[i % selectedMealTypes.length]);
    }

    const categoryHints = [
      ...(input.filters?.categories ?? []),
      ...(input.filters?.userCategories ?? []),
    ];

    const timeConstraints = [
      input.filters?.maxPrepTime ? `- Prep time at most ${input.filters.maxPrepTime} minutes` : null,
      input.filters?.maxCookTime ? `- Cook time at most ${input.filters.maxCookTime} minutes` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const includeTags = input.filters?.includeTags?.length
      ? `- Favor themes/tags: ${input.filters.includeTags.join(", ")}`
      : "";

    const excludeIngredients = input.filters?.excludeIngredients?.length
      ? `- Absolutely avoid ingredients: ${input.filters.excludeIngredients.join(", ")}`
      : "";

    const categoryLine = categoryHints.length
      ? `- Recipes should align with these categories when possible: ${categoryHints.join(", ")}`
      : "";

    const nameHint = input.filters?.exactName ? `- Include at least one recipe that matches or closely matches the exact name: "${input.filters.exactName}"` : "";
    const ingredientHint = input.filters?.ingredientSeeds?.length ? `- Prefer recipes that prominently use: ${input.filters.ingredientSeeds.join(", ")}` : "";

    const prompt = `Generate ${input.count} unique and creative low-FODMAP recipes for batch ${input.batchNumber}. 

IMPORTANT REQUIREMENTS:
- All recipes MUST use ONLY low-FODMAP ingredients
- Each recipe must be completely unique and creative
- Use varied cooking techniques and international cuisines
- Include meal types: ${mealTypesForBatch.join(", ")}
- Make recipes practical and realistic
- Ensure accurate cooking times and servings
${timeConstraints}
${includeTags}
${excludeIngredients}
${categoryLine}
${nameHint}
${ingredientHint}

Available low-FODMAP ingredients to use: ${LOW_FODMAP_INGREDIENTS.join(", ")}

Return a valid JSON array with ${input.count} recipe objects. Each recipe must have this exact structure:
{
  "title": "Creative recipe name",
  "description": "Brief appetizing description (1-2 sentences)",
  "mealType": "breakfast|lunch|dinner|snack|dessert",
  "ingredients": [
    {
      "name": "ingredient name",
      "amount": "quantity",
      "unit": "measurement unit (optional)"
    }
  ],
  "instructions": [
    "Step 1 instruction",
    "Step 2 instruction"
  ],
  "prepTime": number (in minutes),
  "cookTime": number (in minutes),
  "servings": number
}

Return ONLY the JSON array, no additional text or explanation.`;

    try {
      const response = await generateText({
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      console.log("[Generate Recipes] Raw AI response length:", response.length);
      
      let cleanedResponse = response.trim();
      if (cleanedResponse.startsWith("```json")) {
        cleanedResponse = cleanedResponse.replace(/```json\n?/g, "").replace(/```\n?/g, "");
      } else if (cleanedResponse.startsWith("```")) {
        cleanedResponse = cleanedResponse.replace(/```\n?/g, "");
      }
      
      const recipes = JSON.parse(cleanedResponse) as GeneratedRecipe[];
      
      console.log(`[Generate Recipes] Successfully parsed ${recipes.length} recipes`);
      
      if (!Array.isArray(recipes) || recipes.length === 0) {
        throw new Error("Invalid recipe format received from AI");
      }
      
      const formattedRecipes = recipes.map((recipe, index) => {
        const recipeId = `ai-${input.batchNumber}-${Date.now()}-${index}`;
        
        return {
          id: recipeId,
          title: recipe.title,
          description: recipe.description,
          imageUrl: getRecipeImageUrl(recipe.mealType, input.filters?.imageStrategy, categoryHints[0], index),
          sourcePlatform: "manual" as const,
          prepTime: recipe.prepTime || 15,
          cookTime: recipe.cookTime || 30,
          servings: recipe.servings || 4,
          ingredients: recipe.ingredients.map((ing, idx) => ({
            id: `${recipeId}-ing-${idx}`,
            name: ing.name,
            amount: ing.amount,
            unit: ing.unit || "",
            category: categorizeIngredient(ing.name),
          })),
          instructions: recipe.instructions,
          nutrition: generateEstimatedNutrition(recipe),
          categories: [getMealTypeCategory(recipe.mealType), "Low FODMAP"],
          tags: ["low-fodmap", "ai-generated", recipe.mealType],
          rating: Math.floor(Math.random() * 2) + 4,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isFavorite: false,
        };
      });
      
      console.log(`[Generate Recipes] Batch ${input.batchNumber} completed successfully`);
      return formattedRecipes;
      
    } catch (error) {
      console.error("[Generate Recipes] Error:", error);
      throw new Error(`Failed to generate recipes: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  });

function getRecipeImageUrl(mealType: string, strategy?: "category-generic" | "unsplash-by-query", categoryHint?: string | undefined, index?: number): string {
  const imageMap: Record<string, string[]> = {
    breakfast: [
      "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800",
      "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800",
      "https://images.unsplash.com/photo-1550507992-eb63ffee0847?w=800",
    ],
    lunch: [
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800",
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800",
      "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800",
    ],
    dinner: [
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800",
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800",
      "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800",
    ],
    snack: [
      "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=800",
      "https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=800",
      "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800",
    ],
    dessert: [
      "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800",
      "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800",
      "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800",
    ],
  };
  
  if (strategy === "unsplash-by-query" && categoryHint) {
    const query = encodeURIComponent(`${categoryHint} ${mealType} food`);
    return `https://source.unsplash.com/featured/?${query}`;
  }
  const images = imageMap[mealType] || imageMap.lunch;
  if (typeof index === "number") {
    return images[index % images.length];
  }
  return images[Math.floor(Math.random() * images.length)];
}

function categorizeIngredient(name: string): "produce" | "dairy" | "meat" | "pantry" | "spices" | "other" {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes("chicken") || lowerName.includes("turkey") || 
      lowerName.includes("fish") || lowerName.includes("salmon") || 
      lowerName.includes("shrimp") || lowerName.includes("tuna")) {
    return "meat";
  }
  
  if (lowerName.includes("milk") || lowerName.includes("cheese") || 
      lowerName.includes("yogurt") || lowerName.includes("cream") ||
      lowerName.includes("butter")) {
    return "dairy";
  }
  
  if (lowerName.includes("lettuce") || lowerName.includes("tomato") || 
      lowerName.includes("cucumber") || lowerName.includes("carrot") ||
      lowerName.includes("spinach") || lowerName.includes("pepper") ||
      lowerName.includes("fruit") || lowerName.includes("berry") ||
      lowerName.includes("banana") || lowerName.includes("apple")) {
    return "produce";
  }
  
  if (lowerName.includes("salt") || lowerName.includes("pepper") || 
      lowerName.includes("spice") || lowerName.includes("herb") ||
      lowerName.includes("cumin") || lowerName.includes("paprika") ||
      lowerName.includes("basil") || lowerName.includes("oregano")) {
    return "spices";
  }
  
  if (lowerName.includes("flour") || lowerName.includes("sugar") || 
      lowerName.includes("oil") || lowerName.includes("rice") ||
      lowerName.includes("pasta") || lowerName.includes("bread") ||
      lowerName.includes("quinoa")) {
    return "pantry";
  }
  
  return "other";
}

function getMealTypeCategory(mealType: string): string {
  const categoryMap: Record<string, string> = {
    breakfast: "Breakfast",
    lunch: "Lunch",
    dinner: "Dinner",
    snack: "Snacks",
    dessert: "Desserts",
  };
  return categoryMap[mealType] || "Other";
}

function generateEstimatedNutrition(recipe: GeneratedRecipe) {
  const baseCalories = recipe.mealType === "snack" ? 150 : 
                       recipe.mealType === "dessert" ? 250 :
                       recipe.mealType === "breakfast" ? 350 : 450;
  
  return {
    calories: baseCalories + Math.floor(Math.random() * 100),
    protein: 15 + Math.floor(Math.random() * 20),
    carbs: 30 + Math.floor(Math.random() * 30),
    fat: 10 + Math.floor(Math.random() * 15),
    fiber: 5 + Math.floor(Math.random() * 8),
    sugar: 5 + Math.floor(Math.random() * 10),
    sodium: 300 + Math.floor(Math.random() * 400),
  };
}
