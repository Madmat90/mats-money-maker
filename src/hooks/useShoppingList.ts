// useShoppingList.ts
// Beheert de boodschappenlijst-state + localStorage-persistentie.
// Functies: afvinken, items toevoegen via transcript, nieuw lijstje starten.

import { useState, useEffect, useCallback } from 'react';
import type { RouteSection, ShoppingItem } from '../types';
import { parseTranscript } from '../utils/parseTranscript';

const STORAGE_KEY        = 'mmm-list-v1';
const CUSTOM_ROUTES_KEY  = 'mmm-custom-routes-v1';

function loadCustomRoutes(): Record<string, string> {
  try {
    const raw = localStorage.getItem(CUSTOM_ROUTES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveCustomRoutes(map: Record<string, string>) {
  try { localStorage.setItem(CUSTOM_ROUTES_KEY, JSON.stringify(map)); } catch {}
}

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
  { route: '04', title: 'Voorverpakte groente',          items: [] },
  { route: '05', title: 'Vlees, vleeswaren & slaatjes',  items: [] },
  { route: '06', title: 'Verse kaas',                    items: [] },
  { route: '07', title: 'Verpakte kaas',                 items: [] },
  { route: '08', title: 'Tapas',                         items: [] },
  { route: '09', title: 'Verse noten',                   items: [] },
  { route: '10', title: 'Oosters',                       items: [] },
  { route: '11', title: 'Gemakseten',                    items: [] },
  { route: '12', title: 'Conserven',                     items: [] },
  { route: '13', title: 'Koffie & thee',                 items: [] },
  { route: '14', title: 'Voorverpakte noten',            items: [] },
  { route: '15', title: 'Diepvries',                     items: [] },
  { route: '16', title: 'Koekjes & chocolade',           items: [] },
  { route: '17', title: 'Huishouden',                    items: [] },
  { route: '18', title: 'Verzorging',                    items: [] },
  { route: '19', title: 'Dranken',                       items: [] },
  { route: '20', title: 'Overig',                        items: [] },
];

// Lege secties — basis voor een nieuw lijstje
export const EMPTY_SECTIONS: RouteSection[] = [
  { route: '01', title: 'Groente & fruit',               items: [] },
  { route: '02', title: 'Brood & banket',                items: [] },
  { route: '03', title: 'Zuivel',                        items: [] },
  { route: '04', title: 'Voorverpakte groente',          items: [] },
  { route: '05', title: 'Vlees, vleeswaren & slaatjes',  items: [] },
  { route: '06', title: 'Verse kaas',                    items: [] },
  { route: '07', title: 'Verpakte kaas',                 items: [] },
  { route: '08', title: 'Tapas',                         items: [] },
  { route: '09', title: 'Verse noten',                   items: [] },
  { route: '10', title: 'Oosters',                       items: [] },
  { route: '11', title: 'Gemakseten',                    items: [] },
  { route: '12', title: 'Conserven',                     items: [] },
  { route: '13', title: 'Koffie & thee',                 items: [] },
  { route: '14', title: 'Voorverpakte noten',            items: [] },
  { route: '15', title: 'Diepvries',                     items: [] },
  { route: '16', title: 'Koekjes & chocolade',           items: [] },
  { route: '17', title: 'Huishouden',                    items: [] },
  { route: '18', title: 'Verzorging',                    items: [] },
  { route: '19', title: 'Dranken',                       items: [] },
  { route: '20', title: 'Overig',                        items: [] },
];

// ── Keyword → route classificatie ───────────────────────────────────────────
// Let op: keys '10'-'20' zijn JS array-indices en worden door Object.entries
// voor '01'-'09' teruggegeven. classify() sorteert daarom altijd op routenummer.
const ROUTE_MAP: Record<string, string[]> = {
  '01': [
    'tomaat','tomaten','komkommer','sla','appel','appels','peer','banaan','mango',
    'avocado','peterselie','paprika','ui','uien','knoflook','wortel','courgette',
    'aubergine','champignon','sperzieboon','broccoli','bloemkool','aardbei',
    'druiven','citroen','limoen','sinaasappel','kiwi','radijs','prei','gember',
    'asperge','venkel','selderij','biet','witlof','andijvie','waterkers',
    'rode kool','witte kool','spitskool','bieslook','dille','tijm','rozemarijn',
    'basilicum','munt','aardappel','aardappelen','bosui','lente-ui',
  ],
  '02': [
    'brood','bollen','croissant','beschuit','bagel','ciabatta','baguette',
    'cake','worstenbrood','pistolet','muesli','cornflakes','havermout','granola',
    'roggebrood','wrap','tortilla','broodjes','stokbrood','focaccia','pitabrood',
    'naanbrood','rijstwafels','ontbijtgranen',
  ],
  '03': [
    'melk','yoghurt','kwark','boter','room','vla','pudding','ei','eieren',
    'slagroom','karnemelk','kefir','chocolademelk','zure room','hangop','skyr',
  ],
  '04': [
    'wokgroente','roerbakgroente','soepgroente','saladezak','snijgroente',
    'preiringen','veldsla','ijsbergsla','mesclun','coleslaw',
    'voorgesneden','salade mix','kant-en-klare groente','haricots',
  ],
  '05': [
    'kip','gehakt','vlees','biefstuk','kipfilet','varkens','lam',
    'rookvlees','ham','salami','worst','leverworst','eiersalade','huzarensalade',
    'garnalensalade','paté','bacon','spek','tartaar','ossenworst','carpaccio',
    'filet americain','rosbief','entrecôte','ribeye','schnitzel',
    'slavinken','braadworst','merquez','chorizo','coppa','bresaola',
    'vis','zalm','garnalen','zeebaars','forel','kabeljauw','mosselen',
    'zalmfilet','tilapia','pangasius',
  ],
  '06': [
    'verse kaas','burrata','ricotta','feta','geitenkaas','brie','camembert',
    'cottage cheese','mozzarella','cream cheese','labneh','mascarpone',
    'fromage blanc',
  ],
  '07': [
    'kaas','gouda','edammer','cheddar','parmezaan','gruyère','belegen',
    'jong belegen','komijnekaas','manchego','parmigiano','grana padano',
    'emmentaler','leerdammer','smeerkaas','raclette','maasdam','beemster',
    'oude kaas','extra belegen',
  ],
  '08': [
    'olijven','antipasti','tapas','tzatziki','hummus','guacamole','pesto',
    'bruschetta','artisjokharten','zongedroogde tomaten','tapenade',
    'gevulde paprika','dolmades','baba ganoush','harissa','dip',
  ],
  '09': [
    'verse noten','noten los','noten bulk',
  ],
  '10': [
    'sojasaus','teriyaki','ketjap','sambal','nasi','bami','rijstnoedels',
    'mie','ramen','udon','soba','tempeh','tofu','sesamolie','vissaus',
    'oestersaus','hoisin','kokosmelk','tamarinde','wasabi','kimchi','miso',
    'dashi','lemongrass','sriracha','rijstazijn','gemberpasta','currypasta',
  ],
  '11': [
    'pizza','quiche','lasagne','ovenschotel','kant-en-klaar','pastasalade',
    'tortellini','gnocchi','stamppot','hutspot','erwtensoep','maaltijdsoep',
    'maaltijd','kant en klaar','panini','verse pasta','gevulde pasta',
  ],
  '12': [
    'pasta','spaghetti','penne','fusilli','farfalle','tagliatelle','rigatoni',
    'rijst','couscous','bulgur','quinoa','tomatensaus','pastasaus',
    'blik','tonijn','sardines','makreel blik','bonen','linzen','kikkererwten',
    'bruine bonen','kidneybonen','tomatenpuree','passata','gepelde tomaten',
    'augurken','zilveruitjes','jam','honing','pindakaas','notenpasta',
    'confiture','siroop','stroop','ansjovis','kappertjes','olijfolie',
    'azijn','mosterd','mayo','ketchup','soepblik',
  ],
  '13': [
    'koffie','thee','espresso','cappuccino','koffiebonen','koffiecups',
    'nespresso','senseo','groene thee','kruidenthee','rooibos','earl grey',
    'chai','matcha','oploskoffie',
  ],
  '14': [
    'studentenhaver','mixed nuts','cashewnoten','amandelen','walnoten',
    'hazelnoten','pistache','rozijnen','gedroogd fruit','dadels','vijgen',
    'gedroogde abrikozen','cranberries','pinda','macadamia','pecannoten',
    'noten zak','noten mix','gezouten noten','ongezouten noten',
  ],
  '15': [
    'diepvries','friet','frites','frikandel','kroket','nugget','visstick',
    'roomijs','ijsje','sorbet','bevroren','edamame','diepvriesgroente',
  ],
  '16': [
    'koekjes','chocolade','stroopwafel','speculaas','ontbijtkoek','wafel',
    'biscuit','pepernoten','kruidnoten','drop','snoep','bonbon','praline',
    'gevulde koek','chocoladereep','pure chocolade','melkchocolade',
    'truffels','zuurtjes','lolly','chips','popcorn',
  ],
  '17': [
    'wasmiddel','afwasmiddel','schoonmaakmiddel','toiletpapier','wc-papier',
    'keukenpapier','afwasborstel','spons','keukenrol','vuilniszak','afvalzak',
    'aluminiumfolie','plastic folie','bakpapier','bleekwater','glasreiniger',
    'vloerreiniger','droogmiddel','vaatwaspoeder','wasverzachter',
    'handzeep','reiniger','wc-blok','geurkaars',
  ],
  '18': [
    'shampoo','conditioner','douchegel','tandpasta','deodorant','scheermesje',
    'scheercrème','bodylotion','gezichtscrème','zonnebrand','maandverband',
    'tampon','scheergel','mondwater','lipbalsem','handcrème','haargel',
    'haarlak','parfum','aftershave','scheerschuim','wattenschijfje',
    'wattenstaafje','pleister','ibuprofen','paracetamol',
  ],
  '19': [
    'water','spa','cola','fanta','sap','jus','limonade','bier','wijn',
    'champagne','prosecco','frisdrank','energiedrank','smoothie',
    'vruchtensap','ijsthee','tomatensap','appelsap','sinaasappelsap',
    'sportdrank','mineraalwater','tonic','ginger ale','cranberrysap',
    'druivensap','rosé',
  ],
};

function classify(name: string, sections: RouteSection[]): string {
  const lower = name.toLowerCase();

  // Geleerde routes gaan voor op de ingebouwde ROUTE_MAP
  const custom = loadCustomRoutes();
  if (custom[lower] && sections.some(s => s.route === custom[lower])) {
    return custom[lower];
  }

  // Sorteer op routenummer: JS beschouwt '10'-'20' als array-indices en zet
  // ze anders vóór '01'-'09' in Object.entries. Expliciete sortering voorkomt dit.
  const entries = Object.entries(ROUTE_MAP).sort((a, b) => Number(a[0]) - Number(b[0]));
  for (const [route, kws] of entries) {
    if (kws.some(kw => lower.includes(kw))) {
      if (sections.some(s => s.route === route)) return route;
    }
  }
  // Fallback: laatste sectie
  return sections[sections.length - 1]?.route ?? '20';
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}

function load(): RouteSection[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved: RouteSection[] = JSON.parse(raw);

    // Migratie: als er secties ontbreken (oude opslag), bouw de volledige lijst op
    // en bewaar bestaande items in hun sectie.
    const savedMap   = new Map(saved.map(s => [s.route, s]));
    const hasMissing = EMPTY_SECTIONS.some(s => !savedMap.has(s.route));
    if (!hasMissing) return saved;

    const migrated = EMPTY_SECTIONS.map(template => {
      const existing = savedMap.get(template.route);
      if (!existing) return { ...template };
      // Oude route '04' heette 'Overig' — items gaan naar nieuwe route '20'
      if (template.route === '04' && existing.title === 'Overig') return { ...template };
      return { ...template, items: existing.items };
    });

    // Items van oude Overig (route 04, title 'Overig') naar nieuwe Overig (route 20)
    const oldOverig = savedMap.get('04');
    if (oldOverig?.title === 'Overig' && oldOverig.items.length > 0) {
      const idx = migrated.findIndex(s => s.route === '20');
      if (idx !== -1) migrated[idx] = { ...migrated[idx], items: [...migrated[idx].items, ...oldOverig.items] };
    }

    return migrated;
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

  /** Herorden items binnen een sectie (via drag-and-drop) */
  const reorderItems = useCallback((sectionRoute: string, fromIndex: number, toIndex: number) => {
    setSections(prev => prev.map(s => {
      if (s.route !== sectionRoute) return s;
      const items = [...s.items];
      const [moved] = items.splice(fromIndex, 1);
      items.splice(toIndex, 0, moved);
      return { ...s, items };
    }));
  }, []);

  /** Verwijder een item op id */
  const deleteItem = useCallback((id: string) => {
    setSections(prev => prev.map(s => ({
      ...s,
      items: s.items.filter(it => it.id !== id),
    })));
  }, []);

  /**
   * Verplaats item naar een andere sectie en sla de naam→route koppeling op,
   * zodat de app dit product voortaan automatisch correct indeelt.
   */
  const reassignItem = useCallback((id: string, targetRoute: string) => {
    setSections(prev => {
      let moved: ShoppingItem | null = null;
      const next = prev.map(s => ({
        ...s,
        items: s.items.filter(it => {
          if (it.id === id) { moved = it; return false; }
          return true;
        }),
      }));
      if (moved) {
        // Onthoud de koppeling naam → sectie
        const custom = loadCustomRoutes();
        custom[(moved as ShoppingItem).name.toLowerCase()] = targetRoute;
        saveCustomRoutes(custom);
        const target = next.find(s => s.route === targetRoute) ?? next[next.length - 1];
        target.items.push(moved as ShoppingItem);
      }
      return next;
    });
  }, []);

  return { sections, toggleItem, addByTranscript, startNewList, deleteItem, reassignItem, reorderItems };
}
