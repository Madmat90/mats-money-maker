// SplashScreen.tsx — Mats Money Maker splash
// Gebaseerd op SplashScreen uit screens.jsx (design handoff).

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
      background: 'radial-gradient(120% 80% at 50% 110%, #2a3d6b 0%, #1a2540 40%, #0c1424 100%)',
      color: 'var(--mm-bone)',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'var(--mm-sans)',
    }}>

      {/* Saffraan glow achter het wordmark */}
      <div style={{
        position: 'absolute',
        width: 320,
        height: 320,
        left: '50%',
        top: '46%',
        transform: 'translate(-50%,-50%)',
        background: `radial-gradient(circle, ${ACCENT_HEX}55 0%, transparent 60%)`,
        filter: 'blur(40px)',
        pointerEvents: 'none',
      }}/>

      {/* Chiaroscuro onderaan — placeholder food vignette */}
      <div style={{
        position: 'absolute',
        left: 0, right: 0, bottom: 0,
        height: '40%',
        background:
          'linear-gradient(to top, #0c1424 0%, transparent 100%), ' +
          'radial-gradient(80% 60% at 30% 95%, #3d4a6e 0%, transparent 70%), ' +
          'radial-gradient(60% 50% at 75% 90%, #2a3658 0%, transparent 70%)',
        pointerEvents: 'none',
      }}/>

      {/* Ghost 'm' in rechteronderhoek */}
      <div style={{
        position: 'absolute',
        right: -30,
        bottom: 200,
        fontFamily: 'var(--mm-serif)',
        fontSize: 240,
        fontWeight: 300,
        fontStyle: 'italic',
        fontVariationSettings: "'opsz' 144, 'SOFT' 80",
        color: 'rgba(255,255,255,0.025)',
        lineHeight: 0.8,
        letterSpacing: '-0.04em',
        pointerEvents: 'none',
        userSelect: 'none',
      }}>m</div>

      {/* Eyebrow rij bovenaan */}
      <div style={{
        padding: '24px 28px 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative',
        zIndex: 2,
      }}>
        <span className="mm-eyebrow" style={{ opacity: 0.6 }}>v1.0</span>
        <span className="mm-eyebrow" style={{ color: ACCENT }}>Welkom terug</span>
      </div>

      {/* Gecentreerd merk */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 32px',
        position: 'relative',
        zIndex: 2,
      }}>
        <MMSymbol variant="sprout" size={56} color="var(--mm-bone)" accent={ACCENT_HEX}/>

        <h1 style={{
          fontFamily: 'var(--mm-serif)',
          fontWeight: 320,
          fontVariationSettings: "'opsz' 144, 'SOFT' 50",
          fontSize: 64,
          lineHeight: 0.9,
          letterSpacing: '-0.035em',
          margin: '28px 0 0',
          color: 'var(--mm-bone)',
          textAlign: 'center',
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
          color: 'rgba(239,229,210,0.65)',
          textAlign: 'center',
          maxWidth: 260,
          marginTop: 18,
        }}>
          Spreek je lijst in.<br/>
          Loop op route. Mis geen bonus.
        </p>
      </div>

      {/* Onderste CTA's */}
      <div style={{
        padding: '0 28px 32px',
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
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
            boxShadow: `0 14px 32px -10px ${ACCENT_HEX}, 0 0 0 1px rgba(0,0,0,0.08) inset`,
          }}
        >
          Mijn boodschappenlijst openen
        </button>

        <button
          onClick={onNewList}
          style={{
            background: 'transparent',
            color: 'var(--mm-bone)',
            border: '1px solid rgba(239,229,210,0.18)',
            padding: '15px 24px',
            borderRadius: 'var(--mm-r-pill)',
            fontFamily: 'var(--mm-sans)',
            fontWeight: 500,
            fontSize: 14,
            cursor: 'pointer',
            opacity: 0.85,
          }}
        >
          Nieuw lijstje beginnen
        </button>
      </div>
    </div>
  );
}
