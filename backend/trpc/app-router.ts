import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { adaptRecipeProcedure } from "./routes/recipe/adapt-recipe/route";
import searchLowFodmapProcedure from "./routes/recipe/search/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  recipe: createTRPCRouter({
    adaptRecipe: adaptRecipeProcedure,
    searchLowFodmap: searchLowFodmapProcedure,
  }),
});

export type AppRouter = typeof appRouter;
