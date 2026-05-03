# Nepal Location Data & Checkout UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace incorrect Nepal location data with correct 77-district dataset, implement cascading Province→District→Municipality dropdowns, fix validation, and improve delivery fee UX.

**Architecture:** Single source of truth in `src/lib/nepal-location.ts` with all location data, delivery rules, and helpers. `delivery.ts` becomes a backward-compatible thin wrapper. Checkout form gets cascading dropdowns with combo-box for city/municipality. Zod schema gets province/district cross-validation.

**Tech Stack:** TypeScript, Zod, React Hook Form, Next.js, Tailwind CSS, Lucide React icons

---

## File Structure

| File | Responsibility |
|------|---------------|
| `src/lib/nepal-location.ts` | **NEW** — All 77 districts, 293 municipalities, delivery rules, helper functions (single source of truth) |
| `src/lib/nepal-location-assertions.ts` | **NEW** — Dev-mode sanity checks (district count, no city-as-district, province mapping) |
| `src/lib/delivery.ts` | **REWRITE** — Thin wrapper re-exporting from `nepal-location.ts`, keeping backward-compatible API |
| `src/lib/validations/checkout.ts` | **MODIFY** — Zod schema with `z.enum(PROVINCES)`, district refinement, city min(1) |
| `src/components/checkout/CheckoutPageClient.tsx` | **MODIFY** — Cascading dropdowns, municipality combo-box, delivery info display |
| `src/components/checkout/CodAvailabilityChecker.tsx` | **MODIFY** — Use `isCodAvailable()` from `nepal-location.ts` |

---

## Task 1: Create `src/lib/nepal-location.ts`

**Files:**
- Create: `src/lib/nepal-location.ts`

This is the core data file. It contains all types, data, and helper functions.

- [ ] **Step 1: Create the file with all types**

```ts
export type Province = "Koshi" | "Madhesh" | "Bagmati" | "Gandaki" | "Lumbini" | "Karnali" | "Sudurpashchim";

export type District =
  | "Taplejung" | "Panchthar" | "Ilam" | "Jhapa" | "Morang" | "Sunsari"
  | "Bhojpur" | "Dhankuta" | "Terhathum" | "Sankhuwasabha"
  | "Siraha" | "Dhanusha" | "Mahottari" | "Sarlahi" | "Rautahat" | "Bara" | "Parsa"
  | "Sindhuli" | "Ramechhap" | "Dolakha" | "Sindhupalchok" | "Kavrepalanchok"
  | "Nuwakot" | "Rasuwa" | "Dhading" | "Chitwan" | "Makwanpur"
  | "Kathmandu" | "Lalitpur" | "Bhaktapur"
  | "Gorkha" | "Lamjung" | "Tanahu" | "Kaski" | "Syangja" | "Nawalpur"
  | "Manang" | "Mustang"
  | "Parasi" | "Rupandehi" | "Kapilvastu" | "Palpa" | "Argakhanchi"
  | "Gulmi" | "Pyuthan" | "Rolpa" | "Dang" | "Banke" | "Bardiya"
  | "Mugu" | "Humla" | "Jumla" | "Kalikot" | "Dolpa" | "Surkhet"
  | "Dailekh" | "Jajarkot" | "Rukum West" | "Salyan"
  | "Bajura" | "Bajhang" | "Darchula" | "Kailali" | "Kanchanpur"
  | "Achham" | "Doti" | "Dadeldhura" | "Baitadi";

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

- [ ] **Step 2: Add PROVINCES and DISTRICTS constants**

```ts
export const PROVINCES: Province[] = [
  "Koshi", "Madhesh", "Bagmati", "Gandaki", "Lumbini", "Karnali", "Sudurpashchim",
];

