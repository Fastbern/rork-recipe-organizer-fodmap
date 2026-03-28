import createContextHook from '@nkzw/create-context-hook';
import { useState, useMemo, useCallback } from 'react';
import { Recipe } from '@/types/recipe';
import { AdaptedRecipeData } from '@/utils/recipe-adaptation';

export interface IngredientChoice {
  originalName: string;
  adaptedName: string;
  amount: string;
  unit?: string;
  options: string[];
  accepted: boolean;
}

export interface AdaptationProposal {
  original: Recipe;
  adapted: AdaptedRecipeData;
  diets: string[];
  allergies: string[];
  choices: IngredientChoice[];
}

function buildDefaultChoices(original: Recipe, adapted: AdaptedRecipeData, diets: string[]): IngredientChoice[] {
  const choices: IngredientChoice[] = adapted.ingredients.map((ing, idx) => {
    const orig = original.ingredients[idx];
    const originalName = orig ? orig.name : ing.name;
    const adaptedName = ing.name;
    const options: string[] = [];

    const lower = originalName.toLowerCase();
    if (lower.includes('garlic')) {
      options.push('garlic-infused oil', 'garlic chives');
    }
    if (lower.includes('onion')) {
      options.push('green onion tops', 'chives', 'asafoetida (pinch)');
    }
    if (lower.includes('bread')) {
      options.push('gluten-free bread');
      options.push('sourdough spelt (small serve)');
      if (diets.some(d => /keto|low[- ]carb/i.test(d))) {
        options.push('almond flour bread', 'cloud bread');
      } else {
        options.push('almond flour bread');
      }
    }
    if (lower.includes('pasta')) {
      options.push('gluten-free pasta', 'rice noodles', 'zucchini noodles');
    }
    if (lower.includes('milk')) {
      options.push('lactose-free milk', 'almond milk');
    }
    if (lower.includes('cream')) {
      options.push('lactose-free cream', 'coconut cream');
    }
    if (lower.includes('yogurt')) {
      options.push('lactose-free yogurt', 'coconut yogurt');
    }
    if (lower.includes('flour') && !lower.includes('almond')) {
      options.push('gluten-free flour blend', 'rice flour', 'almond flour');
    }

    const dedup = Array.from(new Set([adaptedName, ...options]));

    return {
      originalName,
      adaptedName,
      amount: ing.amount,
      unit: ing.unit,
      options: dedup,
      accepted: adaptedName !== originalName,
    };
  });
  return choices;
}

export interface AdaptationContextValue {
  proposal: AdaptationProposal | null;
  setProposal: (p: { original: Recipe; adapted: AdaptedRecipeData; diets: string[]; allergies: string[] }) => void;
  clear: () => void;
  updateChoice: (index: number, nextName: string, accepted: boolean) => void;
  acceptAll: () => void;
  resetAll: () => void;
}

export const [AdaptationProvider, useAdaptation] = createContextHook<AdaptationContextValue>(() => {
  const [proposal, setProposalState] = useState<AdaptationProposal | null>(null);

  const setProposal = useCallback((p: { original: Recipe; adapted: AdaptedRecipeData; diets: string[]; allergies: string[] }) => {
    const choices = buildDefaultChoices(p.original, p.adapted, p.diets);
    setProposalState({ ...p, choices });
  }, []);

  const clear = useCallback(() => setProposalState(null), []);

  const updateChoice = useCallback((index: number, nextName: string, accepted: boolean) => {
    setProposalState(prev => {
      if (!prev) return prev;
      const next = { ...prev, choices: [...prev.choices] };
      next.choices[index] = { ...next.choices[index], adaptedName: nextName, accepted };
      return next;
    });
  }, []);

  const acceptAll = useCallback(() => {
    setProposalState(prev => {
      if (!prev) return prev;
      const choices = prev.choices.map(c => ({ ...c, accepted: c.adaptedName.trim().toLowerCase() !== c.originalName.trim().toLowerCase() }));
      return { ...prev, choices };
    });
  }, []);

  const resetAll = useCallback(() => {
    setProposalState(prev => {
      if (!prev) return prev;
      const choices = prev.choices.map(c => ({ ...c, adaptedName: c.originalName, accepted: false }));
      return { ...prev, choices };
    });
  }, []);

  return useMemo(() => ({ proposal, setProposal, clear, updateChoice, acceptAll, resetAll }), [proposal]);
});
