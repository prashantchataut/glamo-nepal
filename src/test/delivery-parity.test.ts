// Parity test: client calculateDeliveryFee must equal the backend algorithm
// across every combination the order flow can produce. The backend body is
// inlined here (copied verbatim from backend/src/utils/delivery.ts) because the
// frontend vitest config cannot resolve cross-project backend imports. Keeping
// the body inline also makes drift obvious in code review.
//
// Run with: npx vitest run src/test/delivery-parity.test.ts
import { describe, it, expect } from "vitest";
import { calculateDeliveryFee as clientCalc } from "@/lib/delivery";

// ── BEGIN inlined copy of backend/src/utils/delivery.ts (calculateDeliveryFee) ──
const BACKEND_DISTRICT_FEES: Record<string, number> = {
  Kathmandu: 0, Lalitpur: 0, Bhaktapur: 50, Kavrepalanchok: 100, Dhading: 120,
  Chitwan: 100, Makwanpur: 120, Sindhupalchok: 150, Nuwakot: 150, Rasuwa: 200,
  Ramechhap: 200, Sindhuli: 200, Dolakha: 250, Kaski: 100, Tanahu: 120,
  Syangja: 150, Gorkha: 150, Lamjung: 150, Nawalpur: 120, Parbat: 150,
  Baglung: 150, Myagdi: 200, Mustang: 300, Manang: 300, Rupandehi: 100,
  Kapilvastu: 120, Palpa: 150, Arghakhanchi: 150, Gulmi: 150, Pyuthan: 200,
  Rolpa: 200, Dang: 150, Banke: 150, Bardiya: 150, Parasi: 120, Jhapa: 150,
  Morang: 150, Sunsari: 150, Ilam: 200, Panchthar: 200, Taplejung: 250,
  Bhojpur: 250, Dhankuta: 250, Terhathum: 250, Sankhuwasabha: 300,
  Solukhumbu: 300, Okhaldhunga: 250, Khotang: 250, Udayapur: 200, Saptari: 150,
  Siraha: 150, Dhanusha: 150, Mahottari: 150, Sarlahi: 150, Rautahat: 150,
  Bara: 150, Parsa: 150, Surkhet: 200, Kalikot: 300, Jumla: 300, Mugu: 350,
  Humla: 350, Dolpa: 350, Dailekh: 250, Jajarkot: 250, Rukum_West: 250,
  Salyan: 250, Rukum_East: 250, Bajura: 300, Bajhang: 300, Darchula: 300,
  Kailali: 200, Kanchanpur: 200, Achham: 250, Doti: 250, Dadeldhura: 300,
  Baitadi: 250,
};
const BACKEND_PROVINCE_DEFAULTS: Record<string, number> = {
  Koshi: 200, Madhesh: 150, Bagmati: 100, Gandaki: 150, Lumbini: 120,
  Karnali: 300, Sudurpashchim: 250,
};
const BACKEND_FREE_THRESHOLD = 2500;
function backendCalc(subtotal: number, district: string, province: string): number {
  const normalizedDistrict = Object.keys(BACKEND_DISTRICT_FEES).find(
    (d) => d.toLowerCase() === district.toLowerCase(),
  );
  const fee = normalizedDistrict ? BACKEND_DISTRICT_FEES[normalizedDistrict] : BACKEND_PROVINCE_DEFAULTS[province] ?? 150;
  return subtotal >= BACKEND_FREE_THRESHOLD ? 0 : fee;
}
// ── END inlined copy ──

describe("delivery fee parity (client vs backend)", () => {
  const cases: Array<{ subtotal: number; district: string; province: string; label: string }> = [
    // The original failure: cart >= 2500 → free delivery. Client used to send 100,
    // backend computed 0.
    { subtotal: 2890, district: "Kathmandu", province: "Bagmati", label: "COSRX in valley, over threshold" },
    { subtotal: 5000, district: "Lalitpur", province: "Bagmati", label: "big cart, valley" },
    // Under threshold — valley rates
    { subtotal: 500, district: "Kathmandu", province: "Bagmati", label: "small cart Kathmandu (0)" },
    { subtotal: 500, district: "Bhaktapur", province: "Bagmati", label: "Bhaktapur (50)" },
    // Outside valley
    { subtotal: 800, district: "Kaski", province: "Gandaki", label: "Pokhara" },
    { subtotal: 800, district: "Rupandehi", province: "Lumbini", label: "Bhairahawa" },
    // Unknown district → province default
    { subtotal: 1500, district: "Unknownplace", province: "Bagmati", label: "unknown district, Bagmati default" },
    // Case-insensitivity (form may send lowercase)
    { subtotal: 3000, district: "kathmandu", province: "bagmati", label: "lowercase + over threshold" },
    { subtotal: 400, district: "KATHMANDU", province: "BAGMATI", label: "uppercase, under threshold" },
  ];

  for (const c of cases) {
    it(`${c.label}: ${c.district}/${c.province} @ NPR ${c.subtotal}`, () => {
      const client = clientCalc(c.subtotal, c.district as any, c.province as any);
      const backend = backendCalc(c.subtotal, c.district, c.province);
      // Backend tolerance for the order check is NPR 5.
      expect(Math.abs(client - backend)).toBeLessThanOrEqual(5);
    });
  }
});
