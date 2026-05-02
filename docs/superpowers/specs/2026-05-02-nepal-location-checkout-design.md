# Nepal Location Data & Checkout UX Fix — Design Spec

**Date:** 2026-05-02  
**Scope:** Replace incorrect Nepal location dataset with correct 77-district data, implement cascading Province→District→Municipality dropdowns, fix validation, and improve delivery fee UX.

---

## A) Problem Statement

The checkout form has incorrect Nepal administrative data:
- 7 of 13 "district" entries are actually cities (Biratnagar, Dharan, Birgunj, Janakpur, Pokhara, Butwal, Nepalgunj, Dhangadhi)
- Only 13 delivery rules exist out of Nepal's 77 districts
- Dhangadhi is listed as a district in Sudurpashchim — it's actually a sub-metropolitan city in Kailali district
- No province→district cross-validation in Zod schema
- No municipality dropdown — just free text
- No delivery fee display after district selection

---

## B) Single Source of Truth: `src/lib/nepal-location.ts`

### Data Types

```ts
export type Province = "Koshi" | "Madhesh" | "Bagmati" | "Gandaki" | "Lumbini" | "Karnali" | "Sudurpashchim";

export type District = 
  | "Taplejung" | "Panchthar" | "Ilam" | "Jhapa" | "Morang" | "Sunsari" | "Bhojpur" | "Dhankuta" | "Terhathum" | "Sankhuwasabha"
  | "Siraha" | "Dhanusha" | "Mahottari" | "Sarlahi" | "Rautahat" | "Bara" | "Parsa"
  | "Sindhuli" | "Ramechhap" | "Dolakha" | "Sindhupalchok" | "Kavrepalanchok" | "Nuwakot" | "Rasuwa" | "Dhading" | "Chitwan" | "Makwanpur" | "Kathmandu" | "Lalitpur" | "Bhaktapur"
  | "Gorkha" | "Lamjung" | "Tanahu" | "Kaski" | "Syangja" | "Nawalpur" | "Manang" | "Mustang"
  | "Parasi" | "Rupandehi" | "Kapilvastu" | "Palpa" | "Argakhanchi" | "Gulmi" | "Pyuthan" | "Rolpa" | "Dang" | "Banke" | "Bardiya"
  | "Mugu" | "Humla" | "Jumla" | "Kalikot" | "Dolpa" | "Surkhet" | "Dailekh" | "Jajarkot" | "Rukum West" | "Salyan"
  | "Mugu" | "Bajura" | "Bajhang" | "Darchula" | "Kailali" | "Kanchanpur" | "Achham" | "Doti" | "Dadeldhura" | "Baitadi" | "Bajhang";

export type ServiceLevel = "valley" | "metro" | "standard" | "remote";

export interface Municipality {
  name: string;
  type: "Metropolitan" | "Sub-Metropolitan" | "Municipality" | "Rural Municipality";
}

export interface DistrictInfo {
  name: District;
  province: Province;
  municipalities: Municipality[];
}

export interface DistrictDeliveryRule {
  district: District;
  province: Province;
  codAvailable: boolean;
  fee: number;
  freeDeliveryThreshold: number;
  serviceLevel: ServiceLevel;
  estimatedDays: string;
}

export interface ProvinceDeliveryDefault {
  province: Province;
  codAvailable: boolean;
  fee: number;
  freeDeliveryThreshold: number;
  serviceLevel: ServiceLevel;
  estimatedDays: string;
}
```

### District-to-Province Mapping (77 districts)

```
Koshi (10): Taplejung, Panchthar, Ilam, Jhapa, Morang, Sunsari, Bhojpur, Dhankuta, Terhathum, Sankhuwasabha
Madhesh (8): Siraha, Dhanusha, Mahottari, Sarlahi, Rautahat, Bara, Parsa, Sindhuli
Bagmati (13): Ramechhap, Dolakha, Sindhupalchok, Kavrepalanchok, Nuwakot, Rasuwa, Dhading, Chitwan, Makwanpur, Kathmandu, Lalitpur, Bhaktapur, Sindhuli
Gandaki (8): Gorkha, Lamjung, Tanahu, Kaski, Syangja, Nawalpur, Manang, Mustang
Lumbini (10): Parasi, Rupandehi, Kapilvastu, Palpa, Argakhanchi, Gulmi, Pyuthan, Rolpa, Dang, Banke, Bardiya
Karnali (10): Mugu, Humla, Jumla, Kalikot, Dolpa, Surkhet, Dailekh, Jajarkot, Rukum West, Salyan
Sudurpashchim (9): Bajura, Bajhang, Darchula, Kailali, Kanchanpur, Achham, Doti, Dadeldhura, Baitadi
```

