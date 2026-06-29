# Auth Race Condition Audit (Phase 3, Step 1)

## Confirmed root cause

`src/components/auth/FirebaseAuthProvider.tsx` lines 190-191 call
`syncCart()` and `syncWishlist()` **fire-and-forget** at the end of the
`onAuthStateChanged` handler:

```ts
syncCart();
syncWishlist();
```

Both are async functions (defined as `async (retries = 1) => { ... }` on
lines 168 and 179) that internally `await useCartStore.getState().syncFromServer()`
and `await useWishlistStore.getState().syncFromServer()`. Because the
calls are not awaited:

1. **`setSyncComplete(true)` at line 170 fires BEFORE the syncs finish.**
   Consumers (cart badge, wishlist count) read `syncComplete` and assume
   sync is done, then re-render with stale local state.

2. **The `onAuthStateChanged` async callback resolves before the syncs
   complete.** If the user signs out (or a token refresh fires) in the
   gap, the in-flight `cartApi.list()` / `wishlistApi.list()` calls hit
   401 because `auth().currentUser` is now `null` and `getAuthToken()`
   returns `null`. The 401 retry in `client.ts` then refreshes the token
   and retries — producing the observed 401 flood.

3. **`syncingRef.current` guard (line 115) prevents re-entry per uid, but
   does not prevent the fire-and-forget calls from outliving a sign-out.**

## Token guard gap in `src/lib/api/client.ts`

`getAuthToken()` (lines 26-37) returns `null` when
`auth().currentUser` is `null` and then `sendRequest` fires the request
with no `Authorization` header — the backend returns 401. There is no
gate that *waits* for auth to be ready before firing; the request just
fires immediately.

## Fix plan (Step 2)

1. In `FirebaseAuthProvider.tsx`, change lines 190-191 to:
   ```ts
   await syncCart();
   await syncWishlist();
   ```
   and move `setSyncComplete(true)` to AFTER both awaits so the flag is
   accurate. Wrap the syncs in try/catch so a sync failure does not block
   the auth flow (the user is still logged in; only the cart/wishlist
   server-state failed to load).

2. (Step 3) Add a token-ready gate in `client.ts` so `apiRequest` does
   not fire while Firebase auth is still initializing. This is the
   defense-in-depth fix — the provider-level await handles the common
   case, but other call sites (e.g. components that call `apiRequest`
   directly on mount) still need the guard.

## Files touched in this audit

- `src/components/auth/FirebaseAuthProvider.tsx` (lines 168-191)
- `src/lib/api/client.ts` (lines 26-37, 49-58)
- `src/store/useCartStore.ts` (syncFromServer, lines 193+)
- `src/store/useWishlistStore.ts` (syncFromServer, lines 110+)
