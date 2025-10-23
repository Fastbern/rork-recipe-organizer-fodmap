import { customIngredientSubstitutions } from '@/constants/custom-substitutions';

export interface IngredientSubstitution {
  original: string[];
  vegan?: string;
  vegetarian?: string;
  keto?: string;
  paleo?: string;
  glutenFree?: string;
  dairyFree?: string;
  lowCarb?: string;
  nutFree?: string;
  lowFodmap?: string;
}

export const baseIngredientSubstitutions: IngredientSubstitution[] = [
  {
    original: ['butter', 'unsalted butter', 'salted butter'],
    vegan: 'vegan butter or coconut oil',
    vegetarian: 'butter',
    keto: 'butter or ghee',
    paleo: 'ghee or coconut oil',
    glutenFree: 'butter',
    dairyFree: 'coconut oil or vegan butter',
    lowCarb: 'butter',
    nutFree: 'butter or coconut oil',
  },
  {
    original: ['milk', 'whole milk', '2% milk', 'skim milk', 'dairy milk'],
    vegan: 'almond milk or oat milk',
    vegetarian: 'milk',
    keto: 'heavy cream or unsweetened almond milk',
    paleo: 'coconut milk or almond milk',
    glutenFree: 'milk',
    dairyFree: 'almond milk or oat milk',
    lowCarb: 'unsweetened almond milk',
    nutFree: 'oat milk or soy milk',
    lowFodmap: 'lactose-free milk or almond milk',
  },
  {
    original: ['eggs', 'egg', 'whole eggs', 'large eggs'],
    vegan: 'flax eggs (1 tbsp ground flax + 3 tbsp water per egg)',
    vegetarian: 'eggs',
    keto: 'eggs',
    paleo: 'eggs',
    glutenFree: 'eggs',
    dairyFree: 'eggs',
    lowCarb: 'eggs',
    nutFree: 'eggs',
  },
  {
    original: ['bacon', 'pork bacon', 'turkey bacon'],
    vegan: 'tempeh bacon or coconut bacon',
    vegetarian: 'veggie bacon or smoked tempeh',
    keto: 'bacon',
    paleo: 'uncured bacon',
    glutenFree: 'bacon (check for gluten-free)',
    dairyFree: 'bacon',
    lowCarb: 'bacon',
    nutFree: 'bacon',
  },
  {
    original: ['chicken', 'chicken breast', 'chicken thighs'],
    vegan: 'tofu or seitan',
    vegetarian: 'chickpeas or extra-firm tofu',
    keto: 'chicken',
    paleo: 'chicken',
    glutenFree: 'chicken',
    dairyFree: 'chicken',
    lowCarb: 'chicken',
    nutFree: 'chicken',
  },
  {
    original: ['beef', 'ground beef', 'beef steak', 'steak'],
    vegan: 'beyond beef or lentils',
    vegetarian: 'portobello mushrooms or black beans',
    keto: 'beef',
    paleo: 'grass-fed beef',
    glutenFree: 'beef',
    dairyFree: 'beef',
    lowCarb: 'beef',
    nutFree: 'beef',
  },
  {
    original: ['cheese', 'cheddar cheese', 'mozzarella', 'parmesan', 'parmesan cheese'],
    vegan: 'nutritional yeast or vegan cheese',
    vegetarian: 'cheese',
    keto: 'cheese',
    paleo: 'omit or use cashew cheese',
    glutenFree: 'cheese',
    dairyFree: 'vegan cheese or nutritional yeast',
    lowCarb: 'cheese',
    nutFree: 'cheese (avoid cashew-based alternatives)',
  },
  {
    original: ['flour', 'all-purpose flour', 'wheat flour', 'plain flour'],
    vegan: 'all-purpose flour',
    vegetarian: 'all-purpose flour',
    keto: 'almond flour or coconut flour',
    paleo: 'almond flour or cassava flour',
    glutenFree: 'gluten-free flour blend or rice flour',
    dairyFree: 'all-purpose flour',
    lowCarb: 'almond flour',
    nutFree: 'rice flour or oat flour',
  },
  {
    original: ['sugar', 'white sugar', 'granulated sugar', 'cane sugar'],
    vegan: 'organic sugar or coconut sugar',
    vegetarian: 'sugar',
    keto: 'erythritol or stevia',
    paleo: 'honey or maple syrup',
    glutenFree: 'sugar',
    dairyFree: 'sugar',
    lowCarb: 'erythritol or monk fruit sweetener',
    nutFree: 'sugar',
  },
  {
    original: ['pasta', 'spaghetti', 'penne', 'noodles', 'macaroni'],
    vegan: 'pasta',
    vegetarian: 'pasta',
    keto: 'zucchini noodles or shirataki noodles',
    paleo: 'zucchini noodles or sweet potato noodles',
    glutenFree: 'gluten-free pasta or rice noodles',
    dairyFree: 'pasta',
    lowCarb: 'zucchini noodles',
    nutFree: 'pasta',
    lowFodmap: 'gluten-free pasta or rice noodles',
  },
  {
    original: ['bread', 'white bread', 'wheat bread', 'bread crumbs', 'breadcrumbs'],
    vegan: 'bread (check for egg/dairy)',
    vegetarian: 'bread',
    keto: 'almond flour bread or cloud bread',
    paleo: 'almond flour bread or omit',
    glutenFree: 'gluten-free bread',
    dairyFree: 'dairy-free bread',
    lowCarb: 'almond flour bread',
    nutFree: 'rice bread or oat bread',
    lowFodmap: 'gluten-free bread or sourdough spelt (in small serves)',
  },
  {
    original: ['rice', 'white rice', 'brown rice', 'jasmine rice'],
    vegan: 'rice',
    vegetarian: 'rice',
    keto: 'cauliflower rice',
    paleo: 'cauliflower rice',
    glutenFree: 'rice',
    dairyFree: 'rice',
    lowCarb: 'cauliflower rice',
    nutFree: 'rice',
  },
  {
    original: ['honey'],
    vegan: 'maple syrup or agave nectar',
    vegetarian: 'honey',
    keto: 'sugar-free syrup or small amount of honey',
    paleo: 'honey',
    glutenFree: 'honey',
    dairyFree: 'honey',
    lowCarb: 'sugar-free syrup',
    nutFree: 'honey',
  },
  {
    original: ['cream', 'heavy cream', 'whipping cream', 'double cream'],
    vegan: 'coconut cream or cashew cream',
    vegetarian: 'heavy cream',
    keto: 'heavy cream',
    paleo: 'coconut cream',
    glutenFree: 'heavy cream',
    dairyFree: 'coconut cream',
    lowCarb: 'heavy cream',
    nutFree: 'coconut cream or oat cream',
    lowFodmap: 'lactose-free cream or coconut cream',
  },
  {
    original: ['yogurt', 'greek yogurt', 'plain yogurt'],
    vegan: 'coconut yogurt or almond yogurt',
    vegetarian: 'yogurt',
    keto: 'full-fat greek yogurt',
    paleo: 'coconut yogurt',
    glutenFree: 'yogurt',
    dairyFree: 'coconut yogurt or almond yogurt',
    lowCarb: 'full-fat greek yogurt',
    nutFree: 'coconut yogurt or soy yogurt',
    lowFodmap: 'lactose-free yogurt or coconut yogurt',
  },
  {
    original: ['soy sauce'],
    vegan: 'soy sauce',
    vegetarian: 'soy sauce',
    keto: 'soy sauce or coconut aminos',
    paleo: 'coconut aminos',
    glutenFree: 'tamari or gluten-free soy sauce',
    dairyFree: 'soy sauce',
    lowCarb: 'soy sauce',
    nutFree: 'soy sauce',
    lowFodmap: 'tamari (gluten-free) or coconut aminos',
  },
  {
    original: ['peanuts', 'peanut butter', 'peanut oil'],
    vegan: 'peanuts or peanut butter',
    vegetarian: 'peanuts or peanut butter',
    keto: 'peanuts or peanut butter',
    paleo: 'almond butter or sunflower seed butter',
    glutenFree: 'peanuts or peanut butter',
    dairyFree: 'peanuts or peanut butter',
    lowCarb: 'peanuts or peanut butter',
    nutFree: 'sunflower seed butter',
  },
  {
    original: ['almonds', 'almond flour', 'almond milk', 'sliced almonds'],
    vegan: 'almonds',
    vegetarian: 'almonds',
    keto: 'almonds',
    paleo: 'almonds',
    glutenFree: 'almonds',
    dairyFree: 'almonds',
    lowCarb: 'almonds',
    nutFree: 'sunflower seeds or pumpkin seeds',
  },
  {
    original: ['fish', 'salmon', 'tuna', 'cod', 'tilapia'],
    vegan: 'hearts of palm or banana blossom',
    vegetarian: 'omit or use tofu',
    keto: 'fish',
    paleo: 'wild-caught fish',
    glutenFree: 'fish',
    dairyFree: 'fish',
    lowCarb: 'fish',
    nutFree: 'fish',
  },
  {
    original: ['shrimp', 'prawns', 'shellfish', 'crab', 'lobster'],
    vegan: 'hearts of palm or king oyster mushrooms',
    vegetarian: 'omit or use mushrooms',
    keto: 'shrimp',
    paleo: 'shrimp',
    glutenFree: 'shrimp',
    dairyFree: 'shrimp',
    lowCarb: 'shrimp',
    nutFree: 'shrimp',
  },
  {
    original: ['garlic', 'garlic clove', 'minced garlic', 'garlic powder', 'garlic salt'],
    vegan: 'garlic',
    vegetarian: 'garlic',
    keto: 'garlic',
    paleo: 'garlic',
    glutenFree: 'garlic',
    dairyFree: 'garlic',
    lowCarb: 'garlic',
    nutFree: 'garlic',
    lowFodmap: 'garlic-infused oil (plus salt) or garlic chives',
  },
  {
    original: ['onion', 'white onion', 'yellow onion', 'red onion', 'brown onion', 'onion powder'],
    vegan: 'onion',
    vegetarian: 'onion',
    keto: 'onion',
    paleo: 'onion',
    glutenFree: 'onion',
    dairyFree: 'onion',
    lowCarb: 'onion',
    nutFree: 'onion',
    lowFodmap: 'green tops of scallions, chives, or a pinch of asafoetida',
  },
] as const;