Note: Sindhuli appears in both Madhesh and Bagmati in some classifications. We'll place it in Bagmati per the constitutional schedule. Total: 77.

### Municipality Data

Each district will include its major municipalities. For example:
- Kathmandu: Kathmandu Metropolitan, Kirtipur Municipality, ...
- Kailali: Dhangadhi Sub-Metropolitan, Tikapur Municipality, Attariya Municipality, Godawari Municipality, Bhajani Municipality, Lamki Chuha Municipality, Janaki Rural Municipality, ...
- Morang: Biratnagar Metropolitan, Itahari Sub-Metropolitan, Sundarharaincha Municipality, ...

Every municipality will have a `name` and `type`. The "Other" option will always be available at the end of the list for unlisted areas.

### Helper Functions

```ts
export const PROVINCES: Province[] = [...];
export const DISTRICTS: District[] = [...];
export const DISTRICTS_BY_PROVINCE: Record<Province, District[]> = ...;
export const MUNICIPALITIES_BY_DISTRICT: Record<District, Municipality[]> = ...;
export const DISTRICT_DELIVERY_RULES: DistrictDeliveryRule[] = [...];
export const PROVINCE_DELIVERY_DEFAULTS: ProvinceDeliveryDefault[] = [...];

export function getDistrictsForProvince(province: Province): District[] { ... }
export function getMunicipalitiesForDistrict(district: District): Municipality[] { ... }
export function getDeliveryRule(district: District, province: Province): DistrictDeliveryRule | ProvinceDeliveryDefault { ... }
export function calculateDeliveryFee(subtotal: number, district: District, province: Province): number { ... }
export function getFreeDeliveryProgress(subtotal: number, district: District, province: Province): { threshold: number; remaining: number; percent: number } { ... }
export function isValidProvinceDistrictCombo(province: Province, district: District): boolean { ... }
export function isCodAvailable(district: District, province: Province): boolean { ... }
```

---

## C) Delivery Fee Structure

### Specific District Rules (10-15 entries)

| District | Province | COD | Fee | Free Above | Service | ETA |
|----------|----------|-----|-----|-----------|---------|-----|
| Kathmandu | Bagmati | Yes | 100 | 2,500 | valley | 1-2 days |
| Lalitpur | Bagmati | Yes | 100 | 2,500 | valley | 1-2 days |
| Bhaktapur | Bagmati | Yes | 120 | 2,500 | valley | 1-2 days |
| Chitwan | Bagmati | Yes | 190 | 2,500 | metro | 2-4 days |
| Kaski | Gandaki | Yes | 180 | 2,500 | metro | 2-4 days |
| Rupandehi | Lumbini | Yes | 200 | 2,500 | metro | 2-4 days |
| Morang | Koshi | No | 240 | 2,500 | standard | 3-5 days |
| Parsa | Madhesh | No | 230 | 2,500 | standard | 3-5 days |
| Banke | Lumbini | No | 220 | 2,500 | standard | 3-5 days |
| Kailali | Sudurpashchim | No | 280 | 3,000 | standard | 4-6 days |
| Surkhet | Karnali | No | 320 | 3,500 | remote | 5-8 days |
| Dang | Lumbini | No | 240 | 2,500 | standard | 3-5 days |

### Province-Level Defaults

| Province | COD | Fee | Free Above | Service | ETA |
|----------|-----|-----|-----------|---------|-----|
| Bagmati | Yes | 150 | 2,500 | standard | 2-4 days |
| Gandaki | Yes | 200 | 2,500 | standard | 3-5 days |
| Lumbini | No | 230 | 2,500 | standard | 3-5 days |
| Koshi | No | 250 | 2,500 | standard | 3-5 days |
| Madhesh | No | 230 | 2,500 | standard | 3-5 days |
| Karnali | No | 350 | 4,000 | remote | 5-10 days |
| Sudurpashchim | No | 300 | 3,000 | standard | 4-7 days |

---

## D) Validation Schema Updates

`src/lib/validations/checkout.ts`:

```ts
import { z } from "zod";
import { PROVINCES, DISTRICTS, isValidProvinceDistrictCombo } from "@/lib/nepal-location";

export const checkoutSchema = z.object({
  name: z.string().min(2, "Full name is required"),
  email: z.union([z.string().email("Enter a valid email address"), z.literal("")]),
  phone: z.string().regex(/^(\+977\s?)?9[78]\d{8}$/, "Enter a valid Nepal mobile number"),
  province: z.enum(PROVINCES, { required_error: "Select a province" }),
  district: z.string().min(1, "Select a district"),
  city: z.string().min(1, "City or municipality is required"),
  ward: z.string().min(1, "Ward number is required"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  giftWrap: z.boolean(),
  notes: z.string(),
  payment: z.enum(["Cash on Delivery", "Khalti", "eSewa", "Cards"]),
}).refine(
  (data) => isValidProvinceDistrictCombo(data.province as Province, data.district as District),
  { message: "Selected district does not belong to this province", path: ["district"] }
);
```

