// useSpeechRecognition.ts
// Wikkelt de Web Speech API (SpeechRecognition / webkitSpeechRecognition).
// Werkt op Android Chrome en Desktop Chrome. Firefox/Safari: isSupported = false.

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

  const startListening = useCallback(
    (onFinal: (transcript: string) => void) => {
      if (!isSupported) {
        setError('Spraakherkenning niet beschikbaar in deze browser.');
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
      const rec = new SR();

      rec.lang            = 'nl-NL';
      rec.continuous      = false;
      rec.interimResults  = true;
      rec.maxAlternatives = 1;

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
        if (fin) onFinal(fin.trim());
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rec.onerror = (e: any) => {
        const msg = e.error === 'no-speech'
          ? 'Niets gehoord. Probeer opnieuw.'
          : `Spraakfout: ${e.error}`;
        setError(msg);
        setIsListening(false);
        setInterim('');
      };

      rec.onend = () => {
        setIsListening(false);
        setInterim('');
      };

      recRef.current = rec;
      rec.start();
    },
    [isSupported],
  );

  const stopListening = useCallback(() => {
    recRef.current?.stop();
  }, []);

  return { isListening, interim, isSupported, error, startListening, stopListening };
}
