// parseTranscript.ts
// Zet spraak-tekst om naar een lijst van {name, qty} items.
// Voorbeelden:
//   "tomaten en komkommer"          → [{name:'Tomaten',qty:''},{name:'Komkommer',qty:''}]
//   "2 kilo appels en 500 gram gehakt" → [{name:'Appels',qty:'2 kilo'},{name:'Gehakt',qty:'500 gram'}]
//   "3 pakken melk"                 → [{name:'Melk', qty:'3 pakken'}]

export interface ParsedItem {
  name: string;
  qty:  string;
}

export function parseTranscript(raw: string): ParsedItem[] {
  const cleaned = raw
    .trim()
    .toLowerCase()
    .replace(/,\s*/g,          ' en ')   // komma → "en"
    .replace(/\ben\s+ook\b/g,  'en')     // "en ook" → "en"
    .replace(/\bplus\b/g,      'en')
    .replace(/\bmet\b/g,       'en');

  return cleaned
    .split(/\s+en\s+/)
    .map(p => p.trim())
    .filter(Boolean)
    .map(parseOne)
    .filter(item => item.name.length > 1);
}

// Getal + optionele eenheid + naam
const QTY_RE = /^(\d+(?:[,.]\d+)?)\s*(kilo|kilogram|kg|gram|gr|g(?=\s)|liter|l(?=\s)|stuks?|st\.?|pak(?:ken)?|blik(?:ken)?|fles(?:sen)?|zakjes?|bosjes?|stuk(?:ken)?|×|x(?=\s))?\s+(.+)/i;

function parseOne(raw: string): ParsedItem {
  const m = raw.match(QTY_RE);
  if (m) {
    const unit = m[2] ? ` ${m[2]}` : ' st.';
    return { name: cap(m[3]), qty: m[1] + unit };
  }
  return { name: cap(raw), qty: '' };
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
