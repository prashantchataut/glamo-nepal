export type Province = "Koshi" | "Madhesh" | "Bagmati" | "Gandaki" | "Lumbini" | "Karnali" | "Sudurpashchim";

export interface DistrictDeliveryRule {
  district: string;
  province: Province;
  codAvailable: boolean;
  prepaidAvailable: boolean;
  estimate: string;
  fee: number;
  freeDeliveryThreshold: number;
  serviceLevel: "valley" | "metro" | "standard" | "remote" | "pending";
  ownerNote: string;
}

export const FREE_DELIVERY_THRESHOLD = 2500;

export const PROVINCES: Province[] = ["Koshi", "Madhesh", "Bagmati", "Gandaki", "Lumbini", "Karnali", "Sudurpashchim"];

export const DISTRICT_DELIVERY_RULES: DistrictDeliveryRule[] = [
  { district: "Kathmandu", province: "Bagmati", codAvailable: true, prepaidAvailable: true, estimate: "1-2 business days", fee: 100, freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD, serviceLevel: "valley", ownerNote: "Mock rule: fast Valley delivery. Confirm courier SLA before launch." },
  { district: "Lalitpur", province: "Bagmati", codAvailable: true, prepaidAvailable: true, estimate: "1-2 business days", fee: 100, freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD, serviceLevel: "valley", ownerNote: "Mock rule: fast Valley delivery. Confirm courier SLA before launch." },
  { district: "Bhaktapur", province: "Bagmati", codAvailable: true, prepaidAvailable: true, estimate: "1-2 business days", fee: 120, freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD, serviceLevel: "valley", ownerNote: "Mock rule: fast Valley delivery. Confirm courier SLA before launch." },
  { district: "Chitwan", province: "Bagmati", codAvailable: true, prepaidAvailable: true, estimate: "2-4 business days", fee: 190, freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD, serviceLevel: "metro", ownerNote: "Mock rule: COD likely but courier confirmation needed." },
  { district: "Pokhara", province: "Gandaki", codAvailable: true, prepaidAvailable: true, estimate: "2-4 business days", fee: 180, freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD, serviceLevel: "metro", ownerNote: "Mock rule: COD likely for metro route. Confirm courier partner." },
  { district: "Biratnagar", province: "Koshi", codAvailable: false, prepaidAvailable: true, estimate: "3-5 business days", fee: 240, freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD, serviceLevel: "standard", ownerNote: "Mock rule: prepaid-only until COD contract is confirmed." },
  { district: "Dharan", province: "Koshi", codAvailable: false, prepaidAvailable: true, estimate: "3-5 business days", fee: 240, freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD, serviceLevel: "standard", ownerNote: "Mock rule: prepaid-only until COD contract is confirmed." },
  { district: "Birgunj", province: "Madhesh", codAvailable: false, prepaidAvailable: true, estimate: "3-5 business days", fee: 230, freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD, serviceLevel: "standard", ownerNote: "Mock rule: courier serviceable, COD pending owner rules." },
  { district: "Janakpur", province: "Madhesh", codAvailable: false, prepaidAvailable: true, estimate: "3-5 business days", fee: 230, freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD, serviceLevel: "standard", ownerNote: "Mock rule: courier serviceable, COD pending owner rules." },
  { district: "Butwal", province: "Lumbini", codAvailable: true, prepaidAvailable: true, estimate: "3-5 business days", fee: 220, freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD, serviceLevel: "standard", ownerNote: "Mock rule: likely serviceable. Confirm COD remittance timeline." },
  { district: "Nepalgunj", province: "Lumbini", codAvailable: false, prepaidAvailable: true, estimate: "4-6 business days", fee: 260, freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD, serviceLevel: "standard", ownerNote: "Mock rule: prepaid preferred until courier COD rules are approved." },
  { district: "Surkhet", province: "Karnali", codAvailable: false, prepaidAvailable: true, estimate: "5-8 business days", fee: 320, freeDeliveryThreshold: 3500, serviceLevel: "remote", ownerNote: "Mock rule: longer delivery route. Owner must confirm courier coverage." },
  { district: "Dhangadhi", province: "Sudurpashchim", codAvailable: false, prepaidAvailable: true, estimate: "5-8 business days", fee: 340, freeDeliveryThreshold: 3500, serviceLevel: "remote", ownerNote: "Mock rule: prepaid preferred until COD coverage is confirmed." },
];

