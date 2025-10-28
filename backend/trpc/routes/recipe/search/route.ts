import { z } from 'zod';
import { publicProcedure } from '../../../create-context';
import { generateObject, generateText } from '@rork/toolkit-sdk';

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

export const searchLowFodmapProcedure = publicProcedure
  .input(z.object({
    query: z.string().min(2),
    mode: z.enum(['suggest', 'generate']).default('suggest'),
  }))
  .mutation(async ({ input }) => {
    const { query, mode } = input;

    if (mode === 'suggest') {
      const result = await generateObject({
        messages: [
          {
            role: 'user',
            content:
              `Find 6 top-rated Low FODMAP recipes for: "${query}". Prefer reputable sources (Monash, certified blogs). Return concise JSON.`,
          },
        ],
        schema: z.object({
          suggestions: z.array(SuggestionSchema).length(6),
          note: z.string().optional(),
        }),
      });
      return { type: 'suggestions' as const, suggestions: result.suggestions, note: result.note };
    }

    const generated = await generateObject({
      messages: [
        {
          role: 'user',
          content:
            `Create a chef-quality Low FODMAP recipe for: "${query}". Use only Monash-friendly ingredients and portions. Include exact amounts. Return JSON.`,
        },
      ],
      schema: GeneratedRecipeSchema,
    });

    return { type: 'generated' as const, recipe: generated };
  });

export default searchLowFodmapProcedure;
