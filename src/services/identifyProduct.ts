// identifyProduct.ts
// Vangt een frame van een actief <video> element en stuurt het naar Gemini Vision.
// Detecteert lege/zwarte frames en probeert max 5x opnieuw.

const API_URL =
  (import.meta.env.VITE_DEALS_API_URL as string | undefined) ??
  'http://localhost:3008';

/**
 * Controleer of een canvas-frame bruikbare content heeft (niet leeg/zwart).
 * Samplet een strook pixels door het midden.
 */
function frameHasContent(ctx: CanvasRenderingContext2D, w: number, h: number): boolean {
  // Strook van 1px hoogte door het midden, volle breedte
  const { data } = ctx.getImageData(0, Math.floor(h / 2), w, 1);
  let bright = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] > 20 || data[i + 1] > 20 || data[i + 2] > 20) bright++;
  }
  // Minstens 10% van de pixels moet niet-zwart zijn
  return bright > w * 0.1;
}

export async function identifyProductFromVideo(
  videoEl: HTMLVideoElement,
): Promise<string | null> {
  const srcW = videoEl.videoWidth  || 640;
  const srcH = videoEl.videoHeight || 480;
  const scale = Math.min(1, 640 / srcW);
  const w = Math.round(srcW * scale);
  const h = Math.round(srcH * scale);

  // Probeer max 5x een niet-leeg frame te vangen
  let base64: string | null = null;

  for (let attempt = 0; attempt < 5; attempt++) {
    if (attempt > 0) await new Promise(r => setTimeout(r, 300));

    const canvas = document.createElement('canvas');
    canvas.width  = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(videoEl, 0, 0, w, h);

    if (frameHasContent(ctx, w, h) || attempt === 4) {
      base64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1] ?? null;
      break;
    }
    // Leeg frame — wacht kort en probeer opnieuw
  }

  if (!base64) return null;

  const res = await fetch(`${API_URL}/identify-image`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ image: base64 }),
    signal:  AbortSignal.timeout(45_000),
  });

  if (!res.ok) return null;
  const data = await res.json() as { name?: string | null };
  return data.name ?? null;
}
