/**
 * Coercizione delle prop MDX: i meta dei fence (```py live maxLines=5```)
 * arrivano come stringhe o boolean impliciti. Condiviso da PyRunner e
 * SQLRunner.
 */

export function coerceBool(v: unknown): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') return v === '' || v === 'true';
  return false;
}

export function coerceNumber(v: unknown, fallback: number): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}
