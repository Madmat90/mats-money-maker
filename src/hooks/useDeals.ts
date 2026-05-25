// useDeals.ts
// Haalt aanbiedingen op van de Mats Money Maker Deals API.
// Cachet resultaten 30 min in localStorage — werkt stil als API niet bereikbaar is.
// v4: slaat ALLE deals per product op (AH + Jumbo + ...), niet alleen de eerste.

import { useState, useEffect, useCallback } from 'react';
import type { RouteSection } from '../types';

const API_URL =
  (import.meta.env.VITE_DEALS_API_URL as string | undefined) ??
  'http://localhost:3008';

const CACHE_KEY = 'mmm-deals-v7';
const CACHE_TTL = 30 * 60 * 1000;

export interface DealInfo {
  name:  string;
  badge: string;
  store: string;
}

// ── Cache helpers ─────────────────────────────────────────────────────────
function loadCache(): { map: Map<string, DealInfo[]>; ts: number } {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return { map: new Map(), ts: 0 };
    const { ts, data } = JSON.parse(raw) as { ts: number; data: Record<string, DealInfo[]> };
    return { map: new Map(Object.entries(data)), ts };
  } catch {
    return { map: new Map(), ts: 0 };
  }
}

function saveCache(map: Map<string, DealInfo[]>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      ts:   Date.now(),
      data: Object.fromEntries(map),
    }));
  } catch {}
}

// Ping de API bij opstarten zodat Render alvast wakker wordt
if (typeof window !== 'undefined') {
  fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(60_000) }).catch(() => {});
}

// ── Hook ──────────────────────────────────────────────────────────────────
export function useDeals(sections: RouteSection[]) {
  const [deals,   setDeals]   = useState<Map<string, DealInfo[]>>(() => loadCache().map);
  const [loading, setLoading] = useState(false);

  const itemKey = sections
    .flatMap(s => s.items)
    .filter(i => !i.checked)
    .map(i => i.id)
    .join(',');

  const fetchDeals = useCallback(async (names: string[]) => {
    setLoading(true);
    try {
      const q   = encodeURIComponent(names.slice(0, 20).join(','));
      const res = await fetch(`${API_URL}/deals?q=${q}`, {
        signal: AbortSignal.timeout(35_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json() as Array<{
        query: string;
        deals: Array<{ store: string; badge: string; name: string }>;
      }>;

      setDeals(prev => {
        const next = new Map(prev);
        for (const result of data) {
          const key = result.query.toLowerCase();
          // Sla ALLE deals op (max 4 stores); lege array = gecheckt, geen deal
          next.set(key, result.deals.slice(0, 4).map(d => ({
            name:  d.name  || result.query,
            badge: d.badge,
            store: d.store,
          })));
        }
        saveCache(next);
        return next;
      });
    } catch (e) {
      console.warn('[Deals] API niet bereikbaar:', (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkAndFetch = useCallback(() => {
    const { map: cached, ts } = loadCache();
    const cacheExpired = Date.now() - ts > CACHE_TTL;

    if (cached.size > 0) setDeals(cached);

    const names = sections
      .flatMap(s => s.items)
      .filter(i => !i.checked)
      .map(i => i.name);

    const missing = cacheExpired
      ? names
      : names.filter(n => !cached.has(n.toLowerCase()));

    if (!missing.length) return;
    void fetchDeals(missing);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemKey, fetchDeals]);

  useEffect(() => {
    checkAndFetch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemKey]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') checkAndFetch();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [checkAndFetch]);

  /** Geeft één aanbieding per winkel terug (lege array = geen deal) */
  function getDeals(name: string): DealInfo[] {
    const all = deals.get(name.toLowerCase()) ?? [];
    // Max 1 deal per winkel — eerste (beste) match wint
    const seen = new Set<string>();
    return all.filter(d => {
      if (seen.has(d.store)) return false;
      seen.add(d.store);
      return true;
    });
  }

  return { getDeals, dealsLoading: loading };
}
