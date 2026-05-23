// useSpeechRecognition.ts
// Wikkelt de Web Speech API (SpeechRecognition / webkitSpeechRecognition).
// Werkt op Android Chrome en Desktop Chrome. Firefox/Safari: isSupported = false.
//
// Fix: abort + null vorige instantie voor we een nieuwe starten.
// Hierdoor werkt de opname ook de tweede, derde, ... keer zonder refresh.

import { useState, useRef, useCallback } from 'react';

export interface SpeechHook {
  isListening:    boolean;
  interim:        string;       // lopend transcript terwijl de gebruiker spreekt
  isSupported:    boolean;
  error:          string | null;
  startListening: (onFinal: (transcript: string) => void) => void;
  stopListening:  () => void;
}

export function useSpeechRecognition(): SpeechHook {
  const [isListening, setIsListening] = useState(false);
  const [interim,     setInterim]     = useState('');
  const [error,       setError]       = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recRef = useRef<any>(null);

  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  /** Ruim de huidige instantie op zonder fouten te gooien. */
  const abortCurrent = useCallback(() => {
    if (recRef.current) {
      try { recRef.current.abort(); } catch { /* genegeerd */ }
      recRef.current = null;
    }
  }, []);

  const startListening = useCallback(
    (onFinal: (transcript: string) => void) => {
      if (!isSupported) {
        setError('Spraakherkenning niet beschikbaar in deze browser.');
        return;
      }

      // Stop altijd de vorige instantie voor we een nieuwe maken.
      // Dit lost het "tweede keer werkt niet" probleem op in Chrome Android.
      abortCurrent();
      setIsListening(false);
      setInterim('');
      setError(null);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
      const rec = new SR();

      rec.lang            = 'nl-NL';
      rec.continuous      = false;
      rec.interimResults  = true;
      rec.maxAlternatives = 1;

      // Voorkom dat onFinal meerdere keren wordt aangeroepen per sessie.
      let finalHandled = false;

      rec.onstart = () => {
        setIsListening(true);
        setInterim('');
        setError(null);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rec.onresult = (e: any) => {
        let fin = '', tmp = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) fin += e.results[i][0].transcript;
          else                      tmp += e.results[i][0].transcript;
        }
        setInterim(tmp || fin);
        if (fin && !finalHandled) {
          finalHandled = true;
          onFinal(fin.trim());
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rec.onerror = (e: any) => {
        // 'aborted' is verwacht als wij zelf stoppen — geen foutmelding tonen.
        if (e.error === 'aborted') {
          setIsListening(false);
          setInterim('');
          return;
        }
        const msg =
          e.error === 'no-speech'   ? 'Niets gehoord — probeer opnieuw.' :
          e.error === 'network'     ? 'Netwerkfout — werkt het best op Android Chrome.' :
          e.error === 'not-allowed' ? 'Microfoon geblokkeerd — geef toestemming in je browser.' :
          `Spraakfout: ${e.error}`;
        setError(msg);
        setIsListening(false);
        setInterim('');
        recRef.current = null;
      };

      rec.onend = () => {
        setIsListening(false);
        setInterim('');
        recRef.current = null;   // vrij voor de volgende sessie
      };

      recRef.current = rec;

      try {
        rec.start();
      } catch {
        setError('Kon opname niet starten — probeer opnieuw.');
        setIsListening(false);
        recRef.current = null;
      }
    },
    [isSupported, abortCurrent],
  );

  const stopListening = useCallback(() => {
    try { recRef.current?.stop(); } catch { /* genegeerd */ }
    recRef.current = null;
  }, []);

  return { isListening, interim, isSupported, error, startListening, stopListening };
}
