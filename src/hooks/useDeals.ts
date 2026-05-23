// useDeals.ts
// Haalt aanbiedingen op van de Mats Money Maker Deals API.
// Cachet resultaten 30 min in localStorage — werkt stil als API niet bereikbaar is.

import { useState, useEffect, useCallback } from 'react';
import type { RouteSection } from '../types';

// Stel in via .env.local (dev) of Vercel/Render env var (productie)
const API_URL =
  (import.meta.env.VITE_DEALS_API_URL as string | undefined) ??
  'http://localhost:3008';

const CACHE_KEY = 'mmm-deals-v3';   // v3: TTL ook voor sentinels
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

// Ping de API bij opstarten zodat Render alvast wakker wordt
if (typeof window !== 'undefined') {
  fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(60_000) }).catch(() => {});
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
    const cacheExpired = Date.now() - ts > CACHE_TTL;

    // Laad wat al in de cache zit meteen in de state
    if (cached.size > 0) setDeals(cached);

    const names = sections
      .flatMap(s => s.items)
      .filter(i => !i.checked)
      .map(i => i.name);

    // Cache verlopen → alles opnieuw checken (ook sentinels van eerder)
    // Cache vers    → alleen items die nog helemaal ontbreken
    const missing = cacheExpired
      ? names
      : names.filter(n => !cached.has(n.toLowerCase()));

    if (!missing.length) return;
    void fetchDeals(missing);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemKey]);

  const fetchDeals = useCallback(async (names: string[]) => {
    setLoading(true);
    try {
      const q   = encodeURIComponent(names.slice(0, 20).join(','));
      const res = await fetch(`${API_URL}/deals?q=${q}`, {
        signal: AbortSignal.timeout(35_000),   // Render free tier cold start ~30s
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json() as Array<{
        query: string;
        deals: Array<{ store: string; badge: string }>;
      }>;

      setDeals(prev => {
        const next = new Map(prev);
        for (const result of data) {
          const key = result.query.toLowerCase();
          if (result.deals.length > 0) {
            const best = result.deals[0];
            next.set(key, { badge: best.badge, store: best.store });
          } else {
            // Geen deal gevonden — sla sentinel op zodat we niet blijven herfetchen
            next.set(key, { badge: '', store: '' });
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

  /** Geeft de beste aanbieding terug voor een productnaam (case-insensitive).
   *  Sentinel { store:'', badge:'' } betekent: gecheckt, geen deal → undefined */
  function getDeal(name: string): DealInfo | undefined {
    const d = deals.get(name.toLowerCase());
    if (!d || (d.store === '' && d.badge === '')) return undefined;
    return d;
  }

  return { getDeal, dealsLoading: loading };
}