export const DISTRICTS: District[] = [
  "Taplejung", "Panchthar", "Ilam", "Jhapa", "Morang", "Sunsari",
  "Bhojpur", "Dhankuta", "Terhathum", "Sankhuwasabha",
  "Siraha", "Dhanusha", "Mahottari", "Sarlahi", "Rautahat", "Bara", "Parsa",
  "Sindhuli", "Ramechhap", "Dolakha", "Sindhupalchok", "Kavrepalanchok",
  "Nuwakot", "Rasuwa", "Dhading", "Chitwan", "Makwanpur",
  "Kathmandu", "Lalitpur", "Bhaktapur",
  "Gorkha", "Lamjung", "Tanahu", "Kaski", "Syangja", "Nawalpur",
  "Manang", "Mustang",
  "Parasi", "Rupandehi", "Kapilvastu", "Palpa", "Argakhanchi",
  "Gulmi", "Pyuthan", "Rolpa", "Dang", "Banke", "Bardiya",
  "Mugu", "Humla", "Jumla", "Kalikot", "Dolpa", "Surkhet",
  "Dailekh", "Jajarkot", "Rukum West", "Salyan",
  "Bajura", "Bajhang", "Darchula", "Kailali", "Kanchanpur",
  "Achham", "Doti", "Dadeldhura", "Baitadi",
];
```

- [ ] **Step 3: Add DISTRICTS_BY_PROVINCE mapping**

```ts
export const DISTRICTS_BY_PROVINCE: Record<Province, District[]> = {
  Koshi: ["Taplejung", "Panchthar", "Ilam", "Jhapa", "Morang", "Sunsari", "Bhojpur", "Dhankuta", "Terhathum", "Sankhuwasabha"],
  Madhesh: ["Siraha", "Dhanusha", "Mahottari", "Sarlahi", "Rautahat", "Bara", "Parsa"],
  Bagmati: ["Sindhuli", "Ramechhap", "Dolakha", "Sindhupalchok", "Kavrepalanchok", "Nuwakot", "Rasuwa", "Dhading", "Chitwan", "Makwanpur", "Kathmandu", "Lalitpur", "Bhaktapur"],
  Gandaki: ["Gorkha", "Lamjung", "Tanahu", "Kaski", "Syangja", "Nawalpur", "Manang", "Mustang"],
  Lumbini: ["Parasi", "Rupandehi", "Kapilvastu", "Palpa", "Argakhanchi", "Gulmi", "Pyuthan", "Rolpa", "Dang", "Banke", "Bardiya"],
  Karnali: ["Mugu", "Humla", "Jumla", "Kalikot", "Dolpa", "Surkhet", "Dailekh", "Jajarkot", "Rukum West", "Salyan"],
  Sudurpashchim: ["Bajura", "Bajhang", "Darchula", "Kailali", "Kanchanpur", "Achham", "Doti", "Dadeldhura", "Baitadi"],
};
```

- [ ] **Step 4: Add MUNICIPALITIES_BY_DISTRICT with all 293 municipalities**

This is the largest data block. Each district gets its municipalities with type. The "Other" option is NOT included here — it's handled in the UI as a free-text fallback.

```ts
export const MUNICIPALITIES_BY_DISTRICT: Record<District, Municipality[]> = {
  // Koshi Province
  Taplejung: [
    { name: "Taplejung", type: "Municipality" },
    { name: "Phungling", type: "Municipality" },
    { name: "Sirijangha", type: "Rural Municipality" },
    { name: "Mikwakhola", type: "Rural Municipality" },
    { name: "Yangwarak", type: "Rural Municipality" },
    { name: "Thumbedin", type: "Rural Municipality" },
    { name: "Sidingba", type: "Rural Municipality" },
    { name: "Mewakhola", type: "Rural Municipality" },
  ],
  Panchthar: [
    { name: "Phidim", type: "Municipality" },
    { name: "Panchthar", type: "Municipality" },
    { name: "Phalelung", type: "Rural Municipality" },
    { name: "Yasok", type: "Rural Municipality" },
    { name: "Kuriva", type: "Rural Municipality" },
    { name: "Yangnam", type: "Rural Municipality" },
    { name: "Hilihang", type: "Rural Municipality" },
    { name: "Falelung", type: "Rural Municipality" },
  ],
  Ilam: [
    { name: "Ilam", type: "Municipality" },
    { name: "Deumai", type: "Municipality" },
    { name: "Suryodaya", type: "Municipality" },
    { name: "Mai", type: "Rural Municipality" },
    { name: "Maijogmai", type: "Rural Municipality" },
    { name: "Rong", type: "Rural Municipality" },
    { name: "Sandakpur", type: "Rural Municipality" },
    { name: "Suryodaya", type: "Municipality" },
    { name: "Mangsebung", type: "Rural Municipality" },
    { name: "Chulachuli", type: "Rural Municipality" },
  ],
  Jhapa: [
    { name: "Bhadrapur", type: "Municipality" },
    { name: "Mechinagar", type: "Municipality" },
    { name: "Damak", type: "Municipality" },
    { name: "Itabhatta", type: "Municipality" },
    { name: "Birtamod", type: "Municipality" },
    { name: "Kankai", type: "Municipality" },
    { name: "Shivaganj", type: "Municipality" },
    { name: "Gauradaha", type: "Municipality" },
    { name: "Budhabare", type: "Rural Municipality" },
    { name: "Kachankawal", type: "Rural Municipality" },
    { name: "Barijuwa", type: "Rural Municipality" },
    { name: "Arjundhara", type: "Rural Municipality" },
    { name: "Haldibari", type: "Rural Municipality" },
    { name: "Kamal", type: "Rural Municipality" },
    { name: "Gauriganj", type: "Rural Municipality" },
  ],
  Morang: [
    { name: "Biratnagar", type: "Metropolitan" },
    { name: "Itahari", type: "Sub-Metropolitan" },
    { name: "Sundarharaincha", type: "Municipality" },
    { name: "Dharan", type: "Sub-Metropolitan" },
    { name: "Belbari", type: "Municipality" },
    { name: "Koshi Haraicha", type: "Municipality" },
    { name: "Rangeli", type: "Municipality" },
    { name: "Letang", type: "Municipality" },
    { name: "Urlabari", type: "Municipality" },
    { name: "Sundarpur", type: "Rural Municipality" },
    { name: "Kerabari", type: "Rural Municipality" },
    { name: "Budhiganga", type: "Rural Municipality" },
    { name: "Kanepokhari", type: "Rural Municipality" },
    { name: "Miklajung", type: "Rural Municipality" },
    { name: "Ratuwamai", type: "Rural Municipality" },
  ],
  Sunsari: [
    { name: "Itahari", type: "Sub-Metropolitan" },
    { name: "Dharan", type: "Sub-Metropolitan" },
    { name: "Inaruwa", type: "Municipality" },
    { name: "Sunsari", type: "Municipality" },
    { name: "Ramdhuni", type: "Municipality" },
    { name: "Duhabi", type: "Municipality" },
    { name: "Barju", type: "Rural Municipality" },
    { name: "Harinagara", type: "Rural Municipality" },
    { name: "Bhokraha", type: "Rural Municipality" },
    { name: "Koshi", type: "Rural Municipality" },
  ],
  Bhojpur: [
    { name: "Bhojpur", type: "Municipality" },
    { name: "Taksar", type: "Municipality" },
    { name: "Bhojpur", type: "Rural Municipality" },
    { name: "Ramprasadpur", type: "Rural Municipality" },
    { name: "Shyamtal", type: "Rural Municipality" },
    { name: "Dingla", type: "Rural Municipality" },
    { name: "Aamtek", type: "Rural Municipality" },
    { name: "Pauwa", type: "Rural Municipality" },
    { name: "Salpasilichho", type: "Rural Municipality" },
  ],
  Dhankuta: [
    { name: "Dhankuta", type: "Municipality" },
    { name: "Hile", type: "Municipality" },
    { name: "Pakhribas", type: "Municipality" },
    { name: "Mulgaj", type: "Rural Municipality" },
    { name: "Rajarani", type: "Rural Municipality" },
    { name: "Chhathar", type: "Rural Municipality" },
    { name: "Sangurigadhi", type: "Rural Municipality" },
  ],
  Terhathum: [
    { name: "Myanglung", type: "Municipality" },
    { name: "Terhathum", type: "Municipality" },
    { name: "Aathrai", type: "Rural Municipality" },
    { name: "Jaljale", type: "Rural Municipality" },
    { name: "Chhathar", type: "Rural Municipality" },
  ],
  Sankhuwasabha: [
    { name: "Khandbari", type: "Municipality" },
    { name: "Sankhuwasabha", type: "Municipality" },
    { name: "Madi", type: "Rural Municipality" },
    { name: "Sabhapokhari", type: "Rural Municipality" },
    { name: "Bhotkhola", type: "Rural Municipality" },
    { name: "Kimathanka", type: "Rural Municipality" },
    { name: "Chichila", type: "Rural Municipality" },
    { name: "Wana", type: "Rural Municipality" },
    { name: "Silichong", type: "Rural Municipality" },
  ],
  // Madhesh Province
  Siraha: [
    { name: "Siraha", type: "Municipality" },
    { name: "Lahan", type: "Municipality" },
    { name: "Mirchaiya", type: "Municipality" },
    { name: "Golbazar", type: "Municipality" },
    { name: "Dhangadhi", type: "Municipality" },
    { name: "Sukhipur", type: "Municipality" },
    { name: "Kalyanpur", type: "Municipality" },
    { name: "Bariyarpur", type: "Rural Municipality" },
    { name: "Lakshminiya", type: "Rural Municipality" },
    { name: "Arnama", type: "Rural Municipality" },
    { name: "Nawarajpur", type: "Rural Municipality" },
    { name: "Bhagawanpur", type: "Rural Municipality" },
    { name: "Aurahi", type: "Rural Municipality" },
  ],
  Dhanusha: [
    { name: "Janakpur", type: "Sub-Metropolitan" },
    { name: "Dhanushadham", type: "Municipality" },
    { name: "Bideha", type: "Municipality" },
    { name: "Mithila", type: "Municipality" },
    { name: "Nagarain", type: "Municipality" },
    { name: "Hansapur", type: "Municipality" },
    { name: "Ganeshwan Chaur", type: "Municipality" },
    { name: "Chhireshwornath", type: "Municipality" },
    { name: "Mithila Bihari", type: "Rural Municipality" },
    { name: "Dhanauji", type: "Rural Municipality" },
    { name: "Mithila", type: "Rural Municipality" },
    { name: "Shambhunath", type: "Rural Municipality" },
  ],
  Mahottari: [
    { name: "Jaleshwar", type: "Municipality" },
    { name: "Mahottari", type: "Municipality" },
    { name: "Bardibas", type: "Municipality" },
    { name: "Gaushala", type: "Municipality" },
    { name: "Loharpatti", type: "Municipality" },
    { name: "Pipara", type: "Rural Municipality" },
    { name: "Balawa", type: "Rural Municipality" },
    { name: "Bahiudar", type: "Rural Municipality" },
    { name: "Sahodawa", type: "Rural Municipality" },
    { name: "Ramgopalpur", type: "Rural Municipality" },
    { name: "Manara", type: "Rural Municipality" },
    { name: "Ekdara", type: "Rural Municipality" },
  ],
  Sarlahi: [
    { name: "Malangwa", type: "Municipality" },
    { name: "Haripurwa", type: "Municipality" },
    { name: "Barahathawa", type: "Municipality" },
    { name: "Ishworpur", type: "Municipality" },
    { name: "Lalbandi", type: "Municipality" },
    { name: "Bagmati", type: "Municipality" },
    { name: "Kaudena", type: "Municipality" },
    { name: "Chandrauta", type: "Rural Municipality" },
    { name: "Dhankaul", type: "Rural Municipality" },
    { name: "Ramnagar", type: "Rural Municipality" },
    { name: "Bishnu", type: "Rural Municipality" },
    { name: "Parsa", type: "Rural Municipality" },
    { name: "Bairgania", type: "Rural Municipality" },
  ],
  Rautahat: [
    { name: "Gaur", type: "Municipality" },
    { name: "Chandranigahapur", type: "Municipality" },
    { name: "Garuda", type: "Municipality" },
    { name: "Pipra", type: "Municipality" },
    { name: "Rajpur", type: "Municipality" },
    { name: "Paroha", type: "Municipality" },
    { name: "Yemunamai", type: "Municipality" },
    { name: "Katahariya", type: "Municipality" },
    { name: "Brindaban", type: "Rural Municipality" },
    { name: "Rajdevi", type: "Rural Municipality" },
    { name: "Guerrini", type: "Rural Municipality" },
    { name: "Dewahi", type: "Rural Municipality" },
    { name: "Fatuwa", type: "Rural Municipality" },
  ],
  Bara: [
    { name: "Kalaiya", type: "Municipality" },
    { name: "Nijgadh", type: "Municipality" },
    { name: "Simaraungadh", type: "Municipality" },
    { name: "Jeetpur", type: "Municipality" },
    { name: "Pipara", type: "Municipality" },
    { name: "Kolhabi", type: "Municipality" },
    { name: "Suwarna", type: "Municipality" },
    { name: "Jitpur", type: "Municipality" },
    { name: "Pheta", type: "Rural Municipality" },
    { name: "Subarna", type: "Rural Municipality" },
    { name: "Bodhgan", type: "Rural Municipality" },
    { name: "Maharajganj", type: "Rural Municipality" },
    { name: "Bishrampur", type: "Rural Municipality" },
  ],
  Parsa: [
    { name: "Birgunj", type: "Metropolitan" },
    { name: "Pokhariya", type: "Municipality" },
    { name: "Jirbhawani", type: "Municipality" },
    { name: "Paterwa", type: "Municipality" },
    { name: "Sakhuwanankarkatti", type: "Municipality" },
    { name: "Bindabasini", type: "Municipality" },
    { name: "Thori", type: "Rural Municipality" },
    { name: "Amlekhgunj", type: "Rural Municipality" },
    { name: "Biruwaguthi", type: "Rural Municipality" },
    { name: "Chhipaharmai", type: "Rural Municipality" },
    { name: "Jeetpur", type: "Rural Municipality" },
    { name: "Pakahamainpur", type: "Rural Municipality" },
    { name: "Bahudaramai", type: "Rural Municipality" },
  ],
  // Bagmati Province (Sindhuli placed here per constitutional schedule)
  Sindhuli: [
    { name: "Kamalamai", type: "Municipality" },
    { name: "Sindhuligadhi", type: "Municipality" },
    { name: "Dudhkunda", type: "Municipality" },
    { name: "Hariharpurgadhi", type: "Rural Municipality" },
    { name: "Golanjor", type: "Rural Municipality" },
    { name: "Bhimeshthang", type: "Rural Municipality" },
    { name: "Phikkal", type: "Rural Municipality" },
    { name: "Tinpatan", type: "Rural Municipality" },
  ],
  Ramechhap: [
    { name: "Manthali", type: "Municipality" },
    { name: "Ramechhap", type: "Municipality" },
    { name: "Khadadevi", type: "Rural Municipality" },
    { name: "Sunapati", type: "Rural Municipality" },
    { name: "Gokulgandaki", type: "Rural Municipality" },
    { name: "Lalitpur", type: "Rural Municipality" },
    { name: "Umakunda", type: "Rural Municipality" },
  ],
  Dolakha: [
    { name: "Bhimeshwar", type: "Municipality" },
    { name: "Charikot", type: "Municipality" },
    { name: "Jiri", type: "Municipality" },
    { name: "Shailung", type: "Rural Municipality" },
    { name: "Gaurishankar", type: "Rural Municipality" },
    { name: "Kalinchok", type: "Rural Municipality" },
    { name: "Bigu", type: "Rural Municipality" },
    { name: "Tamakoshi", type: "Rural Municipality" },
  ],
  Sindhupalchok: [
    { name: "Chautara", type: "Municipality" },
    { name: "Barhabise", type: "Municipality" },
    { name: "Balephi", type: "Rural Municipality" },
    { name: "Gumba", type: "Rural Municipality" },
    { name: "Helambu", type: "Rural Municipality" },
    { name: "Jugal", type: "Rural Municipality" },
    { name: "Lisankhu", type: "Rural Municipality" },
    { name: "Melamchi", type: "Rural Municipality" },
    { name: "Panchpokhari", type: "Rural Municipality" },
    { name: "Tripurasundari", type: "Rural Municipality" },
  ],
  Kavrepalanchok: [
    { name: "Dhulikhel", type: "Municipality" },
    { name: "Banepa", type: "Municipality" },
    { name: "Panauti", type: "Municipality" },
    { name: "Bhaktapur", type: "Municipality" },
    { name: "Panchkhal", type: "Municipality" },
    { name: "Namobuddha", type: "Municipality" },
    { name: "Khanikhola", type: "Rural Municipality" },
    { name: "Chaurideurali", type: "Rural Municipality" },
    { name: "Bhumlu", type: "Rural Municipality" },
    { name: "Mandandeupur", type: "Municipality" },
    { name: "Roshi", type: "Rural Municipality" },
    { name: "Bethanchok", type: "Rural Municipality" },
    { name: "Mahabharat", type: "Rural Municipality" },
  ],
  Nuwakot: [
    { name: "Bidur", type: "Municipality" },
    { name: "Nuwakot", type: "Municipality" },
    { name: "Kakani", type: "Rural Municipality" },
    { name: "Likhu", type: "Rural Municipality" },
    { name: "Panchakanya", type: "Rural Municipality" },
    { name: "Shivapuri", type: "Rural Municipality" },
    { name: "Tadi", type: "Rural Municipality" },
    { name: "Tupche", type: "Rural Municipality" },
    { name: "Ghyangphedi", type: "Rural Municipality" },
  ],
  Rasuwa: [
    { name: "Dhunche", type: "Municipality" },
    { name: "Uttargaya", type: "Rural Municipality" },
    { name: "Aamachhodingmo", type: "Rural Municipality" },
    { name: "Gosaikunda", type: "Rural Municipality" },
    { name: "Kalika", type: "Rural Municipality" },
  ],
  Dhading: [
    { name: "Dhading Besi", type: "Municipality" },
    { name: "Nilakantha", type: "Municipality" },
    { name: "Gajuri", type: "Municipality" },
    { name: "Neelakantha", type: "Municipality" },
    { name: "Thakre", type: "Rural Municipality" },
    { name: "Gangajamuna", type: "Rural Municipality" },
    { name: "Jyamruk", type: "Rural Municipality" },
    { name: "Khwolakar", type: "Rural Municipality" },
    { name: "Benighat", type: "Rural Municipality" },
    { name: "Rubi Valley", type: "Rural Municipality" },
    { name: "Salyantar", type: "Rural Municipality" },
    { name: "Tripurasundari", type: "Rural Municipality" },
  ],
  Chitwan: [
    { name: "Bharatpur", type: "Metropolitan" },
    { name: "Ratnanagar", type: "Municipality" },
    { name: "Khairahani", type: "Municipality" },
    { name: "Kalika", type: "Municipality" },
    { name: "Rapti", type: "Municipality" },
    { name: "Ichchhyakamana", type: "Rural Municipality" },
    { name: "Madi", type: "Municipality" },
  ],
  Makwanpur: [
    { name: "Hetauda", type: "Sub-Metropolitan" },
    { name: "Thaha", type: "Municipality" },
    { name: "Makwanpurgadhi", type: "Municipality" },
    { name: "Bakaiya", type: "Rural Municipality" },
    { name: "Kailash", type: "Rural Municipality" },
    { name: "Raksirang", type: "Rural Municipality" },
    { name: "Manahari", type: "Rural Municipality" },
    { name: "Indrasarowar", type: "Rural Municipality" },
    { name: "Bhimphedi", type: "Rural Municipality" },
  ],
  Kathmandu: [
    { name: "Kathmandu", type: "Metropolitan" },
    { name: "Kirtipur", type: "Municipality" },
    { name: "Gokarneshwor", type: "Municipality" },
    { name: "Shankharapur", type: "Municipality" },
    { name: "Budhanilkantha", type: "Municipality" },
    { name: "Chandragiri", type: "Municipality" },
    { name: "Tokha", type: "Municipality" },
    { name: "Tarakeshwar", type: "Municipality" },
    { name: "Nagarjun", type: "Municipality" },
    { name: "Dakshinkali", type: "Municipality" },
    { name: "Kageshwori Manohara", type: "Municipality" },
  ],
  Lalitpur: [
    { name: "Lalitpur", type: "Metropolitan" },
    { name: "Godawari", type: "Municipality" },
    { name: "Mahalaxmi", type: "Municipality" },
    { name: "Konjyosom", type: "Rural Municipality" },
    { name: "Bagmati", type: "Rural Municipality" },
    { name: "Chandragiri", type: "Rural Municipality" },
  ],
  Bhaktapur: [
    { name: "Bhaktapur", type: "Municipality" },
    { name: "Madhyapur Thimi", type: "Municipality" },
    { name: "Suryabinayak", type: "Municipality" },
    { name: "Changunarayan", type: "Municipality" },
  ],
  // Gandaki Province
  Gorkha: [
    { name: "Gorkha", type: "Municipality" },
    { name: "Pokharithok", type: "Municipality" },
    { name: "Arughat", type: "Municipality" },
    { name: "Palungtar", type: "Municipality" },
    { name: "Ajirkot", type: "Rural Municipality" },
    { name: "Bhimsen", type: "Rural Municipality" },
    { name: "Chum Nubri", type: "Rural Municipality" },
    { name: "Dhawa", type: "Rural Municipality" },
    { name: "Gandaki", type: "Rural Municipality" },
    { name: "Larpak", type: "Rural Municipality" },
    { name: "Sahid Lakhan", type: "Rural Municipality" },
    { name: "Sirdibas", type: "Rural Municipality" },
  ],
  Lamjung: [
    { name: "Besisahar", type: "Municipality" },
    { name: "Sundi Bazar", type: "Municipality" },
    { name: "Rainas", type: "Municipality" },
    { name: "Dudhpokhari", type: "Rural Municipality" },
    { name: "Marsyangdi", type: "Rural Municipality" },
    { name: "Kwholasothar", type: "Rural Municipality" },
    { name: "Madhyanepal", type: "Rural Municipality" },
  ],
  Tanahu: [
    { name: "Byas", type: "Municipality" },
    { name: "Shuklagandaki", type: "Municipality" },
    { name: "Vyas", type: "Municipality" },
    { name: "Bhanu", type: "Municipality" },
    { name: "Anbukhaireni", type: "Municipality" },
    { name: "Devghat", type: "Rural Municipality" },
    { name: "Bandipur", type: "Rural Municipality" },
    { name: "Ghiring", type: "Rural Municipality" },
    { name: "Myagde", type: "Rural Municipality" },
    { name: "Rishing", type: "Rural Municipality" },
  ],
  Kaski: [
    { name: "Pokhara", type: "Metropolitan" },
    { name: "Lekhnath", type: "Municipality" },
    { name: "Pokhara", type: "Metropolitan" },
    { name: "Rupa", type: "Rural Municipality" },
    { name: "Machhapuchchhre", type: "Rural Municipality" },
    { name: "Annapurna", type: "Rural Municipality" },
    { name: "Sardikhola", type: "Rural Municipality" },
  ],
  Syangja: [
    { name: "Syangja", type: "Municipality" },
    { name: "Putalibazar", type: "Municipality" },
    { name: "Waling", type: "Municipality" },
    { name: "Chapakot", type: "Rural Municipality" },
    { name: "Kaligandaki", type: "Rural Municipality" },
    { name: "Biruwa", type: "Rural Municipality" },
    { name: "Bhirkot", type: "Rural Municipality" },
    { name: "Galyang", type: "Runicipality" },
    { name: "Arjun", type: "Rural Municipality" },
    { name: "Phedikhola", type: "Rural Municipality" },
  ],
  Nawalpur: [
    { name: "Gaindakot", type: "Municipality" },
    { name: "Nawalparasi", type: "Municipality" },
    { name: "Kawasoti", type: "Municipality" },
    { name: "Bardaghat", type: "Municipality" },
    { name: "Susta", type: "Rural Municipality" },
    { name: "Bulingtar", type: "Rural Municipality" },
    { name: "Hupsekot", type: "Rural Municipality" },
    { name: "Madhyabindu", type: "Municipality" },
  ],
  Manang: [
    { name: "Chame", type: "Municipality" },
    { name: "Nashong", type: "Rural Municipality" },
    { name: "Narphu", type: "Rural Municipality" },
    { name: "Pisang", type: "Rural Municipality" },
  ],
  Mustang: [
    { name: "Jomsom", type: "Municipality" },
    { name: "Lomanthang", type: "Municipality" },
    { name: "Gharapjhong", type: "Rural Municipality" },
    { name: "Dalami", type: "Rural Municipality" },
    { name: "Chhoser", type: "Rural Municipality" },
  ],
  // Lumbini Province
  Parasi: [
    { name: "Ramgram", type: "Municipality" },
    { name: "Sunawal", type: "Municipality" },
    { name: "Pratappur", type: "Municipality" },
    { name: "Susta", type: "Rural Municipality" },
    { name: "Bardinath", type: "Rural Municipality" },
    { name: "Sarawal", type: "Rural Municipality" },
  ],
  Rupandehi: [
    { name: "Siddharthanagar", type: "Municipality" },
    { name: "Butwal", type: "Sub-Metropolitan" },
    { name: "Lumbini Sanskritik", type: "Municipality" },
    { name: "Tilottama", type: "Municipality" },
    { name: "Devdaha", type: "Municipality" },
    { name: "Sainamaina", type: "Municipality" },
    { name: "Marchawari", type: "Rural Municipality" },
    { name: "Kotahimai", type: "Rural Municipality" },
    { name: "Mayadevi", type: "Rural Municipality" },
    { name: "Omsatiya", type: "Rural Municipality" },
    { name: "Rohini", type: "Rural Municipality" },
  ],
  Kapilvastu: [
    { name: "Kapilvastu", type: "Municipality" },
    { name: "Taulihawa", type: "Municipality" },
    { name: "Lumbini", type: "Municipality" },
    { name: "Banganga", type: "Municipality" },
    { name: "Krishnanagar", type: "Municipality" },
    { name: "Maharajganj", type: "Municipality" },
    { name: "Shivaraj", type: "Municipality" },
    { name: "Bijaynagar", type: "Rural Municipality" },
    { name: "Dobhan", type: "Rural Municipality" },
    { name: "Buddhabhumi", type: "Municipality" },
  ],
  Palpa: [
    { name: "Tansen", type: "Municipality" },
    { name: "Rampur", type: "Municipality" },
    { name: "Rishing", type: "Municipality" },
    { name: "Tinau", type: "Rural Municipality" },
    { name: "Purba", type: "Rural Municipality" },
    { name: "Ribdikot", type: "Rural Municipality" },
    { name: "Nisdi", type: "Rural Municipality" },
    { name: "Mathagadhi", type: "Rural Municipality" },
  ],
  Argakhanchi: [
    { name: "Sandhikharka", type: "Municipality" },
    { name: "Sitganga", type: "Municipality" },
    { name: "Panini", type: "Rural Municipality" },
    { name: "Chhatraganj", type: "Rural Municipality" },
    { name: "Malarani", type: "Rural Municipality" },
    { name: "Argha", type: "Rural Municipality" },
  ],
  Gulmi: [
    { name: "Tamghas", type: "Municipality" },
    { name: "Resunga", type: "Municipality" },
    { name: "Gulmi", type: "Municipality" },
    { name: "Ruru", type: "Municipality" },
    { name: "Chatrakot", type: "Rural Municipality" },
    { name: "Dhurkot", type: "Rural Municipality" },
    { name: "Isma", type: "Rural Municipality" },
    { name: "Malika", type: "Rural Municipality" },
    { name: "Musikot", type: "Rural Municipality" },
  ],
  Pyuthan: [
    { name: "Pyuthan", type: "Municipality" },
    { name: "Bijuwar", type: "Municipality" },
    { name: "Sworgadwari", type: "Municipality" },
    { name: "Machchhe", type: "Rural Municipality" },
    { name: "Naya Gaun", type: "Rural Municipality" },
    { name: "Arkha", type: "Rural Municipality" },
    { name: "Hansapur", type: "Rural Municipality" },
    { name: "Khaira", type: "Rural Municipality" },
  ],
  Rolpa: [
    { name: "Liwang", type: "Municipality" },
    { name: "Rolpa", type: "Municipality" },
    { name: "Thawang", type: "Municipality" },
    { name: "Sriam", type: "Municipality" },
    { name: "Jaimakasala", type: "Rural Municipality" },
    { name: "Runtigadi", type: "Rural Municipality" },
    { name: "Madi", type: "Rural Municipality" },
    { name: "Sukidang", type: "Rural Municipality" },
    { name: "Sunchal", type: "Rural Municipality" },
  ],
  Dang: [
    { name: "Ghorahi", type: "Sub-Metropolitan" },
    { name: "Tulsipur", type: "Sub-Metropolitan" },
    { name: "Narayanpur", type: "Municipality" },
    { name: "Lamahi", type: "Municipality" },
    { name: "Rajpur", type: "Municipality" },
    { name: "Rapti", type: "Municipality" },
    { name: "Shantinagar", type: "Municipality" },
    { name: "Gadhawa", type: "Rural Municipality" },
    { name: "Bangalachuli", type: "Rural Municipality" },
    { name: "Dangisharan", type: "Rural Municipality" },
  ],
  Banke: [
    { name: "Nepalgunj", type: "Sub-Metropolitan" },
    { name: "Kohalpur", type: "Municipality" },
    { name: "Gulariya", type: "Municipality" },
    { name: "Khaskusma", type: "Municipality" },
    { name: "Rapti Sonari", type: "Rural Municipality" },
    { name: "Duduwa", type: "Rural Municipality" },
    { name: "Baijanath", type: "Rural Municipality" },
    { name: "Janki", type: "Rural Municipality" },
  ],
  Bardiya: [
    { name: "Gulariya", type: "Municipality" },
    { name: "Rajapur", type: "Municipality" },
    { name: "Thakurdwara", type: "Municipality" },
    { name: "Basgadhi", type: "Municipality" },
    { name: "Bansgadhi", type: "Municipality" },
    { name: "Madhuvan", type: "Municipality" },
    { name: "Baradhiya", type: "Rural Municipality" },
    { name: "Geruwa", type: "Rural Municipality" },
    { name: "Suryapatuwa", type: "Rural Municipality" },
  ],
  // Karnali Province
  Mugu: [
    { name: "Gamgadhi", type: "Municipality" },
    { name: "Rara", type: "Rural Municipality" },
    { name: "Chhayanath", type: "Rural Municipality" },
    { name: "Mugum Karmarong", type: "Rural Municipality" },
  ],
  Humla: [
    { name: "Simikot", type: "Municipality" },
    { name: "Kharpunath", type: "Rural Municipality" },
    { name: "Chankheli", type: "Rural Municipality" },
    { name: "Sarkegad", type: "Rural Municipality" },
    { name: "Namkha", type: "Rural Municipality" },
  ],
  Jumla: [
    { name: "Chandannath", type: "Municipality" },
    { name: "Jumla", type: "Municipality" },
    { name: "Guthichaur", type: "Rural Municipality" },
    { name: "Kanakasundari", type: "Rural Municipality" },
    { name: "Sinja", type: "Rural Municipality" },
    { name: "Tatopani", type: "Rural Municipality" },
    { name: "Dilachaur", type: "Rural Municipality" },
    { name: "Patarasi", type: "Rural Municipality" },
  ],
  Kalikot: [
    { name: "Manma", type: "Municipality" },
    { name: "Kalika", type: "Municipality" },
    { name: "Khandachakra", type: "Rural Municipality" },
    { name: "Tilagufa", type: "Rural Municipality" },
    { name: "Raskot", type: "Rural Municipality" },
    { name: "Pachaljalna", type: "Rural Municipality" },
    { name: "Sanni", type: "Rural Municipality" },
  ],
  Dolpa: [
    { name: "Dunai", type: "Municipality" },
    { name: "Tripurasundari", type: "Municipality" },
    { name: "Shey Phoksando", type: "Rural Municipality" },
    { name: "Chharka", type: "Rural Municipality" },
    { name: "Dolpo Buddha", type: "Rural Municipality" },
    { name: "Mudkechula", type: "Rural Municipality" },
  ],
  Surkhet: [
    { name: "Birendranagar", type: "Municipality" },
    { name: "Chinchu", type: "Municipality" },
    { name: "Babiyachaur", type: "Municipality" },
    { name: "Gurbhakot", type: "Municipality" },
    { name: "Panchapuri", type: "Municipality" },
    { name: "Lekbeshi", type: "Municipality" },
    { name: "Simta", type: "Rural Municipality" },
    { name: "Barahatal", type: "Rural Municipality" },
    { name: "Bheriganga", type: "Rural Municipality" },
  ],
  Dailekh: [
    { name: "Narayan", type: "Municipality" },
    { name: "Dailekh", type: "Municipality" },
    { name: "Dullu", type: "Municipality" },
    { name: "Bhagwatimai", type: "Rural Municipality" },
    { name: "Aathbis", type: "Rural Municipality" },
    { name: "Chamunda", type: "Rural Municipality" },
    { name: "Gurans", type: "Rural Municipality" },
    { name: "Dungeshwor", type: "Rural Municipality" },
    { name: "Naumule", type: "Rural Municipality" },
    { name: "Toli", type: "Rural Municipality" },
  ],
  Jajarkot: [
    { name: "Khalanga", type: "Municipality" },
    { name: "Barekot", type: "Rural Municipality" },
    { name: "Junichande", type: "Rural Municipality" },
    { name: "Kushe", type: "Rural Municipality" },
    { name: "Sinja", type: "Rural Municipality" },
    { name: "Dhawalagiri", type: "Rural Municipality" },
  ],
  "Rukum West": [
    { name: "Musikot", type: "Municipality" },
    { name: "Rukumkot", type: "Municipality" },
    { name: "Aathbis", type: "Municipality" },
    { name: "Banfikot", type: "Rural Municipality" },
    { name: "Chaurjahari", type: "Municipality" },
    { name: "Tribeni", type: "Rural Municipality" },
    { name: "Sani Bheri", type: "Rural Municipality" },
  ],
  Salyan: [
    { name: "Salyan", type: "Municipality" },
    { name: "Sharada", type: "Municipality" },
    { name: "Bagchaur", type: "Municipality" },
    { name: "Kapurchaur", type: "Municipality" },
    { name: "Balechha", type: "Rural Municipality" },
    { name: "Chhatreshwori", type: "Rural Municipality" },
    { name: "Dhanawang", type: "Rural Municipality" },
    { name: "Kalimati", type: "Rural Municipality" },
    { name: "Kotmai", type: "Rural Municipality" },
  ],
  // Sudurpashchim Province
  Bajura: [
    { name: "Martadi", type: "Municipality" },
    { name: "Bajura", type: "Municipality" },
    { name: "Triveni", type: "Municipality" },
    { name: "Badimalika", type: "Municipality" },
    { name: "Buddhiganga", type: "Rural Municipality" },
    { name: "Gaumul", type: "Rural Municipality" },
    { name: "Himali", type: "Rural Municipality" },
    { name: "Jagannath", type: "Rural Municipality" },
    { name: "Kanda", type: "Rural Municipality" },
  ],
  Bajhang: [
    { name: "Chainpur", type: "Municipality" },
    { name: "Bajhang", type: "Municipality" },
    { name: "Jayaprithvi", type: "Municipality" },
    { name: "Khaptad", type: "Rural Municipality" },
    { name: "Bitthadchir", type: "Rural Municipality" },
    { name: "Durgathali", type: "Rural Municipality" },
    { name: "Masta", type: "Rural Municipality" },
    { name: "Ranishikhar", type: "Rural Municipality" },
    { name: "Shivath", type: "Rural Municipality" },
  ],
  Darchula: [
    { name: "Darchula", type: "Municipality" },
    { name: "Mahakali", type: "Municipality" },
    { name: "Lekam", type: "Municipality" },
    { name: "Malikarjun", type: "Rural Municipality" },
    { name: "Naugad", type: "Rural Municipality" },
    { name: "Shailyashikhar", type: "Rural Municipality" },
    { name: "Apihimal", type: "Rural Municipality" },
  ],
  Kailali: [
    { name: "Dhangadhi", type: "Sub-Metropolitan" },
    { name: "Tikapur", type: "Municipality" },
    { name: "Attariya", type: "Municipality" },
    { name: "Godawari", type: "Municipality" },
    { name: "Bhajani", type: "Municipality" },
    { name: "Lamki Chuha", type: "Municipality" },
    { name: "Janaki", type: "Rural Municipality" },
    { name: "Gauriganga", type: "Municipality" },
    { name: "Chure", type: "Rural Municipality" },
    { name: "Basanta", type: "Rural Municipality" },
    { name: "Godawari", type: "Rural Municipality" },
    { name: "Tikapur", type: "Municipality" },
    { name: "Mohanyal", type: "Rural Municipality" },
  ],
  Kanchanpur: [
    { name: "Bhimdatta", type: "Municipality" },
    { name: "Mahendranagar", type: "Municipality" },
    { name: "Beldandi", type: "Municipality" },
    { name: "Patan", type: "Municipality" },
    { name: "Shuklaphanta", type: "Municipality" },
    { name: "Belauri", type: "Municipality" },
    { name: "Daijee", type: "Rural Municipality" },
    { name: "Baisi Bichawa", type: "Rural Municipality" },
    { name: "Krishnapur", type: "Rural Municipality" },
    { name: "Laljhadi", type: "Rural Municipality" },
    { name: "Shivaraj", type: "Rural Municipality" },
  ],
  Achham: [
    { name: "Mangalsen", type: "Municipality" },
    { name: "Achham", type: "Municipality" },
    { name: "Kamalbazar", type: "Municipality" },
    { name: "Bannigadhi", type: "Rural Municipality" },
    { name: "Chaurpati", type: "Rural Municipality" },
    { name: "Dhakari", type: "Rural Municipality" },
    { name: "Janakikunda", type: "Rural Municipality" },
    { name: "Mellekh", type: "Rural Municipality" },
    { name: "Panchadewal", type: "Rural Municipality" },
    { name: "Ramrosan", type: "Rural Municipality" },
  ],
  Doti: [
    { name: "Dipayal Silgadhi", type: "Municipality" },
    { name: "Shikhar", type: "Municipality" },
    { name: "Bogtan", type: "Rural Municipality" },
    { name: "Chaupati", type: "Rural Municipality" },
    { name: "K.I.Singh", type: "Rural Municipality" },
    { name: "Purbichauki", type: "Rural Municipality" },
    { name: "Sayal", type: "Rural Municipality" },
    { name: "Badikedar", type: "Rural Municipality" },
    { name: "Jorayal", type: "Rural Municipality" },
  ],
  Dadeldhura: [
    { name: "Dadeldhura", type: "Municipality" },
    { name: "Amargadhi", type: "Municipality" },
    { name: "Ganeshpur", type: "Municipality" },
    { name: "Parashuram", type: "Rural Municipality" },
    { name: "Bhageshwar", type: "Rural Municipality" },
    { name: "Ajaymeru", type: "Rural Municipality" },
    { name: "Navadurga", type: "Rural Municipality" },
  ],
  Baitadi: [
    { name: "Baitadi", type: "Municipality" },
    { name: "Dasharathchanda", type: "Municipality" },
    { name: "Patan", type: "Municipality" },
    { name: "Melauli", type: "Municipality" },
    { name: "Siddheswor", type: "Rural Municipality" },
    { name: "Dilasaini", type: "Rural Municipality" },
    { name: "Shivaswor", type: "Rural Municipality" },
    { name: "Purchaudi", type: "Rural Municipality" },
    { name: "Dogdakedar", type: "Rural Municipality" },
    { name: "Srijana", type: "Rural Municipality" },
  ],
};
```

- [ ] **Step 5: Add ALL_DISTRICTS array and delivery data**

```ts
export const ALL_DISTRICTS: DistrictInfo[] = Object.entries(DISTRICTS_BY_PROVINCE).flatMap(
  ([province, districts]) =>
    districts.map((district) => ({
      name: district,
      province: province as Province,
      municipalities: MUNICIPALITIES_BY_DISTRICT[district],
    }))
);

