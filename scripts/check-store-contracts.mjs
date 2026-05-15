import { readFileSync } from "node:fs";

const checks = [
  ["src/store/useCartStore.ts", ["addItem", "removeItem", "updateQuantity", "clearCart", "getSubtotal", "persist"]],
  ["src/store/useWishlistStore.ts", ["toggleItem", "removeItem", "isInWishlist", "persist"]],
  ["src/store/useCompareStore.ts", ["addItem", "removeItem", "clear", "isInCompare", "persist"]],
  ["src/store/useRecentlyViewedStore.ts", ["addItem", "clear", "persist"]],
  ["src/store/useAuthStore.ts", ["login", "logout", "role"]],
];

const failures = [];
for (const [file, needles] of checks) {
  const text = readFileSync(file, "utf8");
  for (const needle of needles) {
    if (!text.includes(needle)) failures.push(`${file} missing ${needle}`);
  }
}
if (failures.length) {
  console.error("[FAIL] Store contract checks failed:");
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}
console.log(`[OK] ${checks.length} Zustand store contracts checked.`);
