// useBarcodeScanner.ts
// Wikkelt de native BarcodeDetector API + camerastroom.
// Ondersteund in Chrome/Edge (Android + desktop) en Safari 17+.

import { useRef, useState, useCallback } from 'react';

// BarcodeDetector zit nog niet in alle standaard TS-lib versies
declare global {
  class BarcodeDetector {
    constructor(options?: { formats: string[] });
    detect(
      source: HTMLVideoElement | HTMLImageElement | ImageBitmap,
    ): Promise<Array<{ rawValue: string; format: string }>>;
    static getSupportedFormats(): Promise<string[]>;
  }
}

export function useBarcodeScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const streamRef   = useRef<MediaStream | null>(null);
  const rafRef      = useRef<number | null>(null);
  const detectorRef = useRef<InstanceType<typeof BarcodeDetector> | null>(null);

  const isSupported =
    typeof window !== 'undefined' && 'BarcodeDetector' in window;

  /** Open de achtercamera en koppel aan een <video> element. */
  const openCamera = useCallback(async (videoEl: HTMLVideoElement): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width:  { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current  = stream;
      videoEl.srcObject  = stream;
      await videoEl.play();
      setIsScanning(true);
      return true;
    } catch {
      return false;
    }
  }, []);

  /** Start een rAF-lus die elk frame scant. Stopt zodra een code gevonden wordt. */
  const startDetecting = useCallback((
    videoEl:    HTMLVideoElement,
    onDetected: (rawValue: string) => void,
  ) => {
    if (!isSupported) return;

    if (!detectorRef.current) {
      detectorRef.current = new BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'],
      });
    }
    const detector = detectorRef.current;

    const loop = async () => {
      // Wacht tot video geladen is
      if (videoEl.readyState < 2) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      try {
        const codes = await detector.detect(videoEl);
        if (codes.length > 0) {
          onDetected(codes[0].rawValue);
          return; // stop na eerste treffer
        }
      } catch { /* frame overgeslagen */ }
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
  }, [isSupported]);

  /** Zet de zaklamp aan of uit. Geeft false terug als het apparaat dit niet ondersteunt. */
  const setTorch = useCallback(async (on: boolean): Promise<boolean> => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return false;
    try {
      await track.applyConstraints({ advanced: [{ torch: on } as MediaTrackConstraintSet] });
      return true;
    } catch {
      return false;
    }
  }, []);

  /** Stop camera en alle lopende detectie. */
  const stopCamera = useCallback(() => {
    if (rafRef.current)    cancelAnimationFrame(rafRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    streamRef.current  = null;
    rafRef.current     = null;
    setIsScanning(false);
  }, []);

  return { openCamera, startDetecting, stopCamera, setTorch, isScanning, isSupported };
}
