// identifyProduct.ts
// Stuurt een camera-frame naar de backend die Gemini Vision aanroept.
// Geeft de Nederlandse productnaam terug, of null als herkenning mislukt.

const API_URL =
  (import.meta.env.VITE_DEALS_API_URL as string | undefined) ??
  'http://localhost:3008';

/**
 * Vangt een frame van een actief <video> element, schaalt het naar max 640px
 * breedte (houdt aspect ratio), comprimeert naar JPEG 0.85 en stuurt het
 * als base64 naar de backend.
 */
export async function identifyProductFromVideo(
  videoEl: HTMLVideoElement,
): Promise<string | null> {
  // Frame naar canvas
  const srcW = videoEl.videoWidth  || 640;
  const srcH = videoEl.videoHeight || 480;
  const scale = Math.min(1, 640 / srcW);
  const canvas = document.createElement('canvas');
  canvas.width  = Math.round(srcW * scale);
  canvas.height = Math.round(srcH * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

  // Base64 JPEG (zonder data-URI prefix)
  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
  const base64  = dataUrl.split(',')[1];
  if (!base64) return null;

  const res = await fetch(`${API_URL}/identify-image`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ image: base64 }),
    signal:  AbortSignal.timeout(25_000),
  });

  if (!res.ok) return null;
  const data = await res.json() as { name?: string | null };
  return data.name ?? null;
}
