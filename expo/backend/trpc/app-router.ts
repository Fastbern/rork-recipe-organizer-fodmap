import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { adaptRecipeProcedure } from "./routes/recipe/adapt-recipe/route";
import { generateRecipesProcedure } from "./routes/recipe/generate-recipes/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  recipe: createTRPCRouter({
    adaptRecipe: adaptRecipeProcedure,
    generateRecipes: generateRecipesProcedure,
  }),
});

export type AppRouter = typeof appRouter;
