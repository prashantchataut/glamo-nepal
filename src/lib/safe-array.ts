/**
 * safe-array.ts — Defensive array coercion helpers.
 *
 * Fixes Issue C (".map is not a function") on glamonepal.com by giving every
 * admin component a single, robust way to coerce API responses (which may be
 * arrays, `{ rows: [...] }` envelopes, error objects with `error` keys, or
 * outright `null`/`undefined` when a 403 fires) into an iterable.
 *
 * Why a dedicated file?
 *   - `src/lib/array-safe.ts` already exports `toArray` etc. with a slightly
 *     different signature. `safe-array.ts` is the new canonical name with a
 *     stricter, fully-typed API; `array-safe.ts` re-exports from here so
 *     every existing call site keeps working without a rename sweep.
 *   - Components should import `toArray` / `safeMap` from here and write
 *     `safeMap(apiData, fn)` or `toArray(apiData).map(fn)` instead of the
 *     crashy `(apiData ?? []).map(fn)` pattern.
 *
 * Behavioral contract:
 *   `toArray(x)` returns an array. Always.
 *     - null / undefined        → []
 *     - Array                   → shallow copy (defensive)
 *     - string                  → [string]   (a 1-element string array)
 *     - number / boolean / etc. → [value as unknown]
 *     - object with toArray()   → Array.from(x)
 *     - object with .rows       → toArray(x.rows)        (paginated envelope)
 *     - object with .items      → toArray(x.items)
 *     - object with .data       → toArray(x.data)
 *     - any other plain object  → [x]                    (treat as record)
 *     - Set / Map               → Array.from(x)
 *
 * The function never throws and never returns `null`/`undefined`.
 */

export type SafeArrayInput<T> =
  | T
  | T[]
  | readonly T[]
  | null
  | undefined
  | unknown;

/**
 * Coerce any value into an array. The returned array is always a fresh
 * `T[]` instance, never the input reference, so callers may freely sort,
 * filter, or mutate the result.
 */
export function toArray<T = unknown>(value: SafeArrayInput<T>): T[] {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) return value.slice() as T[];

  // Strings: keep as-is only if explicitly wrapped. Most callers expect a
  // string primitive to become a single-element array so `value.map(...)`
  // operates character-by-character, matching native Array#map semantics.
  if (typeof value === "string") {
    // Surface strings as a single-element array. `String.prototype.map` does
    // not exist, so callers writing `toArray(s).map(fn)` will operate on the
    // string itself — almost always what they meant.
    return [value as unknown as T];
  }

  if (typeof value !== "object") {
    return [value as T];
  }

  // Array-like objects (typed arrays, jQuery collections, etc.).
  if (
    typeof (value as { length?: unknown }).length === "number" &&
    typeof (value as unknown as { [Symbol.iterator]?: unknown })[
      Symbol.iterator
    ] === "function"
  ) {
    try {
      return Array.from(value as ArrayLike<T>);
    } catch {
      return [];
    }
  }

  // Common paginated envelopes used by the API helpers in this codebase.
  if ("rows" in (value as Record<string, unknown>)) {
    return toArray<T>((value as { rows: unknown }).rows);
  }
  if ("items" in (value as Record<string, unknown>)) {
    return toArray<T>((value as { items: unknown }).items);
  }
  if ("data" in (value as Record<string, unknown>)) {
    const inner = (value as { data: unknown }).data;
    if (Array.isArray(inner)) return inner.slice() as T[];
    if (inner !== null && typeof inner === "object") return toArray<T>(inner);
  }

  // Plain object that isn't an envelope — treat as a single record.
  return [value as T];
}

/**
 * Like `toArray` but ensures every element is a string (or `""` if a value
 * is `null` / `undefined`). Useful for tag inputs and slug lists that the
 * admin forms expect as `string[]`.
 */
export function toStringArray(value: unknown): string[] {
  return toArray<unknown>(value).map((v) => {
    if (v === null || v === undefined) return "";
    if (typeof v === "string") return v;
    if (typeof v === "number" || typeof v === "boolean") return String(v);
    try {
      return JSON.stringify(v) ?? "";
    } catch {
      return "";
    }
  });
}

/**
 * Like `toArray` but discards anything that isn't a plain object. Used by
 * components that expect record rows (e.g. product/category lists).
 */
export function toObjectArray<T extends Record<string, unknown>>(
  value: unknown
): T[] {
  return toArray<unknown>(value).filter(
    (v): v is T =>
      v !== null && typeof v === "object" && !Array.isArray(v)
  ) as T[];
}

/**
 * Composed helper: coerce `value` to an array and run `fn` on each element.
 * Equivalent to `toArray(value).map(fn)` but signals intent at the call site.
 */
export function safeMap<T = unknown, R = unknown>(
  value: SafeArrayInput<T>,
  fn: (item: T, index: number) => R
): R[] {
  return toArray<T>(value).map(fn);
}

/**
 * `Array.isArray` is great but loses type narrowing. Use this where you want
 * both runtime safety *and* a typed fallback path.
 */
export function isArrayOf<T>(
  value: unknown,
  guard: (item: unknown) => item is T
): value is T[] {
  if (!Array.isArray(value)) return false;
  for (const item of value) {
    if (!guard(item)) return false;
  }
  return true;
}