export const DISTRICT_DELIVERY_RULES: DistrictDeliveryRule[] = [
  { district: "Kathmandu", province: "Bagmati", codAvailable: true, fee: 100, freeDeliveryThreshold: 2500, serviceLevel: "valley", estimatedDays: "1-2 business days" },
  { district: "Lalitpur", province: "Bagmati", codAvailable: true, fee: 100, freeDeliveryThreshold: 2500, serviceLevel: "valley", estimatedDays: "1-2 business days" },
  { district: "Bhaktapur", province: "Bagmati", codAvailable: true, fee: 120, freeDeliveryThreshold: 2500, serviceLevel: "valley", estimatedDays: "1-2 business days" },
  { district: "Chitwan", province: "Bagmati", codAvailable: true, fee: 190, freeDeliveryThreshold: 2500, serviceLevel: "metro", estimatedDays: "2-4 business days" },
  { district: "Kaski", province: "Gandaki", codAvailable: true, fee: 180, freeDeliveryThreshold: 2500, serviceLevel: "metro", estimatedDays: "2-4 business days" },
  { district: "Rupandehi", province: "Lumbini", codAvailable: true, fee: 200, freeDeliveryThreshold: 2500, serviceLevel: "metro", estimatedDays: "2-4 business days" },
  { district: "Morang", province: "Koshi", codAvailable: false, fee: 240, freeDeliveryThreshold: 2500, serviceLevel: "standard", estimatedDays: "3-5 business days" },
  { district: "Parsa", province: "Madhesh", codAvailable: false, fee: 230, freeDeliveryThreshold: 2500, serviceLevel: "standard", estimatedDays: "3-5 business days" },
  { district: "Banke", province: "Lumbini", codAvailable: false, fee: 220, freeDeliveryThreshold: 2500, serviceLevel: "standard", estimatedDays: "3-5 business days" },
  { district: "Kailali", province: "Sudurpashchim", codAvailable: false, fee: 280, freeDeliveryThreshold: 3000, serviceLevel: "standard", estimatedDays: "4-6 business days" },
  { district: "Surkhet", province: "Karnali", codAvailable: false, fee: 320, freeDeliveryThreshold: 3500, serviceLevel: "remote", estimatedDays: "5-8 business days" },
  { district: "Dang", province: "Lumbini", codAvailable: false, fee: 240, freeDeliveryThreshold: 2500, serviceLevel: "standard", estimatedDays: "3-5 business days" },
];

