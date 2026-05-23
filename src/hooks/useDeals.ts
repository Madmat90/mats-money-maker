// useDeals.ts
// Haalt aanbiedingen op van de Mats Money Maker Deals API.
// Cachet resultaten 30 min in localStorage — werkt stil als API niet bereikbaar is.

import { useState, useEffect, useCallback } from 'react';
import type { RouteSection } from '../types';

// Stel in via .env.local (dev) of Vercel/Render env var (productie)
const API_URL =
  (import.meta.env.VITE_DEALS_API_URL as string | undefined) ??
  'http://localhost:3008';

const CACHE_KEY = 'mmm-deals-v1';
const CACHE_TTL = 30 * 60 * 1000;  // 30 minuten

export interface DealInfo {
  badge: string;   // bijv. '–25%' | 'Bonus' | 'Aanbieding'
  store: string;   // bijv. 'AH' | 'Jumbo' | 'Dirk'
}

// ── Lokale cache helpers ──────────────────────────────────────────────────
function loadCache(): { map: Map<string, DealInfo>; ts: number } {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return { map: new Map(), ts: 0 };
    const { ts, data } = JSON.parse(raw) as { ts: number; data: Record<string, DealInfo> };
    return { map: new Map(Object.entries(data)), ts };
  } catch {
    return { map: new Map(), ts: 0 };
  }
}

function saveCache(map: Map<string, DealInfo>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      ts:   Date.now(),
      data: Object.fromEntries(map),
    }));
  } catch {}
}

// ── Hook ──────────────────────────────────────────────────────────────────
export function useDeals(sections: RouteSection[]) {
  const [deals,   setDeals]   = useState<Map<string, DealInfo>>(() => loadCache().map);
  const [loading, setLoading] = useState(false);

  // Bepaal welke productnamen we nog niet gecacht hebben
  const itemKey = sections
    .flatMap(s => s.items)
    .filter(i => !i.checked)
    .map(i => i.id)
    .join(',');

  useEffect(() => {
    const { map: cached, ts } = loadCache();

    // Cache nog vers?
    if (Date.now() - ts < CACHE_TTL) {
      setDeals(cached);
      return;
    }

    // Welke namen missen in de cache?
    const names = sections
      .flatMap(s => s.items)
      .filter(i => !i.checked)
      .map(i => i.name);

    const missing = names.filter(n => !cached.has(n.toLowerCase()));
    if (!missing.length) return;

    void fetchDeals(missing);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemKey]);

  const fetchDeals = useCallback(async (names: string[]) => {
    setLoading(true);
    try {
      const q   = encodeURIComponent(names.slice(0, 20).join(','));
      const res = await fetch(`${API_URL}/deals?q=${q}`, {
        signal: AbortSignal.timeout(12_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json() as Array<{
        query: string;
        deals: Array<{ store: string; badge: string }>;
      }>;

      setDeals(prev => {
        const next = new Map(prev);
        for (const result of data) {
          if (result.deals.length > 0) {
            const best = result.deals[0];
            next.set(result.query.toLowerCase(), {
              badge: best.badge,
              store: best.store,
            });
          }
        }
        saveCache(next);
        return next;
      });
    } catch (e) {
      // Stille fout — deals zijn optioneel, app werkt gewoon door
      console.warn('[Deals] API niet bereikbaar:', (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  /** Geeft de beste aanbieding terug voor een productnaam (case-insensitive) */
  function getDeal(name: string): DealInfo | undefined {
    return deals.get(name.toLowerCase());
  }

  return { getDeal, dealsLoading: loading };
}
