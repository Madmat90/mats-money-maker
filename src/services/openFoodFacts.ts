// openFoodFacts.ts
// Haalt productnaam op via Open Food Facts (gratis, geen API-key nodig).
// Probeert eerst de Nederlandse naam, dan de generieke naam.

const BASE = 'https://world.openfoodfacts.org/api/v2/product';

export async function lookupBarcode(ean: string): Promise<string | null> {
  try {
    const res = await fetch(
      `${BASE}/${ean}?fields=product_name,product_name_nl`,
      { signal: AbortSignal.timeout(6_000) },
    );
    if (!res.ok) return null;

    const data = await res.json() as {
      status:   number;
      product?: { product_name_nl?: string; product_name?: string };
    };

    if (data.status !== 1 || !data.product) return null;
    return data.product.product_name_nl || data.product.product_name || null;
  } catch {
    return null;
  }
}