export const PROVINCE_DELIVERY_DEFAULTS: ProvinceDeliveryDefault[] = [
  { province: "Bagmati", codAvailable: true, fee: 150, freeDeliveryThreshold: 2500, serviceLevel: "standard", estimatedDays: "2-4 business days" },
  { province: "Gandaki", codAvailable: true, fee: 200, freeDeliveryThreshold: 2500, serviceLevel: "standard", estimatedDays: "3-5 business days" },
  { province: "Lumbini", codAvailable: false, fee: 230, freeDeliveryThreshold: 2500, serviceLevel: "standard", estimatedDays: "3-5 business days" },
  { province: "Koshi", codAvailable: false, fee: 250, freeDeliveryThreshold: 2500, serviceLevel: "standard", estimatedDays: "3-5 business days" },
  { province: "Madhesh", codAvailable: false, fee: 230, freeDeliveryThreshold: 2500, serviceLevel: "standard", estimatedDays: "3-5 business days" },
  { province: "Karnali", codAvailable: false, fee: 350, freeDeliveryThreshold: 4000, serviceLevel: "remote", estimatedDays: "5-10 business days" },
  { province: "Sudurpashchim", codAvailable: false, fee: 300, freeDeliveryThreshold: 3000, serviceLevel: "standard", estimatedDays: "4-7 business days" },
];
```

- [ ] **Step 6: Add helper functions**

```ts
export function getDistrictsForProvince(province: Province): District[] {
  return DISTRICTS_BY_PROVINCE[province] ?? DISTRICTS_BY_PROVINCE.Bagmati;
}

