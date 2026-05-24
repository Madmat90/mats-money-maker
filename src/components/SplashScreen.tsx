// SplashScreen.tsx — Mats Money Maker splash
// Achtergrond: splash-bg.png (man met boodschappen).
// Tekst staat in het donkerblauwe stuk boven de man.

import { useState } from 'react';

const ACCENT     = 'var(--mm-saffron)';
const ACCENT_HEX = '#f08a3e';

// ── Inline iconen (identiek aan de echte app-knoppen) ───────────────────────
function MicSvg() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="12" rx="3"/>
      <path d="M5 10a7 7 0 0 0 14 0"/>
      <line x1="12" y1="19" x2="12" y2="22"/>
      <line x1="9"  y1="22" x2="15" y2="22"/>
    </svg>
  );
}

function BarcodeSvg() {
  return (
    <svg width="14" height="14" viewBox="0 0 22 22" fill="currentColor">
      <rect x="2"  y="4" width="2"  height="14"/>
      <rect x="6"  y="4" width="1"  height="14"/>
      <rect x="9"  y="4" width="2"  height="14"/>
      <rect x="13" y="4" width="1"  height="14"/>
      <rect x="16" y="4" width="2"  height="14"/>
      <rect x="20" y="4" width="1"  height="14"/>
    </svg>
  );
}

function CheckSvg() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <rect x="0.5" y="0.5" width="12" height="12" rx="3.5"
            fill={ACCENT_HEX} stroke={ACCENT_HEX}/>
      <path d="M3 6.5l2.5 2.5 4.5-5" stroke="#fff" strokeWidth="1.6"
            strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ── Help overlay ─────────────────────────────────────────────────────────────
function HelpOverlay({ onClose }: { onClose: () => void }) {
  const iconBtn = (children: React.ReactNode, bg: string, color: string) => (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 30, height: 30, borderRadius: 99,
      background: bg, color, flexShrink: 0,
    }}>{children}</span>
  );

  const storeLogo = (src: string, alt: string) => (
    <img src={src} alt={alt} style={{ height: 16, width: 'auto', borderRadius: 3, flexShrink: 0 }}/>
  );

  const routeChip = (
    <span style={{
      background: 'rgba(19,28,46,0.1)', border: 'none',
      borderRadius: 4, padding: '4px 7px',
      fontFamily: 'var(--mm-mono)', fontSize: 10,
      color: 'rgba(19,28,46,0.55)',
    }}>01</span>
  );

  const section = (title: string, children: React.ReactNode) => (
    <div style={{ marginBottom: 22 }}>
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: ACCENT_HEX, marginBottom: 8,
      }}>{title}</div>
      {children}
    </div>
  );

  const row = (icon: React.ReactNode, text: React.ReactNode) => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10 }}>
      <div style={{ flexShrink: 0, paddingTop: 1 }}>{icon}</div>
      <div style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--mm-ink)' }}>{text}</div>
    </div>
  );

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(10,18,36,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 500, padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%', maxWidth: 420,
          background: 'var(--mm-paper)',
          borderRadius: 22,
          maxHeight: '88svh', overflowY: 'auto',
          position: 'relative',
          WebkitOverflowScrolling: 'touch',
        } as React.CSSProperties}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          position: 'sticky', top: 0,
          background: 'var(--mm-navy)',
          borderRadius: '22px 22px 0 0',
          padding: '20px 20px 18px',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          zIndex: 1,
        }}>
          <div>
            <div style={{
              fontFamily: 'var(--mm-serif)', fontSize: 22, fontWeight: 350,
              fontVariationSettings: "'opsz' 144, 'SOFT' 40",
              color: 'var(--mm-bone)', lineHeight: 1.1,
            }}>
              Welkom bij<br/>
              <span style={{ fontStyle: 'italic' }}>Mats Money Maker</span>
            </div>
            <div style={{ fontSize: 12, color: 'rgba(239,229,210,0.55)', marginTop: 4 }}>
              Slimmer boodschappen doen
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Sluiten"
            style={{
              width: 30, height: 30, borderRadius: 99,
              background: 'rgba(255,255,255,0.1)', border: 'none',
              cursor: 'pointer', color: 'rgba(239,229,210,0.7)',
              fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, marginLeft: 12,
            }}
          >×</button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 20px 28px' }}>

          {section('Producten toevoegen', <>
            {row(
              iconBtn(<MicSvg/>, ACCENT_HEX, '#1a2540'),
              <><strong>Inspreken:</strong> tik op de oranje microfoonknop en noem het gewenste product. De app herkent wat u zegt en plaatst het direct op de lijst.</>
            )}
            {row(
              iconBtn(<BarcodeSvg/>, 'var(--mm-navy)', 'var(--mm-bone)'),
              <><strong>Barcode scannen:</strong> tik op de donkere barcodeknop en scan de verpakking. Werkt het beste bij A-merken.</>
            )}
          </>)}

          {section('Aanbiedingen & categorieën', <>
            {row(
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 2 }}>
                {storeLogo('/stores/ah.svg',    'AH')}
                {storeLogo('/stores/jumbo.svg', 'Jumbo')}
                {storeLogo('/stores/lidle.svg', 'Lidl')}
              </div>,
              <><strong>Automatische prijsvergelijking:</strong> zodra een product is toegevoegd, controleert de app of het in de aanbieding is. Bij een treffer verschijnt het logo van de supermarkt. Tik erop voor de details.</>
            )}
            {row(
              <div style={{ paddingTop: 2 }}>{routeChip}</div>,
              <><strong>Slimme categorieën:</strong> producten worden automatisch in de juiste categorie geplaatst. Tik op het grijze getal-blokje om een product handmatig te verplaatsen. De app onthoudt dit voor de volgende keer.</>
            )}
          </>)}

          {section('Efficiënt winkelen', <>
            {row(
              <div style={{ paddingTop: 2 }}><CheckSvg/></div>,
              <><strong>Afvinken:</strong> tik op een product zodra het in uw winkelwagen ligt. Het wordt doorgestreept en naar de onderkant van de lijst verplaatst.</>
            )}
            {row(
              <span style={{ fontSize: 16 }}>↻</span>,
              <><strong>Meenemen naar volgende week:</strong> niet-gekochte producten worden bij een nieuw lijstje automatisch meegenomen en gemarkeerd met het ↻-symbool.</>
            )}
          </>)}

          {/* Noot */}
          <div style={{
            background: 'rgba(19,28,46,0.05)',
            borderRadius: 10, padding: '12px 14px',
            fontSize: 12, color: 'rgba(19,28,46,0.55)', lineHeight: 1.55,
          }}>
            <strong style={{ color: 'rgba(19,28,46,0.7)' }}>Let op:</strong> de barcodefunctie is geoptimaliseerd voor A-merken en werkt mogelijk minder goed bij huismerken.
          </div>

        </div>
      </div>
    </div>
  );
}

