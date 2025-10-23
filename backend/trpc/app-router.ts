import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { adaptRecipeProcedure } from "./routes/recipe/adapt-recipe/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  recipe: createTRPCRouter({
    adaptRecipe: adaptRecipeProcedure,
  }),
});

export type AppRouter = typeof appRouter;
