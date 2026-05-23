// SplashScreen.tsx — Mats Money Maker splash
// Achtergrond: splash-bg.png (man met boodschappen).
// Tekst staat in het donkerblauwe stuk boven de man.

import { MMSymbol } from './Logo';

const ACCENT     = 'var(--mm-saffron)';
const ACCENT_HEX = '#f08a3e';

interface SplashScreenProps {
  onOpenList: () => void;
  onNewList:  () => void;
}

export function SplashScreen({ onOpenList, onNewList }: SplashScreenProps) {
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
        <span className="mm-eyebrow" style={{ opacity: 0.55 }}>v1.0</span>
        <span className="mm-eyebrow" style={{ color: ACCENT }}>Welkom terug</span>
      </div>

      {/* Logo + titel — boven de man */}
      <div style={{
        padding: '18px 32px 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        zIndex: 2,
      }}>
        <MMSymbol variant="sprout" size={48} color="var(--mm-bone)" accent={ACCENT_HEX}/>

        <h1 style={{
          fontFamily: 'var(--mm-serif)',
          fontWeight: 320,
          fontVariationSettings: "'opsz' 144, 'SOFT' 50",
          fontSize: 58,
          lineHeight: 0.9,
          letterSpacing: '-0.035em',
          margin: '18px 0 0',
          color: 'var(--mm-bone)',
          textAlign: 'center',
          textShadow: '0 2px 16px rgba(0,0,0,0.4)',
        }}>
          Mats<br/>
          <span style={{
            fontStyle: 'italic',
            fontVariationSettings: "'opsz' 144, 'SOFT' 80",
          }}>Money</span>{' '}Maker
        </h1>

        <p style={{
          fontSize: 14,
          lineHeight: 1.55,
          color: 'rgba(239,229,210,0.75)',
          textAlign: 'center',
          maxWidth: 240,
          marginTop: 14,
          textShadow: '0 1px 8px rgba(0,0,0,0.5)',
        }}>
          Spreek je lijst in.<br/>
          Loop op route. Mis geen bonus.
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
    </div>
  );
}