// ── SplashScreen ─────────────────────────────────────────────────────────────
interface SplashScreenProps {
  onOpenList: () => void;
  onNewList:  () => void;
}

export function SplashScreen({ onOpenList, onNewList }: SplashScreenProps) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div style={{
      width: '100%',
      minHeight: '100svh',
      backgroundImage: 'url(/splash-bg.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center top',
      backgroundRepeat: 'no-repeat',
      color: 'var(--mm-bone)',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'var(--mm-sans)',
    }}>

      {/* Donkere gradient bovenaan — maakt tekst leesbaar */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background:
          'linear-gradient(to bottom, rgba(10,18,36,0.82) 0%, rgba(10,18,36,0.55) 32%, transparent 52%), ' +
          'linear-gradient(to top,   rgba(10,18,36,0.88) 0%, rgba(10,18,36,0.50) 22%, transparent 40%)',
        pointerEvents: 'none',
        zIndex: 1,
      }}/>

      {/* Eyebrow */}
      <div style={{
        padding: '20px 24px 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative',
        zIndex: 2,
      }}>
        {/* Vraagteken help-knop */}
        <button
          onClick={() => setShowHelp(true)}
          aria-label="Uitleg over de app"
          style={{
            width: 28, height: 28, borderRadius: 99,
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(239,229,210,0.25)',
            backdropFilter: 'blur(4px)',
            color: 'rgba(239,229,210,0.85)',
            fontSize: 14, fontWeight: 700,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            lineHeight: 1,
          }}
        >?</button>
        <span className="mm-eyebrow" style={{ color: ACCENT }}>Welkom terug</span>
      </div>

      {/* Titel */}
      <div style={{
        padding: '28px 32px 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        zIndex: 2,
      }}>
        <h1 style={{
          fontFamily: 'var(--mm-serif)',
          fontWeight: 320,
          fontVariationSettings: "'opsz' 144, 'SOFT' 50",
          fontSize: 40,
          lineHeight: 0.95,
          letterSpacing: '-0.03em',
          margin: '0',
          color: 'var(--mm-bone)',
          textAlign: 'center',
          textShadow: '0 2px 16px rgba(0,0,0,0.5)',
        }}>
          Mats{' '}
          <span style={{
            fontStyle: 'italic',
            fontVariationSettings: "'opsz' 144, 'SOFT' 80",
          }}>Money</span>{' '}Maker
        </h1>

        <p style={{
          fontSize: 13,
          lineHeight: 1.5,
          color: 'rgba(239,229,210,0.75)',
          textAlign: 'center',
          marginTop: 8,
          textShadow: '0 1px 8px rgba(0,0,0,0.6)',
        }}>
          Spreek je lijst in. Mis geen bonus.
        </p>
      </div>

      {/* Ruimte voor de man */}
      <div style={{ flex: 1 }}/>

      {/* CTA's onderaan */}
      <div style={{
        padding: '0 24px 44px',
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}>
        <button
          onClick={onOpenList}
          style={{
            background: ACCENT,
            color: '#1a2540',
            border: 'none',
            padding: '17px 24px',
            borderRadius: 'var(--mm-r-pill)',
            fontFamily: 'var(--mm-sans)',
            fontWeight: 600,
            fontSize: 15.5,
            letterSpacing: '-0.005em',
            cursor: 'pointer',
            boxShadow: `0 14px 32px -10px ${ACCENT_HEX}99, 0 0 0 1px rgba(0,0,0,0.08) inset`,
          }}
        >
          Mijn boodschappenlijst openen
        </button>

        <button
          onClick={onNewList}
          style={{
            background: 'rgba(255,255,255,0.08)',
            color: 'var(--mm-bone)',
            border: '1px solid rgba(239,229,210,0.22)',
            padding: '15px 24px',
            borderRadius: 'var(--mm-r-pill)',
            fontFamily: 'var(--mm-sans)',
            fontWeight: 500,
            fontSize: 14,
            cursor: 'pointer',
            backdropFilter: 'blur(6px)',
          }}
        >
          Nieuw lijstje beginnen
        </button>
      </div>

      {/* Help overlay */}
      {showHelp && <HelpOverlay onClose={() => setShowHelp(false)}/>}
    </div>
  );
}
