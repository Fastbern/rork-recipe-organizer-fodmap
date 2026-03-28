import { FodmapDataset, FodmapEntry, FodmapRating } from '@/types/fodmap';

const RAW_URL = 'https://raw.githubusercontent.com/oseparovic/fodmap_list/master/fodmap_repo.json';
const STORAGE_KEY = 'fodmap_dataset_v1';

function normalizeName(name: string): string {
  return name.toLowerCase().trim()
    .replace(/[^a-z0-9\s\-]/g, '')
    .replace(/\s+/g, ' ');
}

function mapRepoRating(value: string | number | undefined): FodmapRating {
  if (value == null) return 'unknown';
  const v = String(value).toLowerCase();
  if (['safe', 'low', 'green', 'allowed', 'ok', 'yes', 'low fodmap'].some(k => v.includes(k))) return 'low';
  if (['medium', 'moderate', 'amber', 'orange'].some(k => v.includes(k))) return 'moderate';
  if (['high', 'red', 'avoid', 'no', 'not allowed'].some(k => v.includes(k))) return 'high';
  return 'unknown';
}

export async function fetchFodmapDataset(forceRefresh = false): Promise<FodmapDataset> {
  try {
    if (!forceRefresh) {
      const cached = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      if (cached) {
        try {
          return JSON.parse(cached) as FodmapDataset;
        } catch {}
      }
    }

    const res = await fetch(RAW_URL, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw = await res.json();

    const entries: FodmapEntry[] = [];

    if (Array.isArray(raw)) {
      for (const item of raw) {
        const name: string = item.name ?? item.food ?? item.title ?? '';
        if (!name) continue;
        const rating = mapRepoRating(item.group ?? item.category ?? item.rating ?? item.status);
        const entry: FodmapEntry = {
          name,
          group: item.group ?? item.category,
          category: item.category ?? item.type,
          rating,
          details: item.notes ?? item.comment ?? item.description,
          servingNote: item.serving ?? item.portion ?? item.serving_note,
          sources: item.sources ?? item.source ? [item.source] : undefined,
        };
        entries.push(entry);
      }
    } else if (raw && typeof raw === 'object') {
      const list = raw.list ?? raw.items ?? raw.foods ?? [];
      if (Array.isArray(list)) {
        for (const item of list) {
          const name: string = item.name ?? item.food ?? '';
          if (!name) continue;
          const rating = mapRepoRating(item.rating ?? item.rank ?? item.status);
          const entry: FodmapEntry = {
            name,
            group: item.group ?? item.category,
            category: item.category,
            rating,
            details: item.details ?? item.notes,
            servingNote: item.serving ?? item.portion,
            sources: item.sources,
          };
          entries.push(entry);
        }
      }
    }

    const dataset: FodmapDataset = { entries, fetchedAt: new Date().toISOString() };

    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataset));
      }
    } catch {}

    return dataset;
  } catch (e) {
    console.error('[FODMAP] Failed to fetch dataset', e);
    const empty: FodmapDataset = { entries: [], fetchedAt: new Date().toISOString() };
    return empty;
  }
}

export function rateIngredientFromDataset(name: string, dataset: FodmapDataset): { rating: FodmapRating; match?: FodmapEntry } {
  const n = normalizeName(name);
  let best: { entry: FodmapEntry; score: number } | null = null;

  for (const entry of dataset.entries) {
    const en = normalizeName(entry.name);
    if (n === en) {
      return { rating: entry.rating, match: entry };
    }
    if (n.includes(en) || en.includes(n)) {
      const score = Math.min(n.length, en.length);
      if (!best || score > best.score) best = { entry, score };
    }
  }

  if (best) return { rating: best.entry.rating, match: best.entry };
  return { rating: 'unknown' };
}
