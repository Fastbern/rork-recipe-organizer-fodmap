import { Recipe } from '@/types/recipe';
import { findSubstitution } from '@/constants/dietary-substitutions';

export interface AdaptedRecipeData {
  title: string;
  description?: string;
  ingredients: { amount: string; unit?: string; name: string }[];
  instructions: string[];
  notes?: string;
}

function wantsLowFodmapFrom(restrictions: string[]): boolean {
  return restrictions.some(r => r.toLowerCase().includes('fodmap')) ||
    restrictions.some(r => r.toLowerCase() === 'low fodmap');
}

function applyFodmapHeuristics(name: string): string | null {
  const n = name.toLowerCase();
  if (n.includes('garlic')) return 'garlic-infused oil';
  if (n.includes('onion')) return 'chives or green onion tops';
  if (n.includes('wheat flour') || n === 'flour') return 'gluten-free flour blend';
  if (n.includes('pasta')) return 'gluten-free pasta';
  if (n.includes('milk')) return 'lactose-free milk';
  if (n.includes('cream')) return 'lactose-free cream or coconut cream';
  if (n.includes('yogurt')) return 'lactose-free yogurt';
  if (n.includes('bread')) return 'gluten-free bread';
  return null;
}

export function adaptRecipeWithDatabase(
  recipe: Recipe,
  diets: string[],
  allergies: string[]
): AdaptedRecipeData {
  console.log('[Adaptation] Using rule-based substitution database');
  
  const allRestrictions = [...diets, ...allergies];
  const substitutionNotes: string[] = [];
  const madeSubs = new Set<string>();
  const wantsLowFodmap = wantsLowFodmapFrom(allRestrictions);
  
  const adaptedIngredients = recipe.ingredients.map(ingredient => {
    let adaptedName = ingredient.name;
    let adaptedAmount = ingredient.amount;
    let adaptedUnit = ingredient.unit;
    
    for (const restriction of allRestrictions) {
      const substitution = findSubstitution(ingredient.name, restriction);
      if (substitution && substitution !== ingredient.name) {
        substitutionNotes.push(
          `${ingredient.name} → ${substitution} (for ${restriction})`
        );
        adaptedName = substitution;
        madeSubs.add(ingredient.name.toLowerCase());
        break;
      }
    }

    if (wantsLowFodmap && !madeSubs.has(ingredient.name.toLowerCase())) {
      const heuristic = applyFodmapHeuristics(ingredient.name);
      if (heuristic) {
        substitutionNotes.push(`${ingredient.name} → ${heuristic} (for Low FODMAP)`);
        adaptedName = heuristic;
        madeSubs.add(ingredient.name.toLowerCase());
      }
    }
    
    return {
      amount: adaptedAmount,
      unit: adaptedUnit,
      name: adaptedName,
    };
  });
  
  const dietLabel = diets.length > 0 ? diets.join(' & ') : allergies.join(' & ');
  const title = `${recipe.title} (${dietLabel} Adapted)`;
  
  let adaptedInstructions = [...recipe.instructions];
  
  if (diets.includes('Keto') || diets.includes('Low-carb')) {
    adaptedInstructions = adaptedInstructions.map(inst => 
      inst.replace(/serve with rice/gi, 'serve with cauliflower rice')
         .replace(/serve with pasta/gi, 'serve with zucchini noodles')
    );
  }
  
  if (diets.includes('Gluten-free')) {
    adaptedInstructions = adaptedInstructions.map(inst => 
      inst.replace(/flour/gi, 'gluten-free flour')
         .replace(/bread/gi, 'gluten-free bread')
    );
  }
  
  let notes = recipe.notes || '';
  if (substitutionNotes.length > 0) {
    notes += (notes ? '\n\n' : '') + '**Substitutions Made:**\n' + 
      substitutionNotes.map(n => `• ${n}`).join('\n');
  }
  
  notes += '\n\n**Note:** This recipe was adapted using a rule-based substitution engine with FODMAP-aware substitutions. ' +
    'Always check ingredient labels and portion sizes to ensure they meet your dietary requirements.';
  
  return {
    title,
    description: recipe.description,
    ingredients: adaptedIngredients,
    instructions: adaptedInstructions,
    notes,
  };
}

export function enforceLowFodmapOnAdapted(
  adapted: AdaptedRecipeData,
  diets: string[],
  allergies: string[]
): AdaptedRecipeData {
  const allRestrictions = [...diets, ...allergies];
  const wants = wantsLowFodmapFrom(allRestrictions);
  if (!wants) return adapted;

  const substitutionNotes: string[] = [];
  const nextIngredients = adapted.ingredients.map(ing => {
    let name = ing.name;
    for (const restriction of allRestrictions) {
      const sub = findSubstitution(name, restriction);
      if (sub && sub !== name) {
        substitutionNotes.push(`${name} → ${sub} (for ${restriction})`);
        name = sub;
        break;
      }
    }
    if (name === ing.name) {
      const heuristic = applyFodmapHeuristics(name);
      if (heuristic) {
        substitutionNotes.push(`${name} → ${heuristic} (for Low FODMAP)`);
        name = heuristic;
      }
    }
    return { ...ing, name };
  });

  let notes = adapted.notes ?? '';
  if (substitutionNotes.length > 0) {
    notes += (notes ? '\n\n' : '') + '**FODMAP Corrections:**\n' + substitutionNotes.map(n => `• ${n}`).join('\n');
  }

  return { ...adapted, ingredients: nextIngredients, notes };
}

export function getAdaptationSummary(
  originalCount: number,
  adaptedCount: number,
  substitutionsMade: number
): string {
  if (substitutionsMade === 0) {
    return 'No substitutions were needed for this recipe!';
  }
  
  return `Made ${substitutionsMade} substitution${substitutionsMade > 1 ? 's' : ''} to adapt this recipe.`;
}
