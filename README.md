# Mats Money Maker

Progressieve web-app (PWA) voor slimme boodschappenlijsten. De app combineert spraakherkenning, barcode-scanning en AI-productherkenning met real-time aanbiedingsdata van Albert Heijn, Jumbo, Dirk, Lidl en Plus. Producten worden automatisch gecategoriseerd per supermarktroute en bij elk product worden actuele kortingen getoond.

---

## Technische architectuur

De app bestaat uit twee volledig losgekoppelde lagen, elk op een apart platform gehost.

```
┌─────────────────────────────────┐        ┌──────────────────────────────────┐
│         FRONTEND                │        │           BACKEND                │
│   React PWA op Vercel           │◄──────►│   Node.js / Express op Render    │
│                                 │  HTTPS │                                  │
│  • React 18 + TypeScript        │        │  • GET  /deals?q=melk,brood      │
│  • Vite build tooling           │        │  • POST /identify-image          │
│  • @dnd-kit drag-and-drop       │        │  • GET  /health                  │
│  • BarcodeDetector API          │        │                                  │
│  • SpeechRecognition API        │        │  Scrapers: AH, Jumbo, Dirk,      │
│  • localStorage persistentie    │        │  Lidl, Plus                      │
└─────────────────────────────────┘        └──────────────────────────────────┘
        github.com/Madmat90/               github.com/Madmat90/
        mats-money-maker                   mats-money-maker-api
```

---

## Frontend — Vercel

**Repository:** `mats-money-maker`  
**Platform:** Vercel (Hobby, gratis tier)

De frontend is een Vite + React 18 + TypeScript SPA die via `vite-plugin-pwa` als installeerbare PWA werkt. Elke push naar de `master`-branch triggert automatisch een nieuwe Vercel-deploy via de GitHub-integratie.

Communicatie met de backend verloopt via één omgevingsvariabele:

```
VITE_DEALS_API_URL=https://mats-money-maker-api.onrender.com
```

Omdat Vercel een statische frontend bouwt en de variabele tijdens `vite build` ingebakken wordt, is er geen serverside logica op Vercel zelf. Alle runtime API-calls gaan direct van de browser naar Render.

> **Let op bij Vercel Hobby:** commits mogen geen `Co-Authored-By: Claude` bevatten in de commit-message — dat triggert een Vercel-blokkade op de gratis tier.

---

## Backend — Render.com

**Repository:** `mats-money-maker-api`  
**Platform:** Render (Free Web Service)  
**URL:** `https://mats-money-maker-api.onrender.com`

De backend is een Node.js/Express-server met drie endpoints:

| Endpoint | Methode | Functie |
|---|---|---|
| `/health` | GET | Liveness check + cache-statistieken |
| `/deals?q=melk,brood` | GET | Aanbiedingen ophalen voor max. 20 producten |
| `/identify-image` | POST | AI-productherkenning via Gemini Vision |

Omgevingsvariabelen (`GEMINI_API_KEY`, optioneel `CORS_ORIGIN`) worden via het Render-dashboard beheerd.

### Cold-start oplossing

De gratis Render-tier zet de server na 15 minuten inactiviteit in slaap. Een opstarttijd van 30-60 seconden zou de eerste deals-request laten mislukken en een lege cache opleveren. Dit is opgelost met een `_serverReady`-promise: zodra de app laadt stuurt de frontend een health-ping naar Render. De deals-request wacht op die promise, zodat de server wakker is tegen de tijd dat de echte data-aanvraag binnenkomt.

```typescript
// Ping bij app-start, zodat deals-fetch nooit een koude server treft
const _serverReady: Promise<void> = fetch(`${API_URL}/health`, {
  signal: AbortSignal.timeout(60_000)
}).then(() => {}).catch(() => {});

// Deals-fetch wacht op Render-wake
await _serverReady;
const res = await fetch(`${API_URL}/deals?q=${q}`);
```

---

## Dataflow — aanbiedingen

```
App laadt
   │
   ├─► health-ping → Render (wekt server)
   │
   └─► /deals?q=melk,brood,tomaten
              │
              ▼
         Render-backend
              │
       ┌──────┼──────┬──────┬──────┐
       ▼      ▼      ▼      ▼      ▼
      AH   Jumbo   Dirk   Lidl   Plus
    (API) (scrape)(scrape)(scrape)(scrape)
              │
       relevantie-matching
       (woordniveau, meervoud,
        valse-vriendenfilter)
              │
              ▼
      { query, deals: [{ store, name, badge }] }
              │
              ▼
         Frontend
    localStorage-cache (30 min)
              │
              ▼
    Logo-chips naast product
    → popup met exacte naam + badge
```

---

## Dataflow — AI-productherkenning

```
Gebruiker tikt ✦ sluiterknop
        │
        ▼
  Canvas.drawImage(videoEl)
  → JPEG base64 (max 640px)
        │
        ▼
  POST /identify-image
  { image: "<base64>" }
        │
        ▼
   Render-backend
        │
        ▼
  Gemini Vision API
  (gemini-2.5-flash, thinkingBudget: 0)
        │
        ▼
  "Jozo zout"  →  bevestiging  →  lijst
```

---

## Deployment-workflow

```
Lokale wijziging
      │
      ▼
  git push (master)
      │
      ├─► Vercel detecteert push
      │       └─► npm run build (Vite)
      │               └─► deploy in ~30s
      │
      └─► Render detecteert push
              └─► npm install + node server.js
                      └─► live in ~60s
```

Beide platforms luisteren naar dezelfde GitHub-repositories via webhooks. Er is geen aparte CI/CD-pipeline nodig.

---

## Gebruikte technologieën

| Onderdeel | Technologie |
|---|---|
| Frontend framework | React 18 + TypeScript |
| Build tooling | Vite 8 + vite-plugin-pwa |
| Drag-and-drop | @dnd-kit/core + @dnd-kit/sortable |
| Barcode-detectie | native BarcodeDetector API |
| Spraakherkenning | native SpeechRecognition API |
| AI-herkenning | Google Gemini Vision (Gemini 2.5 Flash) |
| Backend runtime | Node.js 20 + Express |
| Web-scraping | Axios + Cheerio |
| Frontend hosting | Vercel (CDN, worldwide edge) |
| Backend hosting | Render.com (Free Web Service) |
| Persistentie | localStorage (client-side, geen account nodig) |
