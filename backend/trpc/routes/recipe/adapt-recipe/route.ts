import { z } from 'zod';
import { publicProcedure } from '../../../create-context';
import { generateText } from '@rork/toolkit-sdk';

export const adaptRecipeProcedure = publicProcedure
  .input(
    z.object({
      recipe: z.object({
        title: z.string(),
        description: z.string().optional(),
        servings: z.number().optional(),
        prepTime: z.number().optional(),
        cookTime: z.number().optional(),
        ingredients: z.array(
          z.object({
            amount: z.string(),
            unit: z.string().optional(),
            name: z.string(),
          })
        ),
        instructions: z.array(z.string()),
      }),
      diets: z.array(z.string()),
      allergies: z.array(z.string()),
      customAllergies: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const { recipe, diets, allergies, customAllergies } = input;

    const dietaryReqs = diets.length > 0 ? diets.join(', ') : 'None';
    const allergyList = [...allergies, ...(customAllergies ? [customAllergies] : [])].join(', ') || 'None';

    const ingredientsText = recipe.ingredients
      .map(ing => `${ing.amount} ${ing.unit || ''} ${ing.name}`.trim())
      .join('\n');

    const instructionsText = recipe.instructions
      .map((inst, i) => `${i + 1}. ${inst}`)
      .join('\n');

    const prompt = `Adapt the following recipe to meet these dietary requirements and allergies while maintaining the dish's essence and flavor profile.

**Original Recipe: ${recipe.title}**
${recipe.description ? `Description: ${recipe.description}\n` : ''}${recipe.servings ? `Servings: ${recipe.servings}\n` : ''}${recipe.prepTime ? `Prep Time: ${recipe.prepTime} min\n` : ''}${recipe.cookTime ? `Cook Time: ${recipe.cookTime} min\n` : ''}
**Ingredients:**
${ingredientsText}

**Instructions:**
${instructionsText}

**Dietary Requirements:** ${dietaryReqs}
**Allergies/Intolerances:** ${allergyList}

**Instructions:**
1. Substitute ingredients to meet the requirements
2. Adjust cooking methods if needed
3. Preserve the dish's original character and flavor as much as possible
4. Provide clear explanations for major substitutions
5. Note if the adaptation significantly changes the dish

**Response Format (JSON):**
Return ONLY a valid JSON object with this structure:
{
  "title": "Adapted recipe name",
  "description": "Brief description",
  "ingredients": [{"amount": "1", "unit": "cup", "name": "ingredient name"}],
  "instructions": ["step 1", "step 2"],
  "notes": "Chef notes on substitutions"
}`;

    if (!process.env.EXPO_PUBLIC_TOOLKIT_URL) {
      throw new Error(
        'AI service is not configured. Set EXPO_PUBLIC_TOOLKIT_URL to enable recipe adaptation.'
      );
    }

    const responseText = await generateText({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    const adaptedData = JSON.parse(jsonMatch[0]);

    return {
      title: adaptedData.title,
      description: adaptedData.description,
      ingredients: adaptedData.ingredients,
      instructions: adaptedData.instructions,
      notes: adaptedData.notes,
    };
  });
