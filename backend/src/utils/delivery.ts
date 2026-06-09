interface DeliveryRule {
  fee: number
  freeDeliveryThreshold: number
  codAvailable: boolean
}

const DISTRICT_DELIVERY_RULES: Record<string, DeliveryRule> = {
  Kathmandu: { fee: 100, freeDeliveryThreshold: 2500, codAvailable: true },
  Lalitpur: { fee: 100, freeDeliveryThreshold: 2500, codAvailable: true },
  Bhaktapur: { fee: 120, freeDeliveryThreshold: 2500, codAvailable: true },
  Chitwan: { fee: 190, freeDeliveryThreshold: 2500, codAvailable: true },
  Kaski: { fee: 180, freeDeliveryThreshold: 2500, codAvailable: true },
  Rupandehi: { fee: 200, freeDeliveryThreshold: 2500, codAvailable: true },
  Morang: { fee: 240, freeDeliveryThreshold: 2500, codAvailable: false },
  Parsa: { fee: 230, freeDeliveryThreshold: 2500, codAvailable: false },
  Banke: { fee: 220, freeDeliveryThreshold: 2500, codAvailable: false },
  Kailali: { fee: 280, freeDeliveryThreshold: 3000, codAvailable: false },
  Surkhet: { fee: 320, freeDeliveryThreshold: 3500, codAvailable: false },
  Dang: { fee: 240, freeDeliveryThreshold: 2500, codAvailable: false },
}

const PROVINCE_DEFAULTS: Record<string, DeliveryRule> = {
  Bagmati: { fee: 150, freeDeliveryThreshold: 2500, codAvailable: true },
  Gandaki: { fee: 200, freeDeliveryThreshold: 2500, codAvailable: true },
  Lumbini: { fee: 230, freeDeliveryThreshold: 2500, codAvailable: false },
  Koshi: { fee: 250, freeDeliveryThreshold: 2500, codAvailable: false },
  Madhesh: { fee: 230, freeDeliveryThreshold: 2500, codAvailable: false },
  Karnali: { fee: 350, freeDeliveryThreshold: 4000, codAvailable: false },
  Sudurpashchim: { fee: 300, freeDeliveryThreshold: 3000, codAvailable: false },
}

const FREE_DELIVERY_THRESHOLD = 2500

function getDeliveryRule(district: string, province: string): DeliveryRule {
  const normalizedDistrict = Object.keys(DISTRICT_DELIVERY_RULES).find(
    (d) => d.toLowerCase() === district.toLowerCase()
  )
  return normalizedDistrict
    ? DISTRICT_DELIVERY_RULES[normalizedDistrict]
    : PROVINCE_DEFAULTS[province] ?? PROVINCE_DEFAULTS.Bagmati
}

export function calculateDeliveryFee(subtotal: number, district: string, province: string): number {
  const rule = getDeliveryRule(district, province)
  return subtotal >= rule.freeDeliveryThreshold ? 0 : rule.fee
}

export function isCodAvailable(district: string): boolean {
  return getDeliveryRule(district, 'Bagmati').codAvailable
}

export { FREE_DELIVERY_THRESHOLD }
