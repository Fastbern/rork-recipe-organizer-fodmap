import createContextHook from '@nkzw/create-context-hook';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { fetchFodmapDataset, rateIngredientFromDataset } from '@/utils/fodmap';
import { FodmapDataset, FodmapEntry, FodmapRating } from '@/types/fodmap';

export interface FodmapContextValue {
  dataset: FodmapDataset | null;
  isLoading: boolean;
  error: string | null;
  rateIngredient: (name: string) => { rating: FodmapRating; match?: FodmapEntry };
}

export const [FodmapProvider, useFodmap] = createContextHook<FodmapContextValue>(() => {
  const query = useQuery({
    queryKey: ['fodmap-dataset'],
    queryFn: () => fetchFodmapDataset(false),
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24 * 7,
  });

  const value: FodmapContextValue = useMemo(() => ({
    dataset: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    rateIngredient: (name: string) => {
      const ds = query.data ?? { entries: [], fetchedAt: new Date().toISOString() } as FodmapDataset;
      return rateIngredientFromDataset(name, ds);
    },
  }), [query.data, query.isLoading, query.error]);

  return value;
});