export const ingredientSubstitutions: IngredientSubstitution[] = [
  ...baseIngredientSubstitutions,
  ...customIngredientSubstitutions,
];

export function findSubstitution(
  ingredientName: string,
  dietType: string
): string | null {
  const normalizedIngredient = ingredientName.toLowerCase().trim();
  
  for (const sub of ingredientSubstitutions) {
    const found = sub.original.some((orig: string) => 
      normalizedIngredient.includes(orig) || orig.includes(normalizedIngredient)
    );
    
    if (found) {
      const dietKey = mapDietToKey(dietType);
      return sub[dietKey as keyof IngredientSubstitution] as string || null;
    }
  }
  
  return null;
}

function mapDietToKey(diet: string): string {
  const mapping: Record<string, string> = {
    'vegan': 'vegan',
    'vegetarian': 'vegetarian',
    'keto': 'keto',
    'paleo': 'paleo',
    'gluten-free': 'glutenFree',
    'dairy-free': 'dairyFree',
    'low-carb': 'lowCarb',
    'nuts': 'nutFree',
    'gluten': 'glutenFree',
    'dairy': 'dairyFree',
    'low fodmap': 'lowFodmap',
    'fodmap': 'lowFodmap',
    'fodmap-sensitive': 'lowFodmap',
    'fodmap sensitive': 'lowFodmap',
  };
  
  return mapping[diet.toLowerCase()] || diet;
}