export function getMunicipalitiesForDistrict(district: District): Municipality[] {
  return MUNICIPALITIES_BY_DISTRICT[district] ?? [];
}

export function getDeliveryRule(district: District, province: Province): DistrictDeliveryRule | ProvinceDeliveryDefault {
  const exact = DISTRICT_DELIVERY_RULES.find((rule) => rule.district === district && rule.province === province);
  if (exact) return exact;
  return PROVINCE_DELIVERY_DEFAULTS.find((rule) => rule.province === province) ?? PROVINCE_DELIVERY_DEFAULTS.find((rule) => rule.province === "Bagmati")!;
}

export function calculateDeliveryFee(subtotal: number, district: District, province: Province): number {
  const rule = getDeliveryRule(district, province);
  return subtotal >= rule.freeDeliveryThreshold ? 0 : rule.fee;
}

export function getFreeDeliveryProgress(subtotal: number, district: District, province: Province): { threshold: number; remaining: number; percent: number } {
  const rule = getDeliveryRule(district, province);
  const remaining = Math.max(0, rule.freeDeliveryThreshold - subtotal);
  const percent = Math.min(100, Math.round((subtotal / rule.freeDeliveryThreshold) * 100));
  return { threshold: rule.freeDeliveryThreshold, remaining, percent };
}

