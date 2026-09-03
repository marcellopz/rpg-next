/** True when two ISO timestamps refer to the same instant (Z vs +00:00, etc.). */
export function sameUpdatedAt(
  a: string | null | undefined,
  b: string | null | undefined
): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  const ta = Date.parse(a);
  const tb = Date.parse(b);
  if (Number.isNaN(ta) || Number.isNaN(tb)) return false;
  return ta === tb;
}

/** Deep equality for JSON values; object key order does not matter (jsonb). */
export function jsonContentEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((value, index) => jsonContentEqual(value, b[index]));
  }
  if (typeof a === "object" && typeof b === "object") {
    const ao = a as Record<string, unknown>;
    const bo = b as Record<string, unknown>;
    const keys = Object.keys(ao);
    if (keys.length !== Object.keys(bo).length) return false;
    return keys.every((key) => jsonContentEqual(ao[key], bo[key]));
  }
  return false;
}
