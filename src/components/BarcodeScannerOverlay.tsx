// BarcodeScannerOverlay.tsx
// Fullscreen camera-overlay met barcode-detectie en Open Food Facts lookup.

import { useEffect, useRef, useState } from 'react';
import { useBarcodeScanner }         from '../hooks/useBarcodeScanner';
import { lookupBarcode }             from '../services/openFoodFacts';
import { identifyProductFromVideo }  from '../services/identifyProduct';

const ACCENT = '#f08a3e';

type Phase =
  | { kind: 'scanning' }               // barcode-modus: actief scannen
  | { kind: 'ai-ready' }               // AI-modus: camera warm, wacht op tik
  | { kind: 'looking';    ean: string } // barcode gevonden, lookup bezig
  | { kind: 'ai-scanning' }            // AI-frame verstuurd, wacht op antwoord
  | { kind: 'confirm';    ean: string; name: string; source?: 'barcode' | 'ai' }
  | { kind: 'notFound';   ean: string }
  | { kind: 'error';      msg: string };

interface Props {
  onAdd:        (name: string) => void;
  onClose:      () => void;
  initialMode?: 'barcode' | 'ai';
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

export function BarcodeScannerOverlay({ onAdd, onClose, initialMode = 'barcode' }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [phase,    setPhase]    = useState<Phase>(
    initialMode === 'ai' ? { kind: 'ai-ready' } : { kind: 'scanning' }
  );
  const [torchOn,  setTorchOn]  = useState(false);
  const [torchAvail, setTorchAvail] = useState(true); // optimistisch; false na eerste mislukte poging
  const { openCamera, startDetecting, stopCamera, setTorch, isSupported } = useBarcodeScanner();

  // ── Barcode detectie ────────────────────────────────────────────────────
  function runDetect(videoEl: HTMLVideoElement) {
    startDetecting(videoEl, async ean => {
      setPhase({ kind: 'looking', ean });
      const name = await lookupBarcode(ean);
      setPhase(name ? { kind: 'confirm', ean, name } : { kind: 'notFound', ean });
    });
  }

  // ── Zaklamp helpers ─────────────────────────────────────────────────────
  async function enableTorch() {
    const ok = await setTorch(true);
    if (ok) { setTorchOn(true); }
    else    { setTorchAvail(false); }
  }

  async function disableTorch() {
    await setTorch(false);
    setTorchOn(false);
  }

  async function toggleTorch() {
    if (torchOn) { await disableTorch(); }
    else         { await enableTorch(); }
  }

  // ── AI herkenning ────────────────────────────────────────────────────────
  async function runAIScan(videoEl: HTMLVideoElement) {
    setPhase({ kind: 'ai-scanning' });

    // Zaklamp aan — max 1,5s wachten; sommige apparaten hangen op applyConstraints
    await Promise.race([
      enableTorch(),
      new Promise<void>(resolve => setTimeout(resolve, 1500)),
    ]);

    // Zorg dat de video-stream daadwerkelijk frames levert
    await new Promise<void>(resolve => {
      if (videoEl.videoWidth > 0 && videoEl.readyState >= 2) {
        resolve();
        return;
      }
      const onPlaying = () => {
        videoEl.removeEventListener('playing', onPlaying);
        videoEl.removeEventListener('loadeddata', onPlaying);
        resolve();
      };
      videoEl.addEventListener('playing',    onPlaying);
      videoEl.addEventListener('loadeddata', onPlaying);
      setTimeout(resolve, 3000);
    });

    try {
      const name = await identifyProductFromVideo(videoEl);
      await disableTorch();
      if (name) {
        setPhase({ kind: 'confirm', ean: '', name, source: 'ai' });
      } else {
        setPhase({ kind: 'notFound', ean: '' });
      }
    } catch {
      await disableTorch();
      setPhase({ kind: 'notFound', ean: '' });
    }
  }

  // ── Camera opstarten ────────────────────────────────────────────────────
  useEffect(() => {
    if (initialMode === 'barcode' && !isSupported) {
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
      if (initialMode === 'ai') {
        // Camera open: toon klaar-scherm, gebruiker kiest zelf het moment
        setPhase({ kind: 'ai-ready' });
      } else {
        setPhase({ kind: 'scanning' });
        runDetect(videoEl);
      }
    });

    return () => stopCamera();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handlers ────────────────────────────────────────────────────────────
  async function handleAIScan() {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    await runAIScan(videoEl);
  }

  function handleConfirm(name: string) {
    stopCamera();
    onAdd(name);
    onClose();
  }

  function handleRetry() {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    if (initialMode === 'ai') {
      setPhase({ kind: 'ai-ready' });
    } else {
      setPhase({ kind: 'scanning' });
      runDetect(videoEl);
    }
  }

  const noCamera   = phase.kind === 'error';
  const isAIMode   = initialMode === 'ai';
  const vfSize     = isAIMode ? 240 : 260;
  const vfHeight   = isAIMode ? 240 : 160;
  const vfTranslate = isAIMode ? 'translate(-50%, -60%)' : 'translate(-50%, -65%)';

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

      {/* Zaklamp-knop — linksboven, alleen als camera actief en apparaat ondersteunt het */}
      {!noCamera && torchAvail && (
        <button
          onClick={toggleTorch}
          aria-label={torchOn ? 'Zaklamp uit' : 'Zaklamp aan'}
          style={{
            position: 'absolute', top: 20, left: 20,
            width: 40, height: 40, borderRadius: 99,
            background: torchOn ? 'rgba(240,138,62,0.85)' : 'rgba(0,0,0,0.55)',
            border: '1px solid rgba(255,255,255,0.25)',
            cursor: 'pointer', zIndex: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {/* Bliksemschicht SVG */}
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M10.5 2L4 10h5.5L7 16l7-9h-5L10.5 2Z"
                  fill={torchOn ? '#1a2540' : '#fff'}
                  stroke={torchOn ? '#1a2540' : '#fff'}
                  strokeWidth="0.5" strokeLinejoin="round"/>
          </svg>
        </button>
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

      {/* ── Viewfinder ── */}
      {!noCamera && (
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: vfTranslate,
          width: vfSize, height: vfHeight,
        }}>
          <Corner pos="tl"/>
          <Corner pos="tr"/>
          <Corner pos="bl"/>
          <Corner pos="br"/>

          {/* Scanlijn — barcode-modus */}
          {phase.kind === 'scanning' && (
            <div style={{
              position: 'absolute', left: 6, right: 6, height: 2,
              background: ACCENT, borderRadius: 2,
              animation: 'mmScanLine 1.8s ease-in-out infinite',
            }}/>
          )}

          {/* Sluiter-knop in viewfinder — AI klaar-state */}
          {phase.kind === 'ai-ready' && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <button
                onClick={handleAIScan}
                aria-label="Maak foto voor AI-herkenning"
                style={{
                  width: 64, height: 64, borderRadius: 99,
                  background: 'rgba(255,255,255,0.92)',
                  border: '4px solid rgba(255,255,255,0.5)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28,
                }}
              >✦</button>
            </div>
          )}

          {/* Pulserend icoon — AI bezig */}
          {phase.kind === 'ai-scanning' && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{
                fontSize: 40, color: '#fff', opacity: 0.85,
                animation: 'mmPulse 1.2s ease-out infinite',
              }}>✦</span>
            </div>
          )}

          {/* Groen kader bij barcode-treffer */}
          {(phase.kind === 'looking' || (phase.kind === 'confirm' && !isAIMode)) && (
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

        {/* Barcode: actief scannen */}
        {phase.kind === 'scanning' && (
          <>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--mm-ink)' }}>
              Richt op de barcode
            </p>
            <p style={{ margin: 0, fontSize: 13.5, color: 'rgba(19,28,46,0.5)', lineHeight: 1.5 }}>
              Houd de barcode stil in het kader. EAN-13 en EAN-8 worden herkend.
            </p>
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

        {/* AI-modus: klaar, wacht op tik */}
        {phase.kind === 'ai-ready' && (
          <>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--mm-ink)' }}>
              Richt op het product
            </p>
            <p style={{ margin: 0, fontSize: 13.5, color: 'rgba(19,28,46,0.5)', lineHeight: 1.5 }}>
              Zorg dat het product goed zichtbaar is in het kader, tik dan op ✦ om te scannen.
            </p>
          </>
        )}

        {/* Barcode gevonden, lookup loopt */}
        {phase.kind === 'looking' && (
          <p style={{ margin: 0, fontSize: 15, color: 'var(--mm-ink)' }}>
            Barcode gevonden, product opzoeken…
          </p>
        )}

        {/* AI bezig */}
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

        {/* Bevestiging */}
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

        {/* Niet gevonden */}
        {phase.kind === 'notFound' && (
          <>
            <div>
              <p style={{
                margin: '0 0 5px',
                fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: 'rgba(19,28,46,0.45)',
              }}>Niet gevonden</p>
              <p style={{ margin: 0, fontSize: 14, color: 'rgba(19,28,46,0.6)', lineHeight: 1.5 }}>
                {isAIMode
                  ? 'Product niet herkend. Probeer beter licht of richt de camera dichter op het product.'
                  : <>Barcode <span style={{ fontFamily: 'var(--mm-mono)', fontSize: 13 }}>{phase.ean}</span> staat niet in de database.</>
                }
              </p>
            </div>
            <button
              onClick={handleRetry}
              style={{
                padding: '14px 0', borderRadius: 'var(--mm-r-pill)',
                background: isAIMode ? 'var(--mm-navy)' : 'var(--mm-cream)',
                color: isAIMode ? 'var(--mm-bone)' : 'var(--mm-ink)',
                border: 'none',
                fontFamily: 'var(--mm-sans)', fontSize: 14, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {isAIMode ? <><span>✦</span> Opnieuw proberen</> : 'Opnieuw scannen'}
            </button>
          </>
        )}

        {/* Fout */}
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
