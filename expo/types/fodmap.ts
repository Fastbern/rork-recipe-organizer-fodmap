export type FodmapRating = 'low' | 'moderate' | 'high' | 'unknown';

export interface FodmapEntry {
  name: string;
  group?: string;
  category?: string;
  rating: FodmapRating; // normalized rating for our UI
  details?: string;
  servingNote?: string;
  sources?: string[];
}

export interface FodmapDataset {
  entries: FodmapEntry[];
  fetchedAt: string;
  version?: string;
}
