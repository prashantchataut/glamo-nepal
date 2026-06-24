#!/usr/bin/env bash
set -euo pipefail

fail() {
  echo "[FAIL] $1" >&2
  exit 1
}

node scripts/check-content.mjs
node scripts/check-routes.mjs
node scripts/check-local-imports.mjs
node scripts/check-smoke-routes.mjs
node scripts/check-store-contracts.mjs
node scripts/check-product-data.mjs
node scripts/check-a11y-source.mjs
node scripts/check-env-example.cjs
node scripts/check-performance-source.mjs

if [[ -d "src/app/(auth)" ]]; then
  fail "Legacy src/app/(auth) route group still exists and can reintroduce duplicate /login routes"
fi

required_files=(
  src/middleware.ts
  src/app/not-found.tsx
  src/app/sitemap.ts
  src/app/robots.ts
  src/app/account/layout.tsx
  src/app/account/profile/page.tsx
  src/app/account/password/page.tsx
  src/app/account/orders/[id]/page.tsx
  src/app/admin/layout.tsx
  src/app/\(public\)/collections/page.tsx
  src/app/\(public\)/collections/[slug]/page.tsx
  src/app/\(public\)/routines/page.tsx
  src/app/\(public\)/routines/[slug]/page.tsx
  src/app/\(public\)/brands/page.tsx
  src/app/\(public\)/brands/[slug]/page.tsx
  src/components/legal/LegalLayout.tsx
  src/lib/api/client.ts
  src/lib/api/checkout.ts
  src/lib/api/customer.ts
  src/lib/api/auth.ts
  src/lib/api/orders.ts
  src/lib/api/admin.ts
  src/lib/api/routines.ts
  src/lib/analytics.ts
  src/lib/delivery.ts
  src/lib/env.ts
  src/lib/collections.ts
  src/lib/mock/inventory.ts
  src/lib/mock/bundles.ts
  src/lib/brands.ts
  src/lib/search.ts
  src/lib/product-safety.ts
  docs/PRODUCT_DATA_GUIDE.md
  docs/PRODUCTION_PROGRESS.md
  DEPLOYMENT_CHECKLIST.md
)

for file in "${required_files[@]}"; do
  [[ -f "$file" ]] || fail "Missing $file"
done

echo "[OK] static GLAMO frontend checks passed"
