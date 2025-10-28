import { z } from 'zod';
import { publicProcedure } from '../../../create-context';
import { generateObject } from '@rork/toolkit-sdk';

const SuggestionSchema = z.object({
  title: z.string(),
  url: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
  summary: z.string().optional(),
  source: z.string().optional(),
});

const GeneratedIngredientSchema = z.object({
  name: z.string(),
  amount: z.string(),
  unit: z.string().optional(),
});

const GeneratedRecipeSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  prepTime: z.number().optional(),
  cookTime: z.number().optional(),
  servings: z.number().optional(),
  ingredients: z.array(GeneratedIngredientSchema),
  instructions: z.array(z.string()),
  imageUrl: z.string().url().optional(),
});

function fallbackSuggestions(q: string) {
  return [
    {
      title: `Low FODMAP ${q} — Monash style`,
      url: 'https://www.monashfodmap.com/recipe/',
      imageUrl:
        'https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=800&auto=format&fit=crop',
      summary: 'Browse certified low FODMAP recipes and meal ideas.',
      source: 'Monash FODMAP',
    },
    {
      title: `FODMAP Friendly ${q} ideas`,
      url: 'https://www.fodmapfriendly.com/recipes/',
      imageUrl:
        'https://images.unsplash.com/photo-1543339308-43f2a6b86ca5?q=80&w=800&auto=format&fit=crop',
      summary: 'Curated recipes from trusted FODMAP resources.',
      source: 'FODMAP Friendly',
    },
    {
      title: `Dietitian-approved Low FODMAP ${q}`,
      url: 'https://alittlebityummy.com/low-fodmap-recipe-index/',
      imageUrl:
        'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800&auto=format&fit=crop',
      summary: 'Balanced options with portion guidance.',
      source: 'A Little Bit Yummy',
    },
    {
      title: 'Certified low FODMAP meals',
      url: 'https://www.fodmapeveryday.com/recipes/',
      imageUrl:
        'https://images.unsplash.com/photo-1526312426976-593c2edd4067?q=80&w=800&auto=format&fit=crop',
      summary: 'Everyday recipes tested for FODMAPs.',
      source: 'FODMAP Everyday',
    },
    {
      title: 'Plant-forward low FODMAP',
      url: 'https://www.funwithoutfodmaps.com/recipe-index/',
      imageUrl:
        'https://images.unsplash.com/photo-1476127397014-6861b2a1d93b?q=80&w=800&auto=format&fit=crop',
      summary: 'Vegetable-rich options within limits.',
      source: 'Fun Without FODMAPs',
    },
    {
      title: 'Quick weeknight-friendly picks',
      url: 'https://www.ibsdiets.org/fodmap-diet/fodmap-food-list/',
      imageUrl:
        'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop',
      summary: 'Cross-check ingredients and serving sizes.',
      source: 'IBS Diets',
    },
  ];
}

export const searchLowFodmapProcedure = publicProcedure
  .input(
    z.object({
      query: z.string().min(2),
      mode: z.enum(['suggest', 'generate']).default('suggest'),
    })
  )
  .mutation(async ({ input }) => {
    const { query, mode } = input;

    const missingEnv = !process.env.EXPO_PUBLIC_TOOLKIT_URL;

    try {
      if (mode === 'suggest') {
        if (missingEnv) {
          return {
            type: 'suggestions' as const,
            suggestions: fallbackSuggestions(query),
            note:
              'AI is temporarily unavailable. Showing trusted FODMAP sources instead.',
          };
        }

        const result = await generateObject({
          messages: [
            {
              role: 'user',
              content: `Find 6 top-rated Low FODMAP recipes for: "${query}". Prefer reputable sources (Monash, certified blogs). Return concise JSON with title, url, optional imageUrl, optional summary, and source.`,
            },
          ],
          schema: z.object({
            suggestions: z.array(SuggestionSchema).length(6),
            note: z.string().optional(),
          }),
        });
        return {
          type: 'suggestions' as const,
          suggestions: result.suggestions,
          note: result.note,
        };
      }

      if (missingEnv) {
        throw new Error(
          'AI service is not configured. Set EXPO_PUBLIC_TOOLKIT_URL to enable recipe generation.'
        );
      }

      const generated = await generateObject({
        messages: [
          {
            role: 'user',
            content: `Create a chef-quality Low FODMAP recipe for: "${query}". Use only Monash-friendly ingredients and portions. Include exact amounts. Return JSON matching schema.`,
          },
        ],
        schema: GeneratedRecipeSchema,
      });

      return { type: 'generated' as const, recipe: generated };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      if (mode === 'suggest') {
        return {
          type: 'suggestions' as const,
          suggestions: fallbackSuggestions(query),
          note:
            'AI request failed: ' + message + '. Showing trusted FODMAP sources instead.',
        };
      }
      throw new Error('AI request failed: ' + message);
    }
  });

export default searchLowFodmapProcedure;