export const DISTRICTS_BY_PROVINCE = PROVINCES.reduce<Record<Province, string[]>>((acc, province) => {
  acc[province] = DISTRICT_DELIVERY_RULES.filter((rule) => rule.province === province).map((rule) => rule.district);
  if (!acc[province].includes("Other")) acc[province].push("Other");
  return acc;
}, {} as Record<Province, string[]>);

const fallbackByProvince: Record<Province, DistrictDeliveryRule> = {
  Koshi: { district: "Other", province: "Koshi", codAvailable: false, prepaidAvailable: true, estimate: "4-7 business days", fee: 280, freeDeliveryThreshold: 3500, serviceLevel: "pending", ownerNote: "Fallback mock rule. Confirm district-level courier and COD coverage." },
  Madhesh: { district: "Other", province: "Madhesh", codAvailable: false, prepaidAvailable: true, estimate: "4-7 business days", fee: 270, freeDeliveryThreshold: 3500, serviceLevel: "pending", ownerNote: "Fallback mock rule. Confirm district-level courier and COD coverage." },
  Bagmati: { district: "Other", province: "Bagmati", codAvailable: true, prepaidAvailable: true, estimate: "2-4 business days", fee: 180, freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD, serviceLevel: "standard", ownerNote: "Fallback Bagmati rule. Owner must confirm serviceable municipalities." },
  Gandaki: { district: "Other", province: "Gandaki", codAvailable: false, prepaidAvailable: true, estimate: "4-7 business days", fee: 280, freeDeliveryThreshold: 3500, serviceLevel: "pending", ownerNote: "Fallback mock rule. Confirm district-level courier and COD coverage." },
  Lumbini: { district: "Other", province: "Lumbini", codAvailable: false, prepaidAvailable: true, estimate: "4-7 business days", fee: 290, freeDeliveryThreshold: 3500, serviceLevel: "pending", ownerNote: "Fallback mock rule. Confirm district-level courier and COD coverage." },
  Karnali: { district: "Other", province: "Karnali", codAvailable: false, prepaidAvailable: true, estimate: "5-10 business days", fee: 360, freeDeliveryThreshold: 4000, serviceLevel: "remote", ownerNote: "Fallback remote rule. Confirm coverage, return windows and extra charges." },
  Sudurpashchim: { district: "Other", province: "Sudurpashchim", codAvailable: false, prepaidAvailable: true, estimate: "5-10 business days", fee: 360, freeDeliveryThreshold: 4000, serviceLevel: "remote", ownerNote: "Fallback remote rule. Confirm coverage, return windows and extra charges." },
};

export function getDistrictsForProvince(province: string) {
  return DISTRICTS_BY_PROVINCE[(province as Province) || "Bagmati"] ?? DISTRICTS_BY_PROVINCE.Bagmati;
}

export function getDeliveryRule(district: string, province: string = "Bagmati"): DistrictDeliveryRule {
  const normalizedProvince = (PROVINCES.includes(province as Province) ? province : "Bagmati") as Province;
  const exact = DISTRICT_DELIVERY_RULES.find((rule) => rule.district === district && rule.province === normalizedProvince);
  if (exact) return exact;
  return { ...fallbackByProvince[normalizedProvince], district: district || "Other" };
}

export function calculateDeliveryFee(subtotal: number, district: string, province = "Bagmati") {
  const rule = getDeliveryRule(district, province);
  return subtotal >= rule.freeDeliveryThreshold ? 0 : rule.fee;
}

export function getFreeDeliveryProgress(subtotal: number, district: string, province = "Bagmati") {
  const rule = getDeliveryRule(district, province);
  const remaining = Math.max(0, rule.freeDeliveryThreshold - subtotal);
  const percent = Math.min(100, Math.round((subtotal / rule.freeDeliveryThreshold) * 100));
  return { threshold: rule.freeDeliveryThreshold, remaining, percent };
}
