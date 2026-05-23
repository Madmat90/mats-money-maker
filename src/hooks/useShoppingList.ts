// useShoppingList.ts
// Beheert de boodschappenlijst-state + localStorage-persistentie.
// Functies: afvinken, items toevoegen via transcript, nieuw lijstje starten.

import { useState, useEffect, useCallback } from 'react';
import type { RouteSection, ShoppingItem } from '../types';
import { parseTranscript } from '../utils/parseTranscript';

const STORAGE_KEY = 'mmm-list-v1';

// ── Demo-startdata (gebruikt als localStorage leeg is) ──────────────────────
export const DEMO_SECTIONS: RouteSection[] = [
  {
    route: '01',
    title: 'Groente & fruit',
    items: [
      { id: 'a1', name: 'Tomaten op de tros', qty: '500 g',  sale: '–25%', checked: false },
      { id: 'a2', name: 'Komkommer',           qty: '2 st.',              checked: false },
      { id: 'a3', name: 'Bos peterselie',      qty: '1 bos',              checked: true  },
      { id: 'a4', name: 'Avocado, rijp',        qty: '3 st.', carry: true, checked: false },
    ],
  },
  {
    route: '02',
    title: 'Brood & banket',
    items: [
      { id: 'b1', name: 'Volkoren boerenbrood', qty: '1 brood', sale: 'Bonus', checked: false },
      { id: 'b2', name: 'Krentenbollen',         qty: '6 st.',               checked: false },
    ],
  },
  {
    route: '03',
    title: 'Zuivel',
    items: [
      { id: 'c1', name: 'Volle melk',      qty: '2 × 1 L', checked: true  },
      { id: 'c2', name: 'Griekse yoghurt', qty: '500 g',   checked: false },
    ],
  },
];

// Lege secties — basis voor een nieuw lijstje
export const EMPTY_SECTIONS: RouteSection[] = [
  { route: '01', title: 'Groente & fruit', items: [] },
  { route: '02', title: 'Brood & banket',  items: [] },
  { route: '03', title: 'Zuivel',           items: [] },
  { route: '04', title: 'Overig',           items: [] },
];

// ── Keyword → route classificatie ───────────────────────────────────────────
const ROUTE_MAP: Record<string, string[]> = {
  '01': ['tomaat','tomaten','komkommer','sla','appel','appels','peer','banaan','mango',
         'avocado','peterselie','paprika','ui','uien','knoflook','wortel','courgette',
         'aubergine','spinazie','champignon','sperzieboon','broccoli','bloemkool','aardbei',
         'druiven','citroen','limoen','sinaasappel','peer','kiwi','radijs'],
  '02': ['brood','bollen','croissant','beschuit','cracker','bagel','ciabatta','baguette',
         'koek','cake','worstenbrood','pistolet','muesli','cornflakes','havermout','granola'],
  '03': ['melk','yoghurt','kwark','kaas','boter','room','vla','pudding','ei','eieren',
         'slagroom','crème','mascarpone','ricotta','mozzarella','brie','gouda'],
  '04': ['pasta','rijst','aardappel','aardappelen','saus','soep','blik','tonijn',
         'kip','gehakt','vlees','vis','zalm','garnalen','tofu','tempeh'],
};

function classify(name: string, sections: RouteSection[]): string {
  const lower = name.toLowerCase();
  for (const [route, kws] of Object.entries(ROUTE_MAP)) {
    if (kws.some(kw => lower.includes(kw))) {
      if (sections.some(s => s.route === route)) return route;
    }
  }
  // Fallback: laatste sectie
  return sections[sections.length - 1]?.route ?? '04';
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}

function load(): RouteSection[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function save(sections: RouteSection[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(sections)); } catch {}
}

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useShoppingList(seed: RouteSection[] = DEMO_SECTIONS) {
  const [sections, setSections] = useState<RouteSection[]>(() => load() ?? seed);

  // Opslaan bij elke wijziging
  useEffect(() => { save(sections); }, [sections]);

  /** Schakel afgevinkt/niet-afgevinkt */
  const toggleItem = useCallback((id: string) => {
    setSections(prev => prev.map(s => ({
      ...s,
      items: s.items.map(it => it.id === id ? { ...it, checked: !it.checked } : it),
    })));
  }, []);

  /** Parseer transcript, voeg items toe aan juiste secties, geef nieuwe items terug */
  const addByTranscript = useCallback((transcript: string): ShoppingItem[] => {
    const parsed = parseTranscript(transcript);
    if (!parsed.length) return [];

    const newItems: ShoppingItem[] = parsed.map(p => ({
      id: uid(), name: p.name, qty: p.qty, checked: false,
    }));

    setSections(prev => {
      // Diepe kopie zodat we veilig kunnen muteren
      const next = prev.map(s => ({ ...s, items: [...s.items] }));
      for (const item of newItems) {
        const route = classify(item.name, next);
        const sec   = next.find(s => s.route === route) ?? next[next.length - 1];
        sec.items.push(item);
      }
      return next;
    });

    return newItems;
  }, []);

  /**
   * Start een nieuw lijstje:
   * - Niet-afgevinkten worden meegenomen als carry-over (↻ over badge)
   * - Afgevinkten worden verwijderd
   */
  const startNewList = useCallback(() => {
    setSections(prev =>
      prev.map(s => ({
        ...s,
        items: s.items
          .filter(it => !it.checked)
          .map(it => ({ ...it, carry: true })),
      }))
    );
  }, []);

  return { sections, toggleItem, addByTranscript, startNewList };
}