export function isValidProvinceDistrictCombo(province: Province, district: District): boolean {
  return DISTRICTS_BY_PROVINCE[province]?.includes(district) ?? false;
}

export function isCodAvailable(district: District, province: Province): boolean {
  return getDeliveryRule(district, province).codAvailable;
}
```

- [ ] **Step 7: Import assertions at end of file**

```ts
import "./nepal-location-assertions";
```

- [ ] **Step 8: Verify file compiles**

Run: `npx tsc --noEmit src/lib/nepal-location.ts`
Expected: No errors (or only assertion import error until Task 2 is done)

---

## Task 2: Create `src/lib/nepal-location-assertions.ts`

**Files:**
- Create: `src/lib/nepal-location-assertions.ts`

- [ ] **Step 1: Create the assertions file**

```ts
import { DISTRICTS, DISTRICTS_BY_PROVINCE, ALL_DISTRICTS, PROVINCES } from "./nepal-location";

if (process.env.NODE_ENV === "development") {
  const totalDistricts = DISTRICTS.length;
  console.assert(totalDistricts === 77, `Expected 77 districts, got ${totalDistricts}`);

  console.assert(!DISTRICTS.includes("Dhangadhi" as never), "Dhangadhi is a city in Kailali district, not a district");
  console.assert(!DISTRICTS.includes("Biratnagar" as never), "Biratnagar is a city in Morang district, not a district");
  console.assert(!DISTRICTS.includes("Dharan" as never), "Dharan is a city in Sunsari/Morang, not a district");
  console.assert(!DISTRICTS.includes("Birgunj" as never), "Birgunj is a city in Parsa district, not a district");
  console.assert(!DISTRICTS.includes("Janakpur" as never), "Janakpur is a city in Dhanusha district, not a district");
  console.assert(!DISTRICTS.includes("Pokhara" as never), "Pokhara is a city in Kaski district, not a district");
  console.assert(!DISTRICTS.includes("Butwal" as never), "Butwal is a city in Rupandehi district, not a district");
  console.assert(!DISTRICTS.includes("Nepalgunj" as never), "Nepalgunj is a city in Banke district, not a district");

  const districtProvinceMap = new Map<string, string>();
  for (const info of ALL_DISTRICTS) {
    const existing = districtProvinceMap.get(info.name);
    if (existing && existing !== info.province) {
      console.assert(false, `District ${info.name} mapped to multiple provinces: ${existing} and ${info.province}`);
    }
    districtProvinceMap.set(info.name, info.province);
  }

  console.assert(PROVINCES.length === 7, `Expected 7 provinces, got ${PROVINCES.length}`);

  let totalMunicipalities = 0;
  for (const info of ALL_DISTRICTS) {
    totalMunicipalities += info.municipalities.length;
  }
  console.assert(totalMunicipalities >= 290, `Expected at least 290 municipalities, got ${totalMunicipalities}`);
}
```

- [ ] **Step 2: Verify no type errors**

Run: `npx tsc --noEmit`
Expected: No type errors

---

## Task 3: Rewrite `src/lib/delivery.ts` as thin wrapper

**Files:**
- Modify: `src/lib/delivery.ts`

The current `delivery.ts` exports: `Province`, `DistrictDeliveryRule`, `FREE_DELIVERY_THRESHOLD`, `PROVINCES`, `DISTRICT_DELIVERY_RULES`, `DISTRICTS_BY_PROVINCE`, `getDistrictsForProvince`, `getDeliveryRule`, `calculateDeliveryFee`, `getFreeDeliveryProgress`.

The new file re-exports everything from `nepal-location.ts` and adds backward-compatible aliases. `DistrictDeliveryRule` has changed shape (removed `prepaidAvailable`, `estimate`, `ownerNote` fields; added `estimatedDays`, `serviceLevel`), so we extend it.

- [ ] **Step 1: Rewrite delivery.ts**

```ts
import {
  type Province,
  type District,
  type ServiceLevel,
  type DistrictDeliveryRule as NewDistrictDeliveryRule,
  type ProvinceDeliveryDefault,
  PROVINCES,
  DISTRICTS,
  DISTRICTS_BY_PROVINCE,
  DISTRICT_DELIVERY_RULES as NEW_DISTRICT_DELIVERY_RULES,
  PROVINCE_DELIVERY_DEFAULTS,
  ALL_DISTRICTS,
  getDistrictsForProvince as _getDistrictsForProvince,
  getMunicipalitiesForDistrict,
  getDeliveryRule as _getDeliveryRule,
  calculateDeliveryFee as _calculateDeliveryFee,
  getFreeDeliveryProgress as _getFreeDeliveryProgress,
  isValidProvinceDistrictCombo,
  isCodAvailable,
} from "./nepal-location";

