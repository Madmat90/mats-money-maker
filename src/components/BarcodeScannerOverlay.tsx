// BarcodeScannerOverlay.tsx
// Fullscreen camera-overlay met barcode-detectie en Open Food Facts lookup.

import { useEffect, useRef, useState } from 'react';
import { useBarcodeScanner }         from '../hooks/useBarcodeScanner';
import { lookupBarcode }             from '../services/openFoodFacts';
import { identifyProductFromVideo }  from '../services/identifyProduct';

const ACCENT = '#f08a3e';

type Phase =
  | { kind: 'scanning' }
  | { kind: 'looking';     ean: string }
  | { kind: 'ai-scanning' }
  | { kind: 'confirm';     ean: string; name: string; source?: 'barcode' | 'ai' }
  | { kind: 'notFound';    ean: string }
  | { kind: 'error';       msg: string };

interface Props {
  onAdd:   (name: string) => void;
  onClose: () => void;
}

// ── Hoekmarkering viewfinder ──────────────────────────────────────────────
function Corner({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  const size = 28;
  const t = pos.startsWith('t') ? 0   : undefined;
  const b = pos.startsWith('b') ? 0   : undefined;
  const l = pos.endsWith('l')   ? 0   : undefined;
  const r = pos.endsWith('r')   ? 0   : undefined;
  return (
    <div style={{
      position: 'absolute',
      top: t, bottom: b, left: l, right: r,
      width: size, height: size,
      borderTop:    pos.startsWith('t') ? '3px solid #fff' : undefined,
      borderBottom: pos.startsWith('b') ? '3px solid #fff' : undefined,
      borderLeft:   pos.endsWith('l')   ? '3px solid #fff' : undefined,
      borderRight:  pos.endsWith('r')   ? '3px solid #fff' : undefined,
      borderRadius:
        pos === 'tl' ? '4px 0 0 0' :
        pos === 'tr' ? '0 4px 0 0' :
        pos === 'bl' ? '0 0 0 4px' : '0 0 4px 0',
    }}/>
  );
}

export function BarcodeScannerOverlay({ onAdd, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [phase,  setPhase] = useState<Phase>({ kind: 'scanning' });
  const { openCamera, startDetecting, stopCamera, isSupported } = useBarcodeScanner();

  // Herstart detectie na notFound / confirm → opnieuw scannen
  function runDetect(videoEl: HTMLVideoElement) {
    startDetecting(videoEl, async ean => {
      setPhase({ kind: 'looking', ean });
      const name = await lookupBarcode(ean);
      setPhase(name ? { kind: 'confirm', ean, name } : { kind: 'notFound', ean });
    });
  }

  useEffect(() => {
    if (!isSupported) {
      setPhase({ kind: 'error', msg: 'Barcode-scanner niet beschikbaar in deze browser.\nGebruik Chrome (Android) of Safari 17+.' });
      return;
    }
    const videoEl = videoRef.current;
    if (!videoEl) return;

    openCamera(videoEl).then(ok => {
      if (!ok) {
        setPhase({ kind: 'error', msg: 'Geen toegang tot camera.\nControleer de cameramachtiging in je browserinstellingen.' });
        return;
      }
      runDetect(videoEl);
    });

    return () => stopCamera();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAIScan() {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    setPhase({ kind: 'ai-scanning' });
    try {
      const name = await identifyProductFromVideo(videoEl);
      if (name) {
        setPhase({ kind: 'confirm', ean: '', name, source: 'ai' });
      } else {
        setPhase({ kind: 'notFound', ean: '' });
      }
    } catch {
      setPhase({ kind: 'notFound', ean: '' });
    }
  }

  function handleConfirm(name: string) {
    stopCamera();
    onAdd(name);
    onClose();
  }

  function handleRetry() {
    setPhase({ kind: 'scanning' });
    const videoEl = videoRef.current;
    if (videoEl) runDetect(videoEl);
  }

  const noCamera = phase.kind === 'error';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 400,
      background: '#000',
      fontFamily: 'var(--mm-sans)',
    }}>

      {/* Camera feed */}
      <video
        ref={videoRef}
        playsInline
        muted
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
          opacity: noCamera ? 0 : 1,
        }}
      />

      {/* Donkere vignette laag */}
      {!noCamera && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.4)',
        }}/>
      )}

      {/* Sluitknop */}
      <button
        onClick={() => { stopCamera(); onClose(); }}
        aria-label="Scanner sluiten"
        style={{
          position: 'absolute', top: 20, right: 20,
          width: 40, height: 40, borderRadius: 99,
          background: 'rgba(0,0,0,0.55)',
          border: '1px solid rgba(255,255,255,0.25)',
          color: '#fff', fontSize: 22, lineHeight: 1,
          cursor: 'pointer', zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >×</button>

      {/* Viewfinder — alleen als camera actief */}
      {!noCamera && (
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -65%)',
          width: 260, height: 160,
        }}>
          <Corner pos="tl"/>
          <Corner pos="tr"/>
          <Corner pos="bl"/>
          <Corner pos="br"/>
          {/* Scanlijn animatie */}
          {phase.kind === 'scanning' && (
            <div style={{
              position: 'absolute', left: 6, right: 6, height: 2,
              background: ACCENT, borderRadius: 2,
              animation: 'mmScanLine 1.8s ease-in-out infinite',
            }}/>
          )}
          {/* Groen vinkje bij treffer */}
          {(phase.kind === 'looking' || phase.kind === 'confirm') && (
            <div style={{
              position: 'absolute', inset: 0,
              border: '2px solid #4caf50',
              borderRadius: 6,
            }}/>
          )}
        </div>
      )}

      {/* ── Bottom sheet ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'var(--mm-paper)',
        borderRadius: '22px 22px 0 0',
        padding: '22px 22px 52px',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>

        {phase.kind === 'scanning' && (
          <>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--mm-ink)' }}>
              Richt op de barcode
            </p>
            <p style={{ margin: 0, fontSize: 13.5, color: 'rgba(19,28,46,0.5)', lineHeight: 1.5 }}>
              Houd de barcode stil in het kader. EAN-13 en EAN-8 worden herkend.
            </p>
            {/* Scheidingslijn */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(19,28,46,0.1)' }}/>
              <span style={{ fontSize: 11, color: 'rgba(19,28,46,0.35)', whiteSpace: 'nowrap' }}>
                geen barcode?
              </span>
              <div style={{ flex: 1, height: 1, background: 'rgba(19,28,46,0.1)' }}/>
            </div>
            <button
              onClick={handleAIScan}
              style={{
                padding: '14px 0',
                borderRadius: 'var(--mm-r-pill)',
                background: 'var(--mm-navy)', color: 'var(--mm-bone)', border: 'none',
                fontFamily: 'var(--mm-sans)', fontWeight: 600, fontSize: 15,
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 8,
              }}
            >
              <span style={{ fontSize: 18 }}>✦</span> Herken product met AI
            </button>
          </>
        )}

        {phase.kind === 'looking' && (
          <p style={{ margin: 0, fontSize: 15, color: 'var(--mm-ink)' }}>
            Barcode gevonden — product opzoeken…
          </p>
        )}

        {phase.kind === 'ai-scanning' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 99, flexShrink: 0,
              background: 'var(--mm-navy)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 18, animation: 'mmPulse 1.2s ease-out infinite' }}>✦</span>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--mm-ink)' }}>
                AI herkent product…
              </div>
              <div style={{ fontSize: 12, color: 'rgba(19,28,46,0.5)', marginTop: 2 }}>
                Even geduld
              </div>
            </div>
          </div>
        )}

        {phase.kind === 'confirm' && (
          <>
            <div>
              <p style={{
                margin: '0 0 5px',
                fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: 'rgba(19,28,46,0.45)',
              }}>{phase.source === 'ai' ? '✦ Herkend door AI' : 'Gevonden'}</p>
              <p style={{ margin: 0, fontSize: 19, fontWeight: 600, color: 'var(--mm-ink)' }}>
                {phase.name}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => handleConfirm(phase.name)}
                style={{
                  flex: 1, padding: '15px 0',
                  borderRadius: 'var(--mm-r-pill)',
                  background: ACCENT, color: '#1a2540', border: 'none',
                  fontFamily: 'var(--mm-sans)', fontWeight: 700, fontSize: 15,
                  cursor: 'pointer',
                }}
              >Toevoegen aan lijst</button>
              <button
                onClick={handleRetry}
                style={{
                  padding: '15px 18px',
                  borderRadius: 'var(--mm-r-pill)',
                  background: 'var(--mm-cream)', color: 'var(--mm-ink)', border: 'none',
                  fontFamily: 'var(--mm-sans)', fontSize: 14, cursor: 'pointer',
                }}
              >Opnieuw</button>
            </div>
          </>
        )}

        {phase.kind === 'notFound' && (
          <>
            <div>
              <p style={{
                margin: '0 0 5px',
                fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: 'rgba(19,28,46,0.45)',
              }}>Niet gevonden</p>
              <p style={{ margin: 0, fontSize: 14, color: 'rgba(19,28,46,0.6)', lineHeight: 1.5 }}>
                Barcode <span style={{ fontFamily: 'var(--mm-mono)', fontSize: 13 }}>{phase.ean}</span> staat niet in de database.
              </p>
            </div>
            <button
              onClick={handleRetry}
              style={{
                padding: '14px 0', borderRadius: 'var(--mm-r-pill)',
                background: 'var(--mm-cream)', color: 'var(--mm-ink)', border: 'none',
                fontFamily: 'var(--mm-sans)', fontSize: 14, cursor: 'pointer',
              }}
            >Opnieuw scannen</button>
          </>
        )}

        {phase.kind === 'error' && (
          <p style={{
            margin: 0, fontSize: 14, color: 'var(--mm-ink)',
            lineHeight: 1.6, whiteSpace: 'pre-line',
          }}>
            {phase.msg}
          </p>
        )}
      </div>
    </div>
  );
}