The refinement ensures province-district consistency at validation time.

---

## E) Checkout Form UX Changes

### Cascading Dropdowns

1. **Province dropdown**: Populated from `PROVINCES` (7 options)
2. **District dropdown**: Populated from `getDistrictsForProvince(province)` (5-13 options per province). Changes reset district, city, and ward.
3. **City/Municipality dropdown**: Populated from `getMunicipalitiesForDistrict(district)`. Includes an "Other" option at the end that reveals a free-text input.
4. **Ward**: Free-text field (ward numbers vary by municipality)

### Delivery Info Display

After district selection, show below the district dropdown:
- **Delivery fee**: "Delivery: NPR 180" or "FREE delivery" (when above threshold)
- **Estimated days**: "Estimated delivery: 2-4 business days"
- **COD badge**: Green checkmark "Cash on Delivery available" or red X "COD not available"
- **Free delivery progress bar**: Visual progress toward free delivery threshold

### Default Values

- Province defaults to "Bagmati" (most customers)
- District defaults to "Kathmandu"
- City defaults to "Kathmandu"

### Mobile UX

- All dropdowns full-width
- Touch targets ≥ 44px height
- Clear labels above each dropdown
- Error messages appear inline below each field
- Delivery info section has a subtle background to distinguish it from form fields

---

## F) API Contract Updates

`src/lib/api/contracts.ts` — The `Address` interface already uses string types for province/district/city, so no breaking changes. However, we should update the TypeScript types to use the `Province` and `District` union types for better type safety on the client side.

---

## G) Sanity Checks

Runtime assertions in development mode:

```ts
// src/lib/nepal-location-assertions.ts
if (process.env.NODE_ENV === 'development') {
  const totalDistricts = DISTRICTS.length;
  console.assert(totalDistricts === 77, `Expected 77 districts, got ${totalDistricts}`);
  
  // Dhangadhi must NOT be a district
  console.assert(!DISTRICTS.includes('Dhangadhi' as any), 'Dhangadhi is a city in Kailali district, not a district');
  
  // Biratnagar must NOT be a district
  console.assert(!DISTRICTS.includes('Biratnagar' as any), 'Biratnagar is a city in Morang district, not a district');
  
  // Every district maps to exactly one province
  const districtProvinceMap = new Map<string, Province>();
  for (const info of ALL_DISTRICTS) {
    const existing = districtProvinceMap.get(info.name);
    console.assert(!existing || existing === info.province, `District ${info.name} mapped to multiple provinces: ${existing} and ${info.province}`);
    districtProvinceMap.set(info.name, info.province);
  }
  
  // Province names match constitutional names
  console.assert(PROVINCES.length === 7, `Expected 7 provinces, got ${PROVINCES.length}`);
}
```

This file is imported in `nepal-location.ts` and runs at module load time in development.

---

## H) Files Changed

| File | Change |
|------|--------|
| `src/lib/nepal-location.ts` | **NEW** — All 77 districts, 293 municipalities, delivery rules, helper functions |
| `src/lib/nepal-location-assertions.ts` | **NEW** — Development-only sanity checks |
| `src/lib/delivery.ts` | **REWRITE** — Thin wrapper around `nepal-location.ts` functions, keeps backward-compatible exports |
| `src/components/checkout/CheckoutPageClient.tsx` | **MODIFY** — Cascading dropdowns, delivery info display, combo-box for city |
| `src/lib/validations/checkout.ts` | **MODIFY** — Zod schema with province/district refinement |
| `src/components/checkout/CodAvailabilityChecker.tsx` | **MODIFY** — Use `isCodAvailable()` from nepal-location |

---

## I) What Gets Fixed

| Bug | Current | Fixed |
|-----|---------|-------|
| Dhangadhi listed as district | City in Kailali district | Kailali is the district, Dhangadhi is a municipality |
| Biratnagar listed as district | City in Morang district | Morang is the district |
| Only 13 district options | Users can't select their district | All 77 districts available |
| No province-district validation | Invalid combos pass Zod | Refinement prevents invalid combos |
| No municipality dropdown | Free text only | 293 municipalities in cascading dropdown |
| No delivery info display | Fee shown only in order summary | Fee, ETA, COD badge shown after district selection |
| City field has no context | "City" label with no guidance | "City / Municipality" with dropdown + free text fallback |