export type { Province, District, ServiceLevel };
export type { ProvinceDeliveryDefault };
export { PROVINCES, DISTRICTS, DISTRICTS_BY_PROVINCE, ALL_DISTRICTS };
export { getMunicipalitiesForDistrict, isValidProvinceDistrictCombo, isCodAvailable };

export const FREE_DELIVERY_THRESHOLD = 2500;

export interface DistrictDeliveryRule {
  district: string;
  province: Province;
  codAvailable: boolean;
  prepaidAvailable: boolean;
  estimate: string;
  fee: number;
  freeDeliveryThreshold: number;
  serviceLevel: ServiceLevel | "pending";
  ownerNote: string;
}

function adaptRule(rule: NewDistrictDeliveryRule | ProvinceDeliveryDefault): DistrictDeliveryRule {
  return {
    district: rule.district ?? "Other",
    province: rule.province,
    codAvailable: rule.codAvailable,
    prepaidAvailable: true,
    estimate: rule.estimatedDays,
    fee: rule.fee,
    freeDeliveryThreshold: rule.freeDeliveryThreshold,
    serviceLevel: rule.serviceLevel,
    ownerNote: "",
  };
}

export const DISTRICT_DELIVERY_RULES: DistrictDeliveryRule[] = NEW_DISTRICT_DELIVERY_RULES.map(adaptRule);

export const DISTRICTS_BY_PROVINCE_COMPAT: Record<Province, string[]> = Object.fromEntries(
  PROVINCES.map((p) => [p, _getDistrictsForProvince(p)])
) as Record<Province, string[]>;

export function getDistrictsForProvince(province: string): string[] {
  const normalizedProvince = (PROVINCES.includes(province as Province) ? province : "Bagmati") as Province;
  return _getDistrictsForProvince(normalizedProvince);
}

export function getDeliveryRule(district: string, province: string = "Bagmati"): DistrictDeliveryRule {
  const normalizedProvince = (PROVINCES.includes(province as Province) ? province : "Bagmati") as Province;
  const normalizedDistrict = (DISTRICTS.includes(district as District) ? district : "Kathmandu") as District;
  return adaptRule(_getDeliveryRule(normalizedDistrict, normalizedProvince));
}

export function calculateDeliveryFee(subtotal: number, district: string, province = "Bagmati"): number {
  const normalizedProvince = (PROVINCES.includes(province as Province) ? province : "Bagmati") as Province;
  const normalizedDistrict = (DISTRICTS.includes(district as District) ? district : "Kathmandu") as District;
  return _calculateDeliveryFee(subtotal, normalizedDistrict, normalizedProvince);
}

export function getFreeDeliveryProgress(subtotal: number, district: string, province = "Bagmati"): { threshold: number; remaining: number; percent: number } {
  const normalizedProvince = (PROVINCES.includes(province as Province) ? province : "Bagmati") as Province;
  const normalizedDistrict = (DISTRICTS.includes(district as District) ? district : "Kathmandu") as District;
  return _getFreeDeliveryProgress(subtotal, normalizedDistrict, normalizedProvince);
}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `npx tsc --noEmit`
Expected: No errors

---

## Task 4: Update `src/lib/validations/checkout.ts`

**Files:**
- Modify: `src/lib/validations/checkout.ts`

- [ ] **Step 1: Update the Zod schema**

```ts
import { z } from "zod";
import { PROVINCES, DISTRICTS, isValidProvinceDistrictCombo, type Province, type District } from "@/lib/nepal-location";

export const checkoutSchema = z.object({
  name: z.string().min(2, "Full name is required"),
  email: z.union([
    z.string().email("Enter a valid email address"),
    z.literal(""),
  ], { error: "Enter a valid email address" }),
  phone: z.string().regex(/^(\+977\s?)?9[78]\d{8}$/, "Enter a valid Nepal mobile number (e.g. 9818212188)"),
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

export type CheckoutFormData = z.infer<typeof checkoutSchema>;
```

- [ ] **Step 2: Verify typecheck passes**

Run: `npx tsc --noEmit`
Expected: No errors

---

## Task 5: Update `CheckoutPageClient.tsx` with cascading dropdowns and delivery info

**Files:**
- Modify: `src/components/checkout/CheckoutPageClient.tsx`

Key changes:
1. Import from `@/lib/nepal-location` instead of `@/lib/delivery` for new functions
2. Import backward-compatible `getDeliveryRule`, `calculateDeliveryFee`, `getFreeDeliveryProgress` from `@/lib/delivery` (they still accept `string` params)
3. Add municipality dropdown with "Other" option that reveals free-text input
4. Reset district/city/ward when province changes; reset city/ward when district changes
5. Show delivery info (fee, ETA, COD badge) after district selection
6. Default province="Bagmati", district="Kathmandu", city="Kathmandu"

- [ ] **Step 1: Update imports**

Replace:
```ts
import { calculateDeliveryFee, getDeliveryRule, getDistrictsForProvince, getFreeDeliveryProgress, PROVINCES } from "@/lib/delivery";
```

