/**
 * Defensive array helpers.
 *
 * Multiple production crashes have been caused by code that does
 * `(value ?? []).map(...)` when `value` is neither null nor undefined
 * but is also not an array (e.g. `1`, `"foo"`, `{}`).
 *
 * `?? []` only falls back on null/undefined. If the value is a number,
 * string, or object, it gets passed through and `.map` throws
 * "(value ?? []).map is not a function".
 *
 * These helpers always return a real array, no matter what the input is.
 */

/**
 * Coerce any value into an array. Returns the original array if it's already
 * one, otherwise returns an empty array. Optionally filters items by type.
 */
export function toArray<T = unknown>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  return [];
}

/**
 * Coerce any value into an array of strings. Filters out non-string items.
 * Useful for product fields like `benefits`, `ingredients`, `concernTags`
 * that may be stored as a string, object, or array in the database.
 */
export function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string");
  }
  if (typeof value === "string" && value.trim().length > 0) {
    // Treat a JSON-encoded array string as an array.
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter((v): v is string => typeof v === "string");
      }
    } catch {
      // Not JSON - return as single-element array if non-empty.
      return [value];
    }
  }
  return [];
}

/**
 * Coerce any value into an array of objects. Filters out non-object items.
 */
export function toObjectArray<T = Record<string, unknown>>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value.filter(
      (v): v is Record<string, unknown> =>
        v !== null && typeof v === "object" && !Array.isArray(v),
    ) as T[];
  }
  return [];
}

/**
 * Safely call `.map()` on any value. If the value is not an array, returns
 * the fallback (default: []).
 */
export function safeMap<T, R>(
  value: unknown,
  fn: (item: T, index: number) => R,
  fallback: R[] = [],
): R[] {
  if (!Array.isArray(value)) return fallback;
  return value.map(fn);
}