With:
```ts
import { PROVINCES, getDistrictsForProvince, getMunicipalitiesForDistrict, isCodAvailable } from "@/lib/nepal-location";
import { calculateDeliveryFee, getDeliveryRule, getFreeDeliveryProgress } from "@/lib/delivery";
```

- [ ] **Step 2: Update default values and form setup**

In the `useForm` defaultValues, keep province: "Bagmati", district: "Kathmandu", city: "Kathmandu".

- [ ] **Step 3: Add municipality state and cascading logic**

After the existing `const form = watch();` line, add:

```ts
const municipalityOptions = useMemo(() => getMunicipalitiesForDistrict(form.district as District), [form.district]);
const [showOtherCity, setShowOtherCity] = useState(false);
```

Import `useState` from React (it's already imported via `useEffect` and `useMemo`):
```ts
import { useEffect, useMemo, useState } from "react";
```

Also import `District` type:
```ts
import { PROVINCES, getDistrictsForProvince, getMunicipalitiesForDistrict, isCodAvailable, type District } from "@/lib/nepal-location";
```

- [ ] **Step 4: Update `updateProvince` function**

Replace the existing `updateProvince` function:

```ts
function updateProvince(province: string) {
  const districts = getDistrictsForProvince(province as Province);
  setValue("province", province, { shouldValidate: true });
  setValue("district", districts[0] || "Kathmandu", { shouldValidate: true });
  setValue("city", "", { shouldValidate: true });
  setShowOtherCity(false);
}
```

Add a new `updateDistrict` function:

```ts
function updateDistrict(district: string) {
  setValue("district", district, { shouldValidate: true });
  setValue("city", "", { shouldValidate: true });
  setShowOtherCity(false);
}
```

- [ ] **Step 5: Replace the Province and District select fields**

Replace the Province `<label>` + `<select>` block:

```tsx
<label className="space-y-2 text-sm font-semibold text-brand-textPrimary">
  Province
  <select {...register("province")} onChange={(e) => updateProvince(e.target.value)} className="w-full rounded-2xl border border-brand-border bg-brand-bgLight px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-brand-primary/30">
    {PROVINCES.map((province) => <option key={province}>{province}</option>)}
  </select>
</label>
```

Replace the District `<label>` + `<select>` block:

```tsx
<label className="space-y-2 text-sm font-semibold text-brand-textPrimary">
  District
  <select {...register("district")} onChange={(e) => updateDistrict(e.target.value)} className="w-full rounded-2xl border border-brand-border bg-brand-bgLight px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-brand-primary/30">
    {districtOptions.map((district) => <option key={district}>{district}</option>)}
  </select>
</label>
```

- [ ] **Step 6: Replace the City Field with municipality combo-box**

Replace the existing `<Field label="City / Municipality" ...>` with:

```tsx
<div className="space-y-2">
  <label className="text-sm font-semibold text-brand-textPrimary">City / Municipality</label>
  {!showOtherCity ? (
    <select
      {...register("city")}
      onChange={(e) => {
        if (e.target.value === "__other__") {
          setShowOtherCity(true);
          setValue("city", "", { shouldValidate: true });
        } else {
          setValue("city", e.target.value, { shouldValidate: true });
        }
      }}
      value={showOtherCity ? "__other__" : form.city}
      className="w-full rounded-2xl border border-brand-border bg-brand-bgLight px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-brand-primary/30"
    >
      <option value="">Select city / municipality</option>
      {municipalityOptions.map((m) => (
        <option key={m.name} value={m.name}>{m.name} ({m.type})</option>
      ))}
      <option value="__other__">Other (type below)</option>
    </select>
  ) : (
    <div className="space-y-2">
      <input
        {...register("city")}
        placeholder="Enter your city / municipality"
        className="w-full rounded-2xl border border-brand-border bg-brand-bgLight px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-brand-primary/30"
      />
      <button type="button" onClick={() => { setShowOtherCity(false); setValue("city", municipalityOptions[0]?.name ?? "", { shouldValidate: true }); }} className="text-xs text-brand-primary underline">Back to list</button>
    </div>
  )}
  {errors.city && <span role="alert" className="text-xs text-red-600">{errors.city.message}</span>}
</div>
```

- [ ] **Step 7: Enhance the delivery info section**

Replace the existing delivery info `<div className="mt-5 rounded-[1.5rem]...">` block with:

```tsx
<div className="mt-5 rounded-[1.5rem] border border-brand-secondary/25 bg-brand-bgLight p-4">
  <div className="flex items-start gap-3">
    <Truck className="mt-0.5 text-brand-primary" size={18} />
    <div className="flex-1">
      <div className="flex items-center gap-2">
        <p className="text-sm font-semibold text-brand-textPrimary">
          Delivery: {deliveryFee ? formatNpr(deliveryFee) : "FREE"}
        </p>
        {deliveryRule.codAvailable ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
            <CheckCircle2 size={12} /> COD available
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
            <XCircle size={12} /> Prepaid only
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-brand-textMuted">Estimated delivery: {deliveryRule.estimate}</p>
      <p className="mt-1 text-xs text-brand-textMuted">Free delivery threshold for this route: {formatNpr(freeDelivery.threshold)}.</p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
        <div className="h-full rounded-full bg-brand-primary" style={{ width: `${freeDelivery.percent}%` }} />
      </div>
      {freeDelivery.remaining > 0 ? <p className="mt-2 text-xs text-brand-textMuted">Add {formatNpr(freeDelivery.remaining)} more for free delivery on this route.</p> : <p className="mt-2 text-xs font-semibold text-emerald-700">Free delivery unlocked.</p>}
    </div>
  </div>
</div>
```

- [ ] **Step 8: Add XCircle to lucide-react imports**

Update the import:
```ts
import { AlertCircle, CheckCircle2, Gift, LockKeyhole, ShieldCheck, ShoppingBag, Truck, XCircle } from "lucide-react";
```

- [ ] **Step 9: Verify typecheck passes**

Run: `npx tsc --noEmit`
Expected: No errors

---

## Task 6: Update `CodAvailabilityChecker.tsx`

**Files:**
- Modify: `src/components/checkout/CodAvailabilityChecker.tsx`

- [ ] **Step 1: Update to use `isCodAvailable` and new delivery rule type**

```tsx
"use client";

import { CheckCircle2, Clock, MapPin, XCircle } from "lucide-react";
import { getDeliveryRule, isCodAvailable } from "@/lib/delivery";
import { cn, formatNpr } from "@/lib/utils";

export function getCodRule(district: string, province?: string) {
  const rule = getDeliveryRule(district, province);
  return { available: rule.codAvailable, estimate: rule.estimate, fee: rule.fee };
}

export function CodAvailabilityChecker({ district, province }: { district: string; province?: string }) {
  const rule = getDeliveryRule(district, province);
  const codAvailable = district ? isCodAvailable(district as never, province as never) : false;
  if (!district) {
    return <div className="rounded-2xl border border-dashed border-brand-secondary/40 bg-brand-bgLight p-4 text-sm text-brand-textMuted">Choose a district to check Cash on Delivery availability.</div>;
  }
  return (
    <div className={cn("rounded-2xl border p-4", codAvailable ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900")}>
      <div className="flex items-start gap-3">
        {codAvailable ? <CheckCircle2 className="mt-0.5" size={20} /> : <XCircle className="mt-0.5" size={20} />}
        <div>
          <p className="font-semibold">{codAvailable ? "COD available" : "Prepaid checkout recommended"} in {district}</p>
          <p className="mt-1 flex items-center gap-1 text-sm opacity-80"><Clock size={14} /> Estimated delivery: {rule.estimate}</p>
          <p className="mt-1 flex items-center gap-1 text-sm opacity-80"><MapPin size={14} /> Delivery fee before threshold: {formatNpr(rule.fee)}</p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `npx tsc --noEmit`
Expected: No errors

---

## Task 7: Final verification

- [ ] **Step 1: Run typecheck**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 2: Run lint**

Run: `npx next lint`
Expected: No errors

- [ ] **Step 3: Run build**

Run: `npm run build`
Expected: Successful build

- [ ] **Step 4: Commit**

```bash
git add src/lib/nepal-location.ts src/lib/nepal-location-assertions.ts src/lib/delivery.ts src/lib/validations/checkout.ts src/components/checkout/CheckoutPageClient.tsx src/components/checkout/CodAvailabilityChecker.tsx
git commit -m "feat: replace incorrect Nepal location data with correct 77 districts, 293 municipalities, cascading dropdowns, and delivery fee UX"
